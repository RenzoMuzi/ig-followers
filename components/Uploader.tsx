"use client";

import { useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

type Props = {
  onFiles: (files: File[]) => void;
  loading: boolean;
};

export function Uploader({ onFiles, loading }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    onFiles(Array.from(fileList));
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors sm:p-8 ${
        dragOver ? "border-pink-500 bg-pink-500/10" : "border-neutral-700 bg-neutral-900/40"
      }`}
    >
      <p className="mb-3 text-neutral-300">
        <Trans
          i18nKey="uploader.description"
          components={[
            <span key="0" className="font-mono text-pink-400" />,
            <span key="1" className="font-mono text-pink-400" />,
            <span key="2" className="font-mono text-pink-400" />,
            <span key="3" className="font-mono text-pink-400" />,
          ]}
        />
      </p>
      <p className="mb-4 text-xs text-neutral-500">{t("uploader.zipNote")}</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".json,application/json,.zip,application/zip,application/x-zip-compressed"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-2.5 font-medium text-white shadow-lg shadow-pink-500/20 transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? t("uploader.processing") : t("uploader.selectButton")}
      </button>
      <p className="mt-4 text-xs text-neutral-500">{t("uploader.localNote")}</p>
    </div>
  );
}
