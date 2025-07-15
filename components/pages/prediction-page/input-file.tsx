/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button"; // Import Button component
import { UploadCloud, File as FileIcon, Loader2, AlertCircle, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { ValueType, NameType, Payload } from 'recharts/types/component/DefaultTooltipContent'; // Import Payload

// --- Interfaces ---
interface ExcelData { [key: string]: any; }
interface AggregatedData { kecamatan: string; [month: string]: any; }

// Definisikan props secara eksplisit
interface MyCustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}


// --- Helper Functions ---
const formatKsaDate = (header: string, short = false): string => {
  const headerStr = String(header);
  if (!/^\d{3,}$/.test(headerStr)) return header;
  try {
    const year = parseInt(headerStr.slice(-2));
    const month = parseInt(headerStr.slice(0, -2));
    const fullYear = 2000 + year;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const longMonthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    if (month >= 1 && month <= 12) return short ? `${monthNames[month - 1]} '${year}` : `${longMonthNames[month - 1]} ${fullYear}`;
    return header;
  } catch (error) { return header; }
};

const kecamatanMap: { [key: string]: string } = {
  '327809': 'Bungursari', '327806': 'Cibeureum',  '327801': 'Cihideung',
  '327802': 'Cipedes',    '327804': 'Indihiang',  '327805': 'Kawalu',
  '327808': 'Mangkubumi', '327810': 'Purbaratu',  '327807': 'Tamansari',
  '327803': 'Tawang'
};

const getModus = (arr: any[]): any => {
    if (!arr.length) return null;
    const freqMap: { [key: string]: number } = {};
    let maxFreq = 0; let modus: any = null;
    arr.forEach(item => {
        const key = String(item);
        freqMap[key] = (freqMap[key] || 0) + 1;
        if (freqMap[key] > maxFreq) { maxFreq = freqMap[key]; modus = item; }
    });
    return modus;
};

const validateStructure = (headers: string[]): string | null => {
    const lowercasedHeaders = headers.map(h => h.toLowerCase().trim());
    if (!lowercasedHeaders.includes('id segmen')) return "Struktur file tidak sesuai. Kolom 'id segmen' tidak ditemukan.";
    if (!lowercasedHeaders.includes('subsegmen')) return "Struktur file tidak sesuai. Kolom 'subsegmen' tidak ditemukan.";
    return null;
};

// Mapping for Y-axis values
const yAxisValueMap: { [key: string]: string } = {
  '1': 'Vegetatif 1 (V1)',
  '2': 'Vegetatif 2 (V2)',
  '3.1': 'Generatif 1',
  '3.2': 'Generatif 2',
  '3.3': 'Generatif 3',
  '4': 'Panen',
  '5': 'Persiapan Lahan',
  '6': 'Puso',
  '7.7': 'Lahan pertanian bukan padi (LL) cabai',
  '7.8': 'Lahan pertanian bukan padi (LL) bawang merah',
  '7.9': 'Lahan pertanian bukan padi (LL) kentang',
  '7.1': 'Lahan pertanian bukan padi (LL) tembakau',
  '7.11': 'Lahan pertanian bukan padi (LL) tebu',
  '7.12': 'Lahan pertanian bukan padi (LL) tanaman pangan lainnya',
  '7.13': 'Lahan pertanian bukan padi (LL) hortikultura lainnya',
  '7.14': 'Lahan pertanian bukan padi (LL) perkebunan lainnya',
  '7.99': 'Lahan pertanian bukan padi (LL) lain-lain',
  '8': 'Bukan lahan pertanian',
  '12': 'Tidak dapat diakses',
  '13': 'Pasca Panen (Beru)'
};

