import StaticContentPage from "../../client/components/marketing/StaticContentPage";

export default function ContactPage() {
  return (
    <StaticContentPage
      eyebrow="Liên hệ"
      title="Kết nối với đội ngũ RAGnostic"
      description="Nếu bạn cần tư vấn triển khai, hỗ trợ kỹ thuật hoặc trao đổi hợp tác, đội ngũ của chúng tôi luôn sẵn sàng phản hồi nhanh chóng."
      sections={[
        {
          title: "Kênh hỗ trợ",
          items: [
            "Email hỗ trợ: support@ragnostic.io",
            "Thời gian phản hồi mục tiêu: trong vòng 01 ngày làm việc.",
            "Ưu tiên các vấn đề ảnh hưởng truy cập và dữ liệu người dùng.",
          ],
        },
      ]}
      primaryAction={{
        label: "Gửi email hỗ trợ",
        href: "mailto:support@ragnostic.io",
      }}
      secondaryAction={{ label: "Xem tài liệu", href: "/docs" }}
    />
  );
}
