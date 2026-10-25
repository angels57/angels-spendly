import type { Metadata, Viewport } from "next";
import { Geist_Mono, Nunito } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MonAi",
  description: "Controla tus gastos sin esfuerzo.",
};

export const viewport: Viewport = {
  themeColor: "#f05b53",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${nunito.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
