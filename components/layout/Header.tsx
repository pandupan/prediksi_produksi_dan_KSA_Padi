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
  }, []);

  return (
    <div
      style={{ backgroundColor: `${color}` }}
      className="fixed left-0 top-0 w-full z-[999] ease-in duration-300"
    >
      <div className="max-w-[11240px] m-auto flex justify-between items-center text-white my-[6px]">
        <Link href="#hero">
          <div className="flex justify-center items-center">
            <div className="flex flex-col items-center justify-center">
              <Image
                src="/images/logo.png"
                width={40}
                height={40}
                alt="Logo Company"
                className="sm:ml-10 sm:p-4 mr-2 ml-1 p-6 w-[50px] h-[35px] sm:w-auto sm:h-auto "
              />
              <div
                className="ml-2 sm:ml-8 text-center text-sm sm:tracking-[2.5px]"
                style={{ color: `${textColor}` }}
              >
                <h2 className="font-bold">LUMBUNG</h2>
                <h2 className="font-bold">NUSA</h2>
              </div>
            </div>
            <div
              className="ml-2 sm:ml-4 text-base sm:tracking-[1.5px]"
              style={{ color: `${textColor}` }}
            >
              <h2 className="font-semibold italic ">
                &quot;Wujudkan Inovasi Ketahan Pangan Bangsa!&quot;
              </h2>
            </div>
          </div>
        </Link>

        <ul
          style={{ color: `${textColor}` }}
          className="hidden sm:flex font-semibold mr-4"
        >
          <li className="p-4 hover:text-blue-500 hover:border-b-2 hover:border-blue-500 transform hover:scale-110 hover:mt-2 hover:font-bold ">
            <Link href="#projects">Dashboard</Link>
          </li>
          <li className="p-4 hover:text-blue-500 hover:border-b-2 hover:border-blue-500 transform hover:scale-110 hover:mt-2 hover:font-bold ">
            <Link href="#about">Deskripsi KSA</Link>
          </li>
          <li className="p-4 hover:text-blue-500 hover:border-b-2 hover:border-blue-500 transform hover:scale-110 hover:mt-2 hover:font-bold ">
            <Link href="#projects">Visualisasi</Link>
          </li>
          <li className="p-4 hover:text-blue-500 hover:border-b-2 hover:border-blue-500 transform hover:scale-110 hover:mt-2 hover:font-bold ">
            <Link href="#about">Coba Sekarang</Link>
          </li>
        </ul>

        {/*Hamburger Button*/}
        <div className="block sm:hidden z-10 p-2" onClick={handleNav}>
          {nav ? (
            <AiOutlineClose size={28} style={{ color: `${textColor}` }} />
          ) : (
            <AiOutlineMenu size={28} style={{ color: `${textColor}` }} />
          )}
        </div>

        {/*Mobile Header*/}
        <div
          className={
            nav
              ? "sm:hidden absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center w-full h-[100vh] bg-black text-center ease-in duration-300"
              : "sm:hidden absolute top-0 left-[-100%] right-0 bottom-0 flex justify-center items-center w-full h-[100vh] bg-black text-center ease-in duration-300"
          }
        >
          <ul>
            <li className="p-4 text-4xl hover:text-blue-500 hover:border-b-2 hover:border-blue-500 transform hover:scale-110 hover:mt-2 hover:font-bold">
              <Link href="#services">Product</Link>
            </li>
            <li className="p-4 text-4xl hover:text-blue-500 hover:border-b-2 hover:border-blue-500 transform hover:scale-110 hover:mt-2 hover:font-bold">
              <Link href="#process">Process</Link>
            </li>
            <li className="p-4 text-4xl hover:text-blue-500 hover:border-b-2 hover:border-blue-500 transform hover:scale-110 hover:mt-2 hover:font-bold">
              <Link href="#projects">Project</Link>
            </li>
            <li className="p-4 text-4xl hover:text-blue-500 hover:border-b-2 hover:border-blue-500 transform hover:scale-110 hover:mt-2 hover:font-bold">
              <Link href="#about">About Us</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Header;
