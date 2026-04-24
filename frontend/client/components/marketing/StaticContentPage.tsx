import Link from "next/link";

interface ActionLink {
  label: string;
  href: string;
}

interface ContentSection {
  title: string;
  items: string[];
}

interface StaticContentPageProps {
  eyebrow: string;
  title: string;
  description: string;
  sections: ContentSection[];
  primaryAction?: ActionLink;
  secondaryAction?: ActionLink;
}

export default function StaticContentPage({
  eyebrow,
  title,
  description,
  sections,
  primaryAction,
  secondaryAction,
}: StaticContentPageProps) {
  const renderAction = (
    action: ActionLink,
    className: string,
    key: string,
  ) => {
    const isExternal =
      action.href.startsWith("http://") ||
      action.href.startsWith("https://") ||
      action.href.startsWith("mailto:");

    if (isExternal) {
      return (
        <a key={key} href={action.href} className={className}>
          {action.label}
        </a>
      );
    }

    return (
      <Link key={key} href={action.href} className={className}>
        {action.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="font-display font-bold text-lg">
            RAGnostic
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors"
            >
              Bắt đầu
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="space-y-5 mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-secondary">
            {eyebrow}
          </p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            {title}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        <div className="space-y-5">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-xl border border-border bg-card/50 p-6"
            >
              <h2 className="text-xl font-display font-bold mb-3 text-foreground">
                {section.title}
              </h2>
              <ul className="space-y-2 text-muted-foreground">
                {section.items.map((item) => (
                  <li key={item} className="leading-relaxed">
                    - {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            {primaryAction && (
              renderAction(
                primaryAction,
                "inline-flex items-center justify-center px-6 py-3 rounded-lg text-white bg-primary font-semibold hover:bg-primary/90 transition-colors",
                "primary",
              )
            )}
            {secondaryAction && (
              renderAction(
                secondaryAction,
                "inline-flex items-center justify-center px-6 py-3 rounded-lg border border-border font-semibold hover:bg-muted/40 transition-colors",
                "secondary",
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
}