// --- Komponen Tooltip Kustom untuk Chart ---
const CustomTooltip = ({ active, payload, label }: MyCustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <Card className="p-2 text-sm shadow-lg">
        <CardHeader className="p-1 font-bold border-b mb-1">
          {typeof label === 'string' || typeof label === 'number' ? label : String(label)} {/* Handle label type */}
        </CardHeader>
        <CardContent className="p-1">
          {/* Specify the type for 'pld' as Payload<ValueType, NameType> */}
          {payload.map((pld: Payload<ValueType, NameType>) => (
            <div key={pld.dataKey as React.Key} className="flex items-center">
              <div style={{ backgroundColor: pld.color as string }} className="w-2.5 h-2.5 rounded-full mr-2 shrink-0"></div>
              <span className="flex-1 truncate">{pld.dataKey as string}: </span> {/* Cast dataKey to string */}
              {/* Convert numerical value to descriptive string */}
              <span className="font-semibold ml-2">{yAxisValueMap[String(pld.value)] || pld.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  return null;
};


// --- Main Component ---
const InputFile = () => {
  const [data, setData] = useState<ExcelData[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData[] | null>(null);
  const [aggregatedColumns, setAggregatedColumns] = useState<string[]>([]);
  const [allKecamatan, setAllKecamatan] = useState<string[]>([]);
  
  // State for pending selections (before confirmation)
  const [pendingSelectedKecamatan, setPendingSelectedKecamatan] = useState<string[]>([]);
  // State for confirmed selections (used for chart rendering)
  const [confirmedSelectedKecamatan, setConfirmedSelectedKecamatan] = useState<string[]>([]);

  // State to control the open/closed state of the Select dropdown
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  // Effect to sync pending selections when allKecamatan changes (e.g., on file upload)
  useEffect(() => {
    if (allKecamatan.length > 0) {
      // PERBAIKAN: Set default kecamatan yang diinginkan
      const defaultSelection = ['Mangkubumi', 'Indihiang', 'Cibeureum'];
      // Filter defaultSelection untuk memastikan hanya kecamatan yang ada di data yang terpilih
      const availableDefault = defaultSelection.filter(k => allKecamatan.includes(k));
      const initialSelection = availableDefault.length > 0 ? availableDefault : allKecamatan.slice(0, 3);
      setPendingSelectedKecamatan(initialSelection);
      setConfirmedSelectedKecamatan(initialSelection); // Also confirm on initial load
    }
  }, [allKecamatan]);

  const processAggregation = (rows: ExcelData[], originalColumns: string[]) => {
      const idSegmenKey = originalColumns.find(c => c.toLowerCase().trim() === 'id segmen');
      const subsegmenKey = originalColumns.find(c => c.toLowerCase().trim() === 'subsegmen');
      if (!idSegmenKey || !subsegmenKey) return;

      const groupedByKecamatan: { [key: string]: ExcelData[] } = {};
      rows.forEach(row => {
          const idSegmen = String(row[idSegmenKey] || '');
          const kodeKecamatan = idSegmen.substring(0, 6);
          const namaKecamatan = kecamatanMap[kodeKecamatan];
          if (namaKecamatan) {
              if (!groupedByKecamatan[namaKecamatan]) groupedByKecamatan[namaKecamatan] = [];
              groupedByKecamatan[namaKecamatan].push(row);
          }
      });

      const monthColumns = originalColumns.filter(c => c.toLowerCase().trim() !== 'id segmen' && c.toLowerCase().trim() !== 'subsegmen');
      const result: AggregatedData[] = [];
      for (const namaKecamatan in groupedByKecamatan) {
          const kecamatanData = groupedByKecamatan[namaKecamatan];
          const newRow: AggregatedData = { kecamatan: namaKecamatan };
          monthColumns.forEach(month => { newRow[month] = getModus(kecamatanData.map(d => d[month]).filter(v => v != null)); });
          result.push(newRow);
      }
      
      result.sort((a, b) => a.kecamatan.localeCompare(b.kecamatan));
      setAggregatedData(result);
      setAggregatedColumns(['kecamatan', ...monthColumns]);
      
      const kecamatanList = result.map(d => d.kecamatan);
      setAllKecamatan(kecamatanList);
  };

  const processFile = (file: File) => {
    setIsLoading(true); setError(null); setData(null); setAggregatedData(null);
    setPendingSelectedKecamatan([]); setConfirmedSelectedKecamatan([]); setAllKecamatan([]); setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) throw new Error('Gagal membaca buffer file.');
        
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length > 1) {
          const headers: string[] = jsonData[0].map(header => String(header || ''));
          const validationError = validateStructure(headers);
          if (validationError) { setError(validationError); setIsLoading(false); return; }

          const rows: ExcelData[] = jsonData.slice(1).map((row: any[]) =>
            headers.reduce((acc: ExcelData, header: string, index: number) => {
              if (header) acc[header] = row[index];
              return acc;
            }, {} as ExcelData)
          );
          const filteredHeaders = headers.filter(h => h);
          setColumns(filteredHeaders);
          setData(rows);
          processAggregation(rows, filteredHeaders);
        } else {
          setError('File Excel tidak memiliki data atau hanya header.');
        }
      } catch (err) {
        console.error(err); setError('Terjadi kesalahan saat memproses file.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => { setError('Gagal membaca file.'); setIsLoading(false); }
    reader.readAsArrayBuffer(file);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => event.preventDefault();
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Memoized chart data based on confirmed selections
  const chartData = useMemo(() => {
    if (!aggregatedData || aggregatedData.length === 0 || confirmedSelectedKecamatan.length === 0) return [];
    const monthColumns = aggregatedColumns.filter(c => c !== 'kecamatan');
    
    return monthColumns.map(month => {
        const dataPoint: any = { name: formatKsaDate(month, true) };
        aggregatedData.forEach(row => {
            // Only add data for confirmed selected kecamatan
            if (confirmedSelectedKecamatan.includes(row.kecamatan)) {
              const value = row[month];
              dataPoint[row.kecamatan] = value === null || value === undefined ? null : parseFloat(value);
            }
        });
        return dataPoint;
    });
  }, [aggregatedData, aggregatedColumns, confirmedSelectedKecamatan]);

  // Handler for pending selections in the dropdown
  const handlePendingKecamatanSelect = (kecamatan: string) => {
      setPendingSelectedKecamatan(prev => {
        const newSelection = prev.includes(kecamatan) ? prev.filter(k => k !== kecamatan) : [...prev, kecamatan];
        return newSelection;
      });
  };
  
  // Handler for confirming selections
  const handleConfirmSelection = () => {
    setConfirmedSelectedKecamatan(pendingSelectedKecamatan);
    setIsSelectOpen(false); // Close the dropdown after confirmation
  };

  const lineColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A4DE6C', '#D0ED57'];

  return (
    <section className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <Card>
            <CardHeader><CardTitle>Unggah File Excel</CardTitle><CardDescription>Seret & lepas file `.xlsx` dengan struktur KSA yang sesuai.</CardDescription></CardHeader>
            <CardContent>
                <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onDragOver={handleDragOver} onDrop={handleDrop}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-10 h-10 mb-4 text-gray-500" /><p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Klik untuk unggah</span> atau seret dan lepas</p><p className="text-xs text-gray-500">Membutuhkan kolom 'id segmen' dan 'subsegmen'</p>
                    </div>
                    <Input id="file-upload" type="file" className="sr-only" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls, .csv"/>
                </label>
                {fileName && !isLoading && !error && ( <div className="mt-4 text-sm text-center text-green-600">File berhasil diproses: <span className="font-medium">{fileName}</span></div> )}
            </CardContent>
        </Card>
        
        {isLoading && ( <div className="flex items-center justify-center p-4 text-blue-600"><Loader2 className="w-6 h-6 animate-spin mr-2" /><span>Memvalidasi dan memproses file...</span></div> )}
        {error && ( <div className="flex items-center justify-center p-4 text-red-600"><AlertCircle className="w-6 h-6 mr-2" /><p>{error}</p></div> )}

        {data && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><FileIcon className="w-5 h-5 mr-2"/>Pratinjau Data Mentah</CardTitle>
                    <CardDescription>Menampilkan semua baris mentah dari file yang diunggah.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                        <div className="h-[450px] relative">
                            <Table>
                                <TableHeader className="sticky top-0 z-10 bg-background">
                                    <TableRow>
                                        {columns.map((col) => ( <TableHead key={col} className="font-semibold">{formatKsaDate(col)}</TableHead> ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row, rowIndex) => (
                                        <TableRow key={rowIndex}>
                                            {columns.map((col) => ( <TableCell key={col}>{row[col]}</TableCell> ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </CardContent>
            </Card>
        )}

        {aggregatedData && aggregatedData.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><BarChart3 className="w-5 h-5 mr-2"/>Analisis Agregat per Kecamatan</CardTitle>
                    <CardDescription>Tabel ini menampilkan nilai modus (fase tanam dominan) per bulan untuk setiap kecamatan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                        <div className="h-[450px] relative">
                            <Table>
                                <TableHeader className="sticky top-0 z-10 bg-background">
                                    <TableRow>
                                        {aggregatedColumns.map((col) => ( <TableHead key={col} className="font-semibold capitalize">{formatKsaDate(col)}</TableHead> ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {aggregatedData.map((row, rowIndex) => (
                                        <TableRow key={rowIndex}>
                                            {aggregatedColumns.map((col) => ( <TableCell key={col}>{row[col]}</TableCell>))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </CardContent>
            </Card>
        )}
        
        {aggregatedData && aggregatedData.length > 0 && ( // Ensure aggregatedData exists before showing chart section
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><LineChartIcon className="w-5 h-5 mr-2"/>Visualisasi Tren Fase Tanam</CardTitle>
                    <CardDescription>Grafik tren nilai modus fase tanam dari waktu ke waktu per kecamatan. Pilih kecamatan di bawah ini untuk ditampilkan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Label htmlFor="kecamatan-select">Pilih Kecamatan</Label>
                        {/* Control Select open/close state */}
                        <Select open={isSelectOpen} onOpenChange={setIsSelectOpen} onValueChange={() => { /* This can remain empty as checkbox handles state */ }}>
                            <SelectTrigger id="kecamatan-select">
                                <SelectValue placeholder="Pilih kecamatan...">
                                    {pendingSelectedKecamatan.length === 0 && "Tidak ada yang dipilih"}
                                    {pendingSelectedKecamatan.length === 1 && pendingSelectedKecamatan[0]}
                                    {pendingSelectedKecamatan.length === allKecamatan.length && "Semua Kecamatan"}
                                    {pendingSelectedKecamatan.length > 1 && pendingSelectedKecamatan.length < allKecamatan.length && `${pendingSelectedKecamatan.length} Kecamatan terpilih`}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-60 overflow-y-auto">
                                {allKecamatan.map((kecamatan) => (
                                    // Use a div with event listeners to handle clicks and prevent SelectItem from closing
                                    <div
                                        key={kecamatan}
                                        className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                        onMouseDown={(e) => e.preventDefault()} // Prevent dropdown from closing on label click
                                        onClick={() => handlePendingKecamatanSelect(kecamatan)} // Handle the actual selection
                                    >
                                        <Checkbox
                                            id={`checkbox-${kecamatan}`}
                                            checked={pendingSelectedKecamatan.includes(kecamatan)}
                                            className="absolute left-2 top-1/2 -translate-y-1/2"
                                            // No need for onCheckedChange here, as the parent div handles the click
                                        />
                                        <Label htmlFor={`checkbox-${kecamatan}`} className="flex-1 cursor-pointer">
                                            {kecamatan}
                                        </Label>
                                    </div>
                                ))}
                                {/* Confirmation Button at the bottom of the dropdown */}
                                <div className="p-2 border-t">
                                    <Button onClick={handleConfirmSelection} className="w-full">
                                        Konfirmasi Pilihan
                                    </Button>
                                </div>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="h-[400px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis 
                                  stroke="hsl(var(--muted-foreground))" 
                                  fontSize={12} 
                                  domain={[0, 'dataMax + 1']} 
                                  tickFormatter={(value) => yAxisValueMap[String(value)] || String(value)} // Apply value mapping
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
                        {confirmedSelectedKecamatan.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                                <p className="text-muted-foreground font-medium">Pilih setidaknya satu kecamatan untuk menampilkan data.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        )}
    </section>
  );
};

export default InputFile;