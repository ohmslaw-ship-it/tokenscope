export type SectionId = "system" | "example1" | "example2" | "user";

export interface PromptSection {
  id: SectionId;
  label: string;
  text: string;
  /** Few-shot example sections that support “cut this example” trim suggestions. */
  cuttable?: boolean;
}

export type SamplePreset = {
  id: string;
  name: string;
  replyTokens: number;
  sections: PromptSection[];
};

const HALDEN_DOCUMENT = `Halden Cloud — Billing & Storage Reference (v4.2)
Last updated: 14 Oct 2026 · Applies to all workspaces in the us-east, eu-west, and ap-south regions.

1. Overview
Halden Cloud charges for compute, object storage, and outbound data transfer. This document covers Storage Plans, invoice timing, overage rules, and common billing FAQs. Pricing amounts below are listed in USD unless marked otherwise. Taxes and payment-processor fees are added at checkout where required by law.

2. Definitions
2.1 Workspace — A billed container tied to one payment method. Sub-accounts inherit the parent workspace limits unless a separate quota profile is attached.
2.2 Hot tier — Frequently accessed objects stored on SSD-backed volumes with millisecond read latency.
2.3 Archive tier — Infrequently accessed objects with retrieval times of 4–12 hours and lower per-GB storage rates.
2.4 Egress — Bytes sent from Halden Cloud to the public internet or to another cloud provider over the Halden backbone. Ingress is free.

3. Storage plans (object storage)
All plans include versioning, server-side encryption (AES-256), and lifecycle rules. Base storage is measured daily at 00:00 UTC as the maximum of hot + archive usage that day.

3.1 Starter
Included hot storage: 250 GB
Included archive storage: 1 TB
Included egress per month: 500 GB
Hot overage: $0.09 per GB-month
Archive overage: $0.012 per GB-month
Egress overage: $0.11 per GB
Minimum monthly charge: $29 (includes listed quotas; overage billed in addition)
Lifecycle transitions: 1,000 free per month, then $0.004 each

3.2 Growth
Included hot storage: 2 TB
Included archive storage: 10 TB
Included egress per month: 5 TB
Hot overage: $0.07 per GB-month
Archive overage: $0.009 per GB-month
Egress overage: $0.085 per GB
Minimum monthly charge: $249
Lifecycle transitions: 25,000 free per month, then $0.003 each
Add-on: Cross-region replication to one extra region at $0.02 per GB replicated (hot tier only)

3.3 Scale
Included hot storage: 20 TB
Included archive storage: 200 TB
Included egress per month: 50 TB
Hot overage: $0.055 per GB-month
Archive overage: $0.007 per GB-month
Egress overage: $0.072 per GB
Minimum monthly charge: $1,890
Dedicated support channel with 4-hour response SLA on billing disputes
Custom lifecycle transition bundles available on request

3.4 Enterprise
Quotas negotiated in the Order Form; minimum egress commit typically 200 TB/month
Volume discounts on archive overage below $0.004 per GB-month when archive exceeds 500 TB sustained for 30 days
Private networking to customer VPC/VNet included; public egress billed per Order Form rate card

4. Plan tables (comparison)
| Plan     | Hot included | Archive included | Egress included | Min monthly |
|----------|--------------|------------------|-----------------|-------------|
| Starter  | 250 GB       | 1 TB             | 500 GB          | $29         |
| Growth   | 2 TB         | 10 TB            | 5 TB            | $249        |
| Scale    | 20 TB        | 200 TB           | 50 TB           | $1,890      |
| Enterprise | Custom     | Custom           | Custom          | Custom      |

5. Billing cycle and invoices
5.1 Calendar-month billing. Usage from 00:00 UTC on the first day through 23:59 UTC on the last day appears on the invoice issued on the 3rd of the following month.
5.2 Overage line items are itemized by tier (hot, archive, egress) and by region.
5.3 Failed card payments retry on days 3, 7, and 12. After day 12 without payment, new writes to object storage are blocked; reads continue for 7 days, then the workspace enters read-only suspension.
5.4 Credits from support incidents expire 90 days after issuance unless the credit memo states otherwise.

6. Limits and soft caps
6.1 API rate limits are separate from storage quotas; see the Platform Limits guide. Exceeding API limits does not increase storage charges.
6.2 Each bucket may hold up to 5 million object versions by default; request a limit raise via the console for Scale and Enterprise.
6.3 Individual object size maximum: 5 TB per object in hot tier, 10 TB in archive after multipart completion.
6.4 Minimum billable object size: 128 KB for hot tier (smaller objects are charged as 128 KB). Archive minimum is 1 MB per object.

7. Overage rules
7.1 Hot and archive overage is calculated independently; moving data to archive via lifecycle does not retroactively change hot usage already recorded that day.
7.2 Egress overage counts all outbound bytes except traffic to Halden Cloud CDN PoPs when the CDN feature is enabled on the same workspace (CDN egress is rated separately on the CDN invoice).
7.3 Cross-region replication bytes count as egress in the source region and as ingress (free) in the destination.
7.4 Early deletion fee: objects in archive tier deleted or moved to hot within 90 days of archival incur a charge equal to 90 days of archive storage for the object size, minus storage already billed.

8. Changing plans
8.1 Upgrades take effect immediately; included quotas prorate upward for the remainder of the month.
8.2 Downgrades take effect at the next month boundary. If current usage exceeds the downgraded plan quotas at month end, overage for that month is still billed at the previous plan's overage rates.
8.3 Enterprise plan changes require a signed Order Form amendment.

9. Tax and currency
9.1 Invoices may be issued in USD, EUR, or GBP depending on billing address.
9.2 India GST applies to customers with a billing address in India when local entity invoicing is selected (HALDEN-IN Pvt Ltd).
9.3 Withholding tax certificates can be uploaded within 14 days of invoice date for adjustment on the following invoice.

10. Frequently asked questions
Q: Does compressing objects reduce billed storage?
A: Billed size is the logical uncompressed byte size stored in metadata at write time, not the on-disk compressed size (Section 6.4 minimums still apply).

Q: Are deleted objects billed immediately?
A: Delete markers and non-current versions continue to accrue archive/hot usage until lifecycle purge rules remove them or they expire per versioning policy.

Q: How is egress measured for multi-part downloads?
A: Sum of bytes delivered to clients, including retry segments; failed client-aborted transfers are not billed once the server stops sending.

Q: Can I cap monthly spend?
A: Growth and above support spend alerts and optional hard caps on egress only; storage overage cannot be hard-capped without disabling writes at quota (contact support).

Q: What happens when hot quota is exceeded but archive is not?
A: Hot overage rates apply to the excess hot GB-months; archive included quota is unchanged.

Q: Is there a free tier?
A: No standing free tier as of v4.2. Trial credits are issued one-time per organization and appear as line-item credits, not plan quotas.

11. Support and disputes
Open a billing dispute within 45 days of invoice date via Console → Billing → Disputes. Include invoice ID and line numbers in question. Halden will respond within 10 business days (Scale) or per Enterprise SLA.

12. Metering accuracy and audit
12.1 Storage metering uses cryptographic checksums on bucket inventory snapshots; discrepancies greater than 0.05% trigger an automatic audit ticket.
12.2 Egress totals exclude TCP retransmits measured at the load balancer when the Halden CDN is not in path.
12.3 Customers may request a raw metering CSV within 30 days of invoice; files expire after 7 days in the secure download area.

13. Worked examples (Growth plan)
Example A — Hot overage only: Customer used 2.4 TB hot (included 2 TB) and 8 TB archive (included 10 TB) with 4.1 TB egress (included 5 TB). Hot overage = 400 GB × $0.07 = $28.00. No archive or egress overage. Lifecycle transitions: 12,400 used, 25,000 free → $0.00.
Example B — Egress overage: Same quotas, 6.2 TB egress in the month. Overage volume = 6.2 TB − 5 TB = 1.2 TB = 1,228.8 GB (using 1 TB = 1024 GB for billing). Charge = 1,228.8 × $0.085 = $104.45 (see Section 3.2 and 7.2).
Example C — Downgrade at month end: Customer on Scale downgrades to Growth effective next month but ends the current month at 22 TB hot. Hot overage = 2 TB × $0.055 = $102.40 billed at Scale hot overage rate per Section 8.2.

14. Regional pricing notes
14.1 ap-south stores bill in USD; INR estimates on the console use the daily reference rate, not the invoice rate unless HALDEN-IN is selected (Section 9.2).
14.2 eu-west archive retrieval requests initiated between 18:00–06:00 UTC receive a 10% discount on retrieval fees only (storage still billed at standard archive rates).
14.3 us-east is the default write region; cross-region replication from us-east to eu-west on Growth adds replication egress per Section 3.2 add-on.

15. Compliance and retention
15.1 Invoices are retained for 7 years in the customer portal.
15.2 Deleted workspace data in object storage is purged from active systems within 30 days; backup tapes may retain encrypted fragments up to 90 days.
15.3 SOC 2 Type II report available to Scale and Enterprise customers under NDA.

16. Glossary extension
Object version — A unique generation of an object name; delete markers count as versions.
Quota profile — Overrides default plan quotas for a sub-account without changing the parent invoice line grouping.
Spend alert — Email or webhook when projected month-end charges exceed a customer-set threshold; does not stop usage.
Transition — A lifecycle action moving objects between hot and archive tiers; billed per Section 3.x lifecycle transition allowances.

17. Document history
v4.2 — Archive early-deletion fee clarified (Section 7.4); Scale minimum updated to $1,890; added Section 13 worked examples.
v4.1 — Added India GST note.
v4.0 — Growth egress included raised to 5 TB.

For machine-to-machine pricing API access, use the billing metadata endpoint documented separately; this PDF-equivalent excerpt is the source of truth for human support agents. When answering customer questions, prefer Section 13 for numeric illustrations and Section 7 for overage policy wording.`;

