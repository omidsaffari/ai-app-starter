import type { Metadata } from "next";
import type { ReactNode } from "react";
import { project } from "@/lib/project";
import "./globals.css";

export const metadata: Metadata = {
	title: `${project.name} — Omid Saffari Labs`,
	description: project.tagline,
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body>
				<div className="flex min-h-svh flex-col">
					<header className="flex items-center justify-between border-border border-b px-5 py-4">
						<a className="font-semibold tracking-tight" href="https://github.com/omidsaffari">
							Omid Saffari Labs
						</a>
						<a className="text-accent text-sm" href={project.repoUrl}>
							Source
						</a>
					</header>
					<main className="flex-1">{children}</main>
					<footer className="border-border border-t px-5 py-4 text-center text-muted text-xs">
						Open source · bring your own key · nothing stored
					</footer>
				</div>
			</body>
		</html>
	);
}
