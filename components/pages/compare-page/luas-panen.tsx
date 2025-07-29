/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from 'react';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Label
} from 'recharts';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Impor data JSON
import rawLuasPanenData from '@/data/data_luas_panen.json';

// --- Tipe Data dan Helper Functions ---
interface GenericDataItem { [key: string]: any; }
interface ProcessedChartData {
    bulan: string;
    bulanFormatted: string;
    luas_panen?: number;
    prediksi_luas_panen?: number;
    fase?: number;
    nama_fase?: string;
}

const yAxisValueMap: { [key: string]: string } = {
  "1": "Vegetatif 1", "2": "Vegetatif 2", "3.1": "Generatif 1",
  "3.2": "Generatif 2", "3.3": "Generatif 3", "4": "Panen",
  "5": "Persiapan Lahan",
};

const getPhaseColor = (phase: number | undefined): string => {
    if (phase === undefined) return "transparent";
    const colors: { [key: string]: string } = {
        "5": "#A16D28", "1": "#3E5F44", "2": "#5E936C",
        "3.1": "#93DA97", "3.2": "#B5E8B8", "3.3": "#DAF5DB", "4": "#FED16A",
    };
    return colors[String(phase)] || "#B0BEC5";
};

const formatHektare = (value: number | undefined) => {
    if (value === null || value === undefined) return "";
    return `${new Intl.NumberFormat('id-ID').format(value)} Ha`;
};

const getModus = (arr: any[]): any => {
    if (!arr.length) return null;
    const freqMap: { [key: string]: number } = {};
    let maxFreq = 0; let modus: any = null;
    arr.forEach((item) => {
        const key = String(item);
        freqMap[key] = (freqMap[key] || 0) + 1;
        if (freqMap[key] > maxFreq) { maxFreq = freqMap[key]; modus = item; }
    });
    const numericModus = parseFloat(modus);
    return isNaN(numericModus) ? modus : numericModus;
};

// --- Tooltip Kustom untuk Data Gabungan ---
const CustomCombinedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const entry = payload[0].payload;
        return (
            <div className="p-4 bg-background border rounded-lg shadow-lg text-sm">
                <p className="font-bold text-base mb-2">{entry.bulanFormatted}</p>
                {entry.luas_panen !== undefined && <p style={{ color: '#0077B6' }}>Luas Panen: {formatHektare(entry.luas_panen)}</p>}
                {entry.prediksi_luas_panen !== undefined && <p style={{ color: '#FDB833' }}>Prediksi Luas Panen: {formatHektare(entry.prediksi_luas_panen)}</p>}
                {entry.nama_fase && entry.nama_fase !== "Data Kosong" && (
                    <p className="mt-2 pt-2 border-t font-semibold flex items-center">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getPhaseColor(entry.fase) }}></span>
                        Fase Dominan: {entry.nama_fase}
                    </p>
                )}
            </div>
        );
    }
    return null;
};


