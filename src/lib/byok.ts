"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * BYOK key handling — the trust boundary. Frozen: do not weaken or relocate.
 *
 * Contract: the visitor's key lives in `sessionStorage` only (gone when the tab
 * closes), is sent per-request to `/api/run` via the `x-provider-key` header,
 * and is never written to localStorage, a cookie, a query string, the DOM, the
 * server environment, or any log/analytics sink.
 */
const STORAGE_KEY = "byok:key";

/** The header the BYOK key rides in, on same-origin requests to `/api/run` only. */
export const PROVIDER_KEY_HEADER = "x-provider-key";

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
