import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "WrytrsBlock — Creative Collaboration OS",
    template: "%s · WrytrsBlock",
  },
  description:
    "WrytrsBlock — THE CR8TV COLLECTV. Discover creators, collaborate on Blocks, and monetize the work you make together.",
  // Absolute base for OG/Twitter image URLs — defaults to the production domain
  // so social previews resolve correctly even when the env var isn't set.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.wrytrsblock.com"
  ),
  // Icons (app/icon.png, app/apple-icon.png, app/favicon.ico) are auto-detected
  // by Next from the app/ directory — the WrytrsBlock W mark.
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "WrytrsBlock",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    siteName: "WrytrsBlock",
    title: "WrytrsBlock — Creative Collaboration OS",
    description:
      "Discover creators, collaborate on Blocks, and monetize the work you make together.",
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WrytrsBlock — The CR8TV Collectv",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WrytrsBlock — Creative Collaboration OS",
    description:
      "Discover creators, collaborate on Blocks, and monetize the work you make together.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#07080D",
};

const themeBootstrap = `
(function() {
  try {
    var t = localStorage.getItem('wb-theme');
    if (!t) t = 'dark';
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
