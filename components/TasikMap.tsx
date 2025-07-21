/* eslint-disable @typescript-eslint/no-explicit-any */

'use client'
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngExpression } from 'leaflet';
import * as turf from '@turf/turf';
import { GeoJsonObject } from 'geojson'; // Import GeoJsonObject untuk tipe yang benar

interface TasikMapProps {
  geoJsonKecamatan: any;
  geoJsonSawah: any;
  dataFase: any[];
  selectedMonth: string;
  phaseColorMapping: (phase: number | null) => string;
}

const TasikMap: React.FC<TasikMapProps> = ({ geoJsonKecamatan, geoJsonSawah, dataFase, selectedMonth, phaseColorMapping }) => {
  const center: LatLngExpression = [-7.35, 108.22];

  // Memoize data fase untuk pencarian yang lebih cepat
  const faseLookup = useMemo(() => {
    const lookup = new Map();
    dataFase.forEach(d => {
      lookup.set(d.kecamatan, d[selectedMonth]);
    });
    return lookup;
  }, [dataFase, selectedMonth]);

  // Proses penggabungan data sawah dengan fase
  const processedSawahGeoJSON = useMemo(() => {
    if (!geoJsonSawah || !geoJsonSawah.features || faseLookup.size === 0) {
      return null;
    }

    const processedFeatures = geoJsonSawah.features.map((sawahFeature: any) => {
      const pointInSawah = turf.pointOnFeature(sawahFeature);
      let kecamatanName = 'Tidak Diketahui';

      for (const kecamatanFeature of geoJsonKecamatan.features) {
        if (turf.booleanPointInPolygon(pointInSawah, kecamatanFeature)) {
          kecamatanName = kecamatanFeature.properties.KECAMATAN;
          break;
        }
      }

      const fase = faseLookup.get(kecamatanName);
      const color = phaseColorMapping(fase ?? null);
      
      return {
        ...sawahFeature,
        properties: {
          ...sawahFeature.properties,
          kecamatan: kecamatanName,
          fase: fase,
          color: color,
        }
      };
    });

    // Perbaikan error GeoJsonObject: tambahkan type assertion
    return { type: 'FeatureCollection', features: processedFeatures } as GeoJsonObject;

  }, [geoJsonSawah, geoJsonKecamatan, faseLookup, phaseColorMapping]);

  // Proses penggabungan data kecamatan dengan fase dominan
  const processedKecamatanGeoJSON = useMemo(() => {
    if (!geoJsonKecamatan || !geoJsonKecamatan.features || faseLookup.size === 0) {
      return null;
    }

    const processedFeatures = geoJsonKecamatan.features.map((kecamatanFeature: any) => {
      const kecamatanName = kecamatanFeature.properties.KECAMATAN;
      const fase = faseLookup.get(kecamatanName);
      const color = phaseColorMapping(fase ?? null);

      return {
        ...kecamatanFeature,
        properties: {
          ...kecamatanFeature.properties,
          fase: fase,
          color: color,
        }
      };
    });

    return { type: 'FeatureCollection', features: processedFeatures } as GeoJsonObject;

  }, [geoJsonKecamatan, faseLookup, phaseColorMapping]);


  // Style untuk lapisan GeoJSON Sawah
  const styleSawah = (feature: any) => {
    const defaultFillColor = feature.properties.color || '#808080';
    let fillOpacity = 0.8; // Default opacity for sawah

    // Sesuaikan opacity untuk sawah di Kawalu dan Tamansari
    // Transparansi sawah di Kawalu/Tamansari tetap diatur di sini
    if (feature.properties.kecamatan === 'Kawalu' || feature.properties.kecamatan === 'Tamansari') {
      fillOpacity = 0.4; 
    }

    return {
      fillColor: defaultFillColor,
      weight: 0.5,
      color: 'white', // Warna border untuk petak sawah individual
      fillOpacity: fillOpacity
    };
  };

  // Style untuk lapisan GeoJSON Kecamatan (batas kota)
  const styleKecamatan = (feature: any) => {
    const defaultFillColor = feature.properties.color || '#BDBDBD'; // Warna isian diambil dari fase dominan kecamatan
    let fillOpacity = 0.1; // Opacity default untuk isian kecamatan, sangat transparan

    // Untuk Kawalu dan Tamansari, mungkin bisa dibuat sedikit lebih transparan lagi jika diinginkan
    if (feature.properties.KECAMATAN === 'Kawalu' || feature.properties.KECAMATAN === 'Tamansari') {
      fillOpacity = 0.05; // Sangat, sangat transparan
    }

    return {
      fillColor: defaultFillColor, // Warna isian kecamatan sesuai fase dominan
      weight: 2, // Ketebalan garis batas kecamatan
      color: '#808080', // Warna garis batas kecamatan (abu-abu)
      fillOpacity: fillOpacity // Opacity untuk isian kecamatan
    };
  };

  const onEachSawah = (feature: any, layer: any) => {
    const { kecamatan, fase } = feature.properties;
    layer.bindTooltip(`Kecamatan: ${kecamatan}<br/>Fase: ${yAxisValueMap[String(fase)] || 'N/A'}`);
  };

  const onEachKecamatan = (feature: any, layer: any) => {
      layer.bindTooltip(feature.properties.KECAMATAN, { permanent: true, direction: 'center', className: 'kecamatan-label' });
  };

  // Pastikan yAxisValueMap ini konsisten dengan yang ada di InputFile.tsx
  const yAxisValueMap: { [key: string]: string } = { '1': 'Vegetatif 1', '2': 'Vegetatif 2', '3.1': 'Generatif 1', '3.2': 'Generatif 2', '3.3': 'Generatif 3', '4': 'Panen', '5': 'Persiapan Lahan', '13': 'Pasca Panen', '6': 'Puso', '8': 'Bukan Lahan Pertanian' };


  return (
    <MapContainer center={center} zoom={12} style={{ height: '500px', width: '100%', borderRadius: '8px', zIndex: 1 }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {/* Lapisan GeoJSON Kecamatan (digambar di bawah sawah) */}
      {processedKecamatanGeoJSON && ( // Pastikan data kecamatan sudah diproses
        <GeoJSON  
          data={processedKecamatanGeoJSON}  
          style={styleKecamatan} // Gunakan fungsi styleKecamatan
          onEachFeature={onEachKecamatan} // Gunakan onEachKecamatan untuk tooltip/label kecamatan
        />
      )}

      {/* Lapisan GeoJSON Sawah (digambar di atas kecamatan untuk interaktivitas) */}
      {processedSawahGeoJSON && (
        <GeoJSON 
          key={selectedMonth} // Key ini penting untuk force re-render saat bulan berubah
          data={processedSawahGeoJSON} 
          style={styleSawah}
          onEachFeature={onEachSawah} // Tooltip sawah tetap aktif
        />
      )}
    </MapContainer>
  );
};

export default TasikMap;