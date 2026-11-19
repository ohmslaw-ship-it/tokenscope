import { selectedModelLabel } from "@/data/placeholder";

function ChevronDown() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden
      className="text-muted"
    >
      <path
        d="M2 3.5L5 6.5L8 3.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-hairline px-6">
      <div className="font-serif text-[22px] leading-none text-accent">
        <span className="font-normal not-italic">Token</span>
        <span className="italic">scope</span>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="flex rounded-[var(--radius-control)] border border-hairline p-0.5"
          role="group"
          aria-label="View mode"
        >
          <button
            type="button"
            className="rounded-[4px] bg-surface px-3 py-1.5 font-mono text-[12px] text-text"
          >
            Inspect
          </button>
          <button
            type="button"
            className="rounded-[4px] px-3 py-1.5 font-mono text-[12px] text-muted"
          >
            Compare
          </button>
        </div>

        <div
          className="flex rounded-[var(--radius-control)] border border-hairline p-0.5"
          role="group"
          aria-label="Currency"
        >
          <button
            type="button"
            className="min-w-[36px] rounded-[4px] bg-surface px-2 py-1.5 font-mono text-[12px] text-text"
          >
            ₹
          </button>
          <button
            type="button"
            className="min-w-[36px] rounded-[4px] px-2 py-1.5 font-mono text-[12px] text-muted"
          >
            $
          </button>
        </div>

        <button
          type="button"
          className="flex items-center gap-2 rounded-[var(--radius-control)] border border-hairline px-3 py-1.5 font-mono text-[12px] text-text-2"
        >
          {selectedModelLabel}
          <ChevronDown />
        </button>
      </div>
    </header>
  );
}