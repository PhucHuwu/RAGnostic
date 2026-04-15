# Kế hoạch task Backend (PM)

## Mục tiêu

- Hoàn thiện 100% backend cho hệ thống RAGnostic theo yêu cầu trong `docs/project.md` và `docs/system-design.md`.
- Mỗi hạng mục có thể cập nhật tiến độ bằng checkbox.

## 1) Nền tảng dự án và môi trường

- [ ] Khởi tạo cấu trúc module FastAPI theo domain (`auth`, `profiles`, `documents`, `chat`, `admin`, `logs`).
- [ ] Thiết lập cấu hình môi trường theo `venv`, tách `dev/staging/prod`.
- [ ] Chuẩn hóa quản lý secret bằng biến môi trường và file mẫu `.env.example`.
- [ ] Thiết lập dependency injection cho DB, cache, object storage, LLM client.
- [ ] Thiết lập healthcheck/readiness endpoint (`/health`, `/ready`).

## 2) Database, migration và dữ liệu mẫu

- [ ] Tạo migration toàn bộ bảng theo thiết kế: `users`, `user_sessions`, `chatbot_profiles`, `documents`, `document_parse_results`, `document_chunks`, `chat_sessions`, `chat_messages`, `message_retrieval_traces`, `system_configs`, `audit_logs`.
- [ ] Tạo ENUM và ràng buộc dữ liệu đúng đặc tả (role, status, chunk strategy, document status, chat status).
- [ ] Bật và cấu hình `pgvector` cho `document_chunks.embedding_vector`.
- [ ] Tạo index nghiệp vụ và index hiệu năng (bao gồm index vector).
- [ ] Seed tài khoản admin mặc định `admin/123456` chỉ cho môi trường khởi tạo.
- [ ] Seed cấu hình hệ thống mặc định: model, memory window = 10, tham số chat cơ bản.

## 3) Auth và RBAC

- [ ] Hoàn thiện `POST /auth/login` trả access + refresh token.
- [ ] Hoàn thiện `POST /auth/refresh` và cơ chế xoay vòng refresh token.
- [ ] Hoàn thiện `POST /auth/logout` thu hồi phiên hiện tại.
- [ ] Hoàn thiện `GET /auth/me`.
- [ ] Cài đặt middleware xác thực JWT và guard phân quyền `USER`/`ADMIN`.
- [ ] Lưu và quản lý phiên trong `user_sessions` (IP, user-agent, revoked_at, expires_at).
- [ ] Thêm rate limit cho endpoint auth để giảm brute-force.

## 4) Quản lý profile chatbot

- [ ] Hoàn thiện `GET /profiles`.
- [ ] Hoàn thiện `POST /profiles`.
- [ ] Hoàn thiện `GET /profiles/{profile_id}`.
- [ ] Hoàn thiện `PATCH /profiles/{profile_id}` (chunking/retrieval/model override).
- [ ] Hoàn thiện `DELETE /profiles/{profile_id}` (soft delete).
- [ ] Thực thi kiểm tra ownership: user chỉ thao tác profile của mình.

## 5) Quản lý tài liệu và ingest pipeline

- [ ] Hoàn thiện upload tài liệu `POST /profiles/{profile_id}/documents/upload` cho `pdf/docx/txt`.
- [ ] Lưu file gốc vào MinIO, metadata vào PostgreSQL, checksum SHA-256.
- [ ] Hoàn thiện `GET /profiles/{profile_id}/documents`.
- [ ] Hoàn thiện `GET /documents/{document_id}`.
- [ ] Hoàn thiện `DELETE /documents/{document_id}` (soft delete + cleanup bất đồng bộ).
- [ ] Hoàn thiện `GET /documents/{document_id}/preview`.
- [ ] Xây worker pipeline: `UPLOADED -> PARSING -> CHUNKING -> INDEXING -> READY/FAILED`.
- [ ] Tích hợp DockLink để parse tài liệu sang JSON có cấu trúc.
- [ ] Cài đặt 4 chiến lược chunking: outline, paragraph, semantic, character.
- [ ] Tạo embedding, lưu vector vào `document_chunks`, gắn metadata truy xuất.
- [ ] Cơ chế retry có kiểm soát và lưu `error_message` khi pipeline lỗi.

## 6) Chat, session và RAG runtime

