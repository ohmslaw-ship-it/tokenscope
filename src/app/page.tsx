import { Fragment } from "react";
import { Ledger } from "@/components/Ledger";
import { MarginGutter } from "@/components/MarginGutter";
import { MarginNote } from "@/components/MarginNote";
import { PromptFooter, PromptSection } from "@/components/PromptDocument";
import { TopBar } from "@/components/TopBar";
import { promptSections } from "@/data/sample";

const sectionSpacing = "pt-8";
const gridColumns = "140px 680px 200px 240px";

export default function Home() {
  const ledgerRowSpan = promptSections.length + 1;

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto w-full max-w-[1280px]">
        <TopBar />

        <main className="pb-16 pt-10">
          <div
            className="mx-auto grid gap-x-2"
            style={{
              gridTemplateColumns: gridColumns,
              width: "fit-content",
              maxWidth: "100%",
            }}
          >
            {promptSections.map((section, index) => {
              const row = index + 1;
              return (
                <Fragment key={section.id}>
                  <div
                    className={index > 0 ? sectionSpacing : undefined}
                    style={{ gridColumn: 1, gridRow: row }}
                  >
                    <MarginGutter sectionId={section.id} label={section.label} />
                  </div>
                  <div style={{ gridColumn: 2, gridRow: row }}>
                    <PromptSection text={section.text} offset={index > 0} />
                  </div>
                  <div
                    className={index > 0 ? sectionSpacing : undefined}
                    style={{ gridColumn: 3, gridRow: row }}
                  >
                    {section.id === "example1" ? <MarginNote /> : null}
                  </div>
                </Fragment>
              );
            })}

            <div
              className="sticky top-8 self-start"
              style={{
                gridColumn: 4,
                gridRow: `1 / span ${ledgerRowSpan}`,
              }}
            >
              <Ledger />
            </div>

            <div style={{ gridColumn: 2, gridRow: promptSections.length + 1 }}>
              <PromptFooter />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}