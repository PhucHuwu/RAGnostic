"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Upload,
  File,
  FileText,
  FileJson,
  Trash2,
  Eye,
  Check,
  AlertCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  FlaskConical,
} from "lucide-react";
import UserLayout from "@/components/layouts/UserLayout";
import {
  ApiErrorState,
  StatCardsSkeleton,
  TableSkeleton,
} from "@/components/common/api-state";
import {
  ApiError,
  deleteDocument,
  getDocumentChunks,
  listDocuments,
  previewDocument,
  uploadDocument,
  type DocumentChunksResponse,
  type DocumentResponse,
} from "@/lib/api";

interface Document {
  id: string;
  name: string;
  format: string;
  size: string;
  sizeBytes: number;
  uploadedAt: string;
  status: "UPLOADED" | "PARSING" | "CHUNKING" | "INDEXING" | "READY" | "FAILED";
  progress?: number;
  chunkCount: number;
  errorMessage?: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

const AppDocuments = () => {
  const params = useParams<{ profileId: string }>();
  const profileId = params.profileId;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [chunkDebugTitle, setChunkDebugTitle] = useState<string | null>(null);
  const [chunkDebugData, setChunkDebugData] =
    useState<DocumentChunksResponse | null>(null);
  const [chunkDebugError, setChunkDebugError] = useState<string | null>(null);
  const [isChunkDebugLoading, setIsChunkDebugLoading] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  const [isDragActive, setIsDragActive] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ALLOWED_EXTS = new Set(["pdf", "docx", "txt"]);

  const mapDocument = (doc: DocumentResponse): Document => ({
    id: doc.id,
    name: doc.file_name,
    format: doc.file_ext.toUpperCase(),
    size: formatBytes(doc.file_size_bytes),
    sizeBytes: doc.file_size_bytes,
    uploadedAt: new Date(doc.uploaded_at).toLocaleDateString("vi-VN"),
    status: doc.status as Document["status"],
    progress: doc.status === "READY" ? 100 : undefined,
    chunkCount: doc.chunk_count,
    errorMessage: doc.error_message,
  });

  const loadDocuments = useCallback(
    async (isManualRetry = false) => {
      if (!profileId) {
        return;
      }

      if (isManualRetry) {
        setIsRetrying(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      try {
        const docs = await listDocuments(profileId);
        setDocuments(docs.map(mapDocument));
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Không thể tải danh sách tài liệu");
        }
      } finally {
        setIsLoading(false);
        setIsRetrying(false);
      }
    },
    [profileId],
  );

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFiles = async (files: FileList) => {
    if (!profileId) {
      return;
    }

    const uploadedDocs: Document[] = [];
    setError(null);
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_EXTS.has(ext)) {
        setError(
          `Tệp ${file.name} không hợp lệ. Chỉ chấp nhận PDF, DOCX, TXT.`,
        );
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`Tệp ${file.name} vượt quá 10MB.`);
        continue;
      }

      try {
        const created = await uploadDocument(profileId, file);
        uploadedDocs.push(mapDocument(created));
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError(`Không thể upload tệp ${file.name}`);
        }
      }
    }

    if (uploadedDocs.length > 0) {
      setDocuments((prev) => [...uploadedDocs, ...prev]);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể xóa tài liệu");
      }
    }
  };

  const handlePreview = async (doc: Document) => {
    setIsDiagnosticsOpen(true);
    setIsPreviewLoading(true);
    setPreviewError(null);
    setPreviewTitle(doc.name);
    setPreviewText(null);

    try {
      const response = await previewDocument(doc.id);
      setPreviewText(response.preview);
    } catch (err) {
      if (err instanceof ApiError) {
        setPreviewError(err.message);
      } else {
        setPreviewError("Không thể tải nội dung xem trước tài liệu");
      }
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleViewChunks = async (doc: Document) => {
    setIsDiagnosticsOpen(true);
    setIsChunkDebugLoading(true);
    setChunkDebugError(null);
    setChunkDebugData(null);
    setChunkDebugTitle(doc.name);

    try {
      const response = await getDocumentChunks(doc.id);
      setChunkDebugData(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setChunkDebugError(err.message);
      } else {
        setChunkDebugError("Không thể tải chi tiết chunks");
      }
    } finally {
      setIsChunkDebugLoading(false);
    }
  };

  const getStatusColor = (status: Document["status"]) => {
    switch (status) {
      case "READY":
        return "bg-green-100/20 text-green-700 dark:text-green-400";
      case "FAILED":
        return "bg-red-100/20 text-red-700 dark:text-red-400";
      case "UPLOADED":
      case "PARSING":
      case "CHUNKING":
      case "INDEXING":
        return "bg-amber-100/20 text-amber-700 dark:text-amber-400";
      default:
        return "bg-blue-100/20 text-blue-700 dark:text-blue-400";
    }
  };

  const getStatusLabel = (status: Document["status"]) => {
    switch (status) {
      case "UPLOADED":
        return "Đã tải lên";
      case "PARSING":
        return "Đang phân tích";
      case "CHUNKING":
        return "Đang chia nhỏ";
      case "INDEXING":
        return "Đang lập chỉ mục";
      case "READY":
        return "Sẵn sàng";
      case "FAILED":
        return "Lỗi";
      default:
        return status;
    }
  };

  const getFileIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case "pdf":
        return <FileText className="w-5 h-5" />;
      case "json":
        return <FileJson className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Quản lý Tài liệu
          </h1>
          <p className="text-muted-foreground">
            Kho tri thức cho trợ lý: {profileId}
          </p>
        </div>

        <section className="space-y-6 rounded-xl border border-border bg-card/40 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">
                Kho tài liệu
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tải lên, quản lý và theo dõi trạng thái xử lý tài liệu.
              </p>
            </div>
          </div>

          <div
            ref={dragRef}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`p-6 sm:p-8 rounded-xl border-2 border-dashed transition-colors ${
              isDragActive
                ? "border-primary/50 bg-primary/5"
                : "border-border bg-card/50 hover:border-primary/30"
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-display font-bold mb-2">Tải lên tài liệu</h3>
              <p className="text-muted-foreground text-center mb-6">
                Kéo và thả tệp của bạn vào đây hoặc{" "}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  chọn từ máy tính
                </button>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) =>
                  e.currentTarget.files && handleFiles(e.currentTarget.files)
                }
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                PDF, TXT, DOCX - Tối đa 10MB mỗi file
              </p>
            </div>
          </div>

          {isLoading && (
            <>
              <StatCardsSkeleton />
              <TableSkeleton />
            </>
          )}

          {error && (
            <ApiErrorState
              message={error}
              onRetry={() => void loadDocuments(true)}
              isRetrying={isRetrying}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card/50">
              <p className="text-sm text-muted-foreground mb-1">Tổng tài liệu</p>
              <p className="text-3xl font-display font-bold">{documents.length}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card/50">
              <p className="text-sm text-muted-foreground mb-1">Sẵn sàng</p>
              <p className="text-3xl font-display font-bold">
                {documents.filter((d) => d.status === "READY").length}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card/50">
              <p className="text-sm text-muted-foreground mb-1">Dung lượng tổng</p>
              <p className="text-3xl font-display font-bold">
                {formatBytes(documents.reduce((sum, d) => sum + d.sizeBytes, 0))}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-card/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Tên file
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Định dạng
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Kích thước
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Tải lên
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <p className="text-muted-foreground">
                          Chưa có tài liệu nào. Tải lên tài liệu đầu tiên của bạn.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="text-muted-foreground">
                              {getFileIcon(doc.format)}
                            </div>
                            <span className="font-medium text-foreground truncate">
                              {doc.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">
                            {doc.format}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">
                            {doc.size}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                doc.status,
                              )}`}
                            >
                              {doc.status === "READY" && (
                                <Check className="w-3 h-3" />
                              )}
                              {(doc.status === "PARSING" ||
                                doc.status === "CHUNKING" ||
                                doc.status === "INDEXING") && (
                                <Loader className="w-3 h-3 animate-spin" />
                              )}
                              {doc.status === "FAILED" && (
                                <AlertCircle className="w-3 h-3" />
                              )}
                              {getStatusLabel(doc.status)}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
                                chunks: {doc.chunkCount}
                              </span>
                              {doc.status === "FAILED" && doc.errorMessage && (
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100/30 text-red-700 max-w-[320px] truncate"
                                  title={doc.errorMessage}
                                >
                                  ingest error: {doc.errorMessage}
                                </span>
                              )}
                            </div>
                            {doc.progress !== undefined && doc.progress < 100 && (
                              <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${doc.progress}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">
                            {doc.uploadedAt}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {doc.status === "READY" && (
                              <button
                                onClick={() => void handlePreview(doc)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                                title="Xem trước"
                              >
                                <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                              </button>
                            )}
                            <button
                              onClick={() => void handleViewChunks(doc)}
                              className="px-2 py-1 text-xs rounded-md border border-border hover:bg-muted transition-colors"
                              title="Xem chunks"
                            >
                              Chẩn đoán
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card/40 overflow-hidden">
          <button
            onClick={() => setIsDiagnosticsOpen((prev) => !prev)}
            className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mt-0.5">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">
                  Chẩn đoán xử lý
                </h2>
                <p className="text-sm text-muted-foreground">
                  Dành cho kiểm tra nội dung parse/chunk. Mặc định được ẩn để giao diện gọn hơn.
                </p>
              </div>
            </div>
            {isDiagnosticsOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {isDiagnosticsOpen && (
            <div className="border-t border-border p-5 sm:p-6 space-y-6">
              {!isPreviewLoading &&
                !previewError &&
                !previewText &&
                !isChunkDebugLoading &&
                !chunkDebugError &&
                !chunkDebugData && (
                  <p className="text-sm text-muted-foreground">
                    Chọn "Xem trước" hoặc "Chẩn đoán" trong bảng tài liệu để hiển thị dữ liệu tại đây.
                  </p>
                )}

              {(isPreviewLoading || previewError || previewText) && (
                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-display font-bold text-foreground">
                      Xem trước tài liệu{previewTitle ? `: ${previewTitle}` : ""}
                    </h3>
                    {(previewText || previewError) && (
                      <button
                        onClick={() => {
                          setPreviewText(null);
                          setPreviewError(null);
                          setPreviewTitle(null);
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Đóng
                      </button>
                    )}
                  </div>

                  {isPreviewLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader className="w-4 h-4 animate-spin" />
                      Đang tải nội dung xem trước...
                    </div>
                  )}

                  {previewError && !isPreviewLoading && (
                    <div className="text-sm text-red-600">{previewError}</div>
                  )}

                  {previewText && !isPreviewLoading && !previewError && (
                    <pre className="whitespace-pre-wrap break-words text-sm text-foreground bg-muted/40 rounded-lg p-4 max-h-96 overflow-y-auto">
                      {previewText}
                    </pre>
                  )}
                </div>
              )}

              {(isChunkDebugLoading || chunkDebugError || chunkDebugData) && (
                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-display font-bold text-foreground">
                      Chi tiết chunks{chunkDebugTitle ? `: ${chunkDebugTitle}` : ""}
                    </h3>
                    {(chunkDebugData || chunkDebugError) && (
                      <button
                        onClick={() => {
                          setChunkDebugData(null);
                          setChunkDebugError(null);
                          setChunkDebugTitle(null);
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Đóng
                      </button>
                    )}
                  </div>

                  {isChunkDebugLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader className="w-4 h-4 animate-spin" />
                      Đang tải danh sách chunks...
                    </div>
                  )}

                  {chunkDebugError && !isChunkDebugLoading && (
                    <div className="text-sm text-red-600">{chunkDebugError}</div>
                  )}

                  {chunkDebugData && !isChunkDebugLoading && !chunkDebugError && (
                    <>
                      <div className="text-sm text-muted-foreground">
                        strategy:{" "}
                        <span className="font-medium text-foreground">
                          {chunkDebugData.strategy ?? "N/A"}
                        </span>{" "}
                        | total chunks:{" "}
                        <span className="font-medium text-foreground">
                          {chunkDebugData.total_chunks}
                        </span>
                      </div>
                      <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
                        {chunkDebugData.items.map((chunk) => (
                          <div
                            key={chunk.id}
                            className="rounded-lg border border-border bg-muted/20 p-3 space-y-2"
                          >
                            <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                              <span>#{chunk.chunk_index}</span>
                              <span>tokens: {chunk.token_count}</span>
                              <span>chars: {chunk.char_count}</span>
                              <span>source: {chunk.source_ref ?? "N/A"}</span>
                              <span>section: {chunk.section_title ?? "N/A"}</span>
                            </div>
                            <pre className="whitespace-pre-wrap break-words text-sm text-foreground bg-card rounded-md p-3 overflow-x-auto">
                              {chunk.content}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </UserLayout>
  );
};

export default AppDocuments;
