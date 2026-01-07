
import React, { useState, useEffect, useRef } from 'react';
import { OrderItem, UserProfile, Outlet, GlobalSettings } from '../types';
import { FirestoreDB } from '../services/firestoreDb';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  onUpdateQty: (id: string, variant: string, delta: number) => void;
  onCheckout: (details: any) => void;
  initialUser: UserProfile | null;
  currentOutlet?: Outlet | null;
}

const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, items, onUpdateQty, onCheckout, initialUser, currentOutlet }) => {
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);

  useEffect(() => {
    FirestoreDB.getGlobalSettings().then(setSettings).catch(console.error);
  }, []);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [isVerifyingAddress, setIsVerifyingAddress] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [formData, setFormData] = useState({ 
    name: initialUser?.name || '', 
    phone: initialUser?.phone || '', 
    address: initialUser?.address || '', 
    payment: 'UPI' as 'UPI' | 'CARD' | 'COD'
  });

  useEffect(() => {
    if (initialUser) {
      setFormData(prev => ({
        ...prev,
        name: initialUser.name,
        phone: initialUser.phone,
        address: initialUser.address
      }));
    }
  }, [initialUser, isOpen]);

  useEffect(() => {
    if (checkoutStep === 2 && formData.address.length > 5) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      setIsVerifyingAddress(true);
      debounceTimer.current = setTimeout(() => {
        autoDetectLocation(formData.address);
      }, 1000);
    } else {
      setDistanceKm(null);
      setIsVerifyingAddress(false);
    }
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [formData.address, checkoutStep]);

  const autoDetectLocation = (address: string) => {
    if (!currentOutlet) return;
    let simulatedDist = 2.5;
    const addr = address.toLowerCase();
    if (addr.includes('noida') || addr.includes('gurgaon') || addr.includes('far')) {
      simulatedDist = 8.4;
    } else if (addr.includes('moti') || addr.includes('kalka') || addr.includes('near')) {
      simulatedDist = 1.8;
    } else {
      simulatedDist = Math.max(1, (address.length % 12) + 0.5);
    }
    setDistanceKm(simulatedDist);
    setIsVerifyingAddress(false);
  };

  const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const tax = settings ? subtotal * (settings.gstPercentage / 100) : 0;
  
  let deliveryCharge = 0;
  if (distanceKm !== null && settings) {
    const sortedTiers = [...settings.deliveryTiers].sort((a,b) => a.upToKm - b.upToKm);
    const matchingTier = sortedTiers.find(t => distanceKm <= t.upToKm);
    if (matchingTier) deliveryCharge = matchingTier.charge;
    else deliveryCharge = settings.deliveryBaseCharge + (distanceKm * settings.deliveryChargePerKm);
  }
  const total = subtotal + tax + deliveryCharge;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    
    if (!nameRegex.test(formData.name.trim())) {
      newErrors.name = 'Name must contain letters only';
    }
    
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Invalid 10-digit number (starts with 6-9)';
    }

    if (!formData.address.trim() || formData.address.length < 10) {
      newErrors.address = 'Detailed address required (min 10 chars)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: value });
  };

  const handleNextStep = () => {
    if (checkoutStep === 1 && items.length > 0) {
      setCheckoutStep(2);
    } else if (checkoutStep === 2) {
      if (validate()) {
        onCheckout({ ...formData, subtotal, tax, deliveryCharge, total });
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setCheckoutStep(1);
        setErrors({});
      }, 500);
    }
  }, [isOpen]);

  return (
    <div className={`fixed inset-0 z-[200] transition-all duration-500 ${isOpen ? 'visible' : 'invisible'}`}>
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      ></div>

      <div className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)] transition-transform duration-500 transform flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white mt-12 sm:mt-0">
          <div>
            <h2 className="text-3xl font-playfair font-bold text-gray-900 leading-none">Your Haven Box</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#C0392B] mt-2 opacity-60">Checkout Protocol</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-[#C0392B] rounded-full transition-all active:scale-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto no-scrollbar p-8">
          {checkoutStep === 1 ? (
            <div className="space-y-10">
              {items.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-7xl mb-6 grayscale opacity-20">🍱</div>
                  <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Your sanctuary box is empty.</p>
                  <button onClick={onClose} className="mt-8 text-[#C0392B] font-black text-[11px] uppercase tracking-widest hover:underline">Explore Menu</button>
                </div>
              ) : (
                items.map(item => (
                  <div key={`${item.menuItemId}-${item.variant}`} className="flex items-center justify-between group animate-fade-up">
                    <div className="flex-1 pr-4">
                      <h4 className="font-bold text-xl text-gray-800 leading-tight mb-1 group-hover:text-[#C0392B] transition-colors">{item.name}</h4>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        {item.variant === 'full' ? 'Full Portions' : (item.variant === 'half' ? 'Half Portions' : 'Quarter Portions')}
                      </p>
                    </div>
                    <div className="flex items-center bg-gray-50 rounded-2xl p-1 shadow-sm border border-gray-100">
                      <button 
                        onClick={() => onUpdateQty(item.menuItemId, item.variant, -1)} 
                        className="w-10 h-10 flex items-center justify-center bg-white shadow-sm rounded-xl text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M20 12H4" /></svg>
                      </button>
                      <span className="w-10 text-center font-black text-gray-900 text-lg tabular-nums">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQty(item.menuItemId, item.variant, 1)} 
                        className="w-10 h-10 flex items-center justify-center bg-white shadow-sm rounded-xl text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-fade-up">
              <div>
                <h3 className="text-2xl font-playfair font-bold text-gray-900 mb-2">Delivery Details</h3>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Secure Shipping Protocol</p>
              </div>
              <div className="space-y-4">
                <div className="group">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-1 mb-2 block">Receiver Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className={`w-full px-6 py-4 rounded-2xl border ${errors.name ? 'border-red-500' : 'border-gray-100'} bg-gray-50 outline-none font-bold text-sm focus:bg-white focus:ring-4 ring-red-50 transition-all`} 
                    placeholder="Letters only"
                  />
                  {errors.name && <p className="text-[8px] text-red-500 font-bold mt-1 ml-2 uppercase">{errors.name}</p>}
                </div>
                <div className="group">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-1 mb-2 block">Phone (10 Digits)</label>
                  <input 
                    type="tel" 
                    maxLength={10}
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className={`w-full px-6 py-4 rounded-2xl border ${errors.phone ? 'border-red-500' : 'border-gray-100'} bg-gray-50 outline-none font-bold text-sm focus:bg-white focus:ring-4 ring-red-50 transition-all`} 
                    placeholder="98XXXXXXXX"
                  />
                  {errors.phone && <p className="text-[8px] text-red-500 font-bold mt-1 ml-2 uppercase">{errors.phone}</p>}
                </div>
                <div className="group">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-1 mb-2 block">Full Address</label>
                  <textarea 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className={`w-full px-6 py-4 rounded-2xl border ${errors.address ? 'border-red-500' : 'border-gray-100'} bg-gray-50 outline-none font-bold text-sm focus:bg-white focus:ring-4 ring-red-50 transition-all resize-none`} 
                    placeholder="House No, Street, Landmark..."
                    rows={3}
                  />
                  {errors.address && <p className="text-[8px] text-red-500 font-bold mt-1 ml-2 uppercase">{errors.address}</p>}
                </div>
              </div>
              
              <div className="mt-12">
                <h4 className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest text-center">Payment Verification</h4>
                <div className="grid grid-cols-3 gap-3">
                  {(['UPI', 'CARD', 'COD'] as const).map(m => (
                    <button 
                      key={m}
                      onClick={() => setFormData({...formData, payment: m})}
                      className={`py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${formData.payment === m ? 'bg-[#C0392B] text-white border-[#FFB30E]' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-10 bg-white border-t border-gray-50 space-y-6">
          <button 
            disabled={items.length === 0 || isVerifyingAddress}
            onClick={handleNextStep}
            className="w-full py-6 bg-[#C0392B] text-white rounded-[32px] font-black uppercase tracking-[0.25em] text-[11px] shadow-2xl hover:bg-black transition-all border-2 border-[#FFB30E] active:scale-95 disabled:opacity-50"
          >
            {checkoutStep === 1 ? 'ENTER DETAILS' : (isVerifyingAddress ? 'LOCATING...' : 'PLACE ORDER NOW')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartModal;
