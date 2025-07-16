/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/tasikmalaya-geojson.ts
export const tasikmalayaGeoJson: any = {
  "type": "FeatureCollection",
  "features": [
    // Data GeoJSON untuk setiap kecamatan di Tasikmalaya akan ada di sini.
    // Contoh untuk beberapa kecamatan:
    {
      "type": "Feature",
      "properties": { "KECAMATAN": "Cihideung" },
      "geometry": { "type": "Polygon", "coordinates": [ [ [108.22,-7.32], [108.23,-7.32], [108.23,-7.33], [108.22,-7.33], [108.22,-7.32] ] ] }
    },
    {
      "type": "Feature",
      "properties": { "KECAMATAN": "Cipedes" },
      "geometry": { "type": "Polygon", "coordinates": [ [ [108.24,-7.31], [108.25,-7.31], [108.25,-7.32], [108.24,-7.32], [108.24,-7.31] ] ] }
    },
    {
      "type": "Feature",
      "properties": { "KECAMATAN": "Tawang" },
      "geometry": { "type": "Polygon", "coordinates": [ [ [108.23,-7.33], [108.24,-7.33], [108.24,-7.34], [108.23,-7.34], [108.23,-7.33] ] ] }
    },
    {
      "type": "Feature",
      "properties": { "KECAMATAN": "Indihiang" },
      "geometry": { "type": "Polygon", "coordinates": [ [ [108.20,-7.30], [108.21,-7.30], [108.21,-7.31], [108.20,-7.31], [108.20,-7.30] ] ] }
    },
     {
      "type": "Feature",
      "properties": { "KECAMATAN": "Bungursari" },
      "geometry": { "type": "Polygon", "coordinates": [ [ [108.20, -7.34], [108.21, -7.34], [108.21, -7.35], [108.20, -7.35], [108.20, -7.34] ] ] }
    },
    {
      "type": "Feature",
      "properties": { "KECAMATAN": "Cibeureum" },
      "geometry": { "type": "Polygon", "coordinates": [ [ [108.27, -7.36], [108.28, -7.36], [108.28, -7.37], [108.27, -7.37], [108.27, -7.36] ] ] }
    },
    {
      "type": "Feature",
      "properties": { "KECAMATAN": "Kawalu" },
      "geometry": { "type": "Polygon", "coordinates": [ [ [108.22, -7.38], [108.23, -7.38], [108.23, -7.39], [108.22, -7.39], [108.22, -7.38] ] ] }
    },
    {
      "type": "Feature",
      "properties": { "KECAMATAN": "Mangkubumi" },
      "geometry": { "type": "Polygon", "coordinates": [ [ [108.19, -7.36], [108.20, -7.36], [108.20, -7.37], [108.19, -7.37], [108.19, -7.36] ] ] }
    },
    {
      "type": "Feature",
      "properties": { "KECAMATAN": "Purbaratu" },
      "geometry": { "type": "Polygon", "coordinates": [ [ [108.27, -7.33], [108.28, -7.33], [108.28, -7.34], [108.27, -7.34], [108.27, -7.33] ] ] }
    },
    {
      "type": "Feature",
      "properties": { "KECAMATAN": "Tamansari" },
      "geometry": { "type": "Polygon", "coordinates": [ [ [108.29, -7.40], [108.30, -7.40], [108.30, -7.41], [108.29, -7.41], [108.29, -7.40] ] ] }
    }
    // Anda harus mengganti 'coordinates' dengan data poligon yang sebenarnya untuk akurasi.
    // Pastikan properti "KECAMATAN" namanya sama persis dengan yang ada di data Excel Anda.
  ]
};