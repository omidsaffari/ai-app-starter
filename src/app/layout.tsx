import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { project } from "@/lib/project";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const siteUrl =
	process.env.NEXT_PUBLIC_SITE_URL ||
	project.siteUrl ||
	(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: `${project.name} — Omid Saffari Labs`,
	description: project.tagline,
	openGraph: {
		title: `${project.name} — Omid Saffari Labs`,
		description: project.tagline,
		url: siteUrl,
		siteName: "Omid Saffari Labs",
		images: [{ url: "/og.png", width: 1280, height: 640, alt: `${project.name} social preview` }],
	},
	twitter: {
		card: "summary_large_image",
		title: `${project.name} — Omid Saffari Labs`,
		description: project.tagline,
		images: ["/og.png"],
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
				<ThemeProvider>
					<TooltipProvider>{children}</TooltipProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
