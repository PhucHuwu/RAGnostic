"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  Trash2,
  FileText,
  Check,
  AlertCircle,
  Loader,
} from "lucide-react";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  ApiError,
  deleteAdminDocument,
  listAdminDocuments,
  getAdminDocumentChunks,
  listAdminUsers,
  type DocumentResponse,
  type DocumentChunkDetailResponse,
} from "@/lib/api";
import {
  ApiErrorState,
  StatCardsSkeleton,
  TableSkeleton,
} from "@/components/common/api-state";

interface AdminDocument {
  id: string;
  name: string;
  format: string;
  size: string;
  user: string;
  profile: string;
  status: "UPLOADED" | "READY" | "PARSING" | "CHUNKING" | "INDEXING" | "FAILED";
  uploadedAt: string;
  chunks: number;
}

function mapDocument(
  item: DocumentResponse,
  resolveUsername: (userId: string) => string,
): AdminDocument {
  return {
    id: item.id,
    name: item.file_name,
    format: item.file_ext.toUpperCase(),
    size: `${(item.file_size_bytes / 1024 / 1024).toFixed(1)} MB`,
    user: resolveUsername(item.owner_user_id),
    profile: item.profile_id,
    status: item.status === "DELETED" ? "FAILED" : item.status,
    uploadedAt: new Date(item.uploaded_at).toLocaleDateString("vi-VN"),
    chunks: item.chunk_count,
  };
}

