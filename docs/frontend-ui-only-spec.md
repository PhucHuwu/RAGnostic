# Đặc tả Frontend UI-Only cho RAGnostic

## 1) Mục đích tài liệu

Tài liệu này là nguồn duy nhất để dev Frontend dựng **giao diện hoàn chỉnh** cho hệ thống RAGnostic.

**Phạm vi duy nhất:** code UI/UX (layout, component, trạng thái hiển thị, điều hướng giao diện).

**Không thuộc phạm vi tài liệu này:**

- Không đặc tả nghiệp vụ backend.
- Không yêu cầu tích hợp API thật.
- Không dùng cho vận hành, bảo mật hệ thống, hay thiết kế cơ sở dữ liệu.

---

## 2) Mục tiêu giao diện cần hoàn thành

- Có landing page hiện đại, nhất quán phong cách.
- Có đầy đủ giao diện cho 2 vai trò: `USER` và `ADMIN`.
- Có đầy đủ các trạng thái UI: loading, empty, success, error.
- Hỗ trợ responsive: mobile (>=360px), tablet (>=768px), desktop (>=1280px).
- Chat UI hỗ trợ render Markdown.

---

## 3) Công nghệ FE đề xuất (chỉ để dựng UI)

- Next.js (App Router).
- TypeScript.
- TailwindCSS (hoặc CSS Modules nếu team đã chọn sẵn).
- Thư viện UI tự chọn, nhưng phải giữ 1 ngôn ngữ thiết kế xuyên suốt.
- Dữ liệu màn hình dùng mock local (JSON/mock service).

---

## 4) Cấu trúc route cần có

### Public

- `/` - Landing page.
- `/login` - Đăng nhập.

### User area

- `/app/profiles` - Danh sách profile chatbot.
- `/app/profiles/new` - Tạo profile.
- `/app/profiles/[profileId]` - Chi tiết profile.
- `/app/profiles/[profileId]/documents` - Quản lý tài liệu.
- `/app/profiles/[profileId]/chat` - Khu vực chat.

### Admin area

- `/admin/users` - Quản lý người dùng.
- `/admin/documents` - Quản lý tài liệu toàn hệ thống.
- `/admin/model` - Cấu hình model.
- `/admin/logs` - Log realtime.

### Error pages

- `/401`, `/403`, `/404`, `/500`.

---

## 5) Kiến trúc giao diện

## 5.1 Layout

- `PublicLayout`: dùng cho `/`, `/login`.
- `UserLayout`: sidebar trái + topbar + content.
- `AdminLayout`: sidebar riêng admin + topbar + content.

## 5.2 Điều hướng UI

- Sau login, điều hướng theo role:
  - `USER` -> `/app/profiles`
  - `ADMIN` -> `/admin/users`
- Sidebar active theo route hiện tại.
- Breadcrumb có ở mọi trang nội bộ trừ màn chat.

---

## 6) Ngôn ngữ thiết kế (UI style guide)

## 6.1 Tinh thần hình ảnh

- Chủ đề: AI Futuristic + Glassmorphism nhẹ.
- Nền có gradient tinh tế, không dùng nền phẳng đơn sắc toàn bộ.
- Tông màu ưu tiên: xanh than, cyan, slate, điểm nhấn amber.
- Tránh phong cách mặc định nhàm chán.

## 6.2 Typography

- Font đề xuất:
  - Heading: `Space Grotesk`
  - Body: `Manrope`
  - Code/Log: `JetBrains Mono`
- Scale đề xuất:
  - H1: 40/48
  - H2: 30/38
  - H3: 24/32
  - Body: 16/24
  - Caption: 14/20

## 6.3 Spacing và bo góc

- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48.
- Radius scale: 10, 14, 18.
- Card chuẩn: nền blur nhẹ + viền 1px + shadow mềm.

## 6.4 Motion

- Thời lượng animation: 160ms-240ms.
- Easing: `ease-out`.
- Có animation khi load trang và hiện danh sách theo stagger nhẹ.

---

## 7) Bộ component bắt buộc

- Button: primary, secondary, ghost, danger, icon button.
- Input controls: text, password, search, textarea, select, checkbox, radio, switch.
- Data display: table, badge, avatar, tooltip, progress, pagination.
- Feedback: toast, alert inline, modal confirm, skeleton, spinner.
- Navigation: sidebar, topbar, tabs, breadcrumb.
- Chat components: message bubble, typing indicator, markdown renderer, source card.
- Logs components: filter bar, realtime stream list, pause/resume toggle.

Mỗi component bắt buộc có đủ state:

- default
- hover
- focus
- disabled
- loading
- error (nếu có)

---

## 8) Đặc tả màn hình chi tiết (UI-only)

## 8.1 Landing page (`/`)

- Hero section: tiêu đề lớn, mô tả ngắn, 2 CTA (`Bắt đầu ngay`, `Xem demo`).
- Feature section: 6 thẻ tính năng.
- How-it-works: 4 bước dạng timeline ngang.
- Social proof: logo đối tác giả lập + chỉ số giả lập.
- Footer: liên kết điều hướng và thông tin bản quyền.

