export type ScreenPhilosophyHeaderProps = {
  eyebrow?: string;
  titleLead: string;
  titleAccent: string;
  subtitle: string;
  layout?: "stacked" | "split";
};

export function ScreenPhilosophyHeader({
  eyebrow,
  titleLead,
  titleAccent,
  subtitle,
  layout = "stacked",
}: ScreenPhilosophyHeaderProps) {
  const title = (
    <h1 className="mt-1 max-w-[13ch] font-display text-[31px] leading-[1.08] text-foreground max-[360px]:text-[28px]">
      {titleLead}
      <span className="text-accent">{titleAccent}</span>
    </h1>
  );

  if (layout === "split") {
    return (
      <section className="flex items-end justify-between gap-4 px-0.5 pb-[19px] pt-[27px]">
        <div>
          {eyebrow ? (
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              {eyebrow}
            </p>
          ) : null}
          {title}
        </div>
        <p className="max-w-[17ch] text-right text-xs leading-[1.55] text-muted">
          {subtitle}
        </p>
      </section>
    );
  }

  return (
    <section className="px-0.5 pb-5 pt-[27px]">
      {eyebrow ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
          {eyebrow}
        </p>
      ) : null}
      {title}
      <p className="mt-[11px] max-w-[35ch] text-xs leading-[1.55] text-muted">
        {subtitle}
      </p>
    </section>
  );
}
