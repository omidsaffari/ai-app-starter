"use client";

import { useCallback, useEffect, useState } from "react";
import { redactSecret } from "./secret";

/**
 * BYOK key handling — the trust boundary. Frozen: do not weaken or relocate.
 *
 * Contract: the visitor's key lives in `sessionStorage` only (gone when the tab
 * closes), is sent per-request to `/api/run` via the `x-provider-key` header,
 * and is never written to localStorage, a cookie, a query string, the DOM, the
 * server environment, or any log/analytics sink.
 */
const STORAGE_KEY = "byok:key";

export function readKey(): string {
	if (typeof window === "undefined") return "";
	try {
		return window.sessionStorage.getItem(STORAGE_KEY) ?? "";
	} catch {
		return "";
	}
}

export function writeKey(key: string): void {
	if (typeof window === "undefined") return;
	try {
		window.sessionStorage.setItem(STORAGE_KEY, key);
	} catch {
		/* storage disabled — key simply isn't remembered this session */
	}
}

export function clearKey(): void {
	if (typeof window === "undefined") return;
	try {
		window.sessionStorage.removeItem(STORAGE_KEY);
	} catch {
		/* no-op */
	}
}

export function useByokKey(): {
	key: string;
	setKey: (k: string) => void;
	clear: () => void;
	hasKey: boolean;
} {
	const [key, setKeyState] = useState("");
	useEffect(() => {
		setKeyState(readKey());
	}, []);
	const setKey = useCallback((k: string) => {
		writeKey(k);
		setKeyState(k);
	}, []);
	const clear = useCallback(() => {
		clearKey();
		setKeyState("");
	}, []);
	return { key, setKey, clear, hasKey: key.trim().length > 0 };
}

/**
 * streamPrompt — POST the prompt to the BYOK route with the key in a header and
 * yield streamed text chunks. The key is sent per-request only; errors are
 * redacted so the key never surfaces in the UI.
 */
export async function* streamPrompt(
	prompt: string,
	key: string,
	signal?: AbortSignal,
): AsyncGenerator<string> {
	let res: Response;
	try {
		res = await fetch("/api/run", {
			method: "POST",
			headers: { "content-type": "application/json", "x-provider-key": key },
			body: JSON.stringify({ prompt }),
			signal,
		});
	} catch (err) {
		throw new Error(redactSecret(err instanceof Error ? err.message : String(err), key));
	}
	if (!res.ok || !res.body) {
		const detail = await res.text().catch(() => "");
		throw new Error(redactSecret(detail || `Request failed (${res.status})`, key));
	}
	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		yield decoder.decode(value, { stream: true });
	}
}