## 8.2 Login (`/login`)

- Form gồm username + password + nút đăng nhập.
- Có trạng thái loading và lỗi đăng nhập.
- Có panel giới thiệu ngắn ở cạnh phải (desktop), ẩn trên mobile.

## 8.3 User - Profiles list (`/app/profiles`)

- Header + nút `Tạo profile`.
- Grid card profile: tên, topic, mô tả ngắn, metadata.
- Hành động card: `Mở chat`, `Tài liệu`, `Chỉnh sửa`, `Xóa`.
- Empty state có CTA tạo profile đầu tiên.

## 8.4 User - Create/Edit profile (`/app/profiles/new`, `/app/profiles/[profileId]`)

- Form chia 3 khối:
  - Thông tin cơ bản (name, topic, description).
  - Cấu hình chunking (strategy, size, overlap).
  - Cấu hình retrieval/chat (top_k, rerank_top_n, temperature).
- Có validation UI ngay dưới field.

## 8.5 User - Documents (`/app/profiles/[profileId]/documents`)

- Khu upload kéo-thả + nút chọn file.
- Danh sách tài liệu dạng table:
  - Tên file, định dạng, kích thước, trạng thái, thời gian.
- Trạng thái pipeline hiển thị bằng badge màu:
  - `UPLOADED`, `PARSING`, `CHUNKING`, `INDEXING`, `READY`, `FAILED`.
- Actions: `Preview`, `Xóa`.

## 8.6 User - Chat (`/app/profiles/[profileId]/chat`)

- Cột trái: danh sách session + tìm kiếm session + nút `Session mới`.
- Cột phải:
  - Header session.
  - Khung message scroll.
  - Ô nhập câu hỏi + nút gửi.
- Message:
  - User bubble căn phải.
  - Assistant bubble căn trái, render Markdown.
- Có typing indicator và trạng thái gửi thất bại.

## 8.7 Admin - Users (`/admin/users`)

- Bảng users: username, role, status, last login, actions.
- Bộ lọc: role, status, search.
- Action row: đổi role/status, reset mật khẩu (modal xác nhận).

## 8.8 Admin - Documents (`/admin/documents`)

- Bảng tài liệu toàn hệ thống.
- Bộ lọc theo user, profile, trạng thái.
- Action: preview, delete.

## 8.9 Admin - Model config (`/admin/model`)

- Card hiển thị model hiện tại.
- Form chỉnh provider, model name, temperature, max tokens.
- Nút `Lưu cấu hình` + modal xác nhận thay đổi.

## 8.10 Admin - Logs realtime (`/admin/logs`)

- Thanh filter: level, service, time range, keyword.
- Field truy vấn nhanh: request_id, session_id, user_id.
- Danh sách log realtime dạng virtual list.
- Nút `Pause/Resume`.
- Dòng log dùng font mono, tô màu theo level.

---

## 9) Mock data và trạng thái giả lập

Dev FE phải tự mock đầy đủ dữ liệu để dựng UI mà không phụ thuộc backend.

## 9.1 Mock entities tối thiểu

- `currentUser` (`id`, `username`, `role`, `avatarUrl`).
- `profiles[]`.
- `documents[]`.
- `chatSessions[]`.
- `chatMessages[]`.
- `adminUsers[]`.
- `systemModelConfig`.
- `realtimeLogs[]`.

## 9.2 Mock trạng thái bắt buộc cho mỗi màn

- Loading (skeleton/spinner).
- Empty (không có dữ liệu).
- Error (lỗi tải hoặc lỗi thao tác).
- Success (thao tác thành công + toast).

---

## 10) Quy chuẩn UI text (tiếng Việt)

- Toàn bộ label, button, heading, thông báo hiển thị bằng tiếng Việt.
- Thống nhất thuật ngữ:
  - Profile chatbot
  - Tài liệu
  - Phiên chat
  - Nhật ký hệ thống
  - Cấu hình model

---

## 11) Accessibility tối thiểu

- Tất cả thao tác chính dùng được bằng bàn phím.
- Focus ring rõ ràng trên mọi control tương tác.
- Input có label rõ và thông báo lỗi dễ đọc.
- Màu trạng thái không là tín hiệu duy nhất (kèm icon/text).

---

## 12) Checklist bàn giao UI (Definition of Done - UI-only)

- [ ] Đủ toàn bộ route và layout theo tài liệu này.
- [ ] Đủ component bắt buộc và đầy đủ state hiển thị.
- [ ] Đủ tất cả màn User/Admin đã nêu.
- [ ] Chat render Markdown đúng và dễ đọc.
- [ ] Responsive đạt mobile/tablet/desktop.
- [ ] Có mock data + mock flow cho toàn bộ màn.
- [ ] Có trang lỗi 401/403/404/500.
- [ ] Toàn bộ text hiển thị bằng tiếng Việt có dấu.

---

## 13) Ghi chú triển khai

- Tài liệu này chỉ phục vụ dựng giao diện.
- Khi chưa có API thật, mọi action có thể dùng mock handler và giả lập delay.
- Không khóa cứng vào backend implementation cụ thể trong giai đoạn UI-only.
