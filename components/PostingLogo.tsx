export function PostingLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="32" height="32" rx="6" fill="#03C75A" />
      <path
        d="M10 8h5c2.8 0 5 2.2 5 5s-2.2 5-5 5h-2v6h-3V8zm2 7h3c1.1 0 2-.9 2-2s-.9-2-2-2h-3v4z"
        fill="white"
      />
    </svg>
  );
}
