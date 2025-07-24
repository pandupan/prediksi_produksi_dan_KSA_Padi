/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import * as XLSX from "xlsx";
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
  MapPin,
  File as FileIcon,
  Info,
  Globe,
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
} from "recharts";
import {
  ValueType,
  NameType,
  Payload,
} from "recharts/types/component/DefaultTooltipContent";

// --- Import Data GeoJSON ---
import { tasikmalayaGeoJson } from "@/lib/tasikmalaya-geojson";
import { sawahGeoJson } from "@/lib/bpn-sawah-geojson";

// --- Pastikan KEDUA KOMPONEN PETA diimpor secara dinamis dengan ssr: false ---

// Komponen Peta per Sawah/Kecamatan
// Menggunakan nama alias 'KecamatanMapDynamic' untuk menghindari konflik nama.
const KecamatanMapDynamic = dynamic(() => import("@/components/KecamatanMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-muted rounded-lg">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="ml-2">Memuat Peta Sawah/Kecamatan...</p>
    </div>
  ),
});

// Komponen Peta Agregasi Kota
const TasikCityMap = dynamic(() => import("@/components/TasikCityMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-muted rounded-lg">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="ml-2">Memuat Peta Kota...</p>
    </div>
  ),
});


// --- Interfaces & Types ---
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

