"use client";

import { useRef, useState } from "react";

type Props = {
  onFiles: (files: File[]) => void;
  loading: boolean;
};

export function Uploader({ onFiles, loading }: Props) {
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
      className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        dragOver ? "border-pink-500 bg-pink-500/10" : "border-neutral-700 bg-neutral-900/40"
      }`}
    >
      <p className="mb-4 text-neutral-300">
        Arrastrá acá los archivos{" "}
        <span className="font-mono text-pink-400">following.json</span> y{" "}
        <span className="font-mono text-pink-400">followers_1.json</span> que te dio Instagram
        (están dentro del ZIP, en{" "}
        <span className="font-mono text-neutral-400">connections/followers_and_following/</span>).
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-2.5 font-medium text-white shadow-lg shadow-pink-500/20 transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Procesando..." : "Seleccionar archivos"}
      </button>
      <p className="mt-4 text-xs text-neutral-500">
        Todo se procesa local en tu navegador — nada se sube a ningún servidor.
      </p>
    </div>
  );
}
