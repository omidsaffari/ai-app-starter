"use client";

import { Download04Icon, Image02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * In-column image container with skeleton → image transition. Renders inline in
 * the chat column (NOT full-bleed) — the dvnc-cloud imagi canvas + image-row are
 * deliberately excluded. Pruned of the detail sheet, selection, and proxy
 * download/share that depend on dvnc's private-bucket routes; downloads here go
 * straight from the (same-origin or data) URL.
 */
export function ImageFrame({
	src,
	aspectRatio = "1/1",
	isStreaming,
}: {
	src?: string;
	aspectRatio?: string;
	isStreaming?: boolean;
}) {
	const hadSrcOnMount = useRef(!!src);
	const [loaded, setLoaded] = useState(hadSrcOnMount.current);
	const [errored, setErrored] = useState(false);
	const [naturalRatio, setNaturalRatio] = useState<string | null>(null);
	const [retrySrc, setRetrySrc] = useState(src);

	if (src && src !== retrySrc) {
		setRetrySrc(src);
		setLoaded(false);
		setErrored(false);
	}

	const handleRetry = () => {
		if (!src) return;
		setErrored(false);
		setLoaded(false);
		setRetrySrc(`${src}${src.includes("?") ? "&" : "?"}t=${Date.now()}`);
	};

	const handleDownload = () => {
		if (!src) return;
		const a = document.createElement("a");
		a.href = src;
		a.download = "image.png";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const ratio = loaded && naturalRatio ? naturalRatio : aspectRatio;
	const showActions = loaded && src && !errored;

	return (
		<div className="group/img relative w-full max-w-md">
			<div
				className="bg-muted/50 relative w-full overflow-hidden rounded-xl"
				style={{ aspectRatio: ratio }}
			>
				{!loaded && !errored && <div className="bg-muted/40 absolute inset-0" />}

				{!src && !errored && isStreaming && (
					<div className="absolute inset-0 flex items-center justify-center">
						<span className="border-muted-foreground/30 border-t-muted-foreground/70 inline-block size-5 animate-spin rounded-full border-2" />
					</div>
				)}

				{!src && !errored && !isStreaming && (
					<div className="absolute inset-0 flex items-center justify-center">
						<HugeiconsIcon icon={Image02Icon} size={20} className="text-muted-foreground/40" />
					</div>
				)}

				{errored && (
					<div className="absolute inset-0 flex items-center justify-center">
						<button
							type="button"
							onClick={handleRetry}
							className="bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground rounded-lg px-3 py-1.5 text-[12px] transition-colors"
						>
							Retry
						</button>
					</div>
				)}

				{retrySrc && !errored && (
					// biome-ignore lint/performance/noImgElement: BYOK image bytes come from arbitrary provider/data URLs, not next/image-optimizable assets
					<img
						src={retrySrc}
						alt=""
						className={`absolute inset-0 h-full w-full transition-all duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
						onLoad={(e) => {
							const img = e.currentTarget;
							setNaturalRatio(`${img.naturalWidth}/${img.naturalHeight}`);
							setLoaded(true);
						}}
						onError={() => setErrored(true)}
					/>
				)}
			</div>

			{showActions && (
				<div className="mt-2 flex items-center gap-2">
					<Button variant="secondary" size="sm" onClick={handleDownload}>
						<HugeiconsIcon icon={Download04Icon} size={14} />
						Download
					</Button>
				</div>
			)}
		</div>
	);
}
