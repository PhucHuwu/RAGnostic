import StaticContentPage from "../../client/components/marketing/StaticContentPage";

export default function PrivacyPage() {
  return (
    <StaticContentPage
      eyebrow="Pháp lý"
      title="Chính sách riêng tư"
      description="RAGnostic cam kết bảo vệ dữ liệu người dùng và minh bạch trong cách thu thập, sử dụng, lưu trữ thông tin trên nền tảng."
      sections={[
        {
          title: "Nguyên tắc xử lý dữ liệu",
          items: [
            "Chỉ thu thập dữ liệu cần thiết để vận hành dịch vụ.",
            "Tách dữ liệu theo tenant và giới hạn truy cập theo vai trò.",
            "Ưu tiên ẩn danh thông tin nhạy cảm trong log vận hành.",
          ],
        },
        {
          title: "Quyền của người dùng",
          items: [
            "Yêu cầu chỉnh sửa hoặc xóa dữ liệu theo chính sách của tổ chức.",
            "Nhận thông tin về phạm vi và mục đích sử dụng dữ liệu.",
          ],
        },
      ]}
      primaryAction={{ label: "Liên hệ hỗ trợ", href: "/contact" }}
      secondaryAction={{ label: "Điều khoản sử dụng", href: "/terms" }}
    />
  );
}
