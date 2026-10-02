import type { Metadata } from "next";
import { Manrope, Geist_Mono, Instrument_Serif, Tilt_Warp } from "next/font/google";
import "../styles/globals.css"
import QueryProvider from "@/providers/QueryProviders";
import ToastProvider from "@/providers/ToastProvider";
import SmoothScroll from "@/animations/SmoothScroll";
import { getRequestLocale } from "@/libs/localeHeader";
import { SITE_NAME, SITE_URL } from "@/libs/siteUrl";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  subsets: ["latin"],
});

const tiltWarp = Tilt_Warp({
  variable: "--font-tilt-warp",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Lets relative URLs in page metadata (canonical, share images) become absolute.
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_NAME,
};

// proxy.ts forwards the URL's locale in a request header, so marketing pages get
// <html lang="id|en"> (everything else — login, admin — stays "en").
const RootLayout = async ({ children }: { children: React.ReactNode }) => (
  <html
    lang={await getRequestLocale()}
    suppressHydrationWarning
    className={`${manrope.variable} ${geistMono.variable} ${instrumentSerif.variable} ${tiltWarp.variable} h-full antialiased`}
  >
    <body className="min-h-full flex flex-col">
      <QueryProvider>
        <SmoothScroll>
          {children}
        </SmoothScroll>
        <ToastProvider />
      </QueryProvider>
    </body>
  </html>
)

export default RootLayout
