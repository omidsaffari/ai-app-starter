# Example outcome rubric

Reference for `user.define_outcome` — the outcome dialog in the app ships a
shorter default. Rubrics are graded by a separate model context, so criteria
must be explicit and mechanically checkable, not vibes ("looks good").
A useful technique from the platform docs: show the model a known-good
artifact and ask it to derive the rubric from what makes it good.

## Research brief rubric

### Coverage
- Names at least three primary sources, each with a working URL
- States the publication date of every source used
- Distinguishes established facts from the author's inference

### Analysis
- Leads with the single most decision-relevant finding
- Every quantitative claim carries units and a time reference
- Includes at least one counterpoint or limitation of the analysis

### Deliverable quality
- Final file exists at /mnt/session/outputs/ as markdown
- Opens with a 2–3 sentence executive summary
- Ends with an "Open questions" section listing what could not be verified
