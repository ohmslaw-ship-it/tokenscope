import {
  ledgerComparisons,
  monthlyCostInr,
  pricingFootnote,
  selectedModelShort,
  usageAssumptions,
} from "@/data/placeholder";

const formatInr = (value: number) =>
  new Intl.NumberFormat("en-IN").format(value);

const formatDelta = (delta: number) => {
  const formatted = formatInr(Math.abs(delta));
  const sign = delta >= 0 ? "+" : "−";
  return `${sign}₹${formatted}`;
};

export function Ledger() {
  return (
    <aside className="sticky top-8 w-[240px] shrink-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
        THIS MONTH
      </p>
      <p className="mt-3 font-serif text-[48px] leading-none text-accent">
        ₹{formatInr(monthlyCostInr)}
      </p>
      <p className="mt-2 font-mono text-[12px] text-muted">{selectedModelShort}</p>

      <ul className="mt-8 border-t border-hairline">
        {ledgerComparisons.map((row) => (
          <li
            key={row.name}
            className="border-b border-hairline py-4 first:border-t-0"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[11px] text-text-2">{row.name}</span>
              <span className="font-mono text-[11px] text-faint">{row.tier}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="font-mono text-[12px] text-muted">
                ₹{formatInr(row.costInr)}
              </span>
              <span
                className={`font-mono text-[12px] ${
                  row.deltaInr >= 0 ? "text-muted" : "text-faint"
                }`}
              >
                {formatDelta(row.deltaInr)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-1 font-mono text-[11px] text-muted">
        <p>
          {formatInr(usageAssumptions.requestsPerDay)} requests / day
        </p>
        <p>{usageAssumptions.replyTokens} token replies</p>
      </div>
      <p className="mt-6 font-mono text-[10px] leading-relaxed text-faint">
        Prices as of {pricingFootnote.asOf} · FX ₹
        {pricingFootnote.fxInrPerUsd.toFixed(2)} / $1
      </p>
    </aside>
  );
}