const AdminDocuments = () => {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [profileFilter, setProfileFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [previewDoc, setPreviewDoc] = useState<AdminDocument | null>(null);
  const [chunkDetails, setChunkDetails] = useState<DocumentChunkDetailResponse[]>([]);
  const [chunkStrategy, setChunkStrategy] = useState<string | null>(null);
  const [isChunkLoading, setIsChunkLoading] = useState(false);
  const [chunkError, setChunkError] = useState<string | null>(null);

  const loadDocuments = useCallback(async (isManualRetry = false) => {
    if (isManualRetry) {
      setIsRetrying(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const [data, users] = await Promise.all([
        listAdminDocuments(),
        listAdminUsers(),
      ]);
      const usernameById = new Map(users.map((user) => [user.id, user.username]));
      setDocuments(
        data.map((item) =>
          mapDocument(item, (userId) => usernameById.get(userId) ?? userId),
        ),
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải danh sách tài liệu hệ thống");
      }
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const uniqueUsers = useMemo(
    () => Array.from(new Set(documents.map((d) => d.user))),
    [documents],
  );
  const uniqueProfiles = useMemo(
    () => Array.from(new Set(documents.map((d) => d.profile))),
    [documents],
  );

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesUser = !userFilter || doc.user === userFilter;
    const matchesProfile = !profileFilter || doc.profile === profileFilter;
    const matchesStatus = !statusFilter || doc.status === statusFilter;
    return matchesSearch && matchesUser && matchesProfile && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteAdminDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể xóa tài liệu");
      }
    }
  };

  const openChunkPreview = async (doc: AdminDocument) => {
    setPreviewDoc(doc);
    setChunkDetails([]);
    setChunkStrategy(null);
    setChunkError(null);
    setIsChunkLoading(true);
    try {
      const response = await getAdminDocumentChunks(doc.id);
      setChunkDetails(response.items);
      setChunkStrategy(response.strategy);
    } catch (err) {
      if (err instanceof ApiError) {
        setChunkError(err.message);
      } else {
        setChunkError("Không thể tải chi tiết các chunk");
      }
    } finally {
      setIsChunkLoading(false);
    }
  };

  const getStatusColor = (status: AdminDocument["status"]) => {
    switch (status) {
      case "READY":
        return "bg-green-100/20 text-green-700 dark:text-green-400";
      case "FAILED":
        return "bg-red-100/20 text-red-700 dark:text-red-400";
      case "PARSING":
      case "CHUNKING":
      case "INDEXING":
      case "UPLOADED":
        return "bg-amber-100/20 text-amber-700 dark:text-amber-400";
      default:
        return "bg-blue-100/20 text-blue-700 dark:text-blue-400";
    }
  };

  const getStatusLabel = (status: AdminDocument["status"]) => {
    switch (status) {
      case "PARSING":
        return "Đang phân tích";
      case "CHUNKING":
        return "Đang chia nhỏ";
      case "INDEXING":
        return "Đang lập chỉ mục";
      case "UPLOADED":
        return "Đã tải lên";
      case "READY":
        return "Sẵn sàng";
      case "FAILED":
        return "Lỗi";
      default:
        return status;
    }
  };

  const totalSize = documents.reduce((sum, d) => {
    const sizeNum = parseFloat(d.size);
    return sum + sizeNum;
  }, 0);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Quản lý Tài liệu (Toàn hệ thống)
          </h1>
          <p className="text-muted-foreground">
            Xem và quản lý tất cả tài liệu trong hệ thống
          </p>
        </div>

        {/* Statistics */}
        {isLoading && (
          <>
            <StatCardsSkeleton count={4} />
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border border-border bg-card/50">
            <p className="text-sm text-muted-foreground mb-1">Tổng tài liệu</p>
            <p className="text-3xl font-display font-bold">
              {documents.length}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card/50">
            <p className="text-sm text-muted-foreground mb-1">Sẵn sàng</p>
            <p className="text-3xl font-display font-bold">
              {documents.filter((d) => d.status === "READY").length}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card/50">
            <p className="text-sm text-muted-foreground mb-1">Lỗi</p>
            <p className="text-3xl font-display font-bold">
              {documents.filter((d) => d.status === "FAILED").length}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card/50">
            <p className="text-sm text-muted-foreground mb-1">
              Dung lượng tổng
            </p>
            <p className="text-3xl font-display font-bold">
              {totalSize.toFixed(1)} MB
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên file..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Người dùng
            </label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="">Tất cả người dùng</option>
              {uniqueUsers.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Profile
            </label>
            <select
              value={profileFilter}
              onChange={(e) => setProfileFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="">Tất cả trợ lý</option>
              {uniqueProfiles.map((profile) => (
                <option key={profile} value={profile}>
                  {profile}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="READY">Sẵn sàng</option>
              <option value="PARSING">Phân tích</option>
              <option value="CHUNKING">Chia nhỏ</option>
              <option value="INDEXING">Lập chỉ mục</option>
              <option value="FAILED">Lỗi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Kết quả
            </label>
            <div className="px-4 py-2 rounded-lg border border-border bg-muted/30 text-foreground text-sm font-medium">
              {filteredDocuments.length} tài liệu
            </div>
          </div>
        </div>

        {/* Documents Table */}
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
                    Người dùng
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Profile
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Chunks
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <p className="text-muted-foreground">
                        Không tìm thấy tài liệu nào
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
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
                        <span className="text-sm text-muted-foreground">
                          {doc.user}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">
                          {doc.profile}
                        </span>
                      </td>
                      <td className="px-6 py-4">
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
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">
                          {doc.chunks}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {doc.status === "READY" && (
                            <button
                              onClick={() => void openChunkPreview(doc)}
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                              title="Xem chi tiết chunk"
                            >
                              <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </button>
                          )}
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

        {previewDoc && (
          <div className="fixed inset-0 z-50 bg-black/50 p-4 sm:p-6 flex items-center justify-center">
            <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl border border-border bg-card shadow-xl flex flex-col">
              <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-display font-bold text-foreground truncate">
                    Chi tiết chunk: {previewDoc.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Chiến lược: {chunkStrategy ?? "N/A"} • Tổng chunk: {chunkDetails.length}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted/50 transition-colors"
                >
                  Đóng
                </button>
              </div>

              <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
                {isChunkLoading && (
                  <div className="text-sm text-muted-foreground">Đang tải dữ liệu chunk...</div>
                )}

                {!isChunkLoading && chunkError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {chunkError}
                  </div>
                )}

                {!isChunkLoading && !chunkError && chunkDetails.length === 0 && (
                  <div className="text-sm text-muted-foreground">Tài liệu chưa có chunk để hiển thị.</div>
                )}

                {!isChunkLoading &&
                  !chunkError &&
                  chunkDetails.map((chunk) => (
                    <div key={chunk.id} className="rounded-lg border border-border bg-card/50">
                      <div className="px-3 py-2 border-b border-border text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                        <span># {chunk.chunk_index}</span>
                        <span>Token: {chunk.token_count}</span>
                        <span>Ký tự: {chunk.char_count}</span>
                        {chunk.section_title && <span>Mục: {chunk.section_title}</span>}
                        {chunk.page_no !== null && <span>Trang: {chunk.page_no}</span>}
                      </div>
                      <pre className="p-3 text-sm whitespace-pre-wrap break-words text-foreground overflow-x-auto">
                        {chunk.content}
                      </pre>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDocuments;
