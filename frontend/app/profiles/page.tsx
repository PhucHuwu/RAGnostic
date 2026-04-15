"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthGate } from "@/components/auth/auth-gate";
import { Badge } from "@/components/common/badge";
import { Button } from "@/components/common/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/state";
import { Input } from "@/components/common/input";
import { Modal } from "@/components/common/modal";
import { Select } from "@/components/common/select";
import { AppShell } from "@/components/layout/app-shell";
import { useToast } from "@/components/providers/toast-provider";
import { api } from "@/lib/api";
import type { Profile, ProfileInput } from "@/lib/api/client";

const strategies = [
  { value: "OUTLINE", label: "Outline" },
  { value: "PARAGRAPH", label: "Paragraph" },
  { value: "SEMANTIC", label: "Semantic" },
  { value: "CHARACTER", label: "Character" }
] as const;

const defaultForm: ProfileInput = {
  name: "",
  topic: "",
  description: "",
  chunkStrategy: "SEMANTIC",
  topK: 8,
  rerankTopN: 4
};

export default function ProfilesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<ProfileInput>(defaultForm);

  const profilesQuery = useQuery({
    queryKey: ["profiles"],
    queryFn: () => api.listProfiles()
  });

  const createMutation = useMutation({
    mutationFn: (input: ProfileInput) => api.createProfile(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setForm(defaultForm);
      setIsModalOpen(false);
      showToast({ title: "Da tao profile", variant: "success" });
    },
    onError: () => {
      showToast({ title: "Tao profile that bai", variant: "error" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ profileId, input }: { profileId: string; input: Partial<ProfileInput> }) =>
      api.updateProfile(profileId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setForm(defaultForm);
      setEditingProfile(null);
      setIsModalOpen(false);
      showToast({ title: "Da cap nhat profile", variant: "success" });
    },
    onError: () => {
      showToast({ title: "Cap nhat profile that bai", variant: "error" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (profileId: string) => api.deleteProfile(profileId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profiles"] });
      showToast({ title: "Da xoa profile", variant: "success" });
    },
    onError: () => {
      showToast({ title: "Xoa profile that bai", variant: "error" });
    }
  });

  const openCreateModal = () => {
    setEditingProfile(null);
    setForm(defaultForm);
    setIsModalOpen(true);
  };

  const openEditModal = (profile: Profile) => {
    setEditingProfile(profile);
    setForm({
      name: profile.name,
      topic: profile.topic,
      description: profile.description,
      chunkStrategy: profile.chunkStrategy,
      topK: profile.topK,
      rerankTopN: profile.rerankTopN
    });
    setIsModalOpen(true);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const activeCount = useMemo(
    () => profilesQuery.data?.filter((profile) => profile.chunkStrategy === "SEMANTIC").length ?? 0,
    [profilesQuery.data]
  );

  return (
    <AuthGate>
      <AppShell
        title="Chatbot Profiles"
        description="Create and manage profile-level retrieval configuration."
        actions={<Button onClick={openCreateModal}>New profile</Button>}
      >
        <section className="glass-panel stat-strip">
          <article>
            <p>Total profiles</p>
            <strong>{profilesQuery.data?.length ?? 0}</strong>
          </article>
          <article>
            <p>Semantic strategy</p>
            <strong>{activeCount}</strong>
          </article>
          <article>
            <p>Default top_k</p>
            <strong>8</strong>
          </article>
        </section>

        {profilesQuery.isLoading ? <LoadingState title="Loading profiles..." /> : null}
        {profilesQuery.isError ? (
          <ErrorState
            title="Khong the tai danh sach profile"
            actionLabel="Thu lai"
            onAction={() => profilesQuery.refetch()}
          />
        ) : null}

        {!profilesQuery.isLoading && !profilesQuery.isError ? (
          profilesQuery.data && profilesQuery.data.length > 0 ? (
            <section className="profile-grid">
              {profilesQuery.data.map((profile) => (
                <article key={profile.id} className="profile-card glass-panel">
                  <div className="profile-card-head">
                    <h2>{profile.name}</h2>
                    <Badge variant="info">{profile.chunkStrategy}</Badge>
                  </div>
                  <p>{profile.description || "No description"}</p>
                  <dl>
                    <div>
                      <dt>Topic</dt>
                      <dd>{profile.topic || "N/A"}</dd>
                    </div>
                    <div>
                      <dt>top_k</dt>
                      <dd>{profile.topK}</dd>
                    </div>
                    <div>
                      <dt>rerank_top_n</dt>
                      <dd>{profile.rerankTopN}</dd>
                    </div>
                  </dl>
                  <div className="profile-card-actions">
                    <Button variant="secondary" onClick={() => openEditModal(profile)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      isLoading={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm(`Delete profile ${profile.name}?`)) {
                          deleteMutation.mutate(profile.id);
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
              title="Chua co profile nao"
              description="Tao profile dau tien de khoi tao chat workspace."
              actionLabel="Tao profile"
              onAction={openCreateModal}
            />
          )
        ) : null}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingProfile ? "Update profile" : "Create profile"}
          description="Configure chunk strategy and retrieval settings per profile"
          footer={
            <Button
              isLoading={isSubmitting}
              onClick={() => {
                if (editingProfile) {
                  updateMutation.mutate({ profileId: editingProfile.id, input: form });
                  return;
                }
                createMutation.mutate(form);
              }}
            >
              {editingProfile ? "Save changes" : "Create profile"}
            </Button>
          }
        >
          <form className="stack-form" onSubmit={(event) => event.preventDefault()}>
            <Input
              label="Name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <Input
              label="Topic"
              value={form.topic}
              onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value }))}
            />
            <Input
              label="Description"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
            <Select
              label="Chunk strategy"
              options={strategies.map((item) => ({ value: item.value, label: item.label }))}
              value={form.chunkStrategy}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  chunkStrategy: event.target.value as ProfileInput["chunkStrategy"]
                }))
              }
            />
            <Input
              label="top_k"
              type="number"
              min={1}
              value={String(form.topK)}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, topK: Number(event.target.value) }))
              }
            />
            <Input
              label="rerank_top_n"
              type="number"
              min={1}
              value={String(form.rerankTopN)}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, rerankTopN: Number(event.target.value) }))
              }
            />
          </form>
        </Modal>
      </AppShell>
    </AuthGate>
  );
}
