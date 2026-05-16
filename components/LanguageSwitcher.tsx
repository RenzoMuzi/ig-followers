"use client";

import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? "es") as SupportedLanguage;

  return (
    <label className="flex items-center rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 transition-colors focus-within:border-pink-500 hover:border-pink-500 hover:text-pink-400">
      <span className="sr-only">{t("language.label")}</span>
      <select
        value={current}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="cursor-pointer bg-transparent text-inherit outline-none"
        aria-label={t("language.label")}
      >
        {SUPPORTED_LANGUAGES.map((lng) => (
          <option key={lng} value={lng} className="bg-neutral-900 text-neutral-100">
            {t(`language.${lng}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
