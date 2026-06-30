/**
 * Brand mark for St Joseph's College of Health Sciences (SJCHS)
 * Asset Management System. Pure inline SVG + text so it never 404s
 * and scales crisply on any background.
 *
 * variant: "dark"  → for light backgrounds (auth, headers)
 *          "light" → for dark/slate backgrounds (sidebars)
 */
export default function Logo({
  variant = "dark",
  showText = true,
  size = "md",
  className = "",
}) {
  const isLight = variant === "light";

  const sizes = {
    sm: { box: "h-8 w-8", title: "text-sm", sub: "text-[10px]" },
    md: { box: "h-10 w-10", title: "text-base", sub: "text-[11px]" },
    lg: { box: "h-14 w-14", title: "text-xl", sub: "text-xs" },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Monogram badge */}
      <span
        className={`relative inline-flex ${s.box} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-900/25 ring-1 ring-white/20`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-1/2 w-1/2">
          {/* stylised stacked-assets / boxes glyph */}
          <path
            d="M12 2.5 21 7v10l-9 4.5L3 17V7l9-4.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M3 7l9 4.5L21 7M12 11.5V21.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </span>

      {showText && (
        <div className="min-w-0 leading-tight">
          <p
            className={`font-bold tracking-tight ${s.title} ${
              isLight ? "text-white" : "text-slate-900"
            }`}
          >
            SJCHS
          </p>
          <p
            className={`font-medium uppercase tracking-[0.14em] ${s.sub} ${
              isLight ? "text-blue-200/90" : "text-slate-500"
            }`}
          >
            Asset Management
          </p>
        </div>
      )}
    </div>
  );
}
