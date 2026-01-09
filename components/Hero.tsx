import React, { useState, useRef, useEffect } from "react";
import { Outlet } from "../types";

interface HeroProps {
  outlets: Outlet[];
  onSelectOutlet: (o: Outlet) => void;
  onNavigate: (view: string) => void;
  userLocation: any;
  locationStatus: string;
  distanceToNearest: number;
}

const Hero: React.FC<HeroProps> = ({ outlets, onSelectOutlet, onNavigate }) => {
  const [showReserveOutlets, setShowReserveOutlets] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowReserveOutlets(false);
    };
    if (showReserveOutlets) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showReserveOutlets]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!modalRef.current) return;
      if (showReserveOutlets && !modalRef.current.contains(e.target as Node)) {
        setShowReserveOutlets(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showReserveOutlets]);

  const handleReserveClick = () => setShowReserveOutlets((s) => !s);

  const handleSelectForReserve = (o: any) => {
    onSelectOutlet(o);
    setShowReserveOutlets(false);
    onNavigate("contact");
  };

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
          className="mt-12 md:mt-16 animate-fade-up flex flex-col sm:flex-row gap-4 md:gap-6 items-center justify-center"
          style={{ animationDelay: "500ms" }}
        >
          <button
            onClick={handleReserveClick}
            className="group relative bg-white/10 backdrop-blur-sm text-white px-10 md:px-16 py-5 rounded-[15px] font-black uppercase tracking-[0.4em] text-[11px] shadow-[0_20px_50px_rgba(192,57,43,0.2)] hover:bg-white hover:text-black transition-all duration-500 active:scale-95 border-2 border-white/30"
          >
            RESERVE A TABLE
          </button>
          <button
            onClick={() => onSelectOutlet(outlets[0])}
            className="group relative bg-[#C0392B] text-white px-12 md:px-20 py-5 rounded-[15px] font-black uppercase tracking-[0.4em] text-[11px] shadow-[0_20px_50px_rgba(192,57,43,0.3)] hover:bg-white hover:text-black transition-all duration-500 active:scale-95 border-2 border-white/10"
          >
            ORDER NOW
          </button>
        </div>
        {/* Reserve Outlet Picker Modal */}
        {showReserveOutlets && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              ref={modalRef}
              className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Choose an outlet</h3>
                <button
                  onClick={() => setShowReserveOutlets(false)}
                  className="text-gray-500 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {outlets.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => handleSelectForReserve(o)}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:shadow-md text-left"
                  >
                    <img
                      src={o.thumbnail || o.imageUrl || "/placeholder.png"}
                      alt={o.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div>
                      <div className="font-semibold">{o.name}</div>
                      <div className="text-sm text-gray-600">{o.address}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
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
