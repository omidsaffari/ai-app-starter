/**
 * redactSecret — replace every occurrence of `secret` in `text` with a mask.
 *
 * Called on every error path (client and server) so a BYOK key can never leak
 * into an error message, a log line, or an analytics event. Part of the frozen
 * trust boundary — do not weaken.
 */
export function redactSecret(text: string, secret: string | null | undefined): string {
	if (!secret || secret.length < 4) return text;
	return text.split(secret).join("[redacted]");
}
