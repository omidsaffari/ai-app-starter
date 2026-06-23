import type { MetadataRoute } from "next";
import { project } from "@/lib/project";

/**
 * Web app manifest — mirrors dvnc-cloud's setup. `app/icon.svg` (the pixelated
 * mark) is auto-wired as the favicon by Next's file convention; this manifest
 * names it for installs. Per-release fields follow `project.ts`.
 */
export default function manifest(): MetadataRoute.Manifest {
	return {
		name: project.name,
		short_name: project.name,
		description: project.tagline,
		start_url: "/",
		display: "standalone",
		background_color: "#0a0e14",
		theme_color: "#0a0e14",
		icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
	};
}
