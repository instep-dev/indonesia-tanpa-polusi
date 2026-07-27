import type { Metadata } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import "../styles/globals.css"
import QueryProvider from "@/providers/QueryProviders";
import ThemeProvider from "@/providers/ThemeProvider";
import ThemeToggle from "@/components/reusable/ThemeToggle";
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

export const metadata: Metadata = {
  title: "Indonesia Tanpa Polusi",
  description: "Indonesia Tanpa Polusi",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html
    lang="en"
    suppressHydrationWarning
    className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}
  >
    <body className="min-h-full flex flex-col">
      <ThemeProvider>
        <QueryProvider>
          <SmoothScroll>
            <ThemeToggle/>
            {children}
          </SmoothScroll>
          <ToastProvider />
        </QueryProvider>
      </ThemeProvider>
    </body>
  </html>
)

export default RootLayout
