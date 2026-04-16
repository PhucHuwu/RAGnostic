import { useState } from "react";
import { Search, Eye, Trash2, FileText, Check, AlertCircle, Loader } from "lucide-react";
import AdminLayout from "@/components/layouts/AdminLayout";

interface AdminDocument {
  id: string;
  name: string;
  format: string;
  size: string;
  user: string;
  profile: string;
  status: "READY" | "PARSING" | "CHUNKING" | "INDEXING" | "FAILED";
  uploadedAt: string;
  chunks: number;
}

const AdminDocuments = () => {
  const [documents, setDocuments] = useState<AdminDocument[]>([
    {
      id: "1",
      name: "Hướng dẫn sử dụng sản phẩm.pdf",
      format: "PDF",
      size: "2.4 MB",
      user: "john_doe",
      profile: "Hỗ trợ Khách hàng",
      status: "READY",
      uploadedAt: "2024-01-28",
      chunks: 42,
    },
    {
      id: "2",
      name: "Tài liệu API.docx",
      format: "DOCX",
      size: "1.8 MB",
      user: "jane_smith",
      profile: "Tư vấn Tài chính",
      status: "READY",
      uploadedAt: "2024-01-27",
      chunks: 28,
    },
    {
      id: "3",
      name: "FAQ thường gặp.txt",
      format: "TXT",
      size: "0.5 MB",
      user: "john_doe",
      profile: "Hỗ trợ Khách hàng",
      status: "INDEXING",
      uploadedAt: "2024-01-26",
      chunks: 15,
    },
    {
      id: "4",
      name: "Bảng giá dịch vụ.xlsx",
      format: "XLSX",
      size: "0.8 MB",
      user: "alice_brown",
      profile: "Tư vấn Tài chính",
      status: "PARSING",
      uploadedAt: "2024-01-25",
      chunks: 0,
    },
    {
      id: "5",
      name: "Tệp cũ.pdf",
      format: "PDF",
      size: "3.2 MB",
      user: "bob_wilson",
      profile: "Huấn luyện Nhân sự",
      status: "FAILED",
      uploadedAt: "2024-01-24",
      chunks: 0,
    },
    {
      id: "6",
      name: "Chính sách công ty.pdf",
      format: "PDF",
      size: "1.2 MB",
      user: "jane_smith",
      profile: "Hỗ trợ Khách hàng",
      status: "READY",
      uploadedAt: "2024-01-23",
      chunks: 18,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [profileFilter, setProfileFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const uniqueUsers = Array.from(new Set(documents.map((d) => d.user)));
  const uniqueProfiles = Array.from(new Set(documents.map((d) => d.profile)));

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesUser = !userFilter || doc.user === userFilter;
    const matchesProfile = !profileFilter || doc.profile === profileFilter;
    const matchesStatus = !statusFilter || doc.status === statusFilter;
    return matchesSearch && matchesUser && matchesProfile && matchesStatus;
  });

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <p className="text-sm text-muted-foreground mb-1">Lỗi</p>
            <p className="text-3xl font-display font-bold">
              {documents.filter((d) => d.status === "FAILED").length}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card/50">
            <p className="text-sm text-muted-foreground mb-1">Dung lượng tổng</p>
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
              <option value="">Tất cả profile</option>
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
                            doc.status
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
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                              title="Xem trước"
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
      </div>
    </AdminLayout>
  );
};

export default AdminDocuments;
