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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  // PWA manifest. The favicon (app/icon.png) and Apple Touch Icon
  // (app/apple-icon.png) are auto-detected by Next from the app/ directory —
  // both are the WrytrsBlock W mark on royal blue.
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "WrytrsBlock",
    statusBarStyle: "black-translucent",
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
