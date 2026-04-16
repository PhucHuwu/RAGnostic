import { useState } from "react";
import { Search, MoreVertical, Lock, Shield, Trash2 } from "lucide-react";
import AdminLayout from "@/components/layouts/AdminLayout";

interface User {
  id: string;
  username: string;
  email: string;
  role: "ADMIN" | "USER";
  status: "active" | "inactive" | "suspended";
  lastLogin: string;
  createdAt: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      username: "admin_user",
      email: "admin@ragnostic.io",
      role: "ADMIN",
      status: "active",
      lastLogin: "2024-01-28 14:30",
      createdAt: "2024-01-01",
    },
    {
      id: "2",
      username: "john_doe",
      email: "john@example.com",
      role: "USER",
      status: "active",
      lastLogin: "2024-01-28 10:15",
      createdAt: "2024-01-10",
    },
    {
      id: "3",
      username: "jane_smith",
      email: "jane@example.com",
      role: "USER",
      status: "active",
      lastLogin: "2024-01-27 09:45",
      createdAt: "2024-01-12",
    },
    {
      id: "4",
      username: "bob_wilson",
      email: "bob@example.com",
      role: "USER",
      status: "inactive",
      lastLogin: "2024-01-15 16:20",
      createdAt: "2024-01-15",
    },
    {
      id: "5",
      username: "alice_brown",
      email: "alice@example.com",
      role: "ADMIN",
      status: "active",
      lastLogin: "2024-01-28 11:00",
      createdAt: "2024-01-05",
    },
    {
      id: "6",
      username: "charlie_davis",
      email: "charlie@example.com",
      role: "USER",
      status: "suspended",
      lastLogin: "2024-01-20 13:30",
      createdAt: "2024-01-18",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"" | "ADMIN" | "USER">("");
  const [statusFilter, setStatusFilter] = useState<
    "" | "active" | "inactive" | "suspended"
  >("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalAction, setModalAction] = useState<
    "change-role" | "change-status" | "reset-password" | "delete"
  >("change-role");

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenModal = (
    user: User,
    action: "change-role" | "change-status" | "reset-password" | "delete"
  ) => {
    setSelectedUser(user);
    setModalAction(action);
    setModalOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedUser) return;

    if (modalAction === "change-role") {
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                role: u.role === "ADMIN" ? "USER" : "ADMIN",
              }
            : u
        )
      );
    } else if (modalAction === "delete") {
      setUsers(users.filter((u) => u.id !== selectedUser.id));
    }

    setModalOpen(false);
    setSelectedUser(null);
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                placeholder="Tìm theo tên hoặc email..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Vai trò
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="">Tất cả vai trò</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="suspended">Tạm khóa</option>
            </select>
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

        {/* Users Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
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
                      <p className="text-muted-foreground">
                        Không tìm thấy người dùng nào
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground">
                          {user.username}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">
                          {user.email}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                          {user.role === "ADMIN" ? (
                            <Shield className="w-3 h-3" />
                          ) : (
                            <></>
                          )}
                          {user.role === "ADMIN" ? "Admin" : "User"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                            user.status
                          )}`}
                        >
                          {getStatusLabel(user.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground">
                          {user.lastLogin}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleOpenModal(user, "change-role")
                            }
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Đổi vai trò"
                          >
                            <Shield className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </button>
                          <button
                            onClick={() =>
                              handleOpenModal(user, "reset-password")
                            }
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Reset mật khẩu"
                          >
                            <Lock className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </button>
                          <div className="relative group">
                            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
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
                {modalAction === "reset-password" && "Reset mật khẩu?"}
                {modalAction === "delete" && "Xóa người dùng?"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {modalAction === "change-role" &&
                  `Bạn sắp đổi vai trò của ${selectedUser.username} từ ${selectedUser.role} sang ${selectedUser.role === "ADMIN" ? "USER" : "ADMIN"}.`}
                {modalAction === "reset-password" &&
                  `Mật khẩu mới sẽ được gửi tới email của ${selectedUser.username}.`}
                {modalAction === "delete" &&
                  `Người dùng ${selectedUser.username} sẽ bị xóa vĩnh viễn.`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted/50 font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmAction}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
