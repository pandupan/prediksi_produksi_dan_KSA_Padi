import Hero from "@/components/pages/landing-page/Hero";
import InputFile from "@/components/pages/prediction-page/input-file";
import React from "react";

const Prediction = () => {
  return (
    <>
      <Hero
        heading="Menyediakan hasil dari KSA untuk perhitungan akurat dan prediksi hasil panen padi, mendukung petani dan pengambilan keputusan yang lebih baik di Tasikmalaya."
        message='"Mewujudkan Analytic Data Pangan Presisi & Kredibel bersama Lumbung Nusa"'
      />
      <InputFile />
    </>
  );
};

export default Prediction;
