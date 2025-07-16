/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/TasikMap.tsx
'use client'
import React from 'react';
import { MapContainer, TileLayer, GeoJSON, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngExpression } from 'leaflet';

interface TasikMapProps {
  geoJsonData: any;
  data: any[];
  selectedMonth: string;
  phaseColorMapping: (phase: number | null) => string;
  phaseNameMapping: { [key: string]: string };
}

const TasikMap: React.FC<TasikMapProps> = ({ geoJsonData, data, selectedMonth, phaseColorMapping, phaseNameMapping }) => {
  const center: LatLngExpression = [-7.35, 108.22]; // Center of Tasikmalaya

  const styleFeature = (feature: any) => {
    const kecamatanName = feature.properties.KECAMATAN;
    const kecamatanData = data.find(d => d.kecamatan === kecamatanName);
    const phase = kecamatanData ? kecamatanData[selectedMonth] : null;
    const color = phaseColorMapping(phase);

    return {
      fillColor: color,
      weight: 1.5,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.8
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const kecamatanName = feature.properties.KECAMATAN;
    const kecamatanData = data.find(d => d.kecamatan === kecamatanName);
    const phaseValue = kecamatanData ? kecamatanData[selectedMonth] : null;
    const phaseName = phaseValue ? phaseNameMapping[String(phaseValue)] || 'Data tidak tersedia' : 'Data tidak tersedia';
    
    layer.bindTooltip(`
      <div>
        <strong>${kecamatanName}</strong>
        <br/>
        Fase: ${phaseName}
      </div>
    `);
  };

  return (
    // FIX: Ditambahkan zIndex: 1 untuk memastikan dropdown tidak tertindih peta
    <MapContainer center={center} zoom={12} style={{ height: '500px', width: '100%', borderRadius: '8px', zIndex: 1 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Gunakan key untuk memaksa re-render GeoJSON saat bulan berubah */}
      <GeoJSON 
        key={selectedMonth} 
        data={geoJsonData} 
        style={styleFeature} 
        onEachFeature={onEachFeature} 
      />
    </MapContainer>
  );
};

export default TasikMap;