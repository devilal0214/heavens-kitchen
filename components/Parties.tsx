
import React from 'react';

interface PartiesProps {
  onNavigate: (v: any) => void;
}

const Parties: React.FC<PartiesProps> = ({ onNavigate }) => {
  return (
    <div className="bg-white">
   <section className="w-full relative h-[35vh] md:h-[45vh] overflow-hidden mt-[70px] md:mt-0">

{/* Static background image */}
<img 
  src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2400&auto=format&fit=crop"
  alt="Events & Celebrations"
  className="w-full h-full object-cover"
/>

{/* Overlay */}
<div className="absolute inset-0 bg-black/65"></div>

{/* Content */}
<div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
  <div className="max-w-2xl animate-fade-down">
    
    <span className="inline-block px-4 py-1.5 bg-[#FFB30E] text-black text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] rounded-[15px] shadow-xl mb-4 md:mb-6">
      Events & Celebrations
    </span>

    <h2 className="text-4xl md:text-7xl font-playfair font-bold text-white drop-shadow-2xl leading-tight">
      Host Your <span className="italic text-[#FFB30E]">Moments</span>
    </h2>

    <div className="h-[1px] w-12 bg-white/30 mx-auto my-4 md:my-6"></div>

    <p className="text-white/90 font-black uppercase tracking-[0.4em] text-[10px] md:text-xs">
      Birthdays • Corporate • Celebrations
    </p>

  </div>
</div>

</section>

      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-playfair mb-6">Unforgettable Experiences</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">From intimate birthdays to grand corporate dinners, our team handles everything to make your event perfect.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-gray-50 p-12 rounded-[15px] hover:shadow-xl transition-all border border-gray-100">
            <div className="text-4xl mb-6">🎂</div>
            <h3 className="text-3xl font-playfair mb-6">Birthday Parties</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">Special decor, customized menus, and a dedicated host to ensure your celebration is exactly how you imagined it.</p>
            <ul className="space-y-3 mb-10 text-sm text-gray-500">
              <li className="flex items-center"><span className="text-red-500 mr-2">✓</span> Personalized Cake</li>
              <li className="flex items-center"><span className="text-red-500 mr-2">✓</span> Themed Decorations</li>
              <li className="flex items-center"><span className="text-red-500 mr-2">✓</span> DJ & Sound System</li>
            </ul>
            <button
  onClick={() => onNavigate('contact')}
  className="w-full py-4 bg-gray-900 text-white rounded-[15px] font-bold hover:bg-black transition-all"
>
  Enquire Now
</button>          </div>

          <div className="bg-gray-50 p-12 rounded-[15px] hover:shadow-xl transition-all border border-gray-100">
            <div className="text-4xl mb-6">💼</div>
            <h3 className="text-3xl font-playfair mb-6">Corporate Dinners</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">Impress your clients and colleagues with a sophisticated setting and professional service tailored for business.</p>
            <ul className="space-y-3 mb-10 text-sm text-gray-500">
              <li className="flex items-center"><span className="text-red-500 mr-2">✓</span> Private Dining Areas</li>
              <li className="flex items-center"><span className="text-red-500 mr-2">✓</span> Presentation Screens</li>
              <li className="flex items-center"><span className="text-red-500 mr-2">✓</span> Multi-course Menus</li>
            </ul>
            <button
  onClick={() => onNavigate('contact')}
  className="w-full py-4 bg-gray-900 text-white rounded-[15px] font-bold hover:bg-black transition-all"
>
  Enquire Now
</button>             </div>
        </div>
      </section>
    </div>
  );
};

export default Parties;
