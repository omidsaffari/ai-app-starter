import { localDev, placeholderAuth, vercelOidc } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

/**
 * Route auth for /eve/v1/* — walked in order; first match wins.
 * - vercelOidc: your own Vercel deployments + the eve TUI reach the agent.
 * - localDev: open on localhost for `eve dev`; ignored in production.
 * - placeholderAuth: FAILS CLOSED in production. Browser visitors of a deployed
 *   copy get 401 until the deployer replaces it with their app's auth (an
 *   AuthFn over their session) or, for a public demo, `none()` — deliberate,
 *   since a public demo bills the deployer's gateway on every message.
 */
export default eveChannel({
	auth: [vercelOidc(), localDev(), placeholderAuth()],
});
