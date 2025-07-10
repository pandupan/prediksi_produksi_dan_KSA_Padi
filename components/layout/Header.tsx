"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { AiOutlineMenu, AiOutlineClose } from "react-icons/ai";

const Header = () => {
  const [nav, setNav] = useState(false);
  const [color, setColor] = useState("transparent");
  const [textColor, setTextColor] = useState("white");

  const handleNav = () => {
    setNav(!nav);
  };

  useEffect(() => {
    const changeColor = () => {
      if (window.scrollY >= 90) {
        setColor("#ffffff");
        setTextColor("#000000");
      } else {
        setColor("transparent");
        setTextColor("#ffffff");
      }
    };
    window.addEventListener("scroll", changeColor);
    return () => window.removeEventListener("scroll", changeColor);
  }, []);

  return (
    <div
      style={{ backgroundColor: `${color}` }}
      className="fixed left-0 top-0 w-full z-[999] ease-in duration-300"
    >
      <div className="max-w-[1240px] m-auto flex justify-between items-center px-4 py-2">
        <Link href="#hero" className="flex items-center">
          <div className="flex flex-col items-center justify-center">
            <Image
              src="/images/logo.png"
              width={50}
              height={40}
              alt="Logo Company"
              className="block w-[35px] h-[35px] sm:w-auto sm:h-auto sm:p-2"
            />
            {/* Teks disembunyikan di mobile */}
            <div
              className="hidden sm:block ml-2 sm:ml-4 text-center text-sm sm:tracking-[2.5px]"
              style={{ color: `${textColor}` }}
            >
              <h2 className="font-bold">LUMBUNG</h2>
              <h2 className="font-bold">NUSA</h2>
            </div>
          </div>
        </Link>

        {/* Tagline */}
        <div
          className="hidden sm:block ml-4 text-base sm:tracking-[1.5px]"
          style={{ color: `${textColor}` }}
        >
          <h2 className="font-semibold italic">
            &quot;Wujudkan Inovasi Ketahan Pangan Bangsa!&quot;
          </h2>
        </div>

        {/* Navigasi Desktop */}
        <ul
          style={{ color: `${textColor}` }}
          className="hidden sm:flex font-semibold space-x-4"
        >
          <li className="p-2 hover:text-blue-500 hover:border-b-2 hover:border-blue-500 transition-all duration-200">
            <Link href="#projects">Dashboard</Link>
          </li>
          <li className="p-2 hover:text-blue-500 hover:border-b-2 hover:border-blue-500 transition-all duration-200">
            <Link href="#about">Deskripsi KSA</Link>
          </li>
          <li className="p-2 hover:text-blue-500 hover:border-b-2 hover:border-blue-500 transition-all duration-200">
            <Link href="#projects">Visualisasi</Link>
          </li>
          <li className="p-2 hover:text-blue-500 hover:border-b-2 hover:border-blue-500 transition-all duration-200">
            <Link href="#about">Coba Sekarang</Link>
          </li>
        </ul>

        {/* Hamburger Mobile */}
        <div className="sm:hidden z-20" onClick={handleNav}>
          {nav ? (
            <AiOutlineClose size={28} style={{ color: `${textColor}` }} />
          ) : (
            <AiOutlineMenu size={28} style={{ color: `${textColor}` }} />
          )}
        </div>

        {/* Mobile Menu */}
        <div
          className={`sm:hidden absolute top-0 left-0 w-full h-screen bg-black text-white flex justify-center items-center transition-all duration-300 ${
            nav ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <ul className="space-y-8 text-center text-2xl font-bold">
            <li onClick={handleNav}>
              <Link href="#projects">Dashboard</Link>
            </li>
            <li onClick={handleNav}>
              <Link href="#about">Deskripsi KSA</Link>
            </li>
            <li onClick={handleNav}>
              <Link href="#projects">Visualisasi</Link>
            </li>
            <li onClick={handleNav}>
              <Link href="#about">Coba Sekarang</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Header;
