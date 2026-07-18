---
name: shipping-deliverables
description: Produces well-structured final deliverables from agent sessions — reports, briefs, and digests written to the session outputs directory. Use when the user asks for a document, report, summary file, or any artifact they will download or keep.
---

# Shipping deliverables

## Where deliverables go

Write every final artifact to `/mnt/session/outputs/`. Files anywhere else
are working scratch and will not be offered to the user for download.

Name files for their content, kebab-case: `competitive-brief.md`,
`q3-usage-digest.md`. One deliverable per file.

## Structure

Every deliverable leads with a 2–3 sentence summary of what it is and what
it concludes. Then the body, organized by the reader's questions — not by
the order the work happened.

- Markdown by default. Use the pdf skill only when the user asks for a PDF.
- Claims that depend on a fact name the source next to the claim.
- Numbers get units and dates. "Grew 40%" is noise; "grew 40% YoY (2025)"
  is information.
- End with an honest "Open questions" section when something material could
  not be verified. An accurate gap beats a confident guess.

## Before finishing

1. Re-read the deliverable top to bottom once.
2. Verify every file mentioned in the final message actually exists in
   `/mnt/session/outputs/` (`ls` it).
3. The final chat message lists each deliverable file with a one-line
   description.
