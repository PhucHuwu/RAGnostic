# Phân tích thiết kế hệ thống chi tiết - Dự án RAGnostic

## 1. Tổng quan và mục tiêu

RAGnostic là hệ thống RAG (Retrieval-Augmented Generation) đa người dùng, không phụ thuộc domain, cho phép mỗi người dùng tạo nhiều profile chatbot và khai thác tri thức từ bộ tài liệu riêng.

### 1.1 Mục tiêu nghiệp vụ

- Người dùng có thể đăng nhập, tạo profile chatbot, tải tài liệu, chat theo profile.
- Hệ thống truy xuất tri thức từ tài liệu đã nạp và áp dụng BM25 re-ranking để nâng chất lượng kết quả.
- Lưu lịch sử hội thoại theo session độc lập, duy trì trí nhớ ngắn hạn 10 câu gần nhất.
- Admin quản trị user, tài liệu và model AI đang chạy.
- Admin theo dõi log hệ thống real-time, lọc theo mức độ/dịch vụ/khoảng thời gian/mã định danh.

### 1.2 Phạm vi tài liệu

Tài liệu này mô tả chi tiết:

- Thiết kế chức năng.
- Thiết kế cơ sở dữ liệu.
- Thiết kế API.
- Luồng xử lý chính và quy tắc nghiệp vụ.

## 2. Kiến trúc hệ thống đề xuất

### 2.1 Thành phần chính

- **Frontend**: Next.js (trang landing page, giao diện chat Markdown, dashboard user/admin).
- **Backend API**: FastAPI (REST API, xác thực, phân quyền, nghiệp vụ).
- **RAG Worker**: xử lý bất đồng bộ pipeline ingest tài liệu.
- **Database**: PostgreSQL (dữ liệu nghiệp vụ, metadata, lịch sử chat).
- **Object Storage**: MinIO (lưu file gốc và artifact parse).
- **Cache/Queue**: Redis (cache, trạng thái job, token/session hỗ trợ).
- **LLM Provider**: OpenRouter, model mặc định `nvidia/nemotron-3-super-120b-a12b:free`.
- **Document Parser**: DockLink (chuyển tài liệu phi cấu trúc thành JSON có cấu trúc).

### 2.2 Luồng dữ liệu tổng quát

1. Người dùng tải tài liệu lên profile.
2. Backend lưu file vào MinIO và metadata vào PostgreSQL.
3. Worker chạy pipeline parse -> chunk -> embedding/index.
4. Người dùng chat theo session của profile.
5. Backend lấy memory 10 câu gần nhất + truy xuất chunk + BM25 re-ranking.
6. Backend gọi LLM, lưu kết quả và trả nội dung Markdown.

## 3. Phân rã chức năng chi tiết

## 3.1 Quản lý xác thực và phân quyền (Auth & RBAC)

- Đăng nhập/đăng xuất cho User và Admin.
- Sử dụng JWT (access token + refresh token).
- Seed tài khoản mặc định môi trường khởi tạo: `admin/123456`.
- Phân quyền:
  - `USER`: thao tác trên tài nguyên của chính mình.
  - `ADMIN`: quản trị tài nguyên toàn hệ thống.

## 3.2 Quản lý profile chatbot

- User có thể tạo nhiều profile.
- Mỗi profile có:
  - Chủ đề, mô tả.
  - Bộ tài liệu riêng.
  - Cấu hình chunking (outline/đoạn/ngữ nghĩa/số ký tự).
  - Cấu hình retrieval (top_k, rerank_top_n).

## 3.3 Quản lý tài liệu

- Hỗ trợ định dạng: `pdf`, `docx`, `txt`.
- Chức năng User: thêm, xóa, xem trước tài liệu của profile.
- Chức năng Admin: quản trị tài liệu toàn hệ thống.
- Trạng thái xử lý tài liệu:
  - `UPLOADED`
  - `PARSING`
  - `CHUNKING`
  - `INDEXING`
  - `READY`
  - `FAILED`

## 3.4 Chat và quản lý hội thoại

- Tạo session chat theo profile; các session tách biệt ngữ cảnh.
- Lưu lịch sử chat và hỗ trợ xem lại theo session.
- Duy trì trí nhớ ngắn hạn: 10 câu hỏi gần nhất (cửa sổ hội thoại).
- Nội dung trả lời hỗ trợ render Markdown.

