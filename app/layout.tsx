import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { I18nProvider } from "@/components/I18nProvider";
import "./globals.css";

const TITLE = "IG Non-Followers — descubrí quién no te sigue de vuelta";
const DESCRIPTION =
  "Compará quién seguís y quién te sigue en Instagram usando la exportación oficial de tus datos. Todo se procesa local en tu navegador — nada se sube a un servidor.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "IG Non-Followers",
  authors: [{ name: "Renzo Muzi" }],
  keywords: [
    "instagram",
    "non-followers",
    "followers",
    "unfollow",
    "privacy-first",
    "client-side",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "es_AR",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <I18nProvider>{children}</I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
