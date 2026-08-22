import type { Metadata } from "next";
import { Manrope, Geist_Mono, Instrument_Serif, Tilt_Warp } from "next/font/google";
import "../styles/globals.css"
import QueryProvider from "@/providers/QueryProviders";
import ToastProvider from "@/providers/ToastProvider";
import SmoothScroll from "@/animations/SmoothScroll";

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
  title: "Indonesia Tanpa Polusi",
  description: "Indonesia Tanpa Polusi",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html
    lang="en"
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
