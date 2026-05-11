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
  SlidersHorizontal,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
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

  useEffect(() => {
    if (!previewDoc) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [previewDoc]);

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
            Quản lý Tài liệu
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <div className="p-2.5 sm:p-4 rounded-lg border border-border bg-card/50">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Tổng tài liệu</p>
            <p className="text-xl sm:text-3xl font-display font-bold">
              {documents.length}
            </p>
          </div>
          <div className="p-2.5 sm:p-4 rounded-lg border border-border bg-card/50">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Sẵn sàng</p>
            <p className="text-xl sm:text-3xl font-display font-bold">
              {documents.filter((d) => d.status === "READY").length}
            </p>
          </div>
          <div className="p-2.5 sm:p-4 rounded-lg border border-border bg-card/50">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Lỗi</p>
            <p className="text-xl sm:text-3xl font-display font-bold">
              {documents.filter((d) => d.status === "FAILED").length}
            </p>
          </div>
          <div className="p-2.5 sm:p-4 rounded-lg border border-border bg-card/50">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
              Dung lượng tổng
            </p>
            <p className="text-xl sm:text-3xl font-display font-bold">
              {totalSize.toFixed(1)} MB
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {isMobileFiltersOpen ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
          </button>
        </div>

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 ${
            isMobileFiltersOpen ? "grid" : "hidden"
          } md:grid`}
        >
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
            <Select
              value={userFilter || "all"}
              onValueChange={(value) => setUserFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-full bg-input text-foreground text-sm">
                <SelectValue placeholder="Tất cả người dùng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả người dùng</SelectItem>
                {uniqueUsers.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Profile
            </label>
            <Select
              value={profileFilter || "all"}
              onValueChange={(value) => setProfileFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-full bg-input text-foreground text-sm">
                <SelectValue placeholder="Tất cả trợ lý" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trợ lý</SelectItem>
                {uniqueProfiles.map((profile) => (
                  <SelectItem key={profile} value={profile}>
                    {profile}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Trạng thái
            </label>
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-full bg-input text-foreground text-sm">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="READY">Sẵn sàng</SelectItem>
                <SelectItem value="PARSING">Phân tích</SelectItem>
                <SelectItem value="CHUNKING">Chia nhỏ</SelectItem>
                <SelectItem value="INDEXING">Lập chỉ mục</SelectItem>
                <SelectItem value="FAILED">Lỗi</SelectItem>
              </SelectContent>
            </Select>
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

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filteredDocuments.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-muted-foreground text-sm">
              Không tìm thấy tài liệu nào
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <FileText className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.format} • {doc.size}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Người dùng</p>
                    <p className="text-foreground truncate">{doc.user}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Profile</p>
                    <p className="text-foreground truncate">{doc.profile}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Chunks</p>
                    <p className="text-foreground">{doc.chunks}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ngày tải</p>
                    <p className="text-foreground">{doc.uploadedAt}</p>
                  </div>
                </div>

                <div
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    doc.status,
                  )}`}
                >
                  {doc.status === "READY" && <Check className="w-3 h-3" />}
                  {(doc.status === "PARSING" ||
                    doc.status === "CHUNKING" ||
                    doc.status === "INDEXING") && (
                    <Loader className="w-3 h-3 animate-spin" />
                  )}
                  {doc.status === "FAILED" && <AlertCircle className="w-3 h-3" />}
                  {getStatusLabel(doc.status)}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => void openChunkPreview(doc)}
                    disabled={doc.status !== "READY"}
                    className="h-9 rounded-lg border border-border hover:bg-muted transition-colors inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Xem chi tiết chunk"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="h-9 rounded-lg border border-border hover:bg-destructive/10 transition-colors inline-flex items-center justify-center"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-card/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Tên file</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Định dạng</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Kích thước</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Người dùng</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Profile</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Chunks</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <p className="text-muted-foreground">Không tìm thấy tài liệu nào</p>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground truncate">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="text-sm text-muted-foreground">{doc.format}</span></td>
                      <td className="px-6 py-4"><span className="text-sm text-muted-foreground">{doc.size}</span></td>
                      <td className="px-6 py-4"><span className="text-sm text-muted-foreground">{doc.user}</span></td>
                      <td className="px-6 py-4"><span className="text-sm text-muted-foreground">{doc.profile}</span></td>
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            doc.status,
                          )}`}
                        >
                          {doc.status === "READY" && <Check className="w-3 h-3" />}
                          {(doc.status === "PARSING" ||
                            doc.status === "CHUNKING" ||
                            doc.status === "INDEXING") && (
                            <Loader className="w-3 h-3 animate-spin" />
                          )}
                          {doc.status === "FAILED" && <AlertCircle className="w-3 h-3" />}
                          {getStatusLabel(doc.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="text-sm text-muted-foreground">{doc.chunks}</span></td>
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
