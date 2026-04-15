# Tài liệu yêu cầu dự án: RAGnostic

## 1. Mục tiêu dự án

Xây dựng hệ thống RAG (Retrieval-Augmented Generation) không phụ thuộc domain, cho phép nhiều người dùng quản lý và khai thác tri thức từ bộ tài liệu riêng theo từng profile chatbot.

## 2. Phạm vi và định hướng giải pháp

- Áp dụng kiến trúc RAG kết hợp BM25 re-ranking để nâng cao chất lượng truy xuất.
- Hỗ trợ đa profile; mỗi profile gắn với một chủ đề và một tập tài liệu riêng.
- Tài liệu đầu vào có thể chứa văn bản, hình ảnh, bảng biểu.
- Định dạng tài liệu hỗ trợ: `docx`, `pdf`, `txt`.
- Sử dụng model mặc định: `nvidia/nemotron-3-super-120b-a12b:free` thông qua OpenRouter.
- Sử dụng DockLink để chuyển đổi tài liệu phi cấu trúc sang dữ liệu JSON có cấu trúc.
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

### 3.2 Quản lý profile và tri thức

- Người dùng có thể tạo nhiều profile chatbot.
- Mỗi profile sử dụng bộ tài liệu riêng do người dùng cung cấp.

### 3.3 Quản lý tài liệu

- Người dùng có thể tự quản lý tài liệu đã tải lên: thêm, xóa, xem trước.
- Quản trị viên có thể quản trị tài liệu tải lên của người dùng trên toàn hệ thống.

### 3.4 Quản lý người dùng và hệ thống

- Hệ thống có chức năng đăng nhập/đăng xuất cho cả User và Admin.
- Quản trị viên có thể quản trị người dùng và cấu hình hệ thống.
- Quản trị viên có thể thay đổi model AI được sử dụng trong hệ thống.

### 3.5 Giám sát và nhật ký hệ thống

- Admin có thể xem log hệ thống theo thời gian thực (real-time) trên giao diện quản trị.
- Hỗ trợ lọc log theo mức độ (`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`), theo dịch vụ, và theo khoảng thời gian.
- Hỗ trợ tìm kiếm log theo từ khóa và mã định danh liên quan (ví dụ: `request_id`, `session_id`, `user_id`).
- Log cần hiển thị theo luồng mới nhất và có khả năng tạm dừng/tiếp tục theo dõi.

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

- Người dùng đăng nhập, tạo profile, tải tài liệu, và chat theo đúng profile.
- Hệ thống truy xuất tri thức từ tài liệu đã nạp, có BM25 re-ranking.
- Lịch sử chat và session được lưu tách biệt, đảm bảo nhớ 10 câu gần nhất.
- Admin quản trị được người dùng, tài liệu và model AI đang chạy.
- Giao diện có landing page và hỗ trợ Markdown rendering trong khung chat.
- Admin xem được log hệ thống real-time và lọc được theo mức độ/các mã định danh chính.
