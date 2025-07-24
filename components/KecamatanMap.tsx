/* eslint-disable @typescript-eslint/no-explicit-any */

'use client'; 

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Import CSS Leaflet di sini
import { LatLngExpression } from 'leaflet';
import * as turf from '@turf/turf';
import { GeoJsonObject } from 'geojson';

interface KecamatanMapProps {
    geoJsonKecamatan: any;
    geoJsonSawah: any;
    dataFase: any[];
    selectedMonth: string;
    phaseColorMapping: (phase: number | null) => string;
}

const KecamatanMap: React.FC<KecamatanMapProps> = ({ geoJsonKecamatan, geoJsonSawah, dataFase, selectedMonth, phaseColorMapping }) => {
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
                if (kecamatanFeature.properties && kecamatanFeature.properties.KECAMATAN && turf.booleanPointInPolygon(pointInSawah, kecamatanFeature)) {
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

        return { type: 'FeatureCollection', features: processedFeatures } as GeoJsonObject;

    }, [geoJsonSawah, geoJsonKecamatan, faseLookup, phaseColorMapping]);

    // Style untuk lapisan GeoJSON Sawah
    const styleSawah = (feature: any) => {
        const defaultFillColor = feature.properties.color || '#808080';
        let fillOpacity = 0.8;

        if (feature.properties.kecamatan === 'Kawalu' || feature.properties.kecamatan === 'Tamansari') {
            fillOpacity = 0.4;
        }

        return {
            fillColor: defaultFillColor,
            weight: 0.5,
            color: 'white',
            fillOpacity: fillOpacity
        };
    };

    // Style untuk lapisan GeoJSON Kecamatan (batas saja, tidak diisi warna fase)
    const styleKecamatanBoundary = () => {
        return {
            fillColor: 'transparent',
            weight: 2,
            color: '#808080',
            fillOpacity: 0
        };
    };


    const onEachSawah = (feature: any, layer: any) => {
        const { kecamatan, fase } = feature.properties;
        layer.bindTooltip(`Kecamatan: ${kecamatan}<br/>Fase: ${yAxisValueMap[String(fase)] || 'N/A'}`);
    };

    const onEachKecamatanBoundary = (feature: any, layer: any) => {
        layer.bindTooltip(feature.properties.KECAMATAN, { permanent: true, direction: 'center', className: 'kecamatan-label' });
    };

    // Pastikan yAxisValueMap ini konsisten dengan yang ada di AnalysisDashboard.tsx
    const yAxisValueMap: { [key: string]: string } = { '1': 'Vegetatif 1', '2': 'Vegetatif 2', '3.1': 'Generatif 1', '3.2': 'Generatif 2', '3.3': 'Generatif 3', '4': 'Panen', '5': 'Persiapan Lahan', '13': 'Pasca Panen', '6': 'Puso', '8': 'Bukan Sawah', '4.5': 'Pasca Panen' };


    return (
        <MapContainer center={center} zoom={12} style={{ height: '500px', width: '100%', borderRadius: '8px', zIndex: 1 }}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Lapisan GeoJSON Kecamatan (hanya batas) */}
            {geoJsonKecamatan && (
                <GeoJSON
                    data={geoJsonKecamatan}
                    style={styleKecamatanBoundary}
                    onEachFeature={onEachKecamatanBoundary}
                />
            )}

            {/* Lapisan GeoJSON Sawah (digambar di atas kecamatan untuk interaktivitas) */}
            {processedSawahGeoJSON && (
                <GeoJSON
                    key={selectedMonth}
                    data={processedSawahGeoJSON}
                    style={styleSawah}
                    onEachFeature={onEachSawah}
                />
            )}
        </MapContainer>
    );
};

export default KecamatanMap;