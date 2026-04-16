import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description: string;
  goBack?: boolean;
}

const Placeholder = ({ title, description, goBack = true }: PlaceholderProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-display font-bold mb-3">{title}</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          {description}
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Hãy tiếp tục hỏi tôi để xây dựng trang này.
        </p>
        {goBack && (
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white bg-primary hover:bg-primary/90 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        )}
      </div>
    </div>
  );
};

export default Placeholder;
