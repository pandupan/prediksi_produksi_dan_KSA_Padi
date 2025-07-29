/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from 'react';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Label
} from 'recharts';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Impor data harga beras dari file lokal
import rawRiceData from '@/data/data_harga_beras.json';

// --- Tipe Data dan Helper Functions ---
type RiceDataItem = { [key: string]: number | string };
interface KsaDataItem { [key: string]: any; }
interface ProcessedChartData {
    bulan: string;
    bulanFormatted: string;
    harga_rata_rata?: number;
    prediksi_harga?: number;
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
        "5": "#A16D28",   // Persiapan Lahan
        "1": "#3E5F44",   // Vegetatif 1
        "2": "#5E936C",   // Vegetatif 2
        "3.1": "#93DA97", // Generatif 1
        "3.2": "#B5E8B8", // Generatif 2
        "3.3": "#DAF5DB", // Generatif 3
        "4": "#FED16A",   // Panen
    };
    return colors[String(phase)] || "#B0BEC5";
};

const formatRupiah = (value: number | undefined) => {
    if (value === null || value === undefined) return "";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const getModus = (arr: any[]): any => {
    if (!arr.length) return null;
    const freqMap: { [key: string]: number } = {};
    let maxFreq = 0;
    let modus: any = null;
    arr.forEach((item) => {
        const key = String(item);
        freqMap[key] = (freqMap[key] || 0) + 1;
        if (freqMap[key] > maxFreq) { maxFreq = freqMap[key]; modus = item; }
    });
    const numericModus = parseFloat(modus);
    return isNaN(numericModus) ? modus : numericModus;
};

// --- Tooltip Kustom ---
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const entry = payload[0].payload;
        return (
            <div className="p-4 bg-background border rounded-lg shadow-lg">
                <p className="font-bold text-lg mb-2">{entry.bulanFormatted}</p>
                {entry.harga_rata_rata && <p style={{ color: '#1E88E5' }}>Harga Rata-rata: {formatRupiah(entry.harga_rata_rata)}</p>}
                {entry.prediksi_harga && <p style={{ color: '#FF6F00' }}>Prediksi Harga: {formatRupiah(entry.prediksi_harga)}</p>}
                {entry.nama_fase && entry.nama_fase !== "Data Kosong" && (
                    <p className="mt-2 pt-2 border-t font-semibold flex items-center">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getPhaseColor(entry.fase) }}></span>
                        Fase Tanam: {entry.nama_fase}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

// --- Komponen Utama ---
const CompareKsa = () => {
    const [chartData, setChartData] = useState<ProcessedChartData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDataAndProcess = async () => {
            setIsLoading(true);
            try {
                // ... Logika pengambilan dan pemrosesan data tidak diubah ...
                const phaseCycle = [5.0, 1.0, 2.0, 3.1, 3.2, 3.3, 4.0];
                const ksaUrl = "https://raw.githubusercontent.com/pandupan/material_source_magang_bps_tasikmalaya/main/dataset_ksa_tasik_2025_v9.xlsx";
                const response = await fetch(ksaUrl);
                const buffer = await response.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: "buffer" });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData: KsaDataItem[] = XLSX.utils.sheet_to_json(worksheet);
                const monthlyCityPhase: { [key: string]: number } = {};
                const monthsData: { [key: string]: number[] } = {};
                jsonData.forEach(row => {
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
                const monthlyAvgPrices: { [key: string]: { sum: number; count: number } } = {};
                (rawRiceData as RiceDataItem[]).forEach(item => {
                    const month = (item.date as string).substring(0, 7);
                    if (!monthlyAvgPrices[month]) monthlyAvgPrices[month] = { sum: 0, count: 0 };
                    let dailySum = 0; let dailyCount = 0;
                    ['medium_silinda', 'premium_silinda', 'medium_bapanas', 'premium_bapanas'].forEach(key => {
                        if (typeof item[key] === 'number') { dailySum += item[key] as number; dailyCount++; }
                    });
                    if (dailyCount > 0) { monthlyAvgPrices[month].sum += dailySum / dailyCount; monthlyAvgPrices[month].count++; }
                });
                const historicalPriceData = Object.keys(monthlyAvgPrices).map(month => ({
                    bulan: month,
                    harga_rata_rata: monthlyAvgPrices[month].count > 0 ? monthlyAvgPrices[month].sum / monthlyAvgPrices[month].count : 0,
                })).sort((a, b) => a.bulan.localeCompare(b.bulan));
                let combinedHistoricalData: ProcessedChartData[] = historicalPriceData.map(priceItem => {
                    const fase = monthlyCityPhase[priceItem.bulan];
                    const monthDate = new Date(priceItem.bulan + '-02');
                    return {
                        bulan: priceItem.bulan,
                        bulanFormatted: monthDate.toLocaleDateString('id', { month: 'short', year: '2-digit' }),
                        harga_rata_rata: priceItem.harga_rata_rata,
                        fase: fase,
                        nama_fase: fase ? yAxisValueMap[String(fase)] : "Data Kosong",
                    };
                }).filter(d => d.harga_rata_rata && d.harga_rata_rata > 0);
                const historicalPrices = combinedHistoricalData.map(d => d.harga_rata_rata!);
                const predictions: number[] = [];
                let currentPrices = historicalPrices.slice(-12);
                for (let i = 0; i < 12; i++) {
                    const movingAverage = currentPrices.slice(-3).reduce((a, b) => a + b, 0) / 3;
                    const trend = currentPrices[currentPrices.length - 1] - currentPrices[currentPrices.length - 2];
                    let nextPrice = movingAverage + (trend * 0.5);
                    const futureMonth = new Date(combinedHistoricalData[combinedHistoricalData.length - 1].bulan);
                    futureMonth.setMonth(futureMonth.getMonth() + i + 1);
                    const isHarvestSeason = [0, 1, 2, 3].includes(futureMonth.getMonth() + 1);
                    if (isHarvestSeason) {
                        nextPrice *= 0.99;
                    } else {
                        nextPrice *= 1.005;
                    }
                    predictions.push(nextPrice);
                    currentPrices.push(nextPrice);
                }
                const lastHistoricalIndex = combinedHistoricalData.length - 1;
                const lastHistoricalDate = new Date(combinedHistoricalData[lastHistoricalIndex].bulan + '-02');
                const lastValidPhaseEntry = [...combinedHistoricalData].reverse().find(d => d.fase && phaseCycle.includes(d.fase));
                const lastKnownPhase = lastValidPhaseEntry?.fase || 5.0;
                let lastPhaseIndexInCycle = phaseCycle.indexOf(lastKnownPhase);
                const futureData = predictions.map((price, i) => {
                    const futureDate = new Date(lastHistoricalDate.getFullYear(), lastHistoricalDate.getMonth() + i + 1, 2);
                    const month = futureDate.toISOString().substring(0, 7);
                    lastPhaseIndexInCycle = (lastPhaseIndexInCycle + 1) % phaseCycle.length;
                    const futurePhase = phaseCycle[lastPhaseIndexInCycle];
                    return {
                        bulan: month,
                        bulanFormatted: futureDate.toLocaleDateString('id', { month: 'short', year: '2-digit' }),
                        prediksi_harga: price,
                        fase: futurePhase,
                        nama_fase: yAxisValueMap[String(futurePhase)],
                    };
                });
                if (futureData.length > 0) {
                    combinedHistoricalData[lastHistoricalIndex].prediksi_harga = combinedHistoricalData[lastHistoricalIndex].harga_rata_rata;
                }
                const fullChartData = [...combinedHistoricalData, ...futureData];
                const displayData = fullChartData.filter(d => d.bulan >= '2024-01');
                setChartData(displayData);

            } catch (error) {
                console.error("Gagal memproses data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDataAndProcess();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                <span>Mengambil & Memproses Data...</span>
            </div>
        );
    }

    return (
        <section className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Analisis Harga Beras dan Siklus Tanam Padi</CardTitle>
                    <CardDescription>
                        Korelasi antara harga rata-rata beras dengan fase tanam dominan di Tasikmalaya,
                        beserta prediksi harga untuk 12 bulan ke depan.
                    </CardDescription>
                </CardHeader>
                <CardContent>

                    {/* --- PENYESUAIAN TATA LETAK LEGENDA --- */}

                    <div className="w-full h-[500px]">
                        <ResponsiveContainer>
                            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 30, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="bulanFormatted" angle={-45} textAnchor="end" height={80} interval="preserveStartEnd" />
                                <YAxis
                                    yAxisId="left"
                                    tickFormatter={(value) => formatRupiah(value)}
                                    width={100}
                                    domain={['dataMin - 1125', 'dataMax + 1100']}
                                    ticks={[13000, 14000, 15000, 16000, 17000]}
                                />
                                <YAxis yAxisId="right" orientation="right" tick={false} axisLine={false} />

                                <Tooltip content={<CustomTooltip />} />
                                
                                <Bar yAxisId="right" dataKey="fase" isAnimationActive={false}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getPhaseColor(entry.fase)} />
                                    ))}
                                </Bar>
                                
                                <Line yAxisId="left" type="monotone" dataKey="harga_rata_rata" stroke="#1E88E5" strokeWidth={3} dot={false} connectNulls />
                                <Line yAxisId="left" type="monotone" dataKey="prediksi_harga" stroke="#FF6F00" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                                        <div className="mb-8 pb-4 border-b flex flex-wrap justify-center gap-y-4 gap-x-6 md:gap-x-10 text-xs md:text-sm">
                        {/* Kolom 1 */}
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <span className="w-10 h-5 mr-3 rounded-sm" style={{ backgroundColor: '#A16D28' }}></span>
                                <span>Persiapan Lahan</span>
                            </div>
                            <div className="flex items-center">
                                <span className="w-10 h-5 mr-3 rounded-sm" style={{ backgroundColor: '#3E5F44' }}></span>
                                <span>Vegetatif 1</span>
                            </div>
                        </div>

                        {/* Kolom 2 */}
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <span className="w-10 h-5 mr-3 rounded-sm" style={{ backgroundColor: '#5E936C' }}></span>
                                <span>Vegetatif 2</span>
                            </div>
                            <div className="flex items-center">
                                <span className="w-10 h-5 mr-3 rounded-sm" style={{ backgroundColor: '#93DA97' }}></span>
                                <span>Generatif 1</span>
                            </div>
                        </div>

                        {/* Kolom 3 */}
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <span className="w-10 h-5 mr-3 rounded-sm" style={{ backgroundColor: '#B5E8B8' }}></span>
                                <span>Generatif 2</span>
                            </div>
                            <div className="flex items-center">
                                <span className="w-10 h-5 mr-3 rounded-sm" style={{ backgroundColor: '#DAF5DB' }}></span>
                                <span>Generatif 3</span>
                            </div>
                        </div>

                        {/* Kolom 4 */}
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <span className="w-10 h-5 mr-3 rounded-sm" style={{ backgroundColor: '#FED16A' }}></span>
                                <span>Panen</span>
                            </div>
                             <div className="flex items-center">
                                <div className="w-10 h-1 mr-3 bg-[#1E88E5]"></div>
                                <span>Harga Rata-rata</span>
                            </div>
                        </div>

                        {/* Kolom 5 */}
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <div className="w-10 h-1 mr-3" style={{ background: 'repeating-linear-gradient(90deg, #FF6F00, #FF6F00 4px, transparent 4px, transparent 8px)' }}></div>
                                <span>Prediksi Harga</span>
                            </div>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </section>
    );
}

export default CompareKsa;