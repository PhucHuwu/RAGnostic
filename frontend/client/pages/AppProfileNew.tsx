"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import UserLayout from "@/components/layouts/UserLayout";
import { ApiError, createProfile } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAllProfileIconNames, getProfileIconComponent } from "@/lib/profile-icons";

const QUICK_ICON_NAMES = [
  "Bot",
  "Sparkles",
  "UserRound",
  "Briefcase",
  "BookOpenText",
  "Cpu",
  "ShieldCheck",
  "MessageCircleHeart",
];

function formatIconLabel(name: string) {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

const AppProfileNew = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("Bot");
  const [isIconDialogOpen, setIsIconDialogOpen] = useState(false);
  const [iconQuery, setIconQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIconLabel = useMemo(() => formatIconLabel(iconName), [iconName]);
  const filteredIconNames = useMemo(() => {
    const all = getAllProfileIconNames();
    const query = iconQuery.trim().toLowerCase();
    if (!query) {
      return all;
    }
    return all.filter((item) => item.toLowerCase().includes(query));
  }, [iconQuery]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !topic.trim()) {
      setError("Tên trợ lý và chủ đề là bắt buộc");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createProfile({
        name: name.trim(),
        topic: topic.trim(),
        description: description.trim() || undefined,
        icon_name: iconName,
      });
      router.push(`/app/profiles/${created.id}/chat`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Không thể tạo profile mới");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UserLayout>
      <div className="max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Tạo Profile mới
            </h1>
            <p className="text-muted-foreground">
              Tạo chatbot profile để cấu hình dữ liệu và trò chuyện theo domain.
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-border bg-card p-6"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Tên trợ lý
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Hỗ trợ khách hàng"
              maxLength={120}
              className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="topic"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Chủ đề
            </label>
            <input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: FAQ và tài liệu sản phẩm"
              maxLength={240}
              className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Biểu tượng trợ lý
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {QUICK_ICON_NAMES.map((name) => {
                const selected = iconName === name;
                const Icon = getProfileIconComponent(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setIconName(name)}
                    className={`inline-flex items-center justify-center h-12 w-12 rounded-lg border transition-colors ${
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted/40"
                    }`}
                    title={formatIconLabel(name)}
                    aria-label={formatIconLabel(name)}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}

              <Dialog open={isIconDialogOpen} onOpenChange={setIsIconDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center h-12 w-12 rounded-lg border border-dashed border-border hover:bg-muted/40 transition-colors"
                    title="Thêm biểu tượng"
                    aria-label="Thêm biểu tượng"
                  >
                    ...
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Chọn biểu tượng trợ lý</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <input
                      type="text"
                      value={iconQuery}
                      onChange={(e) => setIconQuery(e.target.value)}
                      placeholder="Tìm icon theo tên..."
                      className="w-full px-4 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />

                    <div className="h-[360px] overflow-y-auto pr-1">
                      <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-8 gap-2">
                        {filteredIconNames.map((name) => {
                          const Icon = getProfileIconComponent(name);
                          const selected = iconName === name;
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => {
                                setIconName(name);
                                setIsIconDialogOpen(false);
                              }}
                              className={`inline-flex items-center justify-center h-10 w-10 rounded-md border transition-colors ${
                                selected
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border hover:bg-muted/40"
                              }`}
                              title={formatIconLabel(name)}
                              aria-label={formatIconLabel(name)}
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Đang chọn: <span className="font-medium text-foreground">{selectedIconLabel}</span>
            </p>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Mô tả
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="Mô tả mục tiêu, phạm vi dữ liệu và cách profile này nên trả lời"
              className="w-full px-4 py-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Tạo profile
            </button>
          </div>
        </form>
      </div>
    </UserLayout>
  );
};

export default AppProfileNew;
