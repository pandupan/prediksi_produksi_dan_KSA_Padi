# 🌾 Prediksi Produksi dan KSA Padi — Tasikmalaya

Platform interaktif untuk **visualisasi data** dan **prediksi produksi padi** serta analisis **Ketahanan Sosial Area (KSA)** di Kabupaten Tasikmalaya. Dibangun menggunakan Next.js dengan peta interaktif Leaflet.

## ✨ Fitur

- **Dashboard Prediksi** — Prediksi produksi padi berdasarkan data historis
- **Visualisasi KSA** — Analisis ketahanan sosial area dengan grafik interaktif
- **Peta Interaktif** — Visualisasi spasial kecamatan di Tasikmalaya menggunakan Leaflet
- **Perbandingan Data** — Fitur perbandingan antar periode/lokasi
- **Informasi Algoritma** — Penjelasan metode yang digunakan dalam prediksi

## 🛠️ Tech Stack

- **Next.js** — React framework (App Router)
- **TypeScript** — Type safety
- **Tailwind CSS** — Styling
- **shadcn/ui** — UI components
- **Leaflet / react-leaflet** — Peta interaktif
- **Framer Motion** — Animasi
- **Recharts / Chart** — Visualisasi grafik
- **Turf.js** — Analisis geospasial

## 🚀 Cara Menjalankan

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📁 Struktur Proyek

```
├── app/                     # Next.js App Router pages
│   ├── compare/             # Halaman perbandingan
│   ├── prediction/          # Halaman prediksi produksi
│   └── visualisasi-ksa/     # Halaman visualisasi KSA
├── components/
│   ├── layout/              # Header & Footer
│   ├── pages/               # Komponen halaman
│   │   ├── landing-page/    # Hero, About, Benefits, Algoritma
│   │   ├── prediction-page/ # Form input file
│   │   └── visual-page/     # Dashboard analisis
│   └── ui/                  # Komponen UI (shadcn)
├── data/                    # Dataset JSON
│   ├── data_harga_beras.json
│   ├── data_luas_panen.json
│   └── dataset_ksa_2024-2025.json
└── lib/                     # Utility & GeoJSON
```

## 📊 Dataset

Proyek ini menggunakan data produksi padi dan KSA dari Kabupaten Tasikmalaya yang disimpan dalam format JSON di folder `data/`.

## 📄 Lisensi

MIT License

---

> Dibuat oleh [Pandu Pangestu](https://github.com/pandupan) — Proyek internship BPS Tasikmalaya