- [ ] Hoàn thiện `POST /profiles/{profile_id}/sessions`.
- [ ] Hoàn thiện `GET /profiles/{profile_id}/sessions`.
- [ ] Hoàn thiện `GET /sessions/{session_id}/messages` có phân trang cursor.
- [ ] Hoàn thiện `POST /sessions/{session_id}/messages` hỗ trợ stream/non-stream.
- [ ] Lưu message user/assistant đầy đủ token usage, latency, request_id.
- [ ] Triển khai memory window 10 câu gần nhất theo session.
- [ ] Triển khai truy xuất vector + BM25 re-ranking trước khi gọi LLM.
- [ ] Lưu `message_retrieval_traces` gồm raw candidates, reranked results, citations.
- [ ] Tích hợp OpenRouter với model mặc định `nvidia/nemotron-3-super-120b-a12b:free`.
- [ ] Bổ sung fallback và timeout policy khi provider chậm/lỗi.

## 7) Admin APIs

- [ ] Hoàn thiện `GET /admin/users`.
- [ ] Hoàn thiện `POST /admin/users`.
- [ ] Hoàn thiện `PATCH /admin/users/{user_id}` (role/status).
- [ ] Hoàn thiện `POST /admin/users/{user_id}/reset-password`.
- [ ] Hoàn thiện `GET /admin/documents`.
- [ ] Hoàn thiện `DELETE /admin/documents/{document_id}`.
- [ ] Hoàn thiện `GET /admin/system-config/model`.
- [ ] Hoàn thiện `PUT /admin/system-config/model`.
- [ ] Ghi `audit_logs` cho mọi thao tác quản trị quan trọng.

## 8) Logging, monitoring và quan sát hệ thống

- [ ] Chuẩn hóa structured logging JSON line với trường bắt buộc: `timestamp`, `level`, `service`, `event`, `message`, `request_id`, `session_id`, `user_id`, `metadata`.
- [ ] Đảm bảo timestamp ISO 8601 UTC toàn hệ thống.
- [ ] Tạo luồng log realtime qua SSE hoặc WebSocket cho admin dashboard.
- [ ] Hoàn thiện `GET /admin/logs/search` với filter level/service/time/q/request_id/session_id/user_id.
- [ ] Cài đặt correlation id xuyên suốt request để truy vết.
- [ ] Tích hợp metrics cơ bản (QPS, latency, error rate, pipeline success/fail).

## 9) Bảo mật và độ tin cậy

- [ ] Kiểm tra MIME/type thực tế khi upload, chặn file không hợp lệ.
- [ ] Giới hạn dung lượng upload theo cấu hình.
- [ ] Sanitization input và validation schema cho toàn bộ API.
- [ ] Cấu hình CORS và CSRF strategy phù hợp mô hình auth.
- [ ] Bổ sung cơ chế idempotency cho các thao tác nhạy cảm khi cần.
- [ ] Xử lý lỗi thống nhất theo chuẩn `code/message/details/request_id`.

## 10) Kiểm thử và chất lượng mã nguồn

- [ ] Viết unit test cho service layer quan trọng (auth, profile, chat, retrieval).
- [ ] Viết integration test cho API chính theo luồng người dùng.
- [ ] Viết test pipeline ingest (parse/chunk/index) với dữ liệu mẫu.
- [ ] Viết test phân quyền (USER không truy cập tài nguyên ADMIN và ngược lại).
- [ ] Viết test hồi quy cho memory window 10 câu và session isolation.
- [ ] Thiết lập ngưỡng coverage mục tiêu và báo cáo tự động.

## 11) Hiệu năng và vận hành

- [ ] Benchmark endpoint chat và retrieval với dữ liệu mô phỏng tải.
- [ ] Tối ưu truy vấn DB và index dựa trên kết quả benchmark.
- [ ] Tối ưu worker concurrency cho ingest pipeline.
- [ ] Cấu hình timeout/retry/circuit breaker cho dịch vụ ngoài (OpenRouter, DockLink, MinIO).
- [ ] Chuẩn bị script backup/restore cho PostgreSQL và MinIO metadata.

## 12) Tài liệu và bàn giao

- [ ] Hoàn thiện tài liệu API (OpenAPI + ví dụ request/response thực tế).
- [ ] Hoàn thiện runbook vận hành (deploy, rollback, xử lý sự cố).
- [ ] Hoàn thiện tài liệu kiến trúc backend và sơ đồ sequence chính.
- [ ] Hoàn thiện checklist release backend trước khi go-live.

## 13) Definition of Done (Backend)

- [ ] 100% endpoint trong thiết kế hoạt động đúng nghiệp vụ và qua test.
- [ ] Pipeline ingest ổn định, có retry, có theo dõi trạng thái chi tiết.
- [ ] Chat RAG đúng profile, đúng session, đúng memory 10 câu gần nhất.
- [ ] Admin quản trị được user/tài liệu/model và xem log realtime có filter.
- [ ] Structured logging và audit logging hoạt động đầy đủ, truy vết được sự cố.
- [ ] Tài liệu kỹ thuật + runbook + checklist release đầy đủ để vận hành.
