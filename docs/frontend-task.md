# Kế hoạch task Frontend (PM)

## Mục tiêu

- Hoàn thiện 100% frontend cho hệ thống RAGnostic theo yêu cầu nghiệp vụ và thiết kế hệ thống.
- Mỗi hạng mục có checkbox để đội ngũ cập nhật trạng thái thực hiện.

## 1) Nền tảng frontend và kiến trúc ứng dụng

- [ ] Khởi tạo cấu trúc Next.js theo module: `auth`, `landing`, `chat`, `profiles`, `documents`, `admin`, `logs`.
- [ ] Thiết lập kiến trúc state management (global + server state) rõ ràng.
- [ ] Chuẩn hóa API client, interceptor token, cơ chế refresh token tự động.
- [ ] Thiết lập xử lý lỗi tập trung (toast, boundary, fallback UI).
- [ ] Thiết lập cấu hình môi trường frontend (`.env.example`, base URL API theo môi trường).

## 2) Design system và trải nghiệm giao diện

- [ ] Xây dựng design tokens (màu sắc, typography, spacing, radius, shadow, motion).
- [ ] Hoàn thiện bộ component dùng chung: Button, Input, Select, Modal, Drawer, Table, Tabs, Pagination, Badge, Tooltip.
- [ ] Thiết lập quy chuẩn responsive cho desktop/tablet/mobile.
- [ ] Xây dựng hệ thống icon và minh họa đồng nhất.
- [ ] Bảo đảm khả năng truy cập cơ bản (focus state, keyboard navigation, contrast).

## 3) Landing page chất lượng cao

- [ ] Thiết kế và triển khai landing page hiện đại theo định hướng Glassmorphism/AI Futuristic.
- [ ] Tạo các section bắt buộc: hero, tính năng, quy trình hoạt động, lợi ích, CTA.
- [ ] Tối ưu animation mở trang và chuyển cảnh nhẹ, không gây nhiễu.
- [ ] Đảm bảo hiệu năng tải trang tốt (ảnh tối ưu, lazy load, giảm JS không cần thiết).
- [ ] Đảm bảo landing hiển thị đúng trên desktop và mobile.

## 4) Auth UI/UX

- [ ] Xây trang đăng nhập cho User/Admin.
- [ ] Kết nối `POST /auth/login`, lưu access/refresh token an toàn theo chiến lược đã chọn.
- [ ] Thực thi logout qua `POST /auth/logout`.
- [ ] Tự động làm mới token qua `POST /auth/refresh` khi access token hết hạn.
- [ ] Guard route theo vai trò (USER/ADMIN), điều hướng đúng quyền truy cập.

## 5) Khu vực người dùng - quản lý profile

- [ ] Xây danh sách profile chatbot của người dùng.
- [ ] Xây form tạo profile mới (name, topic, description, chunk strategy, retrieval config).
- [ ] Xây màn hình chi tiết profile.
- [ ] Xây chức năng cập nhật profile (`PATCH /profiles/{profile_id}`).
- [ ] Xây chức năng xóa profile (`DELETE /profiles/{profile_id}`) với xác nhận an toàn.

## 6) Khu vực người dùng - quản lý tài liệu

- [ ] Xây giao diện upload tài liệu cho profile (`pdf/docx/txt`) có progress.
- [ ] Kết nối `POST /profiles/{profile_id}/documents/upload`.
- [ ] Xây danh sách tài liệu theo profile, hiển thị trạng thái pipeline (`UPLOADED` -> `READY/FAILED`).
- [ ] Xây trang/modal xem preview tài liệu qua `GET /documents/{document_id}/preview`.
- [ ] Xây thao tác xóa tài liệu `DELETE /documents/{document_id}` với cập nhật UI tức thời.
- [ ] Xử lý trạng thái lỗi ingest và hướng dẫn người dùng retry.

## 7) Khu vực người dùng - chat RAG

- [ ] Xây màn hình chat theo profile với danh sách session bên trái.
- [ ] Tạo session mới qua `POST /profiles/{profile_id}/sessions`.
- [ ] Tải lịch sử session qua `GET /profiles/{profile_id}/sessions`.
- [ ] Tải message phân trang qua `GET /sessions/{session_id}/messages`.
- [ ] Gửi câu hỏi qua `POST /sessions/{session_id}/messages` (hỗ trợ stream nếu backend bật).
- [ ] Render Markdown đầy đủ trong câu trả lời assistant.
- [ ] Hiển thị trạng thái typing/loading/cancel và xử lý timeout thân thiện.
- [ ] Hỗ trợ đặt tiêu đề session theo ngữ cảnh cuộc trò chuyện.

