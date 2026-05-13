import { DataApp } from "@/components/DataApp";
import { Footer } from "@/components/Footer";
import { HowToDownload } from "@/components/HowToDownload";
import { OpenSourceBanner } from "@/components/OpenSourceBanner";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-3 py-6 sm:px-4 sm:py-10">
      <DataApp
        howToDownload={<HowToDownload />}
        openSourceBanner={<OpenSourceBanner />}
      />
      <Footer />
    </main>
  );
}
