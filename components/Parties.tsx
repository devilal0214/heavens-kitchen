
import React from 'react';

const Parties: React.FC = () => {
  return (
    <div className="pt-28 bg-white">
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=2000" 
          className="absolute inset-0 w-full h-full object-cover brightness-50"
          alt="Parties"
        />
        <div className="relative z-10 text-center text-white px-6">
          <h4 className="text-[#F4A261] font-montserrat tracking-[0.3em] uppercase mb-4">Events & Celebrations</h4>
          <h1 className="text-5xl md:text-7xl font-playfair">Host Your Moments</h1>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-playfair mb-6">Unforgettable Experiences</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">From intimate birthdays to grand corporate dinners, our team handles everything to make your event perfect.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-gray-50 p-12 rounded-[50px] hover:shadow-xl transition-all border border-gray-100">
            <div className="text-4xl mb-6">🎂</div>
            <h3 className="text-3xl font-playfair mb-6">Birthday Parties</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">Special decor, customized menus, and a dedicated host to ensure your celebration is exactly how you imagined it.</p>
            <ul className="space-y-3 mb-10 text-sm text-gray-500">
              <li className="flex items-center"><span className="text-red-500 mr-2">✓</span> Personalized Cake</li>
              <li className="flex items-center"><span className="text-red-500 mr-2">✓</span> Themed Decorations</li>
              <li className="flex items-center"><span className="text-red-500 mr-2">✓</span> DJ & Sound System</li>
            </ul>
            <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold">Enquire Now</button>
          </div>

          <div className="bg-gray-50 p-12 rounded-[50px] hover:shadow-xl transition-all border border-gray-100">
            <div className="text-4xl mb-6">💼</div>
            <h3 className="text-3xl font-playfair mb-6">Corporate Dinners</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">Impress your clients and colleagues with a sophisticated setting and professional service tailored for business.</p>
            <ul className="space-y-3 mb-10 text-sm text-gray-500">
              <li className="flex items-center"><span className="text-red-500 mr-2">✓</span> Private Dining Areas</li>
              <li className="flex items-center"><span className="text-red-500 mr-2">✓</span> Presentation Screens</li>
              <li className="flex items-center"><span className="text-red-500 mr-2">✓</span> Multi-course Menus</li>
            </ul>
            <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold">Enquire Now</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Parties;