## 3.5 Quản trị hệ thống

- Quản trị user: xem danh sách, đổi trạng thái, reset mật khẩu.
- Quản trị model hệ thống: thay đổi model AI mặc định đang dùng.
- Quản trị tài liệu toàn cục.

## 3.6 Giám sát và nhật ký

- Xem log hệ thống real-time trên dashboard admin.
- Filter theo `level`, `service`, khoảng thời gian.
- Tìm kiếm theo từ khóa và mã định danh (`request_id`, `session_id`, `user_id`).
- Hỗ trợ pause/resume luồng log.

## 4. Thiết kế cơ sở dữ liệu chi tiết (PostgreSQL)

## 4.1 Danh sách bảng

### 4.1.1 `users`

- `id` (UUID, PK)
- `username` (UNIQUE, NOT NULL)
- `email` (UNIQUE, NULL)
- `password_hash` (NOT NULL)
- `role` (ENUM: `ADMIN`, `USER`)
- `status` (ENUM: `ACTIVE`, `LOCKED`, `DISABLED`)
- `last_login_at` (TIMESTAMP, NULL)
- `created_at`, `updated_at`, `deleted_at`

### 4.1.2 `user_sessions`

- `id` (UUID, PK)
- `user_id` (FK -> `users.id`)
- `refresh_token_hash`
- `ip_address`
- `user_agent`
- `expires_at`
- `revoked_at` (NULL nếu còn hiệu lực)
- `created_at`, `updated_at`

### 4.1.3 `chatbot_profiles`

- `id` (UUID, PK)
- `user_id` (FK -> `users.id`)
- `name`
- `topic`
- `description`
- `model_override` (NULL)
- `chunk_strategy` (ENUM: `OUTLINE`, `PARAGRAPH`, `SEMANTIC`, `CHARACTER`)
- `chunk_size` (INT)
- `chunk_overlap` (INT)
- `top_k` (INT)
- `rerank_top_n` (INT)
- `temperature` (NUMERIC)
- `is_active` (BOOLEAN)
- `created_at`, `updated_at`, `deleted_at`

### 4.1.4 `documents`

- `id` (UUID, PK)
- `owner_user_id` (FK -> `users.id`)
- `profile_id` (FK -> `chatbot_profiles.id`)
- `file_name`
- `file_ext`
- `mime_type`
- `file_size_bytes`
- `storage_bucket`
- `storage_key`
- `checksum_sha256`
- `status` (ENUM: `UPLOADED`, `PARSING`, `CHUNKING`, `INDEXING`, `READY`, `FAILED`, `DELETED`)
- `error_message` (NULL)
- `uploaded_at`
- `processed_at` (NULL)
- `created_at`, `updated_at`, `deleted_at`

### 4.1.5 `document_parse_results`

- `id` (UUID, PK)
- `document_id` (FK -> `documents.id`, UNIQUE)
- `parser_name` (vd: `docklink`)
- `parser_version`
- `structured_json_path` (đường dẫn artifact trên MinIO)
- `summary`
- `metadata_json` (JSONB)
- `created_at`, `updated_at`

### 4.1.6 `document_chunks`

- `id` (UUID, PK)
- `document_id` (FK -> `documents.id`)
- `profile_id` (FK -> `chatbot_profiles.id`)
- `chunk_index` (INT)
- `content` (TEXT)
- `token_count` (INT)
- `char_count` (INT)
- `section_title` (NULL)
- `page_no` (NULL)
- `source_ref` (NULL)
- `chunk_hash`
- `embedding_vector` (VECTOR - pgvector)
- `created_at`, `updated_at`

### 4.1.7 `chat_sessions`

- `id` (UUID, PK)
- `profile_id` (FK -> `chatbot_profiles.id`)
- `user_id` (FK -> `users.id`)
- `title`
- `status` (ENUM: `ACTIVE`, `ARCHIVED`, `CLOSED`)
- `started_at`
- `last_message_at`
- `created_at`, `updated_at`

### 4.1.8 `chat_messages`

- `id` (UUID, PK)
- `session_id` (FK -> `chat_sessions.id`)
- `role` (ENUM: `SYSTEM`, `USER`, `ASSISTANT`, `TOOL`)
- `content_md` (TEXT)
- `content_text` (TEXT)
- `seq_no` (INT)
- `request_id`
- `latency_ms` (INT)
- `prompt_tokens` (INT)
- `completion_tokens` (INT)
- `total_tokens` (INT)
- `created_at`

