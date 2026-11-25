import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "بَيْت | BAYT - شقق مفروشة جاهزة للإيجار",
  description: "المنصة الأولى المتخصصة في تأجير الشقق المفروشة في السودان مع اتصال مباشر بالمالك ونشر فوري.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-16 md:pb-0 font-sans" suppressHydrationWarning>
        <Navbar />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-4 md:py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
