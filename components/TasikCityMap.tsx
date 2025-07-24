/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

'use client'; 
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; 
import { LatLngExpression } from 'leaflet';
import { GeoJsonObject } from 'geojson';

interface TasikCityMapProps {
    geoJsonKecamatan: any;
    dataFaseKota: number | null;
    phaseColorMapping: (phase: number | null) => string;
    selectedMonth: string;
}

const TasikCityMap: React.FC<TasikCityMapProps> = ({
    geoJsonKecamatan,
    dataFaseKota,
    phaseColorMapping,
    selectedMonth,
}) => {
    const center: LatLngExpression = [-7.35, 108.22];

    // Proses GeoJSON Kecamatan untuk diwarnai dengan fase dominan kota
    const processedKecamatanGeoJSON = useMemo(() => {
        if (!geoJsonKecamatan || !geoJsonKecamatan.features) {
            return null;
        }

        const color = phaseColorMapping(dataFaseKota);

        const processedFeatures = geoJsonKecamatan.features.map((kecamatanFeature: any) => {
            return {
                ...kecamatanFeature,
                properties: {
                    ...kecamatanFeature.properties,
                    color: color,
                    fase: dataFaseKota,
                }
            };
        });

        return { type: 'FeatureCollection', features: processedFeatures } as GeoJsonObject;
    }, [geoJsonKecamatan, dataFaseKota, phaseColorMapping]);

    // Style untuk lapisan GeoJSON Kecamatan (batas kota)
    const styleKecamatan = (feature: any) => {
        const fillColor = feature.properties.color || '#BDBDBD';
        return {
            fillColor: fillColor,
            weight: 2,
            color: '#808080',
            fillOpacity: 0.4,
        };
    };

    const onEachKecamatan = (feature: any, layer: any) => {
        layer.bindTooltip(`Kecamatan: ${feature.properties.KECAMATAN}`, { permanent: true, direction: 'center', className: 'kecamatan-label' });

        const faseLabel = yAxisValueMap[String(feature.properties.fase)] || 'N/A';
        layer.bindPopup(`<h3>Fase Dominan Kota ${formatKsaDate(selectedMonth)}:</h3><p><strong>${faseLabel}</strong></p>`);
    };

    // Pastikan yAxisValueMap dan formatKsaDate konsisten dengan AnalysisDashboard.tsx
    const yAxisValueMap: { [key: string]: string } = { '1': 'Vegetatif 1', '2': 'Vegetatif 2', '3.1': 'Generatif 1', '3.2': 'Generatif 2', '3.3': 'Generatif 3', '4': 'Panen', '5': 'Persiapan Lahan', '13': 'Pasca Panen', '6': 'Puso', '8': 'Bukan Lahan Pertanian', '4.5': 'Pasca Panen' };

    const formatKsaDate = (header: string, short = false): string => {
        const headerStr = String(header);
        if (!/^\d{3,}$/.test(headerStr) && isNaN(parseInt(headerStr))) return header;
        try {
            const year = parseInt(headerStr.slice(-2));
            const month = parseInt(headerStr.slice(0, -2));
            const fullYear = 2000 + year;
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
            const longMonthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            if (month >= 1 && month <= 12)
                return short
                    ? `${monthNames[month - 1]} '${year}`
                    : `${longMonthNames[month - 1]} ${fullYear}`;
            return header;
        } catch (error) {
            return header;
        }
    };

    return (
        <MapContainer key={selectedMonth} center={center} zoom={11} style={{ height: '500px', width: '100%', borderRadius: '8px', zIndex: 1 }}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {processedKecamatanGeoJSON && (
                <GeoJSON
                    data={processedKecamatanGeoJSON}
                    style={styleKecamatan}
                    onEachFeature={onEachKecamatan}
                />
            )}
        </MapContainer>
    );
};

export default TasikCityMap;