import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Upload,
  File,
  FileText,
  FileJson,
  Trash2,
  Eye,
  X,
  Check,
  AlertCircle,
  Loader,
} from "lucide-react";
import UserLayout from "@/components/layouts/UserLayout";

interface Document {
  id: string;
  name: string;
  format: string;
  size: string;
  sizeBytes: number;
  uploadedAt: string;
  status: "UPLOADED" | "PARSING" | "CHUNKING" | "INDEXING" | "READY" | "FAILED";
  progress?: number;
}

const AppDocuments = () => {
  const { profileId } = useParams();
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "1",
      name: "Hướng dẫn sử dụng sản phẩm.pdf",
      format: "PDF",
      size: "2.4 MB",
      sizeBytes: 2400000,
      uploadedAt: "2024-01-28",
      status: "READY",
      progress: 100,
    },
    {
      id: "2",
      name: "Tài liệu API.docx",
      format: "DOCX",
      size: "1.8 MB",
      sizeBytes: 1800000,
      uploadedAt: "2024-01-27",
      status: "READY",
      progress: 100,
    },
    {
      id: "3",
      name: "FAQ thường gặp.txt",
      format: "TXT",
      size: "0.5 MB",
      sizeBytes: 500000,
      uploadedAt: "2024-01-26",
      status: "INDEXING",
      progress: 75,
    },
    {
      id: "4",
      name: "Bảng giá dịch vụ.xlsx",
      format: "XLSX",
      size: "0.8 MB",
      sizeBytes: 800000,
      uploadedAt: "2024-01-25",
      status: "PARSING",
      progress: 30,
    },
    {
      id: "5",
      name: "Tệp cũ.pdf",
      format: "PDF",
      size: "3.2 MB",
      sizeBytes: 3200000,
      uploadedAt: "2024-01-24",
      status: "FAILED",
    },
  ]);

  const [isDragActive, setIsDragActive] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const newDoc: Document = {
        id: String(documents.length + 1),
        name: file.name,
        format: file.name.split(".").pop()?.toUpperCase() || "FILE",
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        sizeBytes: file.size,
        uploadedAt: new Date().toLocaleDateString("vi-VN"),
        status: "UPLOADED",
        progress: 0,
      };
      setDocuments((prev) => [newDoc, ...prev]);
    });
  };

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
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
            Profile: {profileId} - Tải lên và quản lý tài liệu cho chatbot
          </p>
        </div>

        {/* Upload Area */}
        <div
          ref={dragRef}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`p-8 rounded-xl border-2 border-dashed transition-colors ${
            isDragActive
              ? "border-primary/50 bg-primary/5"
              : "border-border bg-card/50 hover:border-primary/30"
          }`}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-display font-bold mb-2">
              Tải lên tài liệu
            </h3>
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
              PDF, TXT, DOCX, XLSX - Tối đa 100MB mỗi file
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <p className="text-sm text-muted-foreground mb-1">
              Dung lượng tổng
            </p>
            <p className="text-3xl font-display font-bold">
              {(
                documents.reduce((sum, d) => sum + d.sizeBytes, 0) /
                1024 /
                1024
              ).toFixed(1)}{" "}
              MB
            </p>
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
    </UserLayout>
  );
};

export default AppDocuments;
