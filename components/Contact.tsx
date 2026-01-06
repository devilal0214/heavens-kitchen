
import React, { useState, useEffect, useRef } from 'react';
import { RealtimeDB } from '../services/mockDb';
import { Outlet } from '../types';

const Contact: React.FC = () => {
  const [subject, setSubject] = useState('Table Reservation');
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    members: '',
    dateTime: '',
    outlet: '',
    message: ''
  });

  // Get current time in ISO format for the 'min' attribute
  const minDateTime = new Date().toISOString().slice(0, 16);

  useEffect(() => {
    const fetchOutlets = () => {
      setOutlets(RealtimeDB.getOutlets());
    };
    fetchOutlets();
    return RealtimeDB.onUpdate(fetchOutlets);
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const nameRegex = /^[a-zA-Z\s]{2,30}$/;
    
    if (!nameRegex.test(formData.firstName.trim())) {
      newErrors.firstName = 'Letters only (2-30 chars)';
    }
    if (!nameRegex.test(formData.lastName.trim())) {
      newErrors.lastName = 'Letters only (2-30 chars)';
    }
    
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Enter valid 10-digit number';
    }

    if (subject === 'Table Reservation') {
      if (!formData.members || Number(formData.members) <= 0 || Number(formData.members) > 50) {
        newErrors.members = 'Select 1-50 members';
      }
      
      if (!formData.dateTime) {
        newErrors.dateTime = 'Select date & time';
      } else {
        const selectedDate = new Date(formData.dateTime);
        const now = new Date();
        if (selectedDate <= now) {
          newErrors.dateTime = 'Must be in the future';
        }
      }

      if (!formData.outlet) newErrors.outlet = 'Select a location';
    }

    if (subject === 'Event Enquiry' && !formData.outlet) {
      newErrors.outlet = 'Select a location';
    }

    if (!formData.message.trim() || formData.message.length < 10) {
      newErrors.message = 'Minimum 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      setTimeout(() => {
        alert('Your sanctuary reservation enquiry has been successfully sent!');
        setIsSubmitting(false);
        setFormData({ firstName: '', lastName: '', phone: '', members: '', dateTime: '', outlet: '', message: '' });
      }, 1500);
    }
  };

  const handlePickerTrigger = () => {
    if (dateInputRef.current) {
      try {
        // @ts-ignore - showPicker is a newer browser API
        if (dateInputRef.current.showPicker) {
          // @ts-ignore
          dateInputRef.current.showPicker();
        } else {
          // Fallback to focus/click
          dateInputRef.current.focus();
        }
      } catch (err) {
        console.debug("Native picker trigger failed", err);
        dateInputRef.current.focus();
      }
    }
  };

  return (
    <div className="pt-28 bg-white pb-20">
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16 animate-fade-up">
          <h1 className="text-5xl md:text-7xl font-playfair mb-6 text-gray-900">Get in Touch</h1>
          <p className="text-gray-500 text-lg italic">"Connecting you to the heart of the Havens heritage."</p>
        </div>

        <div className="max-w-3xl mx-auto mb-32">
          <div className="bg-gray-50 p-10 md:p-14 rounded-[50px] shadow-sm border border-gray-100 animate-fade-up">
            <h2 className="text-3xl font-playfair mb-10 text-center text-gray-900">Reservation Enquiry</h2>
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">First Name</label>
                  <input 
                    type="text" 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="John" 
                    className={`w-full bg-white border ${errors.firstName ? 'border-red-500' : 'border-gray-100'} rounded-2xl px-5 py-4 outline-none focus:ring-4 ring-red-500/5 font-bold transition-all`} 
                  />
                  {errors.firstName && <p className="text-[9px] text-red-500 font-bold mt-1 ml-2 uppercase tracking-tighter">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Last Name</label>
                  <input 
                    type="text" 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Doe" 
                    className={`w-full bg-white border ${errors.lastName ? 'border-red-500' : 'border-gray-100'} rounded-2xl px-5 py-4 outline-none focus:ring-4 ring-red-500/5 font-bold transition-all`} 
                  />
                  {errors.lastName && <p className="text-[9px] text-red-500 font-bold mt-1 ml-2 uppercase tracking-tighter">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Phone Number (10 Digits)</label>
                <input 
                  type="tel" 
                  maxLength={10}
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="98XXXXXXXX" 
                  className={`w-full bg-white border ${errors.phone ? 'border-red-500' : 'border-gray-100'} rounded-2xl px-5 py-4 outline-none focus:ring-4 ring-red-500/5 font-bold transition-all`} 
                />
                {errors.phone && <p className="text-[9px] text-red-500 font-bold mt-1 ml-2 uppercase tracking-tighter">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Subject</label>
                <select 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 ring-red-500/5 font-bold transition-all cursor-pointer appearance-none"
                >
                  <option value="Table Reservation">Table Reservation</option>
                  <option value="Event Enquiry">Event Enquiry</option>
                  <option value="Feedback">Feedback</option>
                  <option value="General Support">General Support</option>
                </select>
              </div>

              {subject === 'Table Reservation' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Number of Members</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="50" 
                      value={formData.members}
                      onChange={(e) => setFormData({...formData, members: e.target.value})}
                      placeholder="e.g. 4" 
                      className={`w-full bg-white border ${errors.members ? 'border-red-500' : 'border-gray-100'} rounded-2xl px-5 py-4 outline-none focus:ring-4 ring-red-500/5 font-bold transition-all`} 
                    />
                    {errors.members && <p className="text-[9px] text-red-500 font-bold mt-1 ml-2 uppercase tracking-tighter">{errors.members}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Select Date & Time</label>
                    <div 
                      className="relative group cursor-pointer"
                      onClick={handlePickerTrigger}
                    >
                      <input 
                        ref={dateInputRef}
                        type="datetime-local" 
                        min={minDateTime}
                        step="60"
                        value={formData.dateTime}
                        onChange={(e) => setFormData({...formData, dateTime: e.target.value})}
                        className={`w-full bg-white border ${errors.dateTime ? 'border-red-500' : 'border-gray-100'} rounded-2xl px-5 py-4 pl-12 outline-none focus:ring-4 ring-red-500/5 font-bold transition-all cursor-pointer block text-sm`} 
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-[#C0392B] transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    </div>
                    {errors.dateTime && <p className="text-[9px] text-red-500 font-bold mt-1 ml-2 uppercase tracking-tighter">{errors.dateTime}</p>}
                  </div>
                </div>
              )}

              {(subject === 'Table Reservation' || subject === 'Event Enquiry') && (
                <div className="animate-fade-up">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Choose Sanctuary Outlet</label>
                  <select 
                    value={formData.outlet}
                    onChange={(e) => setFormData({...formData, outlet: e.target.value})}
                    className={`w-full bg-white border ${errors.outlet ? 'border-red-500' : 'border-gray-100'} rounded-2xl px-5 py-4 outline-none focus:ring-4 ring-red-500/5 font-bold transition-all cursor-pointer appearance-none`}
                  >
                    <option value="">Select a Location</option>
                    {outlets.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                  {errors.outlet && <p className="text-[9px] text-red-500 font-bold mt-1 ml-2 uppercase tracking-tighter">{errors.outlet}</p>}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Message</label>
                <textarea 
                  rows={4} 
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Additional requests or notes for our staff..." 
                  className={`w-full bg-white border ${errors.message ? 'border-red-500' : 'border-gray-100'} rounded-2xl px-5 py-4 outline-none focus:ring-4 ring-red-500/5 font-bold transition-all resize-none`}
                ></textarea>
                {errors.message && <p className="text-[9px] text-red-500 font-bold mt-1 ml-2 uppercase tracking-tighter">{errors.message}</p>}
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 bg-[#C0392B] text-white rounded-[32px] font-black uppercase tracking-[0.25em] text-[11px] shadow-2xl shadow-red-900/10 hover:bg-black transition-all border-2 border-[#FFB30E] active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Send Enquiry'}
              </button>
            </form>
          </div>
        </div>

        {/* OUTLET LOCATION CARDS */}
        <div className="animate-fade-up">
          <div className="text-center mb-16">
            <h4 className="text-[#C0392B] font-black uppercase tracking-[0.4em] text-[10px] mb-4">Our Physical Sanctuaries</h4>
            <h2 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900">Visit Us</h2>
          </div>
          
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 max-w-5xl mx-auto gap-10`}>
            {outlets.map((o, idx) => (
              <div 
                key={o.id} 
                className="bg-white rounded-[50px] overflow-hidden border border-gray-100 shadow-xl hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all duration-500 group flex flex-col h-full"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="relative h-64 overflow-hidden">
                  <img src={o.imageUrl} alt={o.name} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-8">
                    <span className="bg-[#FFB30E] text-black px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {o.isActive ? 'Online Now' : 'Closed'}
                    </span>
                  </div>
                </div>
                
                <div className="p-10 flex flex-col flex-grow">
                  <h3 className="text-2xl font-playfair font-bold mb-4 group-hover:text-[#C0392B] transition-colors text-gray-900">{o.name}</h3>
                  
                  <div className="space-y-4 mb-10 flex-grow">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-[#C0392B] shrink-0 mt-0.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <p className="text-gray-500 text-sm italic leading-relaxed">{o.address}</p>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      </div>
                      <p className="text-gray-500 text-sm font-bold">{o.contact}</p>
                    </div>
                  </div>

                  <button className="w-full py-4 border-2 border-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:border-[#C0392B] hover:text-[#C0392B] transition-all flex items-center justify-center gap-2">
                    Get Directions 
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
