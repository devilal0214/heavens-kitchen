
import React from 'react';
import { UserProfile, UserRole } from '../types';

interface FooterProps {
  onNavigate: (v: any) => void;
  staffUser: UserProfile | null;
}

const Footer: React.FC<FooterProps> = ({ onNavigate, staffUser }) => {
  const isStaffAuthenticated = staffUser && (staffUser.role === UserRole.SUPER_ADMIN || staffUser.role === UserRole.OUTLET_OWNER);

  return (
    <footer className="bg-gray-900 text-white pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 md:gap-20 mb-20">
          {/* Brand Identity */}
          <div className="lg:max-w-xs">
            <div className="flex items-center mb-8">
              <div className="w-10 h-10 bg-[#C0392B] rounded-xl flex items-center justify-center text-white font-bold text-2xl mr-3">H</div>
              <span className="text-2xl font-bold font-playfair">Havens Kitchen</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed mb-8">
              Delhi's premier multi-outlet dining destination. Where every meal is a sanctuary of flavour.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">FB</a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">IG</a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">TW</a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:pl-10 lg:pl-20">
            <h4 className="font-bold mb-8 uppercase tracking-widest text-xs">Quick Links</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li><button onClick={() => onNavigate('home')} className="hover:text-[#C0392B] transition-colors">Home</button></li>
              <li><button onClick={() => onNavigate('menu')} className="hover:text-[#C0392B] transition-colors">Menu</button></li>
              <li><button onClick={() => onNavigate('about')} className="hover:text-[#C0392B] transition-colors">About Us</button></li>
              <li><button onClick={() => onNavigate('parties')} className="hover:text-[#C0392B] transition-colors">Parties</button></li>
              <li><button onClick={() => onNavigate('contact')} className="hover:text-[#C0392B] transition-colors">Contact</button></li>
              <li>
                <button 
                  onClick={() => onNavigate(isStaffAuthenticated ? 'admin' : 'login-staff')} 
                  className="text-[#FFB30E] font-bold hover:underline"
                >
                  Staff Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="md:pl-10 lg:pl-20">
            <h4 className="font-bold mb-8 uppercase tracking-widest text-xs">Support</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li><a href="#" className="hover:text-[#C0392B] transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-[#C0392B] transition-colors">Delivery Range</a></li>
              <li><a href="#" className="hover:text-[#C0392B] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#C0392B] transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">
          <p>© 2024 Havens Kitchen Group. All Rights Reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-8">
            <p>Made in India</p>
            <p>South Delhi Outlets</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
