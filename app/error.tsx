"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-3xl font-bold text-transparent">
        Algo salió mal
      </h1>
      <p className="mt-3 text-sm text-neutral-400">
        Ocurrió un error inesperado en la app. Si vuelve a pasar, podés{" "}
        <a
          href="https://github.com/RenzoMuzi/ig-followers/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-400 underline hover:text-pink-300"
        >
          reportarlo en GitHub
        </a>
        .
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-pink-500/20 hover:opacity-90"
      >
        Reintentar
      </button>
    </main>
  );
}
