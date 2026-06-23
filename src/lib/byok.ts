"use client";

import { useCallback, useEffect, useState } from "react";
import type { Provider } from "@/lib/models";

/**
 * BYOK key handling — the trust boundary. Frozen contract: do not weaken or
 * relocate.
 *
 * The visitor's key lives in `sessionStorage` only (gone when the tab closes),
 * is sent per-request to `/api/run` via the `x-provider-key` header, and is
 * never written to localStorage, a cookie, a query string, the DOM, the server
 * environment, or any log/analytics sink.
 *
 * Keys are stored PER PROVIDER under `byok:key:<provider>` so switching the
 * selected model (and thus provider) surfaces that provider's own key — and the
 * route always receives the key matching the model it's about to run.
 */
const STORAGE_PREFIX = "byok:key:";

/** The header the BYOK key rides in, on same-origin requests to `/api/run` only. */
export const PROVIDER_KEY_HEADER = "x-provider-key";

const storageKey = (provider: Provider) => `${STORAGE_PREFIX}${provider}`;

export function readKey(provider: Provider): string {
	if (typeof window === "undefined") return "";
	try {
		return window.sessionStorage.getItem(storageKey(provider)) ?? "";
	} catch {
		return "";
	}
}

export function writeKey(provider: Provider, key: string): void {
	if (typeof window === "undefined") return;
	try {
		window.sessionStorage.setItem(storageKey(provider), key);
	} catch {
		/* storage disabled — key simply isn't remembered this session */
	}
}

export function clearKey(provider: Provider): void {
	if (typeof window === "undefined") return;
	try {
		window.sessionStorage.removeItem(storageKey(provider));
	} catch {
		/* no-op */
	}
}

/**
 * Provider-scoped key state. Pass the currently selected model's provider; the
 * hook reads/writes that provider's slot and re-reads whenever the provider
 * changes (e.g. the visitor switches models).
 */
export function useByokKey(provider: Provider): {
	key: string;
	setKey: (k: string) => void;
	clear: () => void;
	hasKey: boolean;
} {
	const [key, setKeyState] = useState("");
	useEffect(() => {
		setKeyState(readKey(provider));
	}, [provider]);
	const setKey = useCallback(
		(k: string) => {
			writeKey(provider, k);
			setKeyState(k);
		},
		[provider],
	);
	const clear = useCallback(() => {
		clearKey(provider);
		setKeyState("");
	}, [provider]);
	return { key, setKey, clear, hasKey: key.trim().length > 0 };
}