const AGENT_TOOLS = `Available tools (invoke one at a time; wait for result before the next call):

--- tool: read_file ---
Description: Read the contents of a text file from the repository.
Parameters (JSON):
{
  "path": { "type": "string", "required": true, "description": "Repository-relative path, e.g. src/lib/foo.ts" },
  "start_line": { "type": "integer", "required": false, "description": "1-based start line, inclusive" },
  "end_line": { "type": "integer", "required": false, "description": "1-based end line, inclusive" }
}
Returns: { "path", "content", "line_count" }
Errors: ENOENT if missing, EPERM if path escapes repo root via .. segments

--- tool: edit_file ---
Description: Replace a single contiguous region of a file with new text.
Parameters (JSON):
{
  "path": { "type": "string", "required": true },
  "old_string": { "type": "string", "required": true, "description": "Exact substring to replace; must appear exactly once" },
  "new_string": { "type": "string", "required": true, "description": "Replacement text" }
}
Returns: { "path", "bytes_written", "preview_diff": "unified diff text" }
Errors: AMBIGUOUS if old_string matches more than once; NO_MATCH if zero matches

--- tool: run_tests ---
Description: Run the project test suite or a filtered subset.
Parameters (JSON):
{
  "command": { "type": "string", "required": false, "default": "npm test", "description": "Shell command; must start with npm, pnpm, or yarn" },
  "filter": { "type": "string", "required": false, "description": "Passed to test runner when supported, e.g. file path pattern" },
  "timeout_ms": { "type": "integer", "required": false, "default": 120000, "max": 600000 }
}
Returns: { "exit_code", "stdout", "stderr", "duration_ms" }

--- tool: search_code ---
Description: Ripgrep-style search across tracked files.
Parameters (JSON):
{
  "pattern": { "type": "string", "required": true, "description": "Regex or literal if literal=true" },
  "literal": { "type": "boolean", "required": false, "default": false },
  "glob": { "type": "string", "required": false, "description": "Optional glob, e.g. **/*.tsx" },
  "max_results": { "type": "integer", "required": false, "default": 50, "max": 200 }
}
Returns: { "matches": [ { "path", "line", "column", "snippet" } ] }

--- tool: run_command ---
Description: Run a short, allow-listed diagnostic command in the repo root (no network).
Parameters (JSON):
{
  "argv": {
    "type": "array",
    "required": true,
    "items": { "type": "string" },
    "description": "e.g. [\"npm\", \"run\", \"lint\"] — npm/pnpm/yarn/npx only"
  },
  "timeout_ms": { "type": "integer", "required": false, "default": 180000 }
}
Returns: { "exit_code", "stdout", "stderr" }
Safety: Commands not matching the allow-list are rejected with POLICY error.

General rules: Always pass valid JSON for parameters. Do not fabricate tool output. If read_file fails, search_code before asking the user. Prefer edit_file over run_command for source changes. Keep old_string copies short but unique. After edit_file on TypeScript, run run_tests or npm run build when tests exist.`;

