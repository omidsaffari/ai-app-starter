import { defineEvalConfig } from "eve/evals";

// Required by `eve eval`. ⚠ Evals run REAL model turns (billed to your
// gateway) unless the fixture agent uses mockModel — run them deliberately,
// never in CI.
export default defineEvalConfig({});
