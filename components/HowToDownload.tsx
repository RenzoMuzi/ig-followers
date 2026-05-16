"use client";

import { Trans, useTranslation } from "react-i18next";

export function HowToDownload() {
  const { t } = useTranslation();
  return (
    <details className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 text-sm text-neutral-300">
      <summary className="cursor-pointer font-medium text-white">
        {t("howToDownload.summary")}
      </summary>

      <div className="mt-3 rounded-lg border border-pink-500/30 bg-pink-500/5 p-3">
        <p className="text-xs uppercase tracking-wide text-pink-400">
          {t("howToDownload.shortcutLabel")}
        </p>
        <p className="mt-1">{t("howToDownload.shortcutDescription")}</p>
        <a
          href="https://accountscenter.instagram.com/info_and_permissions/dyi/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block break-all rounded-md bg-neutral-900/60 px-2.5 py-1.5 font-mono text-xs text-pink-400 underline hover:text-pink-300 sm:text-sm"
        >
          accountscenter.instagram.com/info_and_permissions/dyi/
        </a>
        <p className="mt-2 text-xs text-neutral-400">{t("howToDownload.shortcutNote")}</p>
      </div>

      <p className="mt-4 text-xs uppercase tracking-wide text-neutral-500">
        {t("howToDownload.stepByStep")}
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>{t("howToDownload.step1")}</li>
        <li>
          <Trans
            i18nKey="howToDownload.step2"
            components={[<span key="0" className="font-semibold" />]}
          />
        </li>
        <li>
          <Trans
            i18nKey="howToDownload.step3"
            components={[
              <span key="0" className="font-mono text-pink-400" />,
              <span key="1" className="font-semibold" />,
            ]}
          />
        </li>
        <li>{t("howToDownload.step4")}</li>
        <li>
          {t("howToDownload.step5")}
          <code className="mt-1 block break-all rounded-md bg-neutral-900/60 px-2.5 py-1.5 font-mono text-xs text-pink-400">
            connections/followers_and_following/
          </code>
        </li>
        <li>
          <Trans
            i18nKey="howToDownload.step6"
            components={[
              <span key="0" className="font-mono text-pink-400" />,
              <span key="1" className="font-mono text-pink-400" />,
              <span key="2" className="font-mono text-pink-400" />,
            ]}
          />
        </li>
      </ol>
    </details>
  );
}
