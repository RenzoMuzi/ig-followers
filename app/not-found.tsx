import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-3xl font-bold text-transparent">
        404 — No encontrado
      </h1>
      <p className="mt-3 text-sm text-neutral-400">Esta página no existe.</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-pink-500/20 hover:opacity-90"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
