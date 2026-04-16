import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Brain,
  Database,
  Gauge,
} from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-ai flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold font-display">RAGnostic</span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-6 py-2 rounded-lg font-medium text-foreground hover:bg-muted/50 transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/login"
              className="px-6 py-2 rounded-lg font-medium text-white bg-primary hover:bg-primary/90 transition-colors"
            >
              Bắt đầu
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">
              Công nghệ AI tiên tiến nhất
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
            Hệ thống AI thông minh cho{" "}
            <span className="bg-gradient-ai bg-clip-text text-transparent">
              Tìm kiếm và Lấy dữ liệu
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Xây dựng các ứng dụng AI có khả năng truy vấn thông minh với dữ liệu
            của bạn. RAGnostic cung cấp nền tảng RAG toàn diện cho các tổ chức
            hiện đại.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold text-white bg-primary hover:bg-primary/90 transition-all hover:shadow-lg group"
            >
              Bắt đầu ngay
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold text-foreground border border-border hover:bg-muted/50 transition-colors">
              Xem demo
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-lg text-muted-foreground">
              Mọi thứ bạn cần để xây dựng ứng dụng AI mạnh mẽ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-xl bg-background border border-border hover:border-secondary/50 transition-all duration-300 hover:shadow-lg hover:shadow-secondary/10"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-secondary/10 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary group-hover:text-secondary transition-colors" />
                </div>
                <h3 className="text-lg font-semibold font-display mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Cách hoạt động
            </h2>
            <p className="text-lg text-muted-foreground">
              4 bước đơn giản để bắt đầu
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary text-white font-display font-bold text-lg">
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold font-display mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-32 w-8 h-0.5 bg-gradient-to-r from-primary to-transparent -ml-8"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              Được tin tưởng bởi các tổ chức hàng đầu
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {partners.map((partner, index) => (
              <div
                key={index}
                className="flex items-center justify-center p-6 rounded-lg border border-border hover:border-secondary/50 transition-colors"
              >
                <span className="font-semibold text-foreground/60">
                  {partner}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-display font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
            Sẵn sàng để bắt đầu?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Tham gia hàng nghìn tổ chức sử dụng RAGnostic để xây dựng các ứng
            dụng AI thông minh.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-10 py-4 rounded-lg font-semibold text-white bg-primary hover:bg-primary/90 transition-all hover:shadow-lg group"
          >
            Bắt đầu miễn phí
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-ai flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold font-display">RAGnostic</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Nền tảng RAG toàn diện cho các ứng dụng AI.
              </p>
            </div>
            <div>
              <h4 className="font-semibold font-display mb-4">Sản phẩm</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Tính năng
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Giá cả
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Tài liệu
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold font-display mb-4">Công ty</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Về chúng tôi
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Liên hệ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold font-display mb-4">Pháp lý</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Điều khoản sử dụng
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Chính sách riêng tư
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Bảo mật
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; 2024 RAGnostic. Bảo lưu mọi quyền.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#" className="hover:text-foreground transition-colors">
                Twitter
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                GitHub
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const features = [
  {
    icon: Zap,
    title: "Xử lý nhanh chóng",
    description:
      "Truy vấn và xử lý tài liệu với độ trễ tối thiểu, tối ưu hóa hiệu suất cho các ứng dụng thực tế.",
  },
  {
    icon: Shield,
    title: "Bảo mật cao",
    description:
      "Dữ liệu của bạn được bảo vệ bằng mã hóa từ đầu đến cuối và kiểm soát truy cập chi tiết.",
  },
  {
    icon: Brain,
    title: "AI thông minh",
    description:
      "Sử dụng các mô hình ngôn ngữ lớn mới nhất để hiểu và trả lời câu hỏi một cách chính xác.",
  },
  {
    icon: Database,
    title: "Quản lý tài liệu",
    description:
      "Tải lên, tổ chức và quản lý hàng triệu tài liệu dễ dàng với tìm kiếm thông minh.",
  },
  {
    icon: Gauge,
    title: "Cấu hình linh hoạt",
    description:
      "Tùy chỉnh mô hình, tham số và chiến lược truy xuất để phù hợp với nhu cầu của bạn.",
  },
  {
    icon: Sparkles,
    title: "API tích hợp",
    description:
      "Tích hợp dễ dàng với ứng dụng của bạn thông qua API RESTful được ghi chép đầy đủ.",
  },
];

const steps = [
  {
    title: "Tạo Profile",
    description: "Thiết lập một profile chatbot mới với tên và mô tả của bạn.",
  },
  {
    title: "Tải tài liệu",
    description:
      "Tải lên các tệp của bạn - PDF, văn bản, hoặc bất kỳ định dạng nào.",
  },
  {
    title: "Xử lý dữ liệu",
    description:
      "Hệ thống tự động phân tích, chia nhỏ và lập chỉ mục dữ liệu của bạn.",
  },
  {
    title: "Bắt đầu chat",
    description:
      "Đặt câu hỏi và nhận câu trả lời thông minh dựa trên dữ liệu của bạn.",
  },
];

const partners = [
  "TechCorp Vietnam",
  "AI Solutions Ltd",
  "DataFlow Inc",
  "Smart Systems",
];

const stats = [
  {
    number: "100K+",
    label: "Tài liệu được xử lý",
  },
  {
    number: "50K+",
    label: "Người dùng hoạt động",
  },
  {
    number: "99.9%",
    label: "Độ tin cậy hệ thống",
  },
];

export default Landing;
