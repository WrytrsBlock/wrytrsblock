import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE_URL } from "@/lib/env";

const SITE_TITLE =
  "WrytrsBlock | Find Creative Collaborators for Music, Film & Content";
const SITE_DESCRIPTION =
  "Find producers, singers, songwriters, engineers, photographers, videographers, filmmakers and creators. Discover talent, start a Block, collaborate on projects, share files, chat and create together on WrytrsBlock.";

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: "%s | WrytrsBlock",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "creative collaboration",
    "find a producer",
    "find a songwriter",
    "find a videographer",
    "find a filmmaker",
    "music collaboration platform",
    "content creator collaboration",
    "connect with musicians",
    "connect with creators",
    "split sheet generator",
    "music industry networking",
    "WrytrsBlock",
  ],
  authors: [{ name: "WrytrsBlock", url: SITE_URL }],
  creator: "WrytrsBlock",
  publisher: "WrytrsBlock",
  applicationName: "WrytrsBlock",
  // Absolute base for OG/Twitter image URLs and relative canonical/alternate
  // URLs below — defaults to the production domain so both resolve correctly
  // even when the env var isn't set.
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
    locale: "en_US",
    siteName: "WrytrsBlock",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#07080D",
  width: "device-width",
  initialScale: 1,
  // Enable env(safe-area-inset-*) on notched devices and let the on-screen
  // keyboard resize the content area (Android Chrome) so modals adapt.
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
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

// Schema.org structured data — Organization + WebSite. sameAs is left empty
// since no official social profile URLs are configured yet; add them there
// once they exist so Google can associate this Organization with those
// profiles (Knowledge Panel eligibility).
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "WrytrsBlock",
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  sameAs: [] as string[],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "WrytrsBlock",
  url: SITE_URL,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
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