Ràng buộc đề xuất:

- UNIQUE (`session_id`, `seq_no`).

### 4.1.9 `message_retrieval_traces`

- `id` (UUID, PK)
- `message_id` (FK -> `chat_messages.id`)
- `retrieval_query`
- `top_k` (INT)
- `rerank_top_n` (INT)
- `bm25_enabled` (BOOLEAN)
- `raw_candidates_json` (JSONB)
- `reranked_results_json` (JSONB)
- `citations_json` (JSONB)
- `created_at`

### 4.1.10 `system_configs`

- `config_key` (PK)
- `value_json` (JSONB)
- `scope` (ENUM: `GLOBAL`, `PROFILE`)
- `updated_by` (FK -> `users.id`)
- `updated_at`

Ví dụ cấu hình:

- Model mặc định hệ thống.
- Prompt template.
- Giới hạn memory window.

### 4.1.11 `audit_logs`

- `id` (UUID, PK)
- `actor_user_id` (FK -> `users.id`)
- `action`
- `resource_type`
- `resource_id`
- `before_json` (JSONB)
- `after_json` (JSONB)
- `created_at`

## 4.2 Chỉ mục và tối ưu

- Index UNIQUE: `users.username`, `users.email`.
- Index tra cứu theo owner/profile: `documents(owner_user_id, profile_id)`.
- Index hội thoại: `chat_messages(session_id, created_at)`.
- Index log nghiệp vụ: `audit_logs(created_at, actor_user_id)`.
- Vector index cho `document_chunks.embedding_vector` (HNSW/IVFFLAT theo pgvector).
- Khuyến nghị partition theo thời gian cho bảng lớn (`chat_messages`) khi hệ thống tăng trưởng.

## 5. Thiết kế API chi tiết

Base path: `/api/v1`

## 5.1 Auth

### POST `/auth/login`

- Request:

```json
{
  "username": "string",
  "password": "string"
}
```

- Response:

```json
{
  "access_token": "jwt",
  "refresh_token": "jwt",
  "user": {
    "id": "uuid",
    "username": "admin",
    "role": "ADMIN"
  }
}
```

### POST `/auth/refresh`

- Cấp lại access token từ refresh token.

### POST `/auth/logout`

- Thu hồi refresh token phiên hiện tại.

### GET `/auth/me`

- Trả thông tin user hiện tại.

## 5.2 Profile

### GET `/profiles`

- Danh sách profile của user hiện tại.

### POST `/profiles`

- Tạo profile mới.

### GET `/profiles/{profile_id}`

- Lấy chi tiết profile.

### PATCH `/profiles/{profile_id}`

- Cập nhật cấu hình profile.

### DELETE `/profiles/{profile_id}`

- Xóa mềm profile.

## 5.3 Documents

### POST `/profiles/{profile_id}/documents/upload`

- Multipart upload file (`pdf`, `docx`, `txt`).
- Response trả `document_id`, `status=UPLOADED`.

### GET `/profiles/{profile_id}/documents`

- Danh sách tài liệu của profile.

### GET `/documents/{document_id}`

- Chi tiết tài liệu + trạng thái pipeline.

### DELETE `/documents/{document_id}`

- Xóa tài liệu (soft delete + cleanup async object nếu cần).

### GET `/documents/{document_id}/preview`

- Xem preview nội dung parse/chunk.

## 5.4 Chat/Sessions

### POST `/profiles/{profile_id}/sessions`

- Tạo session chat mới.

### GET `/profiles/{profile_id}/sessions`

- Lấy danh sách session theo profile.

### GET `/sessions/{session_id}/messages?limit=&cursor=`

- Phân trang lịch sử message.

### POST `/sessions/{session_id}/messages`

- Request:

```json
{
  "content": "Câu hỏi của người dùng",
  "stream": true
}
```

- Xử lý backend:
  1. Lưu message user.
  2. Lấy memory window 10 câu gần nhất.
  3. Retrieve chunk theo profile.
  4. BM25 re-ranking.
  5. Gọi LLM.
  6. Lưu message assistant + retrieval trace.

