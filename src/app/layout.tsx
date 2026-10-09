import type { Metadata } from "next";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/400-italic.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./globals.css";
import { LangProvider } from "@/i18n";

export const metadata: Metadata = {
  title: "Toronto Parcel Spine: one stable ID per Toronto property",
  description:
    "TOP-<PARCELID>: a stable identifier for every Toronto property, joining the city's Property Boundaries with address points. Explorer, REST API, OpenAPI docs, and MCP tools. Open data, MIT licensed.",
  openGraph: {
    title: "Toronto Parcel Spine: one stable ID for each of Toronto's 498,477 properties",
    description:
      "TOP-<PARCELID> gives every Toronto property one stable identifier, joining the city's Property Boundaries with 525,085 address points from the Toronto One Address Repository. Search explorer, REST API, OpenAPI docs, and MCP tools for AI agents.",
    url: "https://parcels.canada.nshipyard.com/",
    siteName: "Open Nshipyard",
    type: "website",
    images: [
      {
        url: "https://parcels.canada.nshipyard.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Toronto Parcel Spine: 498,477 parcels with one stable ID each, 525,085 address points joined",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Toronto Parcel Spine: one stable ID for each of Toronto's 498,477 properties",
    description:
      "TOP-<PARCELID> gives every Toronto property one stable identifier, joining the city's Property Boundaries with 525,085 address points from the Toronto One Address Repository. Search explorer, REST API, OpenAPI docs, and MCP tools for AI agents.",
    images: ["https://parcels.canada.nshipyard.com/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      "/favicon.ico",
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
