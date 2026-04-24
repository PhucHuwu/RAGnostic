import StaticContentPage from "../../client/components/marketing/StaticContentPage";

export default function AboutPage() {
  return (
    <StaticContentPage
      eyebrow="Công ty"
      title="Về RAGnostic"
      description="RAGnostic là nền tảng giúp đội ngũ vận hành trợ lý AI dựa trên kho tri thức nội bộ, với trải nghiệm quản trị rõ ràng và an toàn dữ liệu."
      sections={[
        {
          title: "Sứ mệnh",
          items: [
            "Biến tri thức nội bộ thành trợ lý AI dễ dùng cho cả đội ngũ nghiệp vụ.",
            "Rút ngắn thời gian tìm kiếm thông tin và chuẩn hóa câu trả lời.",
          ],
        },
        {
          title: "Điểm khác biệt",
          items: [
            "Tách rõ không gian người dùng và không gian quản trị.",
            "Theo dõi ingest tài liệu và hội thoại theo từng trợ lý.",
            "Dễ tích hợp với quy trình vận hành hiện có của doanh nghiệp.",
          ],
        },
      ]}
      primaryAction={{ label: "Bắt đầu sử dụng", href: "/login" }}
      secondaryAction={{ label: "Liên hệ đội ngũ", href: "/contact" }}
    />
  );
}