## 5.5 Admin APIs

### User management

- `GET /admin/users`
- `POST /admin/users`
- `PATCH /admin/users/{user_id}` (role/status)
- `POST /admin/users/{user_id}/reset-password`

### Document management

- `GET /admin/documents`
- `DELETE /admin/documents/{document_id}`

### System/Model config

- `GET /admin/system-config/model`
- `PUT /admin/system-config/model`

Ví dụ request cập nhật model:

```json
{
  "provider": "openrouter",
  "model_name": "nvidia/nemotron-3-super-120b-a12b:free",
  "params": {
    "temperature": 0.2,
    "max_tokens": 2048
  }
}
```

## 5.6 Logs & Monitoring

### GET `/admin/logs/search`

- Query params:
  - `level`
  - `service`
  - `from`
  - `to`
  - `q`
  - `request_id`
  - `session_id`
  - `user_id`

### GET `/admin/logs/stream` (SSE) hoặc WS `/admin/logs/ws`

- Stream log real-time cho dashboard admin.

## 5.7 Chuẩn lỗi API

Mọi API dùng format lỗi thống nhất:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu đầu vào không hợp lệ",
  "details": {
    "field": "username"
  },
  "request_id": "req_abc123"
}
```

HTTP status mapping đề xuất:

- `400` Bad Request (format sai).
- `401` Unauthorized.
- `403` Forbidden.
- `404` Not Found.
- `409` Conflict.
- `422` Business Rule Violation.
- `500` Internal Server Error.

## 6. Quy tắc nghiệp vụ quan trọng

- User chỉ thao tác dữ liệu của chính mình.
- Admin có quyền toàn cục nhưng mọi thao tác cần ghi `audit_logs`.
- Session bắt buộc thuộc đúng profile đã tạo.
- Chỉ tài liệu trạng thái `READY` mới được dùng để retrieval.
- Memory hội thoại giới hạn 10 câu gần nhất để cân bằng ngữ cảnh và chi phí.
- Khi thay đổi model mặc định, chỉ request mới bị ảnh hưởng.

## 7. Thiết kế logging có cấu trúc

## 7.1 Format bắt buộc

- Định dạng: JSON line (mỗi dòng là một object JSON độc lập).
- Timestamp theo ISO 8601 UTC.
- Trường tối thiểu:
  - `timestamp`
  - `level`
  - `service`
  - `event`
  - `message`
  - `request_id`
  - `session_id`
  - `user_id` (nếu có)
  - `metadata`

## 7.2 Ví dụ bản ghi log

```json
{
  "timestamp": "2026-04-15T09:30:00Z",
  "level": "INFO",
  "service": "rag-api",
  "event": "chat.response.generated",
  "message": "Assistant response created",
  "request_id": "req_123",
  "session_id": "ses_456",
  "user_id": "usr_789",
  "metadata": {
    "model": "nvidia/nemotron-3-super-120b-a12b:free",
    "latency_ms": 1420
  }
}
```

## 8. Luồng xử lý chính (MVP)

## 8.1 Luồng User

1. Đăng nhập hệ thống.
2. Tạo profile chatbot.
3. Upload tài liệu vào profile.
4. Chờ pipeline xử lý tài liệu về `READY`.
5. Tạo session và chat theo profile.

## 8.2 Luồng Admin

1. Đăng nhập dashboard admin.
2. Quản trị user/tài liệu/model.
3. Theo dõi log real-time, lọc và điều tra theo mã định danh.

## 9. Tiêu chí nghiệm thu MVP

- User đăng nhập, tạo profile, tải tài liệu, chat đúng profile.
- Retrieval có BM25 re-ranking.
- Lịch sử chat/session lưu tách biệt, duy trì memory 10 câu gần nhất.
- Admin quản trị user, tài liệu và model AI.
- UI có landing page và chat render Markdown.
- Admin xem log real-time và lọc được theo level/mã định danh chính.

## 10. Khuyến nghị triển khai kỹ thuật

- Dùng `venv` để quản lý môi trường Python.
- Dùng migration tool (Alembic) để quản lý schema DB.
- Chuẩn hóa `request_id` qua middleware để truy vết xuyên dịch vụ.
- Tách worker ingest khỏi API để tăng khả năng mở rộng.
- Thiết lập chính sách backup cho PostgreSQL và MinIO.
