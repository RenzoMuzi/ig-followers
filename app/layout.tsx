import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IG Non-Followers",
  description: "Encuentra quién no te sigue de vuelta en Instagram",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
