export function LogoMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 16" className={className}>
      <rect width="18" height="3.25" rx="1.6" fill="#fafafa" />
      <rect y="6.375" width="18" height="3.25" rx="1.6" fill="#f5a524" />
      <rect y="12.75" width="18" height="3.25" rx="1.6" fill="#a1a1a1" />
    </svg>
  );
}
