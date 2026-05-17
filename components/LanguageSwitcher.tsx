"use client";

import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? "es") as SupportedLanguage;

  return (
    <label className="relative flex items-center rounded-lg border border-neutral-700 pl-3 pr-7 py-1.5 text-sm text-neutral-200 transition-colors focus-within:border-pink-500 hover:border-pink-500 hover:text-pink-400">
      <span className="sr-only">{t("language.label")}</span>
      <select
        value={current}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        // appearance-none corta el padding/arrow nativo del select (que en mobile
        // hace que la altura del control no coincida con la del wrapper).
        className="cursor-pointer appearance-none bg-transparent text-inherit outline-none"
        aria-label={t("language.label")}
      >
        {SUPPORTED_LANGUAGES.map((lng) => (
          <option key={lng} value={lng} className="bg-neutral-900 text-neutral-100">
            {t(`language.${lng}`)}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-2 h-3 w-3"
      >
        <path
          d="M3 4.5l3 3 3-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </label>
  );
}