// --- Helper Functions (di luar komponen untuk bisa diakses oleh generatePredictions) ---
const formatKsaDate = (header: string, short = false): string => {
  const headerStr = String(header);
  if (!/^\d{3,}$/.test(headerStr) && isNaN(parseInt(headerStr))) return header;
  try {
    const year = parseInt(headerStr.slice(-2));
    const month = parseInt(headerStr.slice(0, -2));
    const fullYear = 2000 + year;
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const longMonthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    if (month >= 1 && month <= 12)
      return short
        ? `${monthNames[month - 1]} '${year}`
        : `${longMonthNames[month - 1]} ${fullYear}`;
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
  if (!lowercasedHeaders.includes("id segmen"))
    return "Struktur file tidak sesuai. Kolom 'id segmen' tidak ditemukan.";
  if (!lowercasedHeaders.includes("subsegmen"))
    return "Struktur file tidak sesuai. Kolom 'subsegmen' tidak ditemukan.";
  return null;
};
const getPhaseColor = (phase: number | null): string => {
  if (phase === null) return "#9E9E9E";
  switch (phase) {
    case 5:
      return "#A16D28";
    case 1:
      return "#3E5F44";
    case 2:
      return "#5E936C";
    case 3.1:
      return "#93DA97";
    case 3.2:
      return "#B5E8B8";
    case 3.3:
      return "#DAF5DB";
    case 4:
      return "#FED16A";
    case 13: // 13 biasanya Pasca Panen
      return "#665123";
    case 4.5: // Tambahkan 4.5 untuk Pasca Panen jika ada di data
      return "#FED16A"; // Bisa warna yang sama dengan panen atau berbeda
    case 6:
      return "#101010"; // Puso
    case 8:
      return "#BDBDBD"; // Bukan Sawah
    default:
      return "#78909C"; // Warna default untuk fase yang tidak dikenal
  }
};

const phaseOrder = [4.5, 4, 3.3, 3.2, 3.1, 2, 1, 5, 6, 8];
const yAxisValueMap: { [key: string]: string } = {
  "1": "Vegetatif 1",
  "2": "Vegetatif 2",
  "3.1": "Generatif 1",
  "3.2": "Generatif 2",
  "3.3": "Generatif 3",
  "4": "Panen",
  "5": "Persiapan Lahan",
  "6": "Puso",
  "8": "Bukan Sawah",
  "4.5": "Pasca Panen",
};
const yAxisTicks = phaseOrder.map(String);

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
              <div
                style={{ backgroundColor: pld.color as string }}
                className="w-2.5 h-2.5 rounded-full mr-2 shrink-0"
              ></div>
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


const AnalysisDashboard = () => {
  const [data, setData] = useState<ExcelData[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData[] | null>(
    null
  );
  const [aggregatedColumns, setAggregatedColumns] = useState<string[]>([]);
  const [predictedData, setPredictedData] = useState<PredictedData[] | null>(
    null
  );
  const [predictionColumns, setPredictionColumns] = useState<string[]>([]);
  const [allKecamatan, setAllKecamatan] = useState<string[]>([]);
  const [pendingMapMonth, setPendingMapMonth] = useState<string>("");
  const [confirmedMapMonth, setConfirmedMapMonth] = useState<string>("");
  const [pendingSelectedKecamatan, setPendingSelectedKecamatan] = useState<
    string[]
  >([]);
  const [confirmedSelectedKecamatan, setConfirmedSelectedKecamatan] = useState<
    string[]
  >([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [
    pendingSelectedKecamatanPrediksi,
    setPendingSelectedKecamatanPrediksi,
  ] = useState<string[]>([]);
  const [
    confirmedSelectedKecamatanPrediksi,
    setConfirmedSelectedKecamatanPrediksi,
  ] = useState<string[]>([]);
  const [isSelectOpenPrediksi, setIsSelectOpenPrediksi] = useState(false);

  // Helper function moved outside to be accessible by generatePredictions
  const getNextMonthKey = (monthKey: string): string => {
    const month = parseInt(monthKey.slice(0, -2));
    const year = parseInt(monthKey.slice(-2));
    if (month === 12) return `1${year + 1}`;
    return `${month + 1}${year}`;
  };

  const generatePredictions = (
    aggData: AggregatedData[],
    aggCols: string[]
  ): { predictions: PredictedData[]; columns: string[] } => {
    const faseOrder = [5.0, 1.0, 2.0, 3.1, 3.2, 3.3, 4.0, 4.5];
    const lastMonthKey = aggCols[aggCols.length - 1];
    const predictions: PredictedData[] = [];
    const newColumns: string[] = ["kecamatan"]; 

    let currentMonthKey = lastMonthKey;
    if (!currentMonthKey) return { predictions: [], columns: [] };

    // Loop untuk mengisi newColumns dengan 12 bulan ke depan
    for (let i = 0; i < 12; i++) {
      currentMonthKey = getNextMonthKey(currentMonthKey);
      newColumns.push(currentMonthKey);
    }

    aggData.forEach((row) => {
      const newRow: PredictedData = { kecamatan: row.kecamatan };
      let lastPhase = row[lastMonthKey];
      if (typeof lastPhase === 'string') {
        lastPhase = parseFloat(lastPhase);
      } else if (lastPhase === undefined) {
        lastPhase = null;
      }

      let currentIndex = lastPhase !== null ? faseOrder.indexOf(lastPhase) : -1;

      if (currentIndex === -1) {
          currentIndex = 0;
          lastPhase = faseOrder[currentIndex];
      }

      newColumns.slice(1).forEach((monthKey) => {
        const nextPhase =
          currentIndex === faseOrder.length - 1
            ? faseOrder[0]
            : faseOrder[currentIndex + 1];

        newRow[monthKey] = nextPhase;
        lastPhase = nextPhase;
        currentIndex = faseOrder.indexOf(lastPhase);
      });
      predictions.push(newRow);
    });
    return { predictions, columns: newColumns };
  };

  const processAggregation = (rows: ExcelData[], originalColumns: string[]) => {
    const idSegmenKey = originalColumns.find(
      (c) => c.toLowerCase().trim() === "id segmen"
    );
    const subsegmenKey = originalColumns.find(
      (c) => c.toLowerCase().trim() === "subsegmen"
    );
    if (!idSegmenKey || !subsegmenKey) {
      setError("Struktur file tidak sesuai. Kolom 'id segmen' atau 'subsegmen' tidak ditemukan.");
      return;
    }

    const groupedByKecamatan: { [key: string]: ExcelData[] } = {};
    rows.forEach((row) => {
      const idSegmen = String(row[idSegmenKey] || "");
      const kodeKecamatan = idSegmen.substring(0, 7);
      const namaKecamatan = kecamatanMap[kodeKecamatan];
      if (namaKecamatan) {
        if (!groupedByKecamatan[namaKecamatan])
          groupedByKecamatan[namaKecamatan] = [];
        groupedByKecamatan[namaKecamatan].push(row);
      }
    });

    const monthColumns = originalColumns.filter(
      (c) =>
        c.toLowerCase().trim() !== "id segmen" &&
        c.toLowerCase().trim() !== "subsegmen"
    );

    const result: AggregatedData[] = [];
    for (const namaKecamatan in groupedByKecamatan) {
      const kecamatanData = groupedByKecamatan[namaKecamatan];
      const newRow: AggregatedData = { kecamatan: namaKecamatan };
      monthColumns.forEach((month) => {
        newRow[month] = getModus(
          kecamatanData.map((d) => d[month]).filter((v) => v != null)
        );
      });
      result.push(newRow);
    }
    result.sort((a, b) => a.kecamatan.localeCompare(b.kecamatan));
    setAggregatedData(result);
    const aggCols = ["kecamatan", ...monthColumns];
    setAggregatedColumns(aggCols);
    
    // Pastikan aggCols memiliki setidaknya satu bulan sebelum memanggil generatePredictions
    if (aggCols.length > 1) { 
      const { predictions: preds, columns: predCols } = generatePredictions(
        result,
        aggCols
      );
      setPredictedData(preds);
      setPredictionColumns(predCols);
    } else {
        setPredictedData([]);
        setPredictionColumns(["kecamatan"]);
    }

    const kecamatanList = result.map((d) => d.kecamatan);
    setAllKecamatan(kecamatanList);
  };
  
  useEffect(() => {
    const DATA_URL =
      "https://raw.githubusercontent.com/pandupan/material_source_magang_bps_tasikmalaya/main/dataset_ksa_tasik_2025_v9.xlsx";
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(DATA_URL);
        if (!response.ok) {
          throw new Error(
            `Gagal mengambil data dari server: ${response.statusText}`
          );
        }
        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        });
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
          const filteredHeaders = headers.filter((h) => h);
          setColumns(filteredHeaders);
          setData(rows);
          processAggregation(rows, filteredHeaders);
        } else {
          throw new Error(
            "File Excel tidak memiliki data atau header yang valid."
          );
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
      const availableDefault = defaultSelection.filter((k) =>
        allKecamatan.includes(k)
      );
      const initialSelection =
        availableDefault.length > 0
          ? availableDefault
          : allKecamatan.slice(0, 3);
      setPendingSelectedKecamatan(initialSelection);
      setConfirmedSelectedKecamatan(initialSelection);
      setPendingSelectedKecamatanPrediksi(initialSelection);
      setConfirmedSelectedKecamatanPrediksi(initialSelection);
    }
  }, [allKecamatan]);
  const combinedTableData = useMemo(() => {
    if (!aggregatedData || !predictedData) return { data: [], columns: [] };
    const combinedData = aggregatedData.map((aggRow) => {
      const predRow = predictedData.find(
        (p) => p.kecamatan === aggRow.kecamatan
      );
      return { ...aggRow, ...(predRow || {}) };
    });
    const predColsOnly = predictionColumns.filter((c) => c !== "kecamatan");
    const combinedColumns = [...aggregatedColumns, ...predColsOnly];
    return { data: combinedData, columns: combinedColumns };
  }, [aggregatedData, predictedData, aggregatedColumns, predictionColumns]);
  useEffect(() => {
    if (combinedTableData.columns.length > 0 && !confirmedMapMonth) {
      const actualMonths = aggregatedColumns.filter((c) => c !== "kecamatan");
      const defaultMonth =
        actualMonths.length > 0
          ? actualMonths[actualMonths.length - 1]
          : combinedTableData.columns[1];
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
    if (!predictedData || confirmedSelectedKecamatanPrediksi.length === 0)
      return [];
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

  // Hitung fase dominan untuk seluruh kota Tasikmalaya
  const cityWideDominantPhase = useMemo(() => {
    if (!aggregatedData || !confirmedMapMonth) return null;

    const allPhasesInMonth = aggregatedData
      .map((row) => row[confirmedMapMonth])
      .filter((v) => v != null);

    return getModus(allPhasesInMonth);
  }, [aggregatedData, confirmedMapMonth]);


  const handleConfirmMapMonth = () => setConfirmedMapMonth(pendingMapMonth);
  const handlePendingKecamatanSelect = (kecamatan: string) =>
    setPendingSelectedKecamatan((prev) =>
      prev.includes(kecamatan)
        ? prev.filter((k) => k !== kecamatan)
        : [...prev, kecamatan]
    );
  const handleConfirmSelection = () => {
    setConfirmedSelectedKecamatan(pendingSelectedKecamatan);
    setIsSelectOpen(false);
  };
  const handlePendingKecamatanSelectPrediksi = (kecamatan: string) =>
    setPendingSelectedKecamatanPrediksi((prev) =>
      prev.includes(kecamatan)
        ? prev.filter((k) => k !== kecamatan)
        : [...prev, kecamatan]
    );
  const handleConfirmSelectionPrediksi = () => {
    setConfirmedSelectedKecamatanPrediksi(pendingSelectedKecamatanPrediksi);
    setIsSelectOpenPrediksi(false);
  };

  const lineColors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#A4DE6C",
    "#D0ED57",
  ];

  return (
    <section
      id="visualisasi-interaktif"
      className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-8"
    >
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Visualisasi Hasil Analisis
        </h2>
        <div className="w-24 h-1 bg-green-700 mx-auto" />
        <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
          Jelajahi data KSA terbaru dan prediksi untuk 12 bulan ke depan.
          Gunakan filter untuk melihat tren per kecamatan, atau lihat sebaran
          fase tanam pada peta interaktif.
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-10 h-64">
          <Loader2 className="w-10 h-10 animate-spin text-green-700" />
          <span className="mt-4 text-lg font-semibold text-gray-700">
            Memuat Data Analisis Terbaru...
          </span>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center p-10 h-64 bg-red-50 rounded-lg">
          <AlertCircle className="w-10 h-10 text-red-600" />
          <p className="mt-4 text-lg font-semibold text-red-800">
            Gagal Memuat Data
          </p>
          {/* Menampilkan pesan error secara lebih informatif */}
          <p className="mt-2 text-sm text-red-700">{error}</p>
        </div>
      )}

      {!isLoading && !error && data && (
        <>
          {/* Card Data Mentah KSA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileIcon className="w-5 h-5 mr-2" />
                Data Mentah KSA
              </CardTitle>
              <CardDescription>
                Tabel ini menyajikan data observasi Kerangka Sampel Area (KSA) asli
                per segmen sawah, diunduh langsung dari sumber resmi. Data ini
                mencakup 'id segmen' unik dan 'subsegmen' sebagai komponen
                identifikasi utama, bersama dengan catatan fase tanam bulanan.
                Gunakan tabel ini untuk melihat detail data dasar yang digunakan
                dalam analisis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 flex items-center">
                <Info size={16} className="mr-2 text-blue-500" />
                Geser tabel secara horizontal untuk melihat semua data bulanan.
              </p>
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <div className="h-[450px] relative">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                      <TableRow>
                        {columns.map((col) => (
                          <TableHead key={col} className="font-semibold">
                            {formatKsaDate(col)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {columns.map((col) => (
                            <TableCell key={col}>{row[col]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Card Tabel Agregat Fase Dominan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Tabel Agregat Fase Dominan
              </CardTitle>
              <CardDescription>
                Tabel ini menampilkan hasil agregasi data KSA mentah, di mana
                fase tanam dominan (modus) dihitung untuk setiap kecamatan setiap
                bulannya. Proses ini menyederhanakan data segmen individual
                menjadi satu nilai representatif per kecamatan, yang menjadi
                fondasi untuk semua visualisasi tren dan prediksi berikutnya.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 flex items-center">
                <Info size={16} className="mr-2 text-blue-500" />
                Tabel ini menjadi dasar untuk semua visualisasi tren dan
                prediksi.
              </p>
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <div className="h-[450px] relative">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                      <TableRow>
                        {aggregatedColumns.map((col) => (
                          <TableHead
                            key={col}
                            className="font-semibold capitalize"
                          >
                            {formatKsaDate(col)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aggregatedData?.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {aggregatedColumns.map((col) => (
                            <TableCell key={col}>{row[col]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Card Visualisasi Tren Fase Tanam */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChartIcon className="w-5 h-5 mr-2" />
                Visualisasi Tren Fase Tanam
              </CardTitle>
              <CardDescription>
                Grafik ini menggambarkan tren historis fase tanam padi yang
                paling dominan per kecamatan di Kota Tasikmalaya. Dengan
                memvisualisasikan nilai modus bulanan, Anda dapat mengamati
                siklus tanam dan pola perubahan fase pertumbuhan padi dari waktu
                ke waktu secara dinamis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 flex items-center">
                <Info size={16} className="mr-2 text-blue-500" />
                Gunakan menu dropdown untuk memilih satu atau lebih kecamatan,
                lalu klik "Konfirmasi Pilihan" untuk memperbarui grafik.
              </p>
              <div className="mb-4">
                <Label htmlFor="kecamatan-select">
                  Pilih Kecamatan (Data Aktual)
                </Label>
                <Select open={isSelectOpen} onOpenChange={setIsSelectOpen}>
                  <SelectTrigger id="kecamatan-select">
                    <SelectValue placeholder="Pilih kecamatan..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {allKecamatan.map((kecamatan) => (
                      <div
                        key={kecamatan}
                        className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handlePendingKecamatanSelect(kecamatan)}
                      >
                        <Checkbox
                          id={`checkbox-${kecamatan}`}
                          checked={pendingSelectedKecamatan.includes(kecamatan)}
                          className="absolute left-2 top-1/2 -translate-y-1/2"
                        />
                        <Label
                          htmlFor={`checkbox-${kecamatan}`}
                          className="flex-1 cursor-pointer"
                        >
                          {kecamatan}
                        </Label>
                      </div>
                    ))}
                    <div className="p-2 border-t">
                      <Button
                        onClick={handleConfirmSelection}
                        className="w-full"
                      >
                        Konfirmasi Pilihan
                      </Button>
                    </div>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[400px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      domain={["dataMin", "dataMax"]}
                      ticks={yAxisTicks}
                      tickFormatter={(value) =>
                        yAxisValueMap[String(value)] || ""
                      }
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {confirmedSelectedKecamatan.map((kecamatan, index) => (
                      <Line
                        key={kecamatan}
                        type="monotone"
                        dataKey={kecamatan}
                        stroke={lineColors[index % lineColors.length]}
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Card Visualisasi Prediksi Tren Fase Tanam */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChartIcon className="w-5 h-5 mr-2" />
                Visualisasi Prediksi Tren Fase Tanam
              </CardTitle>
              <CardDescription>
                Grafik ini menyajikan proyeksi fase pertumbuhan padi untuk 12
                bulan ke depan, berdasarkan pola historis dari data KSA terakhir.
                Dengan algoritma sederhana, kami memprediksi transisi fase
                tanam, memungkinkan Anda untuk mengantisipasi siklus pertanian
                mendatang per kecamatan di Kota Tasikmalaya.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 flex items-center">
                <Info size={16} className="mr-2 text-blue-500" />
                Sama seperti grafik sebelumnya, pilih kecamatan yang ingin Anda
                lihat prediksinya.
              </p>
              <div className="mb-4">
                <Label htmlFor="kecamatan-select-prediksi">
                  Pilih Kecamatan (Data Prediksi)
                </Label>
                <Select
                  open={isSelectOpenPrediksi}
                  onOpenChange={setIsSelectOpenPrediksi}
                >
                  <SelectTrigger id="kecamatan-select-prediksi">
                    <SelectValue placeholder="Pilih kecamatan..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {allKecamatan.map((kecamatan) => (
                      <div
                        key={kecamatan}
                        className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() =>
                          handlePendingKecamatanSelectPrediksi(kecamatan)
                        }
                      >
                        <Checkbox
                          id={`checkbox-prediksi-${kecamatan}`}
                          checked={pendingSelectedKecamatanPrediksi.includes(
                            kecamatan
                          )}
                          className="absolute left-2 top-1/2 -translate-y-1/2"
                        />
                        <Label
                          htmlFor={`checkbox-prediksi-${kecamatan}`}
                          className="flex-1 cursor-pointer"
                        >
                          {kecamatan}
                        </Label>
                      </div>
                    ))}
                    <div className="p-2 border-t">
                      <Button
                        onClick={handleConfirmSelectionPrediksi}
                        className="w-full"
                      >
                        Konfirmasi Pilihan
                      </Button>
                    </div>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[400px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={predictedChartData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      domain={["dataMin", "dataMax"]}
                      ticks={yAxisTicks}
                      tickFormatter={(value) =>
                        yAxisValueMap[String(value)] || ""
                      }
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {confirmedSelectedKecamatanPrediksi.map(
                      (kecamatan, index) => (
                        <Line
                          key={kecamatan}
                          type="monotone"
                          dataKey={kecamatan}
                          stroke={lineColors[index % lineColors.length]}
                          strokeWidth={2}
                          activeDot={{ r: 6 }}
                        />
                      )
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        
            {/* NEW Card: Peta Sebaran Fase Tanam Kota */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Globe className="w-5 h-5 mr-2" />
                        Peta Agregasi Fase Tanam Kota
                    </CardTitle>
                    <CardDescription>
                        Peta ini menampilkan fase tanam dominan untuk seluruh wilayah Kota Tasikmalaya
                        berdasarkan bulan yang dipilih. Seluruh area kota akan diwarnai sesuai dengan
                        fase tanam yang paling sering muncul (modus) di semua kecamatan pada bulan tersebut.
                        Ini memberikan gambaran cepat tentang kondisi pertanian secara makro di seluruh kota.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-4 flex items-center">
                        <Info size={16} className="mr-2 text-blue-500" />
                        Pilih bulan yang diinginkan, kemudian klik "Terapkan" untuk melihat fase dominan
                        seluruh kota pada peta.
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex-grow">
                            <Label htmlFor="month-select-city-map">Pilih Bulan</Label>
                            <Select
                                value={pendingMapMonth}
                                onValueChange={setPendingMapMonth}
                            >
                                <SelectTrigger id="month-select-city-map">
                                    <SelectValue placeholder="Pilih bulan..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableMonthsForMap.map((month) => (
                                        <SelectItem key={month} value={month}>
                                            {formatKsaDate(month)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleConfirmMapMonth} className="self-end">
                            Terapkan
                        </Button>
                    </div>
                    {/* Render TasikCityMap */}
                    <TasikCityMap
                        geoJsonKecamatan={tasikmalayaGeoJson}
                        dataFaseKota={cityWideDominantPhase}
                        phaseColorMapping={getPhaseColor}
                        selectedMonth={confirmedMapMonth}
                    />
                </CardContent>
            </Card>

            {/* Existing Card: Peta Sebaran Fase Tanam (Per Kecamatan/Sawah) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <MapPin className="w-5 h-5 mr-2" />
                        Peta Sebaran Fase Tanam per Sawah/Kecamatan
                    </CardTitle>
                    <CardDescription>
                        Peta interaktif ini memvisualisasikan fase tanam padi yang dominan pada
                        petak-petak sawah individual di setiap kecamatan Kota Tasikmalaya untuk
                        bulan yang dipilih. Setiap warna pada petak sawah merepresentasikan fase
                        tanam yang paling sering terjadi di kecamatannya, memberikan detail
                        distribusi fase tanam.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-4 flex items-center">
                        <Info size={16} className="mr-2 text-blue-500" />
                        Pilih bulan yang diinginkan lalu klik "Terapkan" untuk
                        memperbarui warna pada peta sesuai fase tanam.
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex-grow">
                            <Label htmlFor="month-select-map">Pilih Bulan</Label>
                            <Select
                                value={pendingMapMonth}
                                onValueChange={setPendingMapMonth}
                            >
                                <SelectTrigger id="month-select-map">
                                    <SelectValue placeholder="Pilih bulan..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableMonthsForMap.map((month) => (
                                        <SelectItem key={month} value={month}>
                                            {formatKsaDate(month)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleConfirmMapMonth} className="self-end">
                            Terapkan
                        </Button>
                    </div>
                    {/* Menggunakan KecamatanMapDynamic yang di-dynamic import */}
                    <KecamatanMapDynamic
                        geoJsonKecamatan={tasikmalayaGeoJson}
                        geoJsonSawah={sawahGeoJson}
                        dataFase={combinedTableData.data}
                        selectedMonth={confirmedMapMonth}
                        phaseColorMapping={getPhaseColor}
                    />
                </CardContent>
            </Card>
        </>
      )}
    </section>
  );
};

export default AnalysisDashboard;