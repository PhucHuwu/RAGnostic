import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>

        <h1 className="text-6xl font-display font-bold mb-2 text-destructive">404</h1>
        <p className="text-2xl font-display font-bold mb-4">Trang không tìm thấy</p>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-primary hover:bg-primary/90 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Về Trang chủ
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-foreground border border-border hover:bg-muted/50 transition-colors"
          >
            Quay lại
          </button>
        </div>

        <div className="mt-12 p-6 rounded-lg bg-card border border-border">
          <p className="text-sm text-muted-foreground mb-4">
            Cần giúp đỡ? Liên hệ với chúng tôi qua:
          </p>
          <a href="mailto:support@ragnostic.io" className="text-primary hover:text-primary/80 font-medium">
            support@ragnostic.io
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
