import { defaultBackend, defineSandbox } from "eve/sandbox";

/**
 * The agent's one sandbox. defaultBackend picks Vercel Sandbox on Vercel,
 * else Docker → microsandbox → just-bash locally. `/workspace` persists across
 * turns for a session; `agent/sandbox/workspace/**` seeds it.
 *
 * Egress defaults to allow-all. For anything sensitive, tighten per session:
 *   async onSession({ use }) {
 *     await use({ networkPolicy: { allow: ["ai-gateway.vercel.sh"] } });
 *   }
 */
export default defineSandbox({
	backend: defaultBackend(),
});
