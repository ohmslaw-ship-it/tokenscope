import { marginNote } from "@/data/placeholder";

const formatInr = (value: number) =>
  new Intl.NumberFormat("en-IN").format(value);

export function MarginNote() {
  return (
    <aside
      className="w-[200px] shrink-0 border-l border-accent py-1 pl-4 font-serif text-[13px] italic leading-snug text-accent"
      aria-label="Cost suggestion"
    >
      Cut this example and save ₹{formatInr(marginNote.savingsInr)} a month on{" "}
      {marginNote.model}.
    </aside>
  );
}