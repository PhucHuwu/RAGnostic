import StaticContentPage from "../../client/components/marketing/StaticContentPage";

export default function BlogPage() {
  return (
    <StaticContentPage
      eyebrow="Blog"
      title="Chia sẻ từ đội ngũ RAGnostic"
      description="Blog tập trung vào kinh nghiệm triển khai trợ lý AI cho doanh nghiệp, vận hành kho tri thức và các bài học thực tế khi mở rộng hệ thống."
      sections={[
        {
          title: "Nội dung sắp đăng",
          items: [
            "Thiết kế luồng tạo trợ lý AI theo vai trò trong doanh nghiệp.",
            "Tối ưu chất lượng trả lời với chiến lược chunking phù hợp.",
            "Checklist kiểm thử UI/UX cho nền tảng RAG đa tenant.",
          ],
        },
      ]}
      primaryAction={{ label: "Đăng nhập để trải nghiệm", href: "/login" }}
      secondaryAction={{ label: "Về trang chủ", href: "/" }}
    />
  );
}
