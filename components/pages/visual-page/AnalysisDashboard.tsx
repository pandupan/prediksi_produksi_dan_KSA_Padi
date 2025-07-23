/* eslint-disable react-hooks/exhaustive-deps */
 
// src/components/pages/landing-page/AnalysisDashboard.tsx

/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import * as XLSX from "xlsx";
import type { Variants } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  BarChart3,
  LineChart as LineChartIcon,
  Table2,
  AreaChart,
  MapPin,
  File as FileIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import {
  ValueType,
  NameType,
  Payload,
} from "recharts/types/component/DefaultTooltipContent";

// --- Import Data GeoJSON ---
import { tasikmalayaGeoJson } from "@/lib/tasikmalaya-geojson";
import { sawahGeoJson } from "@/lib/bpn-sawah-geojson";

// --- Interfaces ---
interface ExcelData {
  [key: string]: any;
}
interface AggregatedData {
  kecamatan: string;
  [month: string]: any;
}
interface PredictedData {
  kecamatan: string;
  [month: string]: any;
}


// --- Dynamic Import untuk Peta (Client-Side Only) ---
const TasikMap = dynamic(() => import("@/components/TasikMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-muted rounded-lg">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="ml-2">Memuat Peta...</p>
    </div>
  ),
});

// --- Helper Functions ---
const formatKsaDate = (header: string, short = false): string => {
  const headerStr = String(header);
  if (!/^\d{3,}$/.test(headerStr) && isNaN(parseInt(headerStr))) return header;
  try {
    const year = parseInt(headerStr.slice(-2));
    const month = parseInt(headerStr.slice(0, -2));
    const fullYear = 2000 + year;
    const monthNames = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
    const longMonthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    if (month >= 1 && month <= 12)
      return short ? `${monthNames[month - 1]} '${year}` : `${longMonthNames[month - 1]} ${fullYear}`;
    return header;
  } catch (error) {
    return header;
  }
};

const kecamatanMap: { [key: string]: string } = {
  "3278071": "Bungursari",
  "3278030": "Cibeureum",
  "3278050": "Cihideung",
  "3278080": "Cipedes",
  "3278070": "Indihiang",
  "3278010": "Kawalu",
  "3278060": "Mangkubumi",
  "3278031": "Purbaratu",
  "3278020": "Tamansari",
  "3278040": "Tawang",
};

const getModus = (arr: any[]): any => {
  if (!arr.length) return null;
  const freqMap: { [key: string]: number } = {};
  let maxFreq = 0;
  let modus: any = null;
  arr.forEach((item) => {
    const key = String(item);
    freqMap[key] = (freqMap[key] || 0) + 1;
    if (freqMap[key] > maxFreq) {
      maxFreq = freqMap[key];
      modus = item;
    }
  });
  return modus;
};

const validateStructure = (headers: string[]): string | null => {
  const lowercasedHeaders = headers.map((h) => h.toLowerCase().trim());
  if (!lowercasedHeaders.includes("id segmen")) return "Struktur file tidak sesuai. Kolom 'id segmen' tidak ditemukan.";
  if (!lowercasedHeaders.includes("subsegmen")) return "Struktur file tidak sesuai. Kolom 'subsegmen' tidak ditemukan.";
  return null;
};

const yAxisValueMap: { [key: string]: string } = {
  "1": "Vegetatif 1 (V1)","2": "Vegetatif 2 (V2)","3.1": "Generatif 1","3.2": "Generatif 2", "3.3": "Generatif 3","4": "Panen","5": "Persiapan Lahan","6": "Puso","7.7": "LL Cabai","7.8": "LL Bawang Merah","7.9": "LL Kentang","7.1": "LL Tembakau","7.11": "LL Tebu","7.12": "LL Pangan Lainnya","7.13": "LL Hortikultura Lainnya","7.14": "LL Perkebunan Lainnya","7.99": "LL Lain-lain","8": "Bukan Lahan Pertanian","12": "Tidak Dapat Diakses","13": "Pasca Panen",
};

