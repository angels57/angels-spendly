import type { Metadata, Viewport } from "next";
import { Geist_Mono, Nunito } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { KeyboardInset } from "@/components/keyboard-inset";
import { OfflineBanner, ServiceWorkerRegistration } from "@/components/pwa";
import "./globals.css";
import { APP_NAME, APP_SHORT_NAME, APP_TAGLINE } from "@/lib/brand";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Las páginas solo ponen su nombre: "Movimientos · Spendly".
  title: { default: APP_NAME, template: `%s · ${APP_SHORT_NAME}` },
  description: APP_TAGLINE,
  applicationName: APP_NAME,
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  // iOS: pantalla completa al abrirla desde la pantalla de inicio.
  appleWebApp: {
    capable: true,
    title: APP_SHORT_NAME,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  // Android: el teclado encoge la página en vez de taparla, así el quick add
  // y los drawers quedan encima. En iOS se usa --keyboard-inset (KeyboardInset).
  interactiveWidget: "resizes-content",
  // Color de la barra del navegador/sistema según el tema del dispositivo.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // next-themes añade la clase "dark" antes de hidratar.
    <html
      lang="es"
      suppressHydrationWarning
      className={`${nunito.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <OfflineBanner />
          {children}
          {/* Arriba: abajo taparía el quick add en el celular. */}
          <Toaster position="top-center" />
          <ServiceWorkerRegistration />
          <KeyboardInset />
        </ThemeProvider>
      </body>
    </html>
  );
}
