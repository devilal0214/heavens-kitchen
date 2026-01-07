
import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile } from '../types';

interface NavbarProps {
  onNavigate: (view: any) => void;
  currentView: string;
  cartCount: number;
  onCartOpen: () => void;
  user: UserProfile | null;
  onLogout: () => void;
  forceGlass?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentView, cartCount, onCartOpen, user, onLogout, forceGlass }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', id: 'home' },
    { label: 'About', id: 'about' },
    { label: 'Menu', id: 'menu' },
    { label: 'Parties', id: 'parties' },
    { label: 'Contact', id: 'contact' },
  ];

  const useGlass = isScrolled || forceGlass;
  const linkHoverColor = useGlass ? 'hover:text-[#E31E24]' : 'hover:text-[#FFB30E]';
  const linkBaseColor = useGlass ? 'text-gray-600' : 'text-white/80';

  return (
    <>
      {/* Primary Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-[150] transition-all duration-500 px-6 ${
        useGlass ? 'py-2 glass-nav shadow-lg border-b border-gray-100' : 'py-4 bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* LOGO */}
          <div 
            className="flex items-center cursor-pointer group scale-90 sm:scale-100 origin-left"
            onClick={() => onNavigate('home')}
          >
            <img
              src="https://heavenskitchen.in/images/logo.png"
              alt="Havens Kitchen Logo"
              className="w-[70px]"
            />
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map(link => (
              <button
                key={link.label}
                onClick={() => onNavigate(link.id)}
                className={`relative font-poppins text-xs font-bold uppercase tracking-widest nav-underline transition-colors ${
                  currentView === link.id ? 'text-[#E31E24]' : `${linkBaseColor} ${linkHoverColor}`
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 md:space-x-6">
            <button 
              onClick={onCartOpen}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${
                useGlass ? 'bg-gray-50 text-gray-700 hover:bg-red-50 hover:text-[#C0392B]' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C0392B] text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <div 
                className="relative"
                onMouseEnter={() => setShowProfileDropdown(true)}
                onMouseLeave={() => setShowProfileDropdown(false)}
              >
                <button 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    useGlass ? 'border-[#C0392B] bg-white text-[#C0392B]' : 'border-white/30 bg-white/10 text-white'
                  } font-black text-xs hover:scale-105 shadow-md`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>

                <div className={`absolute right-0 top-full pt-4 transition-all duration-300 transform origin-top-right ${
                  showProfileDropdown ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                }`}>
                  <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden min-w-[200px]">
                    <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#C0392B]">Logged In</p>
                      <p className="text-xs font-bold text-gray-800 truncate">{user.name}</p>
                    </div>
                    <div className="flex flex-col p-2">
                      <button 
                        onClick={() => onNavigate('profile')}
                        className="flex items-center px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#C0392B] hover:bg-red-50 rounded-lg transition-all"
                      >
                        My Profile
                      </button>
                      <button 
                        onClick={() => onNavigate('my-orders')}
                        className="flex items-center px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#C0392B] hover:bg-red-50 rounded-lg transition-all"
                      >
                        Order History
                      </button>
                      <button 
                        onClick={() => onNavigate('contact')}
                        className="flex items-center px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#C0392B] hover:bg-red-50 rounded-lg transition-all"
                      >
                        Help Center
                      </button>
                      <button 
                        onClick={onLogout}
                        className="flex items-center px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-lg transition-all border-t border-gray-50 mt-1 pt-3"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => onNavigate('login')}
                className={`w-10 h-10 rounded-[15px] flex items-center justify-center border-2 transition-all ${
                  useGlass ? 'border-gray-200 bg-gray-50 text-gray-400' : 'border-white/20 bg-white/5 text-white'
                } hover:border-[#C0392B] hover:text-[#C0392B] shadow-sm`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </button>
            )}

            <button 
              className="md:hidden p-2 group"
              onClick={() => setMobileMenuOpen(true)}
            >
              <div className={`w-6 h-1 mb-1 transition-all ${useGlass ? 'bg-gray-900' : 'bg-[#FFB30E]'}`}></div>
              <div className={`w-6 h-1 mb-1 transition-all ${useGlass ? 'bg-gray-900' : 'bg-[#FFB30E]'}`}></div>
              <div className={`w-4 h-1 ml-auto transition-all ${useGlass ? 'bg-gray-900' : 'bg-[#FFB30E]'}`}></div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Moved outside nav to avoid stacking context issues with backdrop-filter */}
      <div className={`fixed inset-0 z-[300] transition-all duration-500 ${mobileMenuOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'}`}>
        <div 
          className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} 
          onClick={() => setMobileMenuOpen(false)}
        ></div>
        <div className={`absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white p-8 sm:p-12 shadow-2xl flex flex-col transition-transform duration-500 transform ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between mb-8 sm:mb-12">
            <img
              src="https://heavenskitchen.in/images/logo.png"
              alt="Havens Kitchen Logo"
              className="w-[60px] sm:w-[70px]"
            />
            <button 
              className="p-2 text-gray-400 hover:text-[#C0392B] hover:rotate-90 transition-all" 
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="flex flex-col space-y-8 sm:space-y-10 flex-grow justify-center">
            {navLinks.map((link) => (
              <button 
                key={link.label}
                onClick={() => { onNavigate(link.id); setMobileMenuOpen(false); }}
                className={`text-3xl sm:text-4xl font-bold uppercase tracking-tighter text-left transition-colors ${currentView === link.id ? 'text-[#E31E24]' : 'text-black hover:text-[#C0392B]'}`}
              >
                {link.label}
              </button>
            ))}
            
            <div className="pt-8 border-t border-gray-100">
              <button 
                onClick={() => { onCartOpen(); setMobileMenuOpen(false); }}
                className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                View Cart ({cartCount})
              </button>
            </div>
          </div>

          <div className="mt-auto pt-10 text-center">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Sanctuary Collections</p>
             <p className="text-[8px] font-bold text-gray-200 mt-2">© 2024 Havens Kitchen</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
