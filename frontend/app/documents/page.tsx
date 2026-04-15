"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth/auth-gate";
import { Badge } from "@/components/common/badge";
import { Button } from "@/components/common/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/state";
import { Modal } from "@/components/common/modal";
import { Select } from "@/components/common/select";
import { AppShell } from "@/components/layout/app-shell";
import { useToast } from "@/components/providers/toast-provider";
import { api } from "@/lib/api";
import type { DocumentItem } from "@/lib/api/client";
import { formatDateTime } from "@/lib/utils";

const getStatusVariant = (status: string) => {
  if (status === "READY") return "success" as const;
  if (status === "FAILED") return "danger" as const;
  if (status === "UPLOADED") return "info" as const;
  return "warning" as const;
};

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [profileId, setProfileId] = useState<string>("");
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const profilesQuery = useQuery({
    queryKey: ["profiles"],
    queryFn: () => api.listProfiles()
  });

  const activeProfileId = profileId || profilesQuery.data?.[0]?.id || "";

  const documentsQuery = useQuery({
    queryKey: ["documents", activeProfileId],
    queryFn: () => api.listDocuments(activeProfileId),
    enabled: Boolean(activeProfileId)
  });

  const previewQuery = useQuery({
    queryKey: ["document-preview", previewDoc?.id],
    queryFn: () => api.previewDocument(previewDoc!.id),
    enabled: Boolean(previewDoc)
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadProgress(10);
      const progressTick = window.setInterval(() => {
        setUploadProgress((current) => (current >= 85 ? current : current + 15));
      }, 250);

      try {
        const result = await api.uploadDocument(activeProfileId, file);
        setUploadProgress(100);
        return result;
      } finally {
        window.clearInterval(progressTick);
        window.setTimeout(() => setUploadProgress(0), 500);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents", activeProfileId] });
      showToast({ title: "Upload thanh cong", variant: "success" });
    },
    onError: () => {
      showToast({ title: "Upload that bai", description: "Vui long thu lai", variant: "error" });
      setUploadProgress(0);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => api.deleteDocument(documentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents", activeProfileId] });
      showToast({ title: "Da xoa tai lieu", variant: "success" });
    },
    onError: () => {
      showToast({ title: "Xoa tai lieu that bai", variant: "error" });
    }
  });

  const pipelineHint = useMemo(
    () => "UPLOADED -> PARSING -> CHUNKING -> INDEXING -> READY / FAILED",
    []
  );

  return (
    <AuthGate>
      <AppShell
        title="Documents"
        description="Upload and track profile-level ingestion pipeline."
        actions={
          <label className="btn btn-primary cursor-pointer">
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file && activeProfileId) {
                  uploadMutation.mutate(file);
                }
                event.currentTarget.value = "";
              }}
            />
            Upload file
          </label>
        }
      >
        <section className="glass-panel doc-toolbar">
          <Select
            label="Profile"
            value={activeProfileId}
            onChange={(event) => setProfileId(event.target.value)}
            options={(profilesQuery.data ?? []).map((profile) => ({
              value: profile.id,
              label: profile.name
            }))}
          />
          <p className="muted">Pipeline: {pipelineHint}</p>
        </section>

        {uploadProgress > 0 ? (
          <section className="glass-panel upload-progress" role="status" aria-live="polite">
            <p>Uploading... {uploadProgress}%</p>
            <div className="progress-track">
              <span style={{ width: `${uploadProgress}%` }} />
            </div>
          </section>
        ) : null}

        {documentsQuery.isLoading ? <LoadingState title="Loading documents..." /> : null}
        {documentsQuery.isError ? (
          <ErrorState
            title="Khong the tai danh sach tai lieu"
            description="Kiem tra ket noi API va thu lai"
            actionLabel="Thu lai"
            onAction={() => documentsQuery.refetch()}
          />
        ) : null}

        {!documentsQuery.isLoading && !documentsQuery.isError ? (
          documentsQuery.data && documentsQuery.data.length > 0 ? (
            <section className="doc-list">
              {documentsQuery.data.map((document) => (
                <article key={document.id} className="doc-card glass-panel">
                  <div>
                    <h2>{document.fileName}</h2>
                    <p className="muted">Uploaded {formatDateTime(document.uploadedAt)}</p>
                  </div>
                  <Badge variant={getStatusVariant(document.status)}>{document.status}</Badge>
                  <div className="doc-actions">
                    <Button variant="secondary" onClick={() => setPreviewDoc(document)}>
                      Preview
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (window.confirm(`Delete document ${document.fileName}?`)) {
                          deleteMutation.mutate(document.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <EmptyState
              title="Chua co tai lieu"
              description="Upload file pdf/docx/txt de bat dau ingest tri thuc cho profile nay."
            />
          )
        ) : null}

        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc?.fileName ?? "Document preview"}
          description="Preview from /documents/{document_id}/preview"
        >
          {previewQuery.isLoading ? (
            <LoadingState title="Loading preview..." />
          ) : (
            <pre className="preview-block">{previewQuery.data?.content ?? "No preview data"}</pre>
          )}
        </Modal>
      </AppShell>
    </AuthGate>
  );
}
