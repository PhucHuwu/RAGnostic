import StaticContentPage from "../../client/components/marketing/StaticContentPage";

export default function TermsPage() {
  return (
    <StaticContentPage
      eyebrow="Pháp lý"
      title="Điều khoản sử dụng"
      description="Điều khoản này mô tả cách sử dụng dịch vụ RAGnostic, trách nhiệm của người dùng và giới hạn vận hành để đảm bảo an toàn hệ thống."
      sections={[
        {
          title: "Trách nhiệm người dùng",
          items: [
            "Sử dụng nền tảng đúng mục đích nghiệp vụ và tuân thủ pháp luật.",
            "Không tải lên nội dung vi phạm quyền sở hữu trí tuệ hoặc dữ liệu trái phép.",
            "Bảo mật thông tin đăng nhập và phân quyền nội bộ đúng vai trò.",
          ],
        },
        {
          title: "Giới hạn dịch vụ",
          items: [
            "Chất lượng phản hồi AI phụ thuộc vào độ tin cậy của dữ liệu nguồn.",
            "Một số tính năng có thể thay đổi theo gói triển khai và cấu hình hệ thống.",
          ],
        },
      ]}
      primaryAction={{ label: "Liên hệ tư vấn", href: "/contact" }}
      secondaryAction={{ label: "Chính sách riêng tư", href: "/privacy" }}
    />
  );
}
