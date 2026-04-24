import StaticContentPage from "../../client/components/marketing/StaticContentPage";

export default function PricingPage() {
  return (
    <StaticContentPage
      eyebrow="Gói dịch vụ"
      title="Mô hình triển khai linh hoạt"
      description="RAGnostic hỗ trợ nhiều mô hình triển khai tùy theo quy mô tổ chức, mức độ bảo mật và nhu cầu tích hợp hệ thống hiện hữu."
      sections={[
        {
          title: "Gợi ý lựa chọn",
          items: [
            "Gói khởi động: phù hợp nhóm nhỏ muốn thử nghiệm nhanh.",
            "Gói vận hành: dành cho tổ chức cần phân quyền và theo dõi sử dụng.",
            "Gói doanh nghiệp: ưu tiên SLA, bảo mật và tích hợp mở rộng.",
          ],
        },
        {
          title: "Lưu ý triển khai",
          items: [
            "Chi phí phụ thuộc vào mô hình AI, dung lượng tri thức và lưu lượng truy vấn.",
            "Nên xác định rõ số lượng người dùng và use case trước khi scale.",
          ],
        },
      ]}
      primaryAction={{ label: "Trao đổi nhu cầu", href: "/contact" }}
      secondaryAction={{ label: "Đăng nhập", href: "/login" }}
    />
  );
}
