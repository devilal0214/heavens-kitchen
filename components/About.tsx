
import React from 'react';

const About: React.FC = () => {
  return (
    <div className="bg-white w-full overflow-x-hidden min-h-screen">
      {/* Cinematic Brand Heritage Hero - Exact Match to New Reference Image */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
        {/* Multi-layered Cinematic Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2000" 
            alt="Havens Kitchen Legacy" 
            className="w-full h-full object-cover opacity-70"
          />
          {/* Subtle Vignette & Dark Overlays */}
          <div className="absolute inset-0 bg-black/40"></div>
          
          {/* CRITICAL: The bottom white floor fade matching the reference */}
          <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-white via-white/95 to-transparent"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 text-center px-6 max-w-7xl animate-fade-up">
          
          {/* Established Header with precise gold lines */}
          <div className="flex items-center justify-center gap-4 mb-6 md:mb-8">
            <div className="h-[1.5px] w-10 md:w-20 bg-[#FFB30E]"></div>
            <span className="text-[#FFB30E] font-black uppercase tracking-[0.6em] text-[8px] md:text-[11px]">
              ESTABLISHED 1984
            </span>
            <div className="h-[1.5px] w-10 md:w-20 bg-[#FFB30E]"></div>
          </div>
          
          {/* Main Hero Headline - Mixed Weights/Colors */}
          <h1 className="text-[3.5rem] md:text-[7rem] lg:text-[9rem] font-playfair leading-none tracking-tight text-white mb-6 drop-shadow-2xl">
            A Legacy of <span className="text-[#C0392B] font-bold">Taste.</span>
          </h1>
          
          {/* Action/Descriptor Line - Wide Spacing */}
          <div className="mt-6 md:mt-8">
            <p className="text-gray-500 font-black uppercase tracking-[0.45em] text-[8px] md:text-[11px] flex items-center justify-center gap-3 md:gap-5 opacity-80">
              TAKEAWAY <span className="text-gray-400 opacity-50">•</span> DELIVERY <span className="text-gray-400 opacity-50">•</span> MEMORIES
            </p>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-10 animate-bounce">
          <div className="w-[1.5px] h-16 bg-black"></div>
        </div>
      </section>

      {/* Main Narrative Section - Continuing the Premium Story */}
      <section className="max-w-7xl mx-auto px-6 py-24 md:py-48">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="animate-fade-up">
            <div className="mb-12">
               <span className="text-[#C0392B] font-black uppercase tracking-[0.4em] text-[10px]">Our History</span>
               <div className="h-1 w-12 bg-[#C0392B] mt-2"></div>
            </div>
            <h2 className="text-5xl md:text-8xl font-playfair mb-10 leading-[0.9] text-gray-900 tracking-tighter">
              Our Story, <br/>
              <span className="text-[#C0392B] italic">Our Haven.</span>
            </h2>
            <div className="space-y-8 text-lg text-gray-500 leading-relaxed font-medium">
              <p>
                In the bustling heart of New Delhi in 1984, our founder envisioned a culinary sanctuary—a place where recipes weren't just instructions, but passed-down legacies of love and precision.
              </p>
              <p>
                Today, Heaven's Kitchen stands as a beacon of authentic taste. From our signature slow-simmered gravies to our artisan hand-folded momos, every element is a tribute to the craftsmanship of the past and the vibrancy of the present.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12 mt-20 pt-12 border-t border-gray-100">
              <div>
                <h4 className="text-5xl font-playfair font-black text-[#C0392B] mb-1">40+</h4>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Years of Passion</p>
              </div>
              <div>
                <h4 className="text-5xl font-playfair font-black text-[#C0392B] mb-1">150+</h4>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Legacy Recipes</p>
              </div>
              <div>
                <h4 className="text-5xl font-playfair font-black text-[#C0392B] mb-1">2</h4>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sanctuary Hubs</p>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="grid grid-cols-2 gap-8 items-stretch">
              <div className="space-y-8">
                <div className="h-[450px] rounded-[50px] overflow-hidden shadow-2xl relative group-hover:rotate-1 transition-transform duration-1000">
                  <img src="https://images.unsplash.com/photo-1577214459173-9c8651f59966?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover brightness-90 grayscale hover:grayscale-0 transition-all duration-700" alt="Kitchen Craft" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-8 left-8 text-white font-playfair italic text-xl">The Hand Crafted.</div>
                </div>
                <div className="bg-gray-50 h-32 rounded-[40px] border border-gray-100 p-8 flex items-center justify-center">
                   <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] text-center">Since 1984 • South Delhi</p>
                </div>
              </div>
              <div className="pt-20">
                <div className="h-full min-h-[500px] rounded-[50px] overflow-hidden shadow-2xl relative group-hover:-rotate-1 transition-transform duration-1000">
                  <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=600" className="w-full h-full object-cover brightness-90 grayscale hover:grayscale-0 transition-all duration-700" alt="Plated Excellence" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-8 left-8 text-white font-playfair italic text-xl">The Sanctuary.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="bg-gray-900 text-white py-32 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-playfair mb-20 text-[#FFB30E]">Our Culinary Creed</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="space-y-6">
              <div className="text-4xl text-[#FFB30E] opacity-50 font-playfair">01</div>
              <h3 className="text-xl font-bold uppercase tracking-widest">Purity</h3>
              <p className="text-white/40 text-sm leading-relaxed">No preservatives. No short-cuts. Just ingredients in their prime.</p>
            </div>
            <div className="space-y-6">
              <div className="text-4xl text-[#FFB30E] opacity-50 font-playfair">02</div>
              <h3 className="text-xl font-bold uppercase tracking-widest">Patience</h3>
              <p className="text-white/40 text-sm leading-relaxed">Our gravies simmer for 12 hours to reach their legendary depth.</p>
            </div>
            <div className="space-y-6">
              <div className="text-4xl text-[#FFB30E] opacity-50 font-playfair">03</div>
              <h3 className="text-xl font-bold uppercase tracking-widest">Purpose</h3>
              <p className="text-white/40 text-sm leading-relaxed">To serve more than food—to serve an experience of sanctuary.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
