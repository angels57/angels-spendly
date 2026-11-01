import type { Metadata, Viewport } from "next";
import { Geist_Mono, Nunito } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { KeyboardInset } from "@/components/keyboard-inset";
import { OfflineBanner, ServiceWorkerRegistration } from "@/components/pwa";
import "../globals.css";
import { APP_NAME, APP_SHORT_NAME } from "@/lib/brand";
import { LOCALES } from "@/i18n/config";
import { I18nProvider } from "@/i18n/provider";
import { getDictionary, getLocale } from "@/i18n/server";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    // Las páginas solo ponen su nombre: "Movimientos · Spendly".
    title: { default: APP_NAME, template: `%s · ${APP_SHORT_NAME}` },
    description: t.meta.tagline,
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
}

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

// Con cacheComponents cada parámetro raíz necesita al menos un valor: así
// las páginas se pre-renderizan por idioma. Otro valor (/fr/…) da 404.
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  return (
    // next-themes añade la clase "dark" antes de hidratar.
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${nunito.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <I18nProvider locale={locale}>
            <OfflineBanner />
            {children}
            {/* Arriba: abajo taparía el quick add en el celular. */}
            <Toaster position="top-center" />
            <ServiceWorkerRegistration />
            <KeyboardInset />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
