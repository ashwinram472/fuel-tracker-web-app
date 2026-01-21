export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
