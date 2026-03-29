import type { Metadata } from "next";
import { Noto_Sans, Open_Sans } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-heading",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Capobianco CRM",
  description: "CRM commerciale - Capobianco Group",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${notoSans.variable} ${openSans.variable} font-body antialiased bg-gray-50 text-text`}
      >
        {children}
      </body>
    </html>
  );
}
