
import React, { useState, useEffect } from 'react';
import { UserRole, Outlet, AppState, Coordinates, MenuItem, Order, OrderStatus, UserProfile } from './types';
import { RealtimeDB } from './services/mockDb';
import { getUserLocation, findNearestOutlet } from './services/locationService';

// --- COMPONENTS ---
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HomeContent from './components/HomeContent';
import MenuPage from './components/MenuPage';
import CartModal from './components/CartModal';
import OrderTracking from './components/OrderTracking';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import About from './components/About';
import Parties from './components/Parties';
import Contact from './components/Contact';
import Footer from './components/Footer';
import MyOrders from './components/MyOrders';

type ViewType = 'home' | 'menu' | 'tracking' | 'admin' | 'owner' | 'login' | 'login-staff' | 'about' | 'parties' | 'contact' | 'profile' | 'my-orders';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('home');
  const [state, setState] = useState<AppState>({
    currentUser: null,
    staffUser: null,
    outlets: RealtimeDB.getOutlets(),
    currentOutlet: null,
    userLocation: null,
    cart: []
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'detecting' | 'success' | 'failed'>('detecting');
  const [distanceToNearest, setDistanceToNearest] = useState<number>(0);

  useEffect(() => {
    const init = async () => {
      try {
        const loc = await getUserLocation();
        const outlets = RealtimeDB.getOutlets();
        const { outlet, distance } = findNearestOutlet(loc, outlets);
        
        setState(prev => ({
          ...prev,
          userLocation: loc,
          outlets: outlets,
          currentOutlet: outlet
        }));
        setDistanceToNearest(distance);
        setLocationStatus('success');
      } catch (err) {
        console.error("Location detection failed:", err);
        setLocationStatus('failed');
        const outlets = RealtimeDB.getOutlets();
        setState(prev => ({ ...prev, outlets: outlets, currentOutlet: outlets[0] }));
      }
    };
    init();

    // Listen for database updates (like new outlets added by admin)
    const unsubscribe = RealtimeDB.onUpdate(() => {
      const freshOutlets = RealtimeDB.getOutlets();
      setState(prev => ({
        ...prev,
        outlets: freshOutlets,
        // If current outlet was deleted or changed, we might need logic here, 
        // but for now we just update the list.
      }));
    });
    return unsubscribe;
  }, []);

  const handleSelectOutlet = (outlet: Outlet) => {
    setState(prev => ({ ...prev, currentOutlet: outlet }));
    setView('menu');
    window.scrollTo(0, 0);
  };

  const addToCart = (item: MenuItem, variant: 'full' | 'half' | 'qtr') => {
    const price = item.price[variant] || item.price.full;
    setState(prev => {
      const existing = prev.cart.find(c => c.menuItemId === item.id && c.variant === variant);
      if (existing) {
        return {
          ...prev,
          cart: prev.cart.map(c => 
            (c.menuItemId === item.id && c.variant === variant) 
              ? { ...c, quantity: c.quantity + 1 } 
              : c
          )
        };
      }
      return {
        ...prev,
        cart: [...prev.cart, { menuItemId: item.id, name: item.name, variant, price, quantity: 1 }]
      };
    });
  };

  const updateCartQty = (id: string, variant: string, delta: number) => {
    setState(prev => ({
      ...prev,
      cart: prev.cart.map(c => {
        if (c.menuItemId === id && c.variant === variant) {
          const newQty = Math.max(0, c.quantity + delta);
          return { ...c, quantity: newQty };
        }
        return c;
      }).filter(c => c.quantity > 0)
    }));
  };

  const placeOrder = (details: { name: string; phone: string; address: string; payment: 'UPI' | 'CARD' | 'COD'; subtotal: number; tax: number; deliveryCharge: number; total: number }) => {
    if (!state.currentOutlet) return;
    
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      outletId: state.currentOutlet.id,
      customerId: state.currentUser?.id || `guest-${Date.now()}`, 
      customerName: details.name,
      customerPhone: details.phone,
      address: details.address,
      items: state.cart,
      subtotal: details.subtotal,
      tax: details.tax,
      deliveryCharge: details.deliveryCharge,
      total: details.total,
      status: OrderStatus.PENDING,
      timestamp: Date.now(),
      paymentMethod: details.payment,
      history: [{ status: OrderStatus.PENDING, time: Date.now(), updatedBy: 'System' }]
    };

    RealtimeDB.createOrder(newOrder);
    setActiveOrderId(newOrder.id);
    setState(prev => ({ ...prev, cart: [] }));
    setIsCartOpen(false);
    setView('tracking');
    window.scrollTo(0, 0);
  };

  const handleLogin = (user: UserProfile) => {
    if (view === 'login-staff') {
      setState(prev => ({ ...prev, staffUser: user }));
      setView('admin');
    } else {
      setState(prev => ({ ...prev, currentUser: user }));
      setView('home');
    }
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
    setView('home');
  };

  const handleStaffLogout = () => {
    setState(prev => ({ ...prev, staffUser: null }));
    setView('login-staff');
  };

  const navigate = (v: ViewType) => {
    setView(v);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden flex flex-col">
      <Navbar 
        onNavigate={navigate} 
        currentView={view} 
        cartCount={state.cart.reduce((a, b) => a + b.quantity, 0)}
        onCartOpen={() => setIsCartOpen(true)}
        user={state.currentUser}
        onLogout={handleLogout}
        forceGlass={view !== 'home'}
      />

      <main className="flex-grow">
        {view === 'home' && (
          <>
            <Hero 
              outlets={state.outlets} 
              onSelectOutlet={handleSelectOutlet}
              userLocation={state.userLocation}
              locationStatus={locationStatus}
              distanceToNearest={distanceToNearest}
            />
            <HomeContent 
              onExploreMenu={() => navigate('menu')} 
              onAddToCart={addToCart} 
              onUpdateQty={updateCartQty}
              cart={state.cart}
              user={state.currentUser} 
            />
          </>
        )}

        {view === 'menu' && state.currentOutlet && (
          <MenuPage 
            outlet={state.currentOutlet} 
            outlets={state.outlets}
            onAddToCart={addToCart} 
            onUpdateQty={updateCartQty}
            cart={state.cart}
            onSelectOutlet={handleSelectOutlet}
            user={state.currentUser}
          />
        )}

        {view === 'about' && <About />}
        {view === 'parties' && <Parties />}
        {view === 'contact' && <Contact />}

        {view === 'tracking' && (
          <OrderTracking 
            orderId={activeOrderId} 
            user={state.currentUser} 
            onGoToLogin={() => navigate('login')}
          />
        )}

        {view === 'my-orders' && state.currentUser && (
          <MyOrders 
            user={state.currentUser} 
            onTrackOrder={(id) => { setActiveOrderId(id); navigate('tracking'); }}
          />
        )}

        {view === 'admin' && state.staffUser && (
          <AdminDashboard user={state.staffUser} onBack={() => setView('home')} onLogout={handleStaffLogout} />
        )}

        {(view === 'login' || view === 'login-staff') && (
          <Login onLogin={handleLogin} onBackToHome={() => navigate('home')} initialIsStaff={view === 'login-staff'} />
        )}
        
        {view === 'profile' && state.currentUser && (
          <div className="pt-40 pb-20 px-6 max-w-2xl mx-auto">
            <div className="bg-white p-12 rounded-[50px] shadow-2xl border border-gray-100 animate-fade-up">
              <h2 className="text-4xl font-playfair font-bold mb-8">Your Profile</h2>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Name</p>
                  <p className="text-xl font-bold">{state.currentUser.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Email</p>
                  <p className="text-xl font-bold">{state.currentUser.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Phone</p>
                  <p className="text-xl font-bold">{state.currentUser.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Delivery Address</p>
                  <p className="text-lg text-gray-600 italic">"{state.currentUser.address || 'No address saved yet.'}"</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {view !== 'admin' && view !== 'login' && view !== 'login-staff' && (
        <Footer onNavigate={navigate} staffUser={state.staffUser} />
      )}

      <CartModal 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={state.cart}
        onUpdateQty={updateCartQty}
        onCheckout={placeOrder}
        initialUser={state.currentUser}
        currentOutlet={state.currentOutlet}
      />
      
      {state.cart.length > 0 && (view === 'menu' || view === 'home') && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-8 right-8 z-40 bg-[#C0392B] text-white p-4 rounded-full shadow-2xl flex items-center space-x-2 transition-transform hover:scale-110 active:scale-95 animate-bounce"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="font-bold">{state.cart.reduce((a,b) => a+b.quantity, 0)} Items</span>
        </button>
      )}
    </div>
  );
};

export default App;
