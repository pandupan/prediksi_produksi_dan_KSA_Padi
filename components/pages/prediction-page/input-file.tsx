/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { UploadCloud, File as FileIcon, Loader2, AlertCircle, BarChart3 } from 'lucide-react';

interface ExcelData {
  [key: string]: any;
}

interface AggregatedData {
    kecamatan: string;
    [month: string]: any;
}

const formatKsaDate = (header: string): string => {
  const headerStr = String(header);
  if (!/^\d{3,}$/.test(headerStr)) return header;
  try {
    const year = parseInt(headerStr.slice(-2));
    const month = parseInt(headerStr.slice(0, -2));
    const fullYear = 2000 + year;
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    if (month >= 1 && month <= 12) return `${monthNames[month - 1]} ${fullYear}`;
    return header;
  } catch (error) {
    return header;
  }
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
    let maxFreq = 0;
    let modus: any = null;
    arr.forEach(item => {
        const key = String(item);
        freqMap[key] = (freqMap[key] || 0) + 1;
        if (freqMap[key] > maxFreq) {
            maxFreq = freqMap[key];
            modus = item;
        }
    });
    return modus;
};

// FUNGSI VALIDASI STRUKTUR FILE
const validateStructure = (headers: string[]): string | null => {
    // PERBAIKAN: Menggunakan .trim() untuk menghapus spasi tak terlihat di awal/akhir header
    const lowercasedHeaders = headers.map(h => h.toLowerCase().trim());
    
    // PERBAIKAN: Mencari 'id segmen' dengan spasi, sesuai dataset Anda.
    if (!lowercasedHeaders.includes('id segmen')) {
        return "Struktur file tidak sesuai. Kolom 'id segmen' tidak ditemukan.";
    }
    if (!lowercasedHeaders.includes('subsegmen')) {
        return "Struktur file tidak sesuai. Kolom 'subsegmen' tidak ditemukan.";
    }
    return null; // Jika valid, kembalikan null
};

const InputFile = () => {
  const [data, setData] = useState<ExcelData[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData[] | null>(null);
  const [aggregatedColumns, setAggregatedColumns] = useState<string[]>([]);

  const processAggregation = (rows: ExcelData[], originalColumns: string[]) => {
      // PERBAIKAN: Mencari 'id segmen' (dengan spasi) secara case-insensitive.
      const idSegmenKey = originalColumns.find(c => c.toLowerCase().trim() === 'id segmen');
      const subsegmenKey = originalColumns.find(c => c.toLowerCase().trim() === 'subsegmen');

      if (!idSegmenKey || !subsegmenKey) return;

      const groupedByKecamatan: { [key: string]: ExcelData[] } = {};

      rows.forEach(row => {
          const idSegmen = String(row[idSegmenKey] || '');
          const kodeKecamatan = idSegmen.substring(0, 6);
          const namaKecamatan = kecamatanMap[kodeKecamatan];
          if (namaKecamatan) {
              if (!groupedByKecamatan[namaKecamatan]) {
                  groupedByKecamatan[namaKecamatan] = [];
              }
              groupedByKecamatan[namaKecamatan].push(row);
          }
      });

      const monthColumns = originalColumns.filter(
        c => c.toLowerCase().trim() !== 'id segmen' && c.toLowerCase().trim() !== 'subsegmen'
      );
      
      const result: AggregatedData[] = [];

      for (const namaKecamatan in groupedByKecamatan) {
          const kecamatanData = groupedByKecamatan[namaKecamatan];
          const newRow: AggregatedData = { kecamatan: namaKecamatan };
          monthColumns.forEach(month => {
              const monthValues = kecamatanData.map(d => d[month]).filter(v => v != null);
              newRow[month] = getModus(monthValues);
          });
          result.push(newRow);
      }
      
      result.sort((a, b) => a.kecamatan.localeCompare(b.kecamatan));
      setAggregatedData(result);
      setAggregatedColumns(['kecamatan', ...monthColumns]);
  };

  const processFile = (file: File) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    setAggregatedData(null);
    setFileName(file.name);

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
          if (validationError) {
              setError(validationError);
              setIsLoading(false);
              return;
          }

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
        console.error(err);
        setError('Terjadi kesalahan saat memproses file.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
        setError('Gagal membaca file.');
        setIsLoading(false);
    }
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

  return (
    <section className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Unggah File Excel</CardTitle>
          <CardDescription>
            Seret & lepas file `.xlsx` atau `.xls` dengan struktur KSA yang sesuai.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label 
            htmlFor="file-upload" 
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadCloud className="w-10 h-10 mb-4 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Klik untuk unggah</span> atau seret dan lepas</p>
              <p className="text-xs text-gray-500">Membutuhkan kolom 'id segmen' dan 'subsegmen'</p>
            </div>
            <Input id="file-upload" type="file" className="sr-only" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls, .csv"/>
          </label>
           {fileName && !isLoading && !error && (
            <div className="mt-4 text-sm text-center text-green-600">
                File berhasil diproses: <span className="font-medium">{fileName}</span>
            </div>
           )}
        </CardContent>
      </Card>
      
      {isLoading && (
        <div className="flex items-center justify-center p-4 text-blue-600"><Loader2 className="w-6 h-6 animate-spin mr-2" /><span>Memvalidasi dan memproses file...</span></div>
      )}

      {error && (
        <div className="flex items-center justify-center p-4 text-red-600"><AlertCircle className="w-6 h-6 mr-2" /><p>{error}</p></div>
      )}

      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><FileIcon className="w-5 h-5 mr-2"/>Pratinjau Data Mentah</CardTitle>
            <CardDescription>Menampilkan semua baris mentah dari file yang diunggah.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-[450px] overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background whitespace-nowrap">
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
                        <TableCell key={col} className="whitespace-nowrap">
                          {row[col]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PERBAIKAN: Kondisi diubah menjadi .length > 0 */}
      {aggregatedData && aggregatedData.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><BarChart3 className="w-5 h-5 mr-2"/>Analisis Agregat per Kecamatan</CardTitle>
                <CardDescription>
                    Tabel ini menampilkan nilai modus (fase tanam dominan) per bulan untuk setiap kecamatan.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative overflow-auto rounded-lg border" style={{maxHeight: '450px'}}>
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-background whitespace-nowrap">
                            <TableRow>
                                {aggregatedColumns.map((col) => (
                                    <TableHead key={col} className="font-semibold capitalize">
                                        {formatKsaDate(col)}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {aggregatedData.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {aggregatedColumns.map((col) => (
                                        <TableCell key={col} className="whitespace-nowrap">
                                            {row[col]}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      )}
    </section>
  );
};

export default InputFile;