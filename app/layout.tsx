import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/app/components/ThemeProvider";

// Add the Adani font
const adani = localFont({
  src: "../public/adani.ttf",
  variable: "--font-adani",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Adani Excel Data Management",
  description: "Manage energy data with Excel export functionality",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${adani.variable} antialiased h-full font-sans`}
        style={{ fontFamily: 'var(--font-adani)' }}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}