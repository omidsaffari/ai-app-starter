import { defineSchedule } from "eve/schedules";

/**
 * ⚠ COSTS MONEY ON DEPLOYED COPIES: on Vercel this becomes a Cron Job (UTC)
 * and every firing is a real model turn billed to the deployment's gateway.
 * Delete this file if the project doesn't need a schedule.
 *
 * `eve dev` never fires schedules on cadence — trigger manually:
 *   POST http://localhost:3000/eve/v1/dev/schedules/weekly-digest
 */
export default defineSchedule({
	cron: "0 9 * * 1",
	markdown:
		"Read the notes under /workspace/notes and reply with a one-paragraph digest of what changed. If there are no notes, reply exactly: No notes this week.",
});