## 8) Khu vực Admin - quản lý người dùng

- [ ] Xây bảng danh sách người dùng với tìm kiếm, lọc và phân trang.
- [ ] Kết nối `GET /admin/users`.
- [ ] Xây form tạo user mới `POST /admin/users`.
- [ ] Xây thao tác cập nhật role/status `PATCH /admin/users/{user_id}`.
- [ ] Xây thao tác reset mật khẩu `POST /admin/users/{user_id}/reset-password`.

## 9) Khu vực Admin - quản lý tài liệu và model hệ thống

- [ ] Xây màn hình quản trị tài liệu toàn cục (`GET /admin/documents`).
- [ ] Xây thao tác xóa tài liệu toàn cục (`DELETE /admin/documents/{document_id}`).
- [ ] Xây màn hình cấu hình model hiện tại (`GET /admin/system-config/model`).
- [ ] Xây form cập nhật model (`PUT /admin/system-config/model`) có xác nhận thay đổi.
- [ ] Hiển thị lịch sử thay đổi cấu hình quan trọng (nếu API cung cấp).

## 10) Khu vực Admin - log realtime và giám sát

- [ ] Xây màn hình log realtime với luồng cập nhật liên tục (SSE/WS).
- [ ] Kết nối endpoint stream log (`/admin/logs/stream` hoặc `/admin/logs/ws`).
- [ ] Xây bộ lọc log theo `level`, `service`, thời gian, từ khóa.
- [ ] Hỗ trợ tìm theo `request_id`, `session_id`, `user_id`.
- [ ] Xây chức năng pause/resume luồng log.
- [ ] Bảo đảm UI vẫn mượt khi log đến nhanh (virtualized list hoặc kỹ thuật tương đương).

## 11) Trạng thái, thông báo và xử lý lỗi

- [ ] Chuẩn hóa loading/empty/error state cho toàn bộ màn hình.
- [ ] Chuẩn hóa thông báo thành công/thất bại theo cùng ngôn ngữ UX.
- [ ] Hiển thị lỗi API theo format chuẩn `code/message/details/request_id`.
- [ ] Tạo trang lỗi chung: 401, 403, 404, 500.

## 12) Hiệu năng, SEO và chất lượng frontend

- [ ] Tối ưu bundle size (code splitting, lazy import, tree-shaking).
- [ ] Tối ưu Core Web Vitals cho landing và trang chính.
- [ ] Cấu hình cache hợp lý cho dữ liệu ít thay đổi.
- [ ] Kiểm tra tương thích trình duyệt mục tiêu.
- [ ] Cấu hình lint/format/type-check trong CI.

## 13) Kiểm thử frontend

- [ ] Viết unit test cho component quan trọng.
- [ ] Viết integration test cho các luồng chính: login, tạo profile, upload tài liệu, chat, admin quản trị.
- [ ] Viết E2E test cho hành trình MVP từ đầu đến cuối.
- [ ] Viết test render Markdown và xử lý dữ liệu dài trong chat.
- [ ] Thiết lập báo cáo coverage và ngưỡng chất lượng tối thiểu.

## 14) Tài liệu và bàn giao

- [ ] Hoàn thiện tài liệu cấu trúc frontend và quy ước code.
- [ ] Hoàn thiện hướng dẫn chạy local/dev/staging.
- [ ] Hoàn thiện guideline UI để mở rộng tính năng nhất quán.
- [ ] Hoàn thiện checklist release frontend trước khi go-live.

## 15) Definition of Done (Frontend)

- [ ] Landing page đạt chất lượng cao, responsive tốt và đúng định hướng thiết kế.
- [ ] User hoàn thành trọn luồng: đăng nhập -> tạo profile -> upload tài liệu -> chat theo profile.
- [ ] Admin quản trị đầy đủ user/tài liệu/model và xem log realtime có filter/pause/resume.
- [ ] Chat render Markdown ổn định, trải nghiệm mượt trên desktop/mobile.
- [ ] Tất cả luồng chính vượt qua test và không còn lỗi blocking trước phát hành.
- [ ] Tài liệu bàn giao đầy đủ để đội phát triển và vận hành tiếp nhận.
