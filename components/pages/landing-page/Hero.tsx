import React from 'react';
import Link from 'next/link'

interface HeroProps {
  heading: string;
  message: string;
}

const Hero: React.FC<HeroProps> = ({ heading, message }) => {
  return (
    <section id="hero">
      <div className="relative flex w-full items-center h-[100vh] mb-[10rem] bg-fixed bg-center bg-cover hero-img">
        {/*Overlayer*/}
        <div className='absolute h-full top-0 left-0 right-0 bottom-0 bg-black/40 z-[2]'/>
        
        <div className='p-5 text-white z-[2] ml-[-10rem] mt-[-10rm] sm:space-y-4'>
          <div className='ml-[10rem] sm:w-[800px] sm:pl-[120px] mt-10'>
            <h2 className='text-3xl sm:text-4xl font-bold'>{heading}</h2>
            <p className='py-5 text-xl font-semibold tracking-[3px] italic'>{message}</p>
            <button className='px-8 py-2 border rounded-lg mt-4'>
              <Link href='#contact'>Analisis Terbaru Kami</Link>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
