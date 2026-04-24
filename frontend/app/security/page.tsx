import StaticContentPage from "../../client/components/marketing/StaticContentPage";

export default function SecurityPage() {
  return (
    <StaticContentPage
      eyebrow="Pháp lý"
      title="Cam kết bảo mật"
      description="Chúng tôi xây dựng RAGnostic với định hướng bảo mật theo chiều sâu, bao gồm phân quyền, tách biệt dữ liệu và giám sát hoạt động hệ thống."
      sections={[
        {
          title: "Biện pháp cốt lõi",
          items: [
            "Phân tách quyền người dùng và quản trị theo role.",
            "Theo dõi log để phát hiện hành vi bất thường.",
            "Kiểm soát vòng đời tài liệu từ tải lên đến index.",
          ],
        },
        {
          title: "Khuyến nghị cho doanh nghiệp",
          items: [
            "Rà soát quyền truy cập định kỳ theo phòng ban.",
            "Thiết lập quy trình phản ứng sự cố và backup dữ liệu.",
          ],
        },
      ]}
      primaryAction={{ label: "Liên hệ đội ngũ bảo mật", href: "/contact" }}
      secondaryAction={{ label: "Chính sách riêng tư", href: "/privacy" }}
    />
  );
}
