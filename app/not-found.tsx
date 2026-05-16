"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-3xl font-bold text-transparent">
        {t("notFound.title")}
      </h1>
      <p className="mt-3 text-sm text-neutral-400">{t("notFound.body")}</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-pink-500/20 hover:opacity-90"
      >
        {t("notFound.back")}
      </Link>
    </main>
  );
}
