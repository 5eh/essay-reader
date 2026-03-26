import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://study.arthurlabs.net"),
  title: {
    default: "Speed Reader | Arthur Labs Inc.",
    template: "%s | Arthur Labs Inc.",
  },
  description:
    "A tool built by Arthur Labs to accelerate learning speed for static articles or documents.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Speed Reader | Arthur Labs Inc.",
    description:
      "A tool built by Arthur Labs to accelerate learning speed for static articles or documents.",
    url: "https://study.arthurlabs.net",
    siteName: "Arthur Labs Inc.",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Speed Reader | Arthur Labs Inc.",
    description:
      "A tool built by Arthur Labs to accelerate learning speed for static articles or documents.",
    creator: "@ArthurLabsDAO",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebApplication",
                  "@id": "https://study.arthurlabs.net/#application",
                  name: "Arthur Labs Speed Reader",
                  description:
                    "A web-based speed reading tool built by Arthur Labs to accelerate learning speed for static articles or documents.",
                  url: "https://study.arthurlabs.net",
                  applicationCategory: "UtilitiesApplication",
                  operatingSystem: "Any",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                  },
                  creator: {
                    "@id": "https://arthurlabs.net/#organization",
                  },
                },
                {
                  "@type": "WebSite",
                  "@id": "https://study.arthurlabs.net/#website",
                  url: "https://study.arthurlabs.net",
                  name: "Arthur Labs Speed Reader",
                  publisher: {
                    "@id": "https://arthurlabs.net/#organization",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
