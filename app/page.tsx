import AboutKsa from "@/components/pages/landing-page/AboutKsa";
import Benefits from "@/components/pages/landing-page/Benefits";
import Hero from "@/components/pages/landing-page/Hero";

export default function Home() {
  return (
    <main>
      <Hero
        heading="Menyediakan data hasil KSA untuk perhitungan prediksi hasil panen padi secara akurat."
        message='"Menyediakan data pertanian yang lebih baik untuk kesejahteraan petani"'
      />
      <AboutKsa />
      <Benefits />
    </main>
  );
}
