/* eslint-disable @typescript-eslint/no-explicit-any */

'use client'

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

interface ExcelData {
  [key: string]: any;
}

const InputFile = () => {
  const [data, setData] = useState<ExcelData[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          setError('Gagal membaca file.');
          setIsLoading(false);
          return;
        }
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length > 0) {
          const headers: string[] = jsonData[0];
          const rows: ExcelData[] = jsonData.slice(1).map((row: any[]) =>
            headers.reduce((acc: ExcelData, header: string, index: number) => {
              acc[header] = row[index];
              return acc;
            }, {} as ExcelData)
          );
          setColumns(headers);
          setData(rows);
        } else {
          setError('File Excel kosong.');
        }
        setIsLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error(err);
      setError('Gagal membaca file.');
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-amber-300 min-h-screen p-4">
      <Card>
        <CardHeader>
          <CardTitle>Unggah File Excel</CardTitle>
          <CardDescription>Pilih file Excel untuk menampilkan isinya.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
        </CardContent>
      </Card>
      {isLoading && <p className="mt-4">Memproses...</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
      {data && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Data Excel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col, index) => (
                      <TableHead key={index}>{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row: ExcelData, rowIndex: number) => (
                    <TableRow key={rowIndex}>
                      {columns.map((col, colIndex) => (
                        <TableCell key={colIndex}>{row[col]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InputFile;