// --- Komponen Utama ---
const LuasPanen = () => {
    const [chartData, setChartData] = useState<ProcessedChartData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDataAndProcess = async () => {
            setIsLoading(true);
            try {
                // 1. Proses Data KSA (Fase Tanam)
                const phaseCycle = [5.0, 1.0, 2.0, 3.1, 3.2, 3.3, 4.0];
                const ksaUrl = "https://raw.githubusercontent.com/pandupan/material_source_magang_bps_tasikmalaya/main/dataset_ksa_tasik_2025_v9.xlsx";
                const response = await fetch(ksaUrl);
                const buffer = await response.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: "buffer" });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const ksaJsonData: GenericDataItem[] = XLSX.utils.sheet_to_json(worksheet);
                
                const monthlyCityPhase: { [key: string]: number } = {};
                const monthsData: { [key: string]: number[] } = {};
                ksaJsonData.forEach(row => {
                    Object.keys(row).forEach(key => {
                        const monthMatch = key.match(/^(\d{1,2})(\d{2})$/);
                        if (monthMatch) {
                            const monthKey = `20${monthMatch[2]}-${monthMatch[1].padStart(2, '0')}`;
                            if (!monthsData[monthKey]) monthsData[monthKey] = [];
                            let phase = parseFloat(row[key]);
                            if (phase === 13) phase = 5;
                            if (phaseCycle.includes(phase)) monthsData[monthKey].push(phase);
                        }
                    });
                });
                Object.keys(monthsData).forEach(month => { monthlyCityPhase[month] = getModus(monthsData[month]); });

                const luasPanenData: { bulan: string; luas_panen: number }[] = [];
                const dataRow = rawLuasPanenData[1];
                const years = ['2021', '2022', '2023', '2024'];
                years.forEach((year, yearIndex) => {
                    const monthKeys = [year, ...Array.from({ length: 11 }, (_, i) => `__EMPTY_${1 + i + (yearIndex * 12)}`)];
                    monthKeys.forEach((key, monthIndex) => {
                        const monthStr = String(monthIndex + 1).padStart(2, '0');
                        const dataKey = `${year}-${monthStr}`;
                        const value = (dataRow as any)[key];
                        if (typeof value === 'number') luasPanenData.push({ bulan: dataKey, luas_panen: value });
                    });
                });

                const allMonths = new Set([...Object.keys(monthlyCityPhase), ...luasPanenData.map(d => d.bulan)]);
                let combinedHistoricalData: ProcessedChartData[] = Array.from(allMonths).map(month => {
                    const fase = monthlyCityPhase[month];
                    const panen = luasPanenData.find(d => d.bulan === month);
                    const monthDate = new Date(month + '-02');
                    return {
                        bulan: month,
                        bulanFormatted: monthDate.toLocaleDateString('id', { month: 'short', year: '2-digit' }),
                        luas_panen: panen?.luas_panen,
                        fase: fase,
                        nama_fase: fase ? yAxisValueMap[String(fase)] : "Data Kosong",
                    };
                }).sort((a, b) => a.bulan.localeCompare(b.bulan));

                // 4. PREDIKSI DENGAN METODE MUSIMAN (SEASONAL)
                const historicalPanenMap = new Map(combinedHistoricalData.map(d => [d.bulan, d.luas_panen]));
                const predictions: number[] = [];
                const lastHistoricalDate = new Date(combinedHistoricalData[combinedHistoricalData.length - 1].bulan + '-02');

                for (let i = 1; i <= 7; i++) {
                    const targetDate = new Date(lastHistoricalDate.getFullYear(), lastHistoricalDate.getMonth() + i, 2);
                    const lastYearDate = new Date(targetDate.getFullYear() - 1, targetDate.getMonth(), 2);
                    const lastYearMonthKey = lastYearDate.toISOString().substring(0, 7);
                    
                    const seasonalBase = historicalPanenMap.get(lastYearMonthKey) || 0;
                    
                    const recentData = combinedHistoricalData.slice(-12).map(d=>d.luas_panen || 0);
                    const trend = (recentData.slice(-6).reduce((a, b) => a + b, 0) / 6) - (recentData.slice(0, 6).reduce((a, b) => a + b, 0) / 6);

                    let nextValue = seasonalBase + (trend / 6); // Rata-rata tren bulanan
                    predictions.push(Math.max(0, nextValue));
                }

                // 5. Prediksi Fase Tanam
                const lastValidPhaseEntry = [...combinedHistoricalData].reverse().find(d => d.fase && phaseCycle.includes(d.fase));
                const lastKnownPhase = lastValidPhaseEntry?.fase || 5.0;
                let lastPhaseIndexInCycle = phaseCycle.indexOf(lastKnownPhase);

                const futureData = predictions.map((luas, i) => {
                    const futureDate = new Date(lastHistoricalDate.getFullYear(), lastHistoricalDate.getMonth() + i + 1, 2);
                    const month = futureDate.toISOString().substring(0, 7);
                    
                    lastPhaseIndexInCycle = (lastPhaseIndexInCycle + 1) % phaseCycle.length;
                    const futurePhase = phaseCycle[lastPhaseIndexInCycle];
                    
                    return {
                        bulan: month,
                        bulanFormatted: futureDate.toLocaleDateString('id', { month: 'short', year: '2-digit' }),
                        prediksi_luas_panen: luas,
                        fase: futurePhase,
                        nama_fase: yAxisValueMap[String(futurePhase)],
                    };
                });
                
                const lastHistoricalWithData = combinedHistoricalData.slice().reverse().find(d => d.luas_panen !== undefined);
                if (lastHistoricalWithData) {
                    lastHistoricalWithData.prediksi_luas_panen = lastHistoricalWithData.luas_panen;
                }
               
                const fullChartData = [...combinedHistoricalData, ...futureData];
                const displayData = fullChartData.filter(d => new Date(d.bulan) >= new Date('2024-01'));
                setChartData(displayData);

            } catch (error) {
                console.error("Gagal memproses data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDataAndProcess();
    }, []);

    return (
        <section className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
             {isLoading ? (
                <div className="flex items-center justify-center h-[700px] w-full">
                    <Loader2 className="w-8 h-8 animate-spin mr-2" />
                    <span>Memuat Data Perbandingan...</span>
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Analisis Fase Tanam Padi dan Realisasi Luas Panen</CardTitle>
                        <CardDescription>
                            Perbandingan antara fase tanam dominan (KSA) dengan luas panen (Hektare) di Tasikmalaya, beserta prediksi luas panen 12 bulan ke depan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-8 pb-4 border-b flex flex-wrap justify-center gap-y-4 gap-x-6 md:gap-x-10 text-xs md:text-sm">
                            <div className="space-y-3">
                                <div className="flex items-center"><span className="w-8 h-4 mr-2 rounded-sm" style={{ backgroundColor: '#A16D28' }}></span><span>Persiapan Lahan</span></div>
                                <div className="flex items-center"><span className="w-8 h-4 mr-2 rounded-sm" style={{ backgroundColor: '#3E5F44' }}></span><span>Vegetatif 1</span></div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center"><span className="w-8 h-4 mr-2 rounded-sm" style={{ backgroundColor: '#5E936C' }}></span><span>Vegetatif 2</span></div>
                                <div className="flex items-center"><span className="w-8 h-4 mr-2 rounded-sm" style={{ backgroundColor: '#93DA97' }}></span><span>Generatif 1</span></div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center"><span className="w-8 h-4 mr-2 rounded-sm" style={{ backgroundColor: '#B5E8B8' }}></span><span>Generatif 2</span></div>
                                <div className="flex items-center"><span className="w-8 h-4 mr-2 rounded-sm" style={{ backgroundColor: '#DAF5DB' }}></span><span>Generatif 3</span></div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center"><span className="w-8 h-4 mr-2 rounded-sm" style={{ backgroundColor: '#FED16A' }}></span><span>Panen</span></div>
                                <div className="flex items-center"><div className="w-8 h-1 mr-2 bg-[#0077B6]"></div><span>Luas Panen</span></div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center"><div className="w-8 h-1 mr-2 border-t-2 border-dashed border-[#FDB833]"></div><span>Prediksi Luas Panen</span></div>
                            </div>
                        </div>
                        <div className="w-full h-[500px]">
                            <ResponsiveContainer>
                                <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 30, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="bulanFormatted" angle={-45} textAnchor="end" height={80} interval="preserveStartEnd" />
                                    <YAxis yAxisId="left" tickFormatter={(value) => new Intl.NumberFormat('id-ID').format(value)} width={80}>
                                        <Label value="Luas Panen (Ha)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                                    </YAxis>
                                    <YAxis yAxisId="right" orientation="right" tick={false} axisLine={false} />
                                    <Tooltip content={<CustomCombinedTooltip />} />
                                    <Bar yAxisId="right" dataKey="fase" isAnimationActive={false}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getPhaseColor(entry.fase)} />
                                        ))}
                                    </Bar>
                                    <Line yAxisId="left" type="monotone" dataKey="luas_panen" stroke="#0077B6" strokeWidth={3} dot={false} connectNulls />
                                    <Line yAxisId="left" type="monotone" dataKey="prediksi_luas_panen" stroke="#FDB833" strokeWidth={3} strokeDasharray="5 5" dot={false} connectNulls />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}
        </section>
    );
};

export default LuasPanen;