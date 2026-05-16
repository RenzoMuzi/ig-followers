"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Sincroniza el atributo `lang` del <html> con el idioma activo. Lo seteamos
  // en un effect porque el layout es SSR y el idioma detectado puede diferir.
  useEffect(() => {
    const apply = () => {
      if (typeof document !== "undefined") {
        document.documentElement.lang = i18n.resolvedLanguage ?? "es";
      }
    };
    apply();
    i18n.on("languageChanged", apply);
    return () => {
      i18n.off("languageChanged", apply);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
