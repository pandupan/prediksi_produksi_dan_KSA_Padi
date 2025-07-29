import Hero2 from '@/components/pages/landing-page/Hero-2'
import AnalysisDashboard from '@/components/pages/visual-page/AnalysisDashboard'
import React from 'react'

const page = () => {
  return (
    <>
      <Hero2
        heading="Menyediakan data hasil KSA untuk perhitungan prediksi hasil panen padi secara akurat."
        message='"Menyediakan data pertanian yang lebih baik untuk kesejahteraan petani"'
      />
      <AnalysisDashboard/>
    </>
  )
}

export default page