const AGENT_REPO = `Repository: harbor-shop (fictional Next.js storefront)

File tree (partial):
harbor-shop/
├── package.json
├── next.config.ts
├── tsconfig.json
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── cart/
│   │       ├── page.tsx
│   │       └── loading.tsx
│   ├── components/
│   │   ├── CartSummary.tsx
│   │   └── PriceTag.tsx
│   └── lib/
│       ├── cart.ts
│       └── currency.ts
└── tests/
    └── cart.test.ts

package.json excerpt:
{
  "name": "harbor-shop",
  "version": "0.4.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "node --test tests/**/*.test.ts",
    "lint": "eslint src"
  },
  "dependencies": {
    "next": "16.4.6",
    "react": "19.3.0",
    "react-dom": "19.3.0"
  }
}

Notes: Cart totals live in src/lib/cart.ts. Currency formatting is in src/lib/currency.ts. The cart page imports both. Tests mock INR and USD.`;

export const samplePresets: SamplePreset[] = [
  {
    id: "support",
    name: "Support bot",
    replyTokens: 400,
    sections: [
      {
        id: "system",
        label: "System",
        text: "You are Northwind Support, the customer-service assistant for Northwind Traders, a mid-size wholesale company. Speak in a calm, concise tone. Be warm, never chatty. Answer only from the order data you are given, the refund policy below, and these examples. Refund policy: a customer may request a full refund within 30 days of delivery if the shipment is unopened or if items arrived damaged or incorrect. After 30 days, offer store credit only. Never invent an order ID, a tracking number, or a delivery date. If you do not have the data, say so and ask for the order ID. If a request is angry, acknowledge the frustration first, then give the next step in one short paragraph.",
      },
      {
        id: "example1",
        label: "Example 1",
        cuttable: true,
        text: "Customer: My order NW-18422 was supposed to arrive Tuesday and it still isn't here. This is the second time this month. Assistant: I'm sorry you've had to wait again, especially after the last delay. I can see NW-18422 left the warehouse on 12 Nov and is with the courier, last scanned in Pune this morning. Current estimate is tomorrow by 6pm. I've added a ₹200 credit to your account for the wait. If it doesn't arrive tomorrow, write back and I'll raise a priority trace.",
      },
      {
        id: "example2",
        label: "Example 2",
        cuttable: true,
        text: "Customer: I want a refund for order NW-19005. I unboxed it yesterday and two of the mugs arrived cracked. Assistant: I'm sorry those mugs arrived damaged. Because NW-19005 was delivered yesterday, you're within the 30-day window and I'll process a full refund for the cracked items. Please keep the rest of the set. A return label is on its way to your email; once the courier scans it, the refund should reach your original payment method in 5-7 days.",
      },
      {
        id: "user",
        label: "User",
        text: "Customer: Hi, I ordered a crate of glass bottles last week (I think the order number starts with NW-19) and I need to return them - I bought the wrong size. Can I get a refund?",
      },
    ],
  },
  {
    id: "rag",
    name: "RAG, long context",
    replyTokens: 250,
    sections: [
      {
        id: "system",
        label: "System",
        text: "You are Halden Cloud's documentation assistant. Answer only using the document provided in this conversation. Do not use outside knowledge. If the document does not contain enough information, say so briefly. Always cite section numbers from the document (e.g. Section 7.2) in your answer. Be concise and factual.",
      },
      {
        id: "example1",
        label: "Document",
        text: HALDEN_DOCUMENT,
      },
      {
        id: "example2",
        label: "Instructions",
        text: "Format: one short direct answer (2–4 sentences), then a line \"Cited sections:\" listing each section number referenced. Do not quote long passages from the document.",
      },
      {
        id: "user",
        label: "User",
        text: "We are on the Growth plan and used 6.2 TB of egress last month. How is the overage calculated, and which section covers it?",
      },
    ],
  },
  {
    id: "agent",
    name: "Coding agent",
    replyTokens: 150,
    sections: [
      {
        id: "system",
        label: "System",
        text: `You are Harbor, an autonomous coding agent working inside the harbor-shop repository. Follow these rules:

1. Understand the user's goal before editing; read relevant files with read_file when paths are uncertain.
2. Make the smallest correct change. Prefer fixing root causes over symptoms.
3. Match existing TypeScript style, imports, and naming in the repo.
4. Never commit secrets, alter CI deploy keys, or disable security checks without explicit user approval.
5. After substantive edits, run tests via run_tests when a test file exists for the touched module.
6. Explain your plan in one short paragraph before the first tool call; keep user-visible text brief.
7. If tests fail, diagnose from stdout/stderr before retrying edits.
8. Do not ask the user to run commands you can run with run_tests or run_command.
9. When the bug is a wrong formula or off-by-one, add or adjust a test if the suite already covers that area.
10. Stop when tests pass and the user request is satisfied; summarize what changed and which files were touched.
11. Prefer editing src/lib modules before UI components when the bug is computational.
12. Do not reformat unrelated lines or reorder imports unless required by the project's lint rules.
13. If two files share duplicated currency logic, consolidate only when the user explicitly asks for a refactor.
14. Report remaining risks (e.g., missing edge-case tests) in one sentence at the end.

You may invoke tools as plain-text JSON blocks only when proceeding with an action. One tool per turn. Never output tool JSON in the same turn as a user-facing summary unless the action is complete.`,
      },
      {
        id: "example1",
        label: "Tools",
        text: AGENT_TOOLS,
      },
      {
        id: "example2",
        label: "Repo context",
        text: AGENT_REPO,
      },
      {
        id: "user",
        label: "User",
        text: "Cart page shows the correct line items but the INR total is 100× too large after the currency refactor. Fix cart.ts and keep tests green.",
      },
    ],
  },
];

export const defaultPresetId = "support";

export function getPresetById(id: string): SamplePreset | undefined {
  return samplePresets.find((preset) => preset.id === id);
}

export function textsFromPreset(presetId: string): Record<SectionId, string> {
  const preset = getPresetById(presetId) ?? getPresetById(defaultPresetId)!;
  return Object.fromEntries(
    preset.sections.map((section) => [section.id, section.text]),
  ) as Record<SectionId, string>;
}

export function labelsFromPreset(presetId: string): Record<SectionId, string> {
  const preset = getPresetById(presetId) ?? getPresetById(defaultPresetId)!;
  return Object.fromEntries(
    preset.sections.map((section) => [section.id, section.label]),
  ) as Record<SectionId, string>;
}

export function presetTextsMatch(
  presetId: string,
  texts: Record<SectionId, string>,
): boolean {
  const expected = textsFromPreset(presetId);
  return (["system", "example1", "example2", "user"] as SectionId[]).every(
    (id) => texts[id] === expected[id],
  );
}