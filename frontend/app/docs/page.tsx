import StaticContentPage from "../../client/components/marketing/StaticContentPage";

export default function DocsPage() {
  return (
    <StaticContentPage
      eyebrow="Tài liệu"
      title="Hướng dẫn sử dụng RAGnostic"
      description="Bắt đầu nhanh với các bước cốt lõi: tạo trợ lý, nạp kho tri thức và vận hành hội thoại theo ngữ cảnh nghiệp vụ."
      sections={[
        {
          title: "Quy trình triển khai cơ bản",
          items: [
            "Tạo trợ lý AI theo phòng ban hoặc nghiệp vụ cụ thể.",
            "Tải tài liệu nguồn và theo dõi trạng thái xử lý.",
            "Thử nghiệm hội thoại, tinh chỉnh thiết lập và đưa vào sử dụng.",
          ],
        },
        {
          title: "Gợi ý vận hành",
          items: [
            "Đặt quy ước đặt tên trợ lý thống nhất để dễ quản lý.",
            "Rà soát tài liệu định kỳ để tránh thông tin lỗi thời.",
            "Theo dõi log và phản hồi người dùng để cải thiện chất lượng.",
          ],
        },
      ]}
      primaryAction={{ label: "Đăng nhập để bắt đầu", href: "/login" }}
      secondaryAction={{ label: "Liên hệ hỗ trợ", href: "/contact" }}
    />
  );
}