const getPhaseColor = (phase: number | null): string => {
  if (phase === null) return "#9E9E9E";
  switch (phase) {
    case 5: return "#A16D28"; case 1: return "#3E5F44"; case 2: return "#5E936C";
    case 3.1: return "#93DA97"; case 3.2: return "#B5E8B8"; case 3.3: return "#DAF5DB";
    case 4: return "#FED16A"; case 13: return "#665123"; case 6: return "#101010";
    case 8: return "#BDBDBD"; default: return "#78909C";
  }
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Card className="p-2 text-sm shadow-lg">
        <CardHeader className="p-1 font-bold border-b mb-1">
          {typeof label === "string" || typeof label === "number"
            ? formatKsaDate(String(label))
            : String(label)}
        </CardHeader>
        <CardContent className="p-1">
          {payload.map((pld: Payload<ValueType, NameType>) => (
            <div key={pld.dataKey as React.Key} className="flex items-center">
              <div style={{ backgroundColor: pld.color as string }} className="w-2.5 h-2.5 rounded-full mr-2 shrink-0"></div>
              <span className="flex-1 truncate">{pld.dataKey as string}: </span>
              <span className="font-semibold ml-2">
                {yAxisValueMap[String(pld.value)] || pld.value}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  return null;
};


// --- Main Component ---
const AnalysisDashboard = () => {
    const [data, setData] = useState<ExcelData[] | null>(null);
    const [columns, setColumns] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [aggregatedData, setAggregatedData] = useState<AggregatedData[] | null>(null);
    const [aggregatedColumns, setAggregatedColumns] = useState<string[]>([]);
    const [predictedData, setPredictedData] = useState<PredictedData[] | null>(null);
    const [predictionColumns, setPredictionColumns] = useState<string[]>([]);
    const [allKecamatan, setAllKecamatan] = useState<string[]>([]);
    
    const [pendingMapMonth, setPendingMapMonth] = useState<string>("");
    const [confirmedMapMonth, setConfirmedMapMonth] = useState<string>("");
    
    const [pendingSelectedKecamatan, setPendingSelectedKecamatan] = useState<string[]>([]);
    const [confirmedSelectedKecamatan, setConfirmedSelectedKecamatan] = useState<string[]>([]);
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    
    const [pendingSelectedKecamatanPrediksi, setPendingSelectedKecamatanPrediksi] = useState<string[]>([]);
    const [confirmedSelectedKecamatanPrediksi, setConfirmedSelectedKecamatanPrediksi] = useState<string[]>([]);
    const [isSelectOpenPrediksi, setIsSelectOpenPrediksi] = useState(false);

  const generatePredictions = (
    aggData: AggregatedData[],
    aggCols: string[]
  ): { predictions: PredictedData[]; columns: string[] } => {
    const faseOrder = [5.0, 1.0, 2.0, 3.1, 3.2, 3.3, 4.0, 13.0];
    const lastMonthKey = aggCols[aggCols.length - 1];
    const getNextMonthKey = (monthKey: string): string => {
      const month = parseInt(monthKey.slice(0, -2));
      const year = parseInt(monthKey.slice(-2));
      if (month === 12) return `1${year + 1}`;
      return `${month + 1}${year}`;
    };

    const predictions: PredictedData[] = [];
    const newColumns: string[] = ["kecamatan"];
    let currentMonthKey = lastMonthKey;
    if (!currentMonthKey) return { predictions: [], columns: [] };

    for (let i = 0; i < 12; i++) {
      currentMonthKey = getNextMonthKey(currentMonthKey);
      newColumns.push(currentMonthKey);
    }

    aggData.forEach((row) => {
      const newRow: PredictedData = { kecamatan: row.kecamatan };
      let lastPhase = row[lastMonthKey];
      newColumns.slice(1).forEach((monthKey) => {
        const currentIndex = faseOrder.indexOf(lastPhase);
        const nextPhase = currentIndex === -1 || currentIndex === faseOrder.length - 1
            ? faseOrder[0]
            : faseOrder[currentIndex + 1];
        newRow[monthKey] = nextPhase;
        lastPhase = nextPhase;
      });
      predictions.push(newRow);
    });
    return { predictions, columns: newColumns };
  };

  const processAggregation = (rows: ExcelData[], originalColumns: string[]) => {
    const idSegmenKey = originalColumns.find((c) => c.toLowerCase().trim() === "id segmen");
    const subsegmenKey = originalColumns.find((c) => c.toLowerCase().trim() === "subsegmen");
    if (!idSegmenKey || !subsegmenKey) return;
    
    const groupedByKecamatan: { [key: string]: ExcelData[] } = {};
    rows.forEach((row) => {
      const idSegmen = String(row[idSegmenKey] || "");
      const kodeKecamatan = idSegmen.substring(0, 7);
      const namaKecamatan = kecamatanMap[kodeKecamatan];
      if (namaKecamatan) {
        if (!groupedByKecamatan[namaKecamatan]) groupedByKecamatan[namaKecamatan] = [];
        groupedByKecamatan[namaKecamatan].push(row);
      }
    });
    
    const monthColumns = originalColumns.filter(
      (c) => c.toLowerCase().trim() !== "id segmen" && c.toLowerCase().trim() !== "subsegmen"
    );
    
    const result: AggregatedData[] = [];
    for (const namaKecamatan in groupedByKecamatan) {
      const kecamatanData = groupedByKecamatan[namaKecamatan];
      const newRow: AggregatedData = { kecamatan: namaKecamatan };
      monthColumns.forEach((month) => {
        newRow[month] = getModus(kecamatanData.map((d) => d[month]).filter((v) => v != null));
      });
      result.push(newRow);
    }
    
    result.sort((a, b) => a.kecamatan.localeCompare(b.kecamatan));
    setAggregatedData(result);
    const aggCols = ["kecamatan", ...monthColumns];
    setAggregatedColumns(aggCols);
    
    const { predictions: preds, columns: predCols } = generatePredictions(result, aggCols);
    setPredictedData(preds);
    setPredictionColumns(predCols);
    
    const kecamatanList = result.map((d) => d.kecamatan);
    setAllKecamatan(kecamatanList);
  };

  useEffect(() => {
    const DATA_URL = "https://raw.githubusercontent.com/pandupan/material_source_magang_bps_tasikmalaya/main/dataset_ksa_tasik_2025_v9.xlsx";

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(DATA_URL);
        if (!response.ok) {
          throw new Error(`Gagal mengambil data dari server: ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length > 1) {
          const headers: string[] = jsonData[0].map(String);
          const validationError = validateStructure(headers);
          if (validationError) throw new Error(validationError);

          const rows: ExcelData[] = jsonData.slice(1).map((row: any[]) =>
            headers.reduce((acc: ExcelData, header: string, index: number) => {
              if (header) acc[header] = row[index];
              return acc;
            }, {})
          );

          const filteredHeaders = headers.filter(h => h);
          setColumns(filteredHeaders);
          setData(rows);
          processAggregation(rows, filteredHeaders);
        } else {
          throw new Error("File Excel tidak memiliki data atau header yang valid.");
        }
      } catch (err: any) {
        console.error(err);
        setError(`Terjadi kesalahan saat memproses data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

    useEffect(() => {
    if (allKecamatan.length > 0) {
      const defaultSelection = ["Mangkubumi", "Indihiang", "Cibeureum"];
      const availableDefault = defaultSelection.filter((k) => allKecamatan.includes(k));
      const initialSelection = availableDefault.length > 0 ? availableDefault : allKecamatan.slice(0, 3);
      setPendingSelectedKecamatan(initialSelection);
      setConfirmedSelectedKecamatan(initialSelection);
      setPendingSelectedKecamatanPrediksi(initialSelection);
      setConfirmedSelectedKecamatanPrediksi(initialSelection);
    }
  }, [allKecamatan]);

  const combinedTableData = useMemo(() => {
    if (!aggregatedData || !predictedData) return { data: [], columns: [] };
    const combinedData = aggregatedData.map((aggRow) => {
      const predRow = predictedData.find((p) => p.kecamatan === aggRow.kecamatan);
      return { ...aggRow, ...(predRow || {}) };
    });
    const predColsOnly = predictionColumns.filter((c) => c !== "kecamatan");
    const combinedColumns = [...aggregatedColumns, ...predColsOnly];
    return { data: combinedData, columns: combinedColumns };
  }, [aggregatedData, predictedData, aggregatedColumns, predictionColumns]);
  
  useEffect(() => {
    if (combinedTableData.columns.length > 0 && !confirmedMapMonth) {
      const actualMonths = aggregatedColumns.filter((c) => c !== "kecamatan");
      const defaultMonth = actualMonths.length > 0 ? actualMonths[actualMonths.length - 1] : combinedTableData.columns[1];
      if (defaultMonth) {
        setPendingMapMonth(defaultMonth);
        setConfirmedMapMonth(defaultMonth);
      }
    }
  }, [aggregatedColumns, combinedTableData.columns, confirmedMapMonth]);

  const chartData = useMemo(() => {
    if (!aggregatedData || confirmedSelectedKecamatan.length === 0) return [];
    const monthColumns = aggregatedColumns.filter((c) => c !== "kecamatan");
    return monthColumns.map((month) => {
      const dataPoint: any = { name: formatKsaDate(month, true) };
      aggregatedData.forEach((row) => {
        if (confirmedSelectedKecamatan.includes(row.kecamatan)) {
          dataPoint[row.kecamatan] = parseFloat(row[month]) || null;
        }
      });
      return dataPoint;
    });
  }, [aggregatedData, aggregatedColumns, confirmedSelectedKecamatan]);

  const predictedChartData = useMemo(() => {
    if (!predictedData || confirmedSelectedKecamatanPrediksi.length === 0) return [];
    const monthColumns = predictionColumns.filter((c) => c !== "kecamatan");
    return monthColumns.map((month) => {
      const dataPoint: any = { name: formatKsaDate(month, true) };
      predictedData.forEach((row) => {
        if (confirmedSelectedKecamatanPrediksi.includes(row.kecamatan)) {
          dataPoint[row.kecamatan] = parseFloat(row[month]) || null;
        }
      });
      return dataPoint;
    });
  }, [predictedData, predictionColumns, confirmedSelectedKecamatanPrediksi]);

  const availableMonthsForMap = useMemo(() => {
    return combinedTableData.columns.filter((c) => c !== "kecamatan");
  }, [combinedTableData.columns]);

  const handleConfirmMapMonth = () => setConfirmedMapMonth(pendingMapMonth);
  const handlePendingKecamatanSelect = (kecamatan: string) => setPendingSelectedKecamatan((prev) => prev.includes(kecamatan) ? prev.filter((k) => k !== kecamatan) : [...prev, kecamatan]);
  const handleConfirmSelection = () => { setConfirmedSelectedKecamatan(pendingSelectedKecamatan); setIsSelectOpen(false); };
  const handlePendingKecamatanSelectPrediksi = (kecamatan: string) => setPendingSelectedKecamatanPrediksi((prev) => prev.includes(kecamatan) ? prev.filter((k) => k !== kecamatan) : [...prev, kecamatan]);
  const handleConfirmSelectionPrediksi = () => { setConfirmedSelectedKecamatanPrediksi(pendingSelectedKecamatanPrediksi); setIsSelectOpenPrediksi(false); };
  
  const lineColors = ["#8884d8","#82ca9d","#ffc658","#ff8042","#0088FE","#00C49F","#FFBB28","#FF8042","#A4DE6C","#D0ED57"];

  return (
    <section id="visualisasi-interaktif" className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Visualisasi Hasil Analisis</h2>
            <div className="w-24 h-1 bg-green-700 mx-auto" />
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
                Jelajahi data KSA terbaru dan prediksi untuk 12 bulan ke depan. Gunakan filter untuk melihat tren per kecamatan, atau lihat sebaran fase tanam pada peta interaktif.
            </p>
        </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-10 h-64">
          <Loader2 className="w-10 h-10 animate-spin text-green-700" />
          <span className="mt-4 text-lg font-semibold text-gray-700">Memuat Data Analisis Terbaru...</span>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center p-10 h-64 bg-red-50 rounded-lg">
          <AlertCircle className="w-10 h-10 text-red-600" />
          <p className="mt-4 text-lg font-semibold text-red-800">Gagal Memuat Data</p>
          <p className="mt-2 text-sm text-red-700">{error}</p>
        </div>
      )}

      {!isLoading && !error && data && (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><FileIcon className="w-5 h-5 mr-2" />Pratinjau Data Mentah</CardTitle>
                    <CardDescription>Menampilkan semua baris mentah dari file yang diunggah.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                    <div className="h-[450px] relative">
                        <Table><TableHeader className="sticky top-0 z-10 bg-background"><TableRow>{columns.map((col) => (<TableHead key={col} className="font-semibold">{formatKsaDate(col)}</TableHead>))}</TableRow></TableHeader>
                        <TableBody>{data.map((row, rowIndex) => (<TableRow key={rowIndex}>{columns.map((col) => (<TableCell key={col}>{row[col]}</TableCell>))}</TableRow>))}</TableBody>
                        </Table>
                    </div>
                    <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><BarChart3 className="w-5 h-5 mr-2" />Analisis Agregat per Kecamatan</CardTitle>
                    <CardDescription>Tabel ini menampilkan nilai modus (fase tanam dominan) per bulan untuk setiap kecamatan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                    <div className="h-[450px] relative">
                        <Table><TableHeader className="sticky top-0 z-10 bg-background"><TableRow>{aggregatedColumns.map((col) => (<TableHead key={col} className="font-semibold capitalize">{formatKsaDate(col)}</TableHead>))}</TableRow></TableHeader>
                        <TableBody>{aggregatedData?.map((row, rowIndex) => (<TableRow key={rowIndex}>{aggregatedColumns.map((col) => (<TableCell key={col}>{row[col]}</TableCell>))}</TableRow>))}</TableBody>
                        </Table>
                    </div>
                    <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><LineChartIcon className="w-5 h-5 mr-2" />Visualisasi Tren Fase Tanam</CardTitle>
                    <CardDescription>Grafik tren nilai modus fase tanam dari waktu ke waktu per kecamatan. Pilih kecamatan di bawah ini untuk ditampilkan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Label htmlFor="kecamatan-select">Pilih Kecamatan (Data Aktual)</Label>
                        <Select open={isSelectOpen} onOpenChange={setIsSelectOpen} onValueChange={() => {}}>
                            <SelectTrigger id="kecamatan-select"><SelectValue placeholder="Pilih kecamatan..." /></SelectTrigger>
                            <SelectContent className="max-h-60 overflow-y-auto">
                                {allKecamatan.map((kecamatan) => (<div key={kecamatan} className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50" onMouseDown={(e) => e.preventDefault()} onClick={() => handlePendingKecamatanSelect(kecamatan)}> <Checkbox id={`checkbox-${kecamatan}`} checked={pendingSelectedKecamatan.includes(kecamatan)} className="absolute left-2 top-1/2 -translate-y-1/2" /> <Label htmlFor={`checkbox-${kecamatan}`} className="flex-1 cursor-pointer"> {kecamatan} </Label> </div>))}
                                <div className="p-2 border-t"><Button onClick={handleConfirmSelection} className="w-full">Konfirmasi Pilihan</Button></div>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="h-[400px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, "dataMax + 1"]} tickFormatter={(value) => yAxisValueMap[String(value)] || String(value)} /><Tooltip content={<CustomTooltip />} /><Legend />{confirmedSelectedKecamatan.map((kecamatan, index) => (<Line key={kecamatan} type="monotone" dataKey={kecamatan} stroke={lineColors[index % lineColors.length]} strokeWidth={2} activeDot={{ r: 6 }} />))}</LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><AreaChart className="w-5 h-5 mr-2" />Visualisasi Prediksi Tren Fase Tanam</CardTitle>
                    <CardDescription>Grafik ini menampilkan tren prediksi fase tanam untuk 12 bulan ke depan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Label htmlFor="kecamatan-select-prediksi">Pilih Kecamatan (Data Prediksi)</Label>
                        <Select open={isSelectOpenPrediksi} onOpenChange={setIsSelectOpenPrediksi} onValueChange={() => {}}><SelectTrigger id="kecamatan-select-prediksi"><SelectValue placeholder="Pilih kecamatan..." /></SelectTrigger>
                            <SelectContent className="max-h-60 overflow-y-auto">
                                {allKecamatan.map((kecamatan) => ( <div key={kecamatan} className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => handlePendingKecamatanSelectPrediksi(kecamatan)}> <Checkbox id={`checkbox-prediksi-${kecamatan}`} checked={pendingSelectedKecamatanPrediksi.includes(kecamatan)} className="absolute left-2 top-1/2 -translate-y-1/2" /> <Label htmlFor={`checkbox-prediksi-${kecamatan}`} className="flex-1 cursor-pointer">{kecamatan}</Label> </div> ))}
                                <div className="p-2 border-t"><Button onClick={handleConfirmSelectionPrediksi} className="w-full">Konfirmasi Pilihan</Button></div>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="h-[400px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={predictedChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, "dataMax + 1"]} tickFormatter={(value) => yAxisValueMap[String(value)] || String(value)} /><Tooltip content={<CustomTooltip />} /><Legend />{confirmedSelectedKecamatanPrediksi.map((kecamatan, index) => ( <Line key={kecamatan} type="monotone" dataKey={kecamatan} stroke={lineColors[index % lineColors.length]} strokeWidth={2} activeDot={{ r: 6 }} /> ))}</LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><MapPin className="w-5 h-5 mr-2" />Peta Sebaran Fase Tanam</CardTitle>
                    <CardDescription>Peta ini memvisualisasikan fase tanam pada lahan sawah di setiap kecamatan. Pilih bulan lalu klik "Terapkan" untuk melihat perubahan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex-grow">
                            <Label htmlFor="month-select-map">Pilih Bulan</Label>
                            <Select value={pendingMapMonth} onValueChange={setPendingMapMonth}><SelectTrigger id="month-select-map"><SelectValue placeholder="Pilih bulan..." /></SelectTrigger>
                                <SelectContent>{availableMonthsForMap.map((month) => (<SelectItem key={month} value={month}>{formatKsaDate(month)}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleConfirmMapMonth} className="self-end">Terapkan</Button>
                    </div>
                    <TasikMap geoJsonKecamatan={tasikmalayaGeoJson} geoJsonSawah={sawahGeoJson} dataFase={combinedTableData.data} selectedMonth={confirmedMapMonth} phaseColorMapping={getPhaseColor} />
                </CardContent>
            </Card>
        </>
      )}
    </section>
  );
};

export default AnalysisDashboard;