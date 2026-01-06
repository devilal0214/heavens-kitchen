
import React, { useState, useEffect } from 'react';
import { UserRole, UserProfile } from '../types';
import { RealtimeDB } from '../services/dbAdapter';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
  onBackToHome?: () => void;
  initialIsStaff?: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, onBackToHome, initialIsStaff = false }) => {
  const [isStaff, setIsStaff] = useState(initialIsStaff);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [showCustomerPassword, setShowCustomerPassword] = useState(false);
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    password: ''
  });

  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  useEffect(() => {
    setIsStaff(initialIsStaff);
    setLoginError('');
  }, [initialIsStaff]);

  const validateCustomer = () => {
    if (!isLoginMode) {
      const nameRegex = /^[a-zA-Z\s]{2,50}$/;
      if (!nameRegex.test(formData.name.trim())) return 'Name must contain letters only (2-50 chars)';
      
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(formData.phone)) return 'Invalid 10-digit mobile number starting with 6-9';
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) return 'Invalid email address';
      
      if (formData.password.length < 6) return 'Password must be at least 6 characters';
      if (!formData.address.trim() || formData.address.length < 10) return 'Please provide a full delivery address';
    } else {
      if (!formData.email || !formData.password) return 'Please fill all fields';
    }
    return null;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: value });
  };

  const handleCustomerAction = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const validationMsg = validateCustomer();
    if (validationMsg) {
      setLoginError(validationMsg);
      return;
    }

    if (isLoginMode) {
      const allCustomers = RealtimeDB.getCustomers();
      const found = allCustomers.find(u => u.email === formData.email && u.password === formData.password);
      
      if (found) {
        onLogin(found);
      } else {
        setLoginError('Invalid Email or Password.');
      }
    } else {
      const allCustomers = RealtimeDB.getCustomers();
      if (allCustomers.some(u => u.email === formData.email)) {
        setLoginError('An account with this email already exists.');
        return;
      }

      const newUser: UserProfile = {
        id: `cust-${Date.now()}`,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        password: formData.password,
        role: UserRole.CUSTOMER
      };
      
      RealtimeDB.saveCustomer(newUser);
      onLogin(newUser);
    }
  };

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!staffEmail || !staffPassword) {
      setLoginError('Staff ID and Security Code are required');
      return;
    }

    const allStaff = RealtimeDB.getStaffUsers();
    const foundStaff = allStaff.find(u => u.email === staffEmail && u.password === staffPassword);

    if (foundStaff) {
      onLogin(foundStaff);
    } else {
      setLoginError('Invalid Station ID or Security Code.');
    }
  };

  const EyeIcon = ({ visible }: { visible: boolean }) => (
    visible ? (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
      </svg>
    ) : (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 pt-20">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-lg animate-fade-up border border-gray-100">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[#C0392B] rounded-3xl flex items-center justify-center text-white text-4xl font-bold mx-auto mb-6 shadow-xl shadow-red-900/10">H</div>
          <h2 className="text-4xl font-playfair font-bold text-gray-900">
            {isStaff ? 'Staff Portal' : (isLoginMode ? 'Welcome Back' : 'Join the Haven')}
          </h2>
          <p className="text-gray-400 mt-2 font-medium">
            {isStaff 
              ? 'Secure access for management' 
              : (isLoginMode ? 'Login to your sanctuary account' : 'Create your account for seamless dining')}
          </p>
        </div>

        {loginError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-bounce">
            {loginError}
          </div>
        )}

        {!isStaff ? (
          <form onSubmit={handleCustomerAction} className="space-y-5" noValidate>
            {!isLoginMode && (
              <>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Arjun Kapoor"
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-[#C0392B]/20 transition-all outline-none font-medium text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Phone (10 Digits)</label>
                  <input 
                    type="tel" 
                    maxLength={10}
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="98XXXXXXXX"
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-[#C0392B]/20 transition-all outline-none font-medium text-sm"
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Email Address</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="name@email.com"
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-[#C0392B]/20 transition-all outline-none font-medium text-sm"
              />
            </div>

            {!isLoginMode && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Default Delivery Address</label>
                <textarea 
                  rows={2}
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  placeholder="Where should we send your sanctuary?"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-[#C0392B]/20 transition-all outline-none font-medium text-sm resize-none"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Password</label>
              <div className="relative">
                <input 
                  type={showCustomerPassword ? "text" : "password"} 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-[#C0392B]/20 transition-all outline-none font-medium text-sm pr-12"
                />
                <button 
                  type="button"
                  onClick={() => setShowCustomerPassword(!showCustomerPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C0392B] transition-colors"
                >
                  <EyeIcon visible={showCustomerPassword} />
                </button>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-[#C0392B] text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-red-900/10 hover:bg-black transition-all border border-[#FFB30E]"
            >
              {isLoginMode ? 'Sign In & Enjoy' : 'Create Account'}
            </button>

            <div className="text-center pt-4 flex flex-col gap-3">
              <button 
                type="button"
                onClick={() => { setIsLoginMode(!isLoginMode); setLoginError(''); }}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#C0392B] transition-colors"
              >
                {isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Login"}
              </button>
              {onBackToHome && (
                <button 
                  type="button"
                  onClick={onBackToHome}
                  className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-gray-900 transition-colors"
                >
                  ← Return to Home
                </button>
              )}
            </div>
          </form>
        ) : (
          <form onSubmit={handleStaffLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Station ID</label>
              <input 
                required
                type="text" 
                value={staffEmail}
                onChange={e => setStaffEmail(e.target.value)}
                placeholder="Enter Staff ID..."
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-[#C0392B]/20 transition-all outline-none font-medium text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Security Code</label>
              <div className="relative">
                <input 
                  required
                  type={showStaffPassword ? "text" : "password"} 
                  value={staffPassword}
                  onChange={e => setStaffPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-[#C0392B]/20 transition-all outline-none font-medium text-sm pr-12"
                />
                <button 
                  type="button"
                  onClick={() => setShowStaffPassword(!showStaffPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C0392B] transition-colors"
                >
                  <EyeIcon visible={showStaffPassword} />
                </button>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-[#C0392B] text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-red-900/10 hover:bg-black transition-all border border-[#FFB30E]"
            >
              Enter Dashboard
            </button>

            <div className="text-center pt-2">
              <button 
                type="button"
                onClick={onBackToHome}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#C0392B] transition-colors"
              >
                ← Go to Home
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
