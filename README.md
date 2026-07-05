# Prediksi Produksi & KSA Padi 🌾

> **Aplikasi prediksi hasil panen padi dan analisis KSA (Kerangka Sampel Area) untuk Kabupaten Tasikmalaya**

Proyek ini adalah aplikasi berbasis Next.js yang menyajikan data dan visualisasi **Kerangka Sampel Area (KSA)** untuk memprediksi hasil produksi padi di Kabupaten Tasikmalaya. Menggabungkan data statistik pertanian dengan analisis spasial interaktif menggunakan peta Leaflet.

---

## ✨ Fitur Utama

- **Prediksi Produksi Padi** — Estimasi hasil panen berdasarkan data historis
- **Visualisasi KSA Interaktif** — Peta sebaran titik KSA di Tasikmalaya dengan Leaflet
- **Perbandingan Data** — Analisis komparatif data produksi antar wilayah/kecamatan
- **Metode KSA** — Informasi tentang metodologi Kerangka Sampel Area
- **Siklus Tumbuh Padi** — Edukasi fase pertumbuhan padi
- **Data Real-time** — Dataset JSON harga beras, luas panen, dan data KSA 2024-2025
- **Animasi Halus** — Transisi dan animasi dengan Framer Motion
- **Peta Interaktif** — GeoJSON Kecamatan Tasikmalaya dengan informasi detail

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Bahasa:** TypeScript
- **UI:** Tailwind CSS 4, Radix UI, Headless UI
- **Animasi:** Framer Motion
- **Peta:** Leaflet + React-Leaflet + Turf.js
- **Grafik:** Recharts
- **Data:** XLSX (pengolahan file Excel)
- **Statistik:** regression (analisis regresi)

---

## 🚀 Cara Install & Jalankan

### Prasyarat
- Node.js 18+
- npm atau yarn

### Langkah
```bash
# Clone repositori
git clone https://github.com/pandupan/prediksi_produksi_dan_KSA_Padi.git
cd prediksi_produksi_dan_KSA_Padi

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 📁 Struktur Folder

```
prediksi_produksi_dan_KSA_Padi/
├── app/
│   ├── page.tsx              # Halaman utama (Hero, About KSA, Metode)
│   ├── prediction/
│   │   └── page.tsx          # Halaman prediksi produksi
│   ├── visualisasi-ksa/
│   │   └── page.tsx          # Visualisasi peta KSA
│   └── compare/
│       └── page.tsx          # Perbandingan data
├── components/
│   ├── layout/
│   │   ├── Header.tsx        # Navigasi
│   │   └── Footer.tsx
│   ├── pages/
│   │   ├── landing-page/     # Komponen halaman utama
│   │   ├── prediction-page/  # Komponen prediksi
│   │   ├── compare-page/     # Komponen perbandingan
│   │   └── visual-page/      # Komponen visualisasi
│   ├── KecamatanMap.tsx      # Peta kecamatan
│   ├── TasikCityMap.tsx      # Peta kota Tasikmalaya
│   └── ui/                   # Komponen UI (shadcn)
├── data/
│   ├── data_harga_beras.json      # Data harga beras
│   ├── data_luas_panen.json       # Data luas panen
│   └── dataset_ksa_2024-2025.json # Dataset KSA
├── lib/
│   ├── bpn-sawah-geojson.ts
│   ├── tasikmalaya-geojson.ts
│   └── utils.tsx
├── public/
└── package.json
```

## 📄 Lisensi

**MIT License**

---

> Dibuat oleh [Pandu Pangestu](https://github.com/pandupan) — Data dan analisis untuk mendukung sektor pertanian di Kabupaten Tasikmalaya.
