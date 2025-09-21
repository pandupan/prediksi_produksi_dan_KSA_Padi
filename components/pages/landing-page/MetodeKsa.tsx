"use client";

import React from 'react';
import Image from 'next/image';
import { motion, type Variants } from 'framer-motion';
import { FiGrid, FiMaximize, FiLock } from 'react-icons/fi';

// Data untuk kartu informasi berdasarkan gambar
const metodeData = [
  {
    icon: <FiGrid size={24} className="text-green-700" />,
    text: "Satu Segmen terdiri dari 9 Subsegmen dengan total luas 9 hektar.",
  },
  {
    icon: <FiMaximize size={24} className="text-green-700" />,
    text: "Setiap subsegmen berluas 1 hektar dengan jarak antar subsegmen 10 meter.",
  },
  {
    icon: <FiLock size={24} className="text-green-700" />,
    text: "Koordinat segmen terpilih dikunci untuk diamati selama 7 hari terakhir setiap bulan.",
  },
];

const MetodeKsa = () => {
  // Varian animasi untuk kontainer utama
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.3
      }
    }
  };

  // Varian animasi untuk kolom teks
  const textVariants: Variants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
  };

  // Varian animasi untuk kolom gambar
  const imageVariants: Variants = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
  };

  return (
    <section id="metode-ksa" className="py-20 bg-white">
      <motion.div
        className="container mx-auto px-6 max-w-6xl"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.3 }}
      >
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Kolom Gambar */}
          <motion.div 
            className="lg:w-1/2 w-full"
            variants={imageVariants}
          >
            <div className="relative w-full h-96 lg:h-[500px] shadow-xl rounded-lg overflow-hidden group">
              <Image
                // Pastikan URL gambar ini dapat diakses secara publik. 
                // Anda bisa mengunggahnya ke layanan seperti Imgur, Vercel Blob, atau menyimpannya di folder /public.
                src="https://i.ibb.co.com/SwF0hxqp/Screenshot-2025-07-25-221613-2.png" 
                alt="Diagram Metode KSA"
                layout="fill"
                objectFit="contain"
                className="bg-gray-100 p-2"
              />
            </div>
          </motion.div>

          {/* Kolom Teks & Kartu Informasi */}
          <motion.div className="lg:w-1/2 text-center lg:text-left" variants={textVariants}>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Metode KSA
            </h2>
            <div className="w-24 h-1 bg-green-700 mx-auto lg:mx-0 mb-6" />
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Metode KSA merupakan pendekatan statistik spasial untuk mengestimasi luas panen dan produksi padi. Metode ini dikembangkan dengan dukungan FAO, USDA, dan Eurostat, lalu diterapkan oleh Badan Pusat Statistik (BPS) Indonesia sejak 2018. Dalam KSA, sebuah <strong>segmen</strong> adalah kumpulan sampel area pengamatan yang mewakili populasi sawah.
            </p>
            
            {/* Kartu Informasi */}
            <div className="space-y-4">
              {metodeData.map((item, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg shadow-md border-l-4 border-green-600 hover:shadow-lg transition-shadow duration-300"
                  variants={textVariants} // Menggunakan varian yang sama untuk efek stagger
                >
                  <div className="flex-shrink-0 bg-green-100 p-3 rounded-full">
                    {item.icon}
                  </div>
                  <p className="text-gray-700 text-left">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
};

export default MetodeKsa;