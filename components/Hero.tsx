import React from "react";
import { Outlet } from "../types";

interface HeroProps {
  outlets: Outlet[];
  onSelectOutlet: (o: Outlet) => void;
  userLocation: any;
  locationStatus: string;
  distanceToNearest: number;
}

const Hero: React.FC<HeroProps> = ({ outlets, onSelectOutlet }) => {
  return (
    <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Cinematic Background Image with Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://plus.unsplash.com/premium_photo-1661883237884-263e8de8869b?q=80&w=2378&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Havens Kitchen Experience"
          className="w-full h-full object-cover opacity-80 scale-105 animate-[zoomIn_10s_infinite_alternate]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60"></div>

        {/* Subtle Radiating Rays for depth */}
        <div className="absolute inset-0 bg-rays opacity-10 pointer-events-none"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center">
        {/* Top Tagline */}
        <div className="animate-fade-down flex items-center gap-4 mb-4">
          <div className="h-[1px] w-8 md:w-12 bg-[#FFB30E]/50"></div>
          <p className="text-[#FFB30E] font-black uppercase tracking-[0.4em] text-[9px] md:text-[11px]">
            Since 1984 • Takeaway & Delivery
          </p>
          <div className="h-[1px] w-8 md:w-12 bg-[#FFB30E]/50"></div>
        </div>

        {/* Hero Headline */}
        <h1 className="animate-fade-up text-4xl md:text-[10rem] lg:text-[10rem] font-playfair leading-[0.85] text-white drop-shadow-2xl">
          Meals <span className="italic">&</span>
          <br />
          <span className="text-[#C0392B]">Memories.</span>
        </h1>

        {/* Secondary Tagline */}
        <div
          className="mt-8 md:mt-12 space-y-4 animate-fade-up"
          style={{ animationDelay: "300ms" }}
        >
          <p className="text-white/80 font-black uppercase tracking-[0.3em] text-[10px] md:text-xs">
            We deliver your food without any excuses.
          </p>
          <p className="text-[#FFB30E]/60 italic font-medium text-sm md:text-lg">
            Free Home Delivery Within 2 Kms.
          </p>
        </div>

        {/* Centered CTA */}
        <div
          className="mt-12 md:mt-16 animate-fade-up"
          style={{ animationDelay: "500ms" }}
        >
          <button
            onClick={() => onSelectOutlet(outlets[0])}
            className="group relative bg-[#C0392B] text-white px-12 md:px-20 py-5 rounded-[15px] font-black uppercase tracking-[0.4em] text-[11px] shadow-[0_20px_50px_rgba(192,57,43,0.3)] hover:bg-white hover:text-black transition-all duration-500 active:scale-95 border-2 border-white/10"
          >
            ORDER NOW
          </button>
        </div>
      </div>

      {/* Bottom Scrolling Indicator (Visual Element) */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 animate-bounce">
        <div className="w-[1px] h-12 bg-white"></div>
      </div>

      {/* Side Decorative Text (Optional aesthetic) */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 -rotate-90 origin-left hidden xl:block opacity-20 pointer-events-none">
        <p className="text-white font-black uppercase tracking-[1em] text-[10px]">
          THE CULINARY SANCTUARY
        </p>
      </div>
      <div className="absolute right-10 top-1/2 -translate-y-1/2 rotate-90 origin-right hidden xl:block opacity-20 pointer-events-none">
        <p className="text-white font-black uppercase tracking-[1em] text-[10px]">
          AUTHENTIC SINCE 1984
        </p>
      </div>
    </section>
  );
};

export default Hero;
