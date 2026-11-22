import { FX_INR_PER_USD, PRICES_AS_OF } from "@/data/models";

export function priceFootnoteText(): string {
  return `Prices as of ${PRICES_AS_OF} · USD rates, ₹ at ${FX_INR_PER_USD}`;
}

export function PriceFootnote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] text-faint ${className}`.trim()}>{priceFootnoteText()}</p>
  );
}