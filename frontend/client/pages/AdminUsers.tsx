"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Lock, Shield, Trash2, SlidersHorizontal } from "lucide-react";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  updateAdminUserStatus,
  ApiError,
  listAdminUsers,
  resetAdminUserPassword,
  updateAdminUserRole,
  type AdminUserResponse,
} from "@/lib/api";
import { ApiErrorState, TableSkeleton } from "@/components/common/api-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCurrentUser } from "@/lib/auth";

interface User {
  id: string;
  username: string;
  email: string;
  role: "ADMIN" | "USER";
  status: "active" | "inactive" | "suspended";
  lastLogin: string;
  createdAt: string;
}

function mapUser(user: AdminUserResponse): User {
  const mapStatus = {
    ACTIVE: "active",
    LOCKED: "suspended",
    DISABLED: "inactive",
  } as const;

  return {
    id: user.id,
    username: user.username,
    email: user.email ?? "N/A",
    role: user.role,
    status: mapStatus[user.status],
    lastLogin: user.last_login_at
      ? new Date(user.last_login_at).toLocaleString("vi-VN")
      : "Chưa đăng nhập",
    createdAt: new Date(user.created_at).toLocaleDateString("vi-VN"),
  };
}

const AdminUsers = () => {
  const currentUser = getCurrentUser();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "ADMIN" | "USER">("");
  const [statusFilter, setStatusFilter] = useState<
    "" | "active" | "inactive" | "suspended"
  >("");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<
    "change-role" | "change-status" | "reset-password" | "delete"
  >("change-role");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [isActing, setIsActing] = useState(false);

  const nextStatus = (status: User["status"]): User["status"] => {
    if (status === "active") return "suspended";
    if (status === "suspended") return "inactive";
    return "active";
  };

  const toApiStatus = (status: User["status"]) => {
    if (status === "active") return "ACTIVE" as const;
    if (status === "suspended") return "LOCKED" as const;
    return "DISABLED" as const;
  };

  const loadUsers = useCallback(async (isManualRetry = false) => {
    if (isManualRetry) {
      setIsRetrying(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const data = await listAdminUsers();
      setUsers(data.map(mapUser));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể tải danh sách người dùng");
      }
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesSearch =
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = !roleFilter || user.role === roleFilter;
        const matchesStatus = !statusFilter || user.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
      }),
    [users, searchQuery, roleFilter, statusFilter],
  );

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  const closeModal = () => {
    setModalOpen(false);
    setSelectedUserId(null);
    setResetPasswordValue("");
    setModalAction("change-role");
    setIsActing(false);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setRoleFilter("");
    setStatusFilter("");
  };

  const handleOpenModal = (
    user: User,
    action: "change-role" | "change-status" | "reset-password" | "delete",
  ) => {
    if (isActing) {
      return;
    }
    setSelectedUserId(user.id);
    setModalAction(action);
    setResetPasswordValue("");
    setModalOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedUser || isActing) return;

    const run = async () => {
      setIsActing(true);
      try {
        if (modalAction === "change-role") {
          if (currentUser?.id === selectedUser.id && selectedUser.role === "ADMIN") {
            setError("Không thể tự hạ quyền quản trị viên của chính bạn");
            return;
          }
          const nextRole = selectedUser.role === "ADMIN" ? "USER" : "ADMIN";
          await updateAdminUserRole(selectedUser.id, nextRole);
        } else if (modalAction === "reset-password") {
          if (resetPasswordValue.trim().length < 6) {
            setError("Mật khẩu mới phải có ít nhất 6 ký tự");
            setIsActing(false);
            return;
          }
          await resetAdminUserPassword(selectedUser.id, resetPasswordValue.trim());
        } else if (modalAction === "change-status") {
          if (currentUser?.id === selectedUser.id && selectedUser.role === "ADMIN") {
            setError("Không thể tự tạm khóa hoặc vô hiệu hóa tài khoản của chính bạn");
            return;
          }
          const newStatus = nextStatus(selectedUser.status);
          await updateAdminUserStatus(selectedUser.id, toApiStatus(newStatus));
        }
        await loadUsers();
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Không thể thực hiện thao tác người dùng");
        }
      } finally {
        closeModal();
      }
    };

    void run();
  };

  const getStatusBadge = (status: User["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100/20 text-green-700 dark:text-green-400";
      case "inactive":
        return "bg-gray-100/20 text-gray-700 dark:text-gray-400";
      case "suspended":
        return "bg-red-100/20 text-red-700 dark:text-red-400";
    }
  };

  const getStatusLabel = (status: User["status"]) => {
    switch (status) {
      case "active":
        return "Hoạt động";
      case "inactive":
        return "Không hoạt động";
      case "suspended":
        return "Tạm khóa";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Quản lý Người dùng
          </h1>
          <p className="text-muted-foreground">
            Quản lý tài khoản, vai trò và quyền hạn của người dùng
          </p>
        </div>

        {/* Filters */}
        {isLoading && <TableSkeleton />}

        {error && users.length === 0 && (
          <ApiErrorState
            message={error}
            onRetry={() => void loadUsers(true)}
            isRetrying={isRetrying}
          />
        )}

        {error && users.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

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
          className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 ${
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
                name="admin-user-search"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên hoặc email..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Vai trò
            </label>
            <Select
              value={roleFilter || "all"}
              onValueChange={(value) =>
                setRoleFilter(value === "all" ? "" : (value as "ADMIN" | "USER"))
              }
            >
              <SelectTrigger className="w-full bg-input text-foreground text-sm">
                <SelectValue placeholder="Tất cả vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="USER">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Trạng thái
            </label>
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) =>
                setStatusFilter(
                  value === "all"
                    ? ""
                    : (value as "active" | "inactive" | "suspended"),
                )
              }
            >
              <SelectTrigger className="w-full bg-input text-foreground text-sm">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
                <SelectItem value="suspended">Tạm khóa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Kết quả
            </label>
            <div className="px-4 py-2 rounded-lg border border-border bg-muted/30 text-foreground text-sm font-medium">
               {filteredUsers.length} người dùng
            </div>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-muted-foreground text-sm">
              Không tìm thấy người dùng nào
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{user.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary shrink-0">
                    {user.role === "ADMIN" && <Shield className="w-3 h-3" />}
                    {user.role === "ADMIN" ? "Admin" : "User"}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full font-semibold ${getStatusBadge(
                      user.status,
                    )}`}
                  >
                    {getStatusLabel(user.status)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">Đăng nhập cuối</span>
                  <span className="text-foreground text-right">{user.lastLogin}</span>
                </div>

                <div className="pt-1 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleOpenModal(user, "change-status")}
                    className="h-9 rounded-lg border border-border hover:bg-muted transition-colors inline-flex items-center justify-center"
                    title="Đổi trạng thái"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenModal(user, "change-role")}
                    className="h-9 rounded-lg border border-border hover:bg-muted transition-colors inline-flex items-center justify-center"
                    title="Đổi vai trò"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenModal(user, "reset-password")}
                    className="h-9 rounded-lg border border-border hover:bg-muted transition-colors inline-flex items-center justify-center"
                    title="Reset mật khẩu"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="bg-card/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Tên đăng nhập
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Vai trò
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Đăng nhập cuối
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-muted-foreground">Không tìm thấy người dùng nào</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground">{user.username}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">{user.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                          {user.role === "ADMIN" && <Shield className="w-3 h-3" />}
                          {user.role === "ADMIN" ? "Admin" : "User"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                            user.status,
                          )}`}
                        >
                          {getStatusLabel(user.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">{user.lastLogin}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenModal(user, "change-status")}
                            className="px-2 lg:px-3 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors inline-flex items-center gap-1.5"
                            title="Đổi trạng thái"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">
                              {user.status === "active"
                                ? "Tạm khóa"
                                : user.status === "suspended"
                                  ? "Vô hiệu"
                                  : "Kích hoạt"}
                            </span>
                          </button>
                          <button
                            onClick={() => handleOpenModal(user, "change-role")}
                            className="px-2 lg:px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors inline-flex items-center gap-1.5"
                            title="Đổi vai trò"
                          >
                            <Shield className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            <span className="hidden lg:inline text-xs font-semibold text-foreground">Vai trò</span>
                          </button>
                          <button
                            onClick={() => handleOpenModal(user, "reset-password")}
                            className="px-2 lg:px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors inline-flex items-center gap-1.5"
                            title="Reset mật khẩu"
                          >
                            <Lock className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            <span className="hidden lg:inline text-xs font-semibold text-foreground">Mật khẩu</span>
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

        {/* Confirmation Modal */}
        {modalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl border border-border max-w-md w-full p-6 animate-fade-in">
              <h3 className="text-xl font-display font-bold mb-2 text-foreground">
                {modalAction === "change-role" && "Đổi vai trò?"}
                {modalAction === "change-status" && "Đổi trạng thái?"}
                {modalAction === "reset-password" && "Reset mật khẩu?"}
                {modalAction === "delete" && "Xóa người dùng?"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {modalAction === "change-role" &&
                  `Bạn sắp đổi vai trò của ${selectedUser.username} từ ${selectedUser.role} sang ${selectedUser.role === "ADMIN" ? "USER" : "ADMIN"}.`}
                {modalAction === "change-status" &&
                  `Bạn sắp đổi trạng thái của ${selectedUser.username} từ ${getStatusLabel(selectedUser.status)} sang ${getStatusLabel(nextStatus(selectedUser.status))}.`}
                {modalAction === "reset-password" &&
                  `Nhập mật khẩu mới cho ${selectedUser.username}.`}
                {modalAction === "delete" &&
                  `Người dùng ${selectedUser.username} sẽ bị xóa vĩnh viễn.`}
              </p>
              {modalAction === "reset-password" && (
                <div className="mb-6">
                  <label
                    htmlFor="reset-password"
                    className="block text-sm font-medium mb-2 text-foreground"
                  >
                    Mật khẩu mới
                  </label>
                  <input
                    id="reset-password"
                    type="password"
                    name="admin-reset-new-password"
                    autoComplete="new-password"
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  disabled={isActing}
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted/50 font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={
                    isActing ||
                    (modalAction === "reset-password" &&
                      resetPasswordValue.trim().length < 6)
                  }
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                >
                  {isActing ? "Đang xử lý..." : "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredUsers.length === 0 && users.length > 0 && !isLoading && (
          <div className="rounded-lg border border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground flex items-center justify-between gap-3">
            <span>Không có kết quả do bộ lọc hiện tại.</span>
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-muted/50 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
