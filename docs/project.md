# Tài liệu yêu cầu dự án: RAGnostic

## 1. Mục tiêu dự án

Xây dựng hệ thống RAG (Retrieval-Augmented Generation) theo mô hình doanh nghiệp dựa trên Workspace. Mỗi doanh nghiệp có một Workspace riêng, kho tài liệu dùng chung theo phân quyền, phiên chat của từng nhân viên vẫn riêng tư, và AI trả lời dựa trên tri thức trong Workspace.

## 2. Phạm vi và định hướng giải pháp

- Áp dụng kiến trúc RAG kết hợp BM25 re-ranking để nâng cao chất lượng truy xuất.
- Hỗ trợ mô hình đa Workspace (multi-tenant theo doanh nghiệp).
- Hỗ trợ nhiều AI Assistant trong cùng Workspace (ví dụ: HR Bot, IT Bot, Legal Bot, Sales Bot).
- Kho tài liệu được chia sẻ theo Workspace và phân quyền truy cập theo phòng ban/chức vụ.
- Tài liệu đầu vào có thể chứa văn bản, hình ảnh, bảng biểu.
- Định dạng tài liệu hỗ trợ: `docx`, `pdf`, `txt`.
- Sử dụng model mặc định: `nvidia/nemotron-3-super-120b-a12b:free` thông qua OpenRouter.
- Sử dụng Docling (https://www.docling.ai/) để chuyển đổi tài liệu phi cấu trúc sang dữ liệu JSON có cấu trúc.
- Hỗ trợ nhiều chiến lược chunking:
  - Theo outline
  - Theo đoạn
  - Theo ngữ nghĩa
  - Theo số lượng ký tự

## 3. Yêu cầu chức năng

### 3.1 Quản lý hội thoại

- Người dùng có thể xem lịch sử chat.
- Hệ thống duy trì trí nhớ ngắn hạn cho 10 câu hỏi gần nhất của người dùng.
- Mỗi cuộc hội thoại hoạt động theo session độc lập để tránh xung đột ngữ cảnh.

### 3.2 Quản lý assistant và tri thức theo Workspace

- Workspace có thể tạo nhiều assistant theo nghiệp vụ phòng ban.
- Mỗi assistant truy cập kho tri thức chung của Workspace theo phạm vi phân quyền.
- Nhân viên chỉ thấy và sử dụng tài liệu được cấp quyền theo phòng ban/chức vụ.

### 3.3 Quản lý tài liệu

- Workspace Admin/Knowledge Manager có thể tải lên, xóa, xem trước tài liệu trong Workspace.
- Tài liệu hỗ trợ phân quyền truy cập theo phòng ban/chức vụ.
- System Admin có thể quản trị tài liệu toàn hệ thống khi cần.

### 3.4 Quản lý người dùng, Workspace và hệ thống

- Hệ thống có chức năng đăng nhập/đăng xuất cho người dùng doanh nghiệp và quản trị.
- Hỗ trợ các vai trò: `SYSTEM_ADMIN`, `WORKSPACE_OWNER`, `WORKSPACE_ADMIN`, `KNOWLEDGE_MANAGER`, `AI_ADMIN`, `MEMBER`.
- System Admin quản lý toàn bộ nền tảng, doanh nghiệp/workspace, model AI và tài nguyên hệ thống.
- Workspace Owner/Admin quản lý thành viên, phân quyền và assistant trong doanh nghiệp.
- AI Admin cấu hình model AI và retrieval/RAG theo Workspace/Assistant.
- Prompt hệ thống là prompt dùng chung, cấu hình nội bộ backend, không cho chỉnh sửa và không hiển thị trên UI.

### 3.5 Giám sát và nhật ký hệ thống

- Admin có thể xem log hệ thống theo thời gian thực (real-time) trên giao diện quản trị.
- Hỗ trợ lọc log theo mức độ (`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`), theo dịch vụ, và theo khoảng thời gian.
- Hỗ trợ tìm kiếm log theo từ khóa và mã định danh liên quan (ví dụ: `request_id`, `session_id`, `user_id`).
- Log cần hiển thị theo luồng mới nhất và có khả năng tạm dừng/tiếp tục theo dõi.
- Bắt buộc audit log cho thao tác upload/chỉnh sửa/xóa tài liệu và thay đổi phân quyền/cấu hình AI.

## 4. Yêu cầu phi chức năng

- Cung cấp tài khoản Admin mặc định cho môi trường khởi tạo: `admin/123456`.
- Giao diện web cần có landing page chất lượng cao, hiện đại.
- Ngôn ngữ thiết kế ưu tiên: Glassmorphism / AI Futuristic.
- Nội dung phản hồi chat phải hỗ trợ render Markdown.
- Môi trường Python được quản lý bằng `venv`.
- Hệ thống phải áp dụng structured logging (log có cấu trúc) để phục vụ truy vấn, theo dõi, và phân tích.
- Định dạng log khuyến nghị: JSON line (mỗi dòng là một object JSON độc lập).
- Tối thiểu mỗi bản ghi log cần có các trường: `timestamp`, `level`, `service`, `event`, `message`, `request_id`, `session_id`, `user_id` (nếu có), `metadata`.
- Timestamp cần theo chuẩn ISO 8601 (UTC) để đồng bộ khi tổng hợp log đa dịch vụ.

## 5. Tech stack đề xuất

- Backend: Python, FastAPI.
- Frontend: Next.js, Express.
- Database/Object Storage: PostgreSQL, MinIO.
- Cache: Redis.

## 6. Tiêu chí hoàn thành tối thiểu (MVP)

- Doanh nghiệp có thể tạo và sử dụng Workspace riêng.
- Nhân viên chat riêng tư theo session cá nhân; không truy cập được lịch sử chat của người khác.
- Assistant trả lời dựa trên tài liệu dùng chung của Workspace theo đúng phân quyền.
- Workspace Admin quản lý người dùng, tài liệu, và assistant; AI Admin quản lý cấu hình AI/RAG.
- Hệ thống có audit log cho upload/chỉnh sửa/xóa dữ liệu và thay đổi quyền/cấu hình.
- Prompt không xuất qua API/UI và không ghi lộ nội dung trong log/audit.
- Giao diện có landing page và hỗ trợ Markdown rendering trong khung chat.
