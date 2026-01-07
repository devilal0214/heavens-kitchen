import React, { useState, useEffect, useRef } from "react";
import { Outlet, MenuItem, UserProfile, OrderItem } from "../types";
import FirestoreDB from "../services/firestoreDb";

interface MenuPageProps {
  outlet: Outlet;
  outlets: Outlet[];
  onAddToCart: (item: MenuItem, variant: any) => void;
  onUpdateQty: (id: string, variant: string, delta: number) => void;
  cart: OrderItem[];
  onSelectOutlet: (o: Outlet) => void;
  user: UserProfile | null;
}

const MenuPage: React.FC<MenuPageProps> = ({ outlet, outlets, onAddToCart, onUpdateQty, cart, onSelectOutlet, user }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState('All');
  const [foodTypeFilter, setFoodTypeFilter] = useState<'All' | 'Veg' | 'Non-Veg'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showOutletToggle, setShowOutletToggle] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const [menuItems, allCategories] = await Promise.all([
          FirestoreDB.getMenu(outlet.id),
          Promise.resolve(['Signature Selection', 'Momo Factory', 'Appetizers', 'Main Course', 'Beverages', 'Desserts'])
        ]);
        setItems(menuItems);
        setCategories(allCategories);
      } catch (error) {
        console.error('Error loading menu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [outlet.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toggleRef.current && !toggleRef.current.contains(event.target as Node)) {
        setShowOutletToggle(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollNav = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 250;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const filtered = items.filter(i => 
    i.isAvailable && // Only show available items
    (category === 'All' || i.category === category) && 
    (foodTypeFilter === 'All' || i.foodType === foodTypeFilter) &&
    (searchQuery === '' || i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full flex flex-col items-center bg-white overflow-x-hidden min-h-screen">
      
      {/* Top Menu Hero Banner - Shifted down on mobile to start below navbar */}
      <div className="w-full relative h-[35vh] md:h-[45vh] overflow-hidden mt-[70px] md:mt-0">
        <img 
          src="https://images.unsplash.com/photo-1585937421612-70a0f2455f75?q=80&w=2336&auto=format&fit=crop" 
          alt="Culinary Sanctuary" 
          className="w-full h-full object-cover scale-110 animate-[zoomIn_20s_infinite_alternate]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-white"></div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="animate-fade-down max-w-2xl">
            <span className="inline-block px-4 py-1.5 bg-[#FFB30E] text-black text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl mb-4 md:mb-6">
              Now Serving Live
            </span>
            <h2 className="text-4xl md:text-7xl font-playfair font-bold text-white drop-shadow-2xl leading-tight">
              The <span className="italic text-[#FFB30E]">Sanctuary</span> Collection
            </h2>
            <div className="h-[1px] w-12 bg-white/30 mx-auto my-4 md:my-6"></div>
            <p className="text-white/90 font-black uppercase tracking-[0.4em] text-[10px] md:text-xs">
              Heritage Recipes • 100% Purity • Since 1984
            </p>
          </div>
        </div>

        {/* Floating Safe Hygiene Badge */}
        <div className="absolute bottom-12 right-6 md:right-12 hidden sm:flex items-center gap-3 bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-white/20 animate-fade-up">
           <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
           </div>
           <div>
             <p className="text-[9px] font-black text-gray-900 uppercase tracking-widest leading-none">Safe & Hygienic</p>
             <p className="text-[7px] font-bold text-emerald-600 uppercase mt-0.5">SOP Verified Sanctuary</p>
           </div>
        </div>
      </div>

      {/* Heritage Header (Integrated Below Banner) */}
      <div className="w-full pt-12 md:pt-8 pb-8 md:pb-12 flex flex-col items-center justify-center bg-white text-center px-4 md:-mt-4 relative z-10">
        <div className="inline-flex items-center gap-3 mb-4 opacity-30">
          <div className="h-[1px] w-6 bg-black"></div>
          <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.6em]">CRAFTED WITH SOUL</span>
          <div className="h-[1px] w-6 bg-black"></div>
        </div>
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-playfair font-bold text-gray-900 tracking-tighter">
          Heritage <span className="italic text-[#C0392B]/80 font-normal">Menu.</span>
        </h1>
        <p className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 tracking-widest mt-4 md:mt-6">
          Currently serving at {outlet.name.toUpperCase()}
        </p>
      </div>

      {/* Filter Navigator Bar */}
      <div className="max-w-4xl w-full mx-auto px-4 md:px-6 mb-10 md:mb-20 animate-fade-up">
        <div className="bg-[#F8F9FA] rounded-[15px] p-2 flex flex-col gap-3 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-gray-100">
          
          {/* Centered Dietary Filter Toggle */}
          <div className="flex justify-center pt-2">
            <div className="flex bg-gray-200/40 p-1 rounded-[15px] gap-1 items-center w-full sm:w-auto">
              {(['All', 'Veg', 'Non-Veg'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFoodTypeFilter(type)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 rounded-[12px] sm:rounded-[15px] text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all duration-300 min-w-[70px] sm:min-w-[100px] ${
                    foodTypeFilter === type 
                    ? 'bg-white text-gray-900 shadow-md scale-105' 
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {type === 'Veg' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div>}
                  {type === 'Non-Veg' && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></div>}
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[1px] w-1/4 bg-gray-100 mx-auto"></div>

          {/* Category List with Right/Left Navigation */}
          <div className="flex items-center px-1 md:px-2">
            <button 
              onClick={() => scrollNav('left')}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-gray-300 hover:text-gray-900 transition-colors active:scale-90 shrink-0"
              aria-label="Previous Categories"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div ref={scrollRef} className="flex-1 flex overflow-x-auto no-scrollbar gap-1 px-1 py-1">
              <button 
                onClick={() => setCategory('All')} 
                className={`whitespace-nowrap px-4 md:px-6 py-2 md:py-2.5 rounded-[12px] md:rounded-[15px] text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${category === 'All' ? 'bg-[#A94442] text-white shadow-lg shadow-red-900/10' : 'text-gray-400 hover:text-gray-600'}`}
              >
                ALL DISHES
              </button>
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setCategory(cat)} 
                  className={`whitespace-nowrap px-4 md:px-6 py-2 md:py-2.5 rounded-[12px] md:rounded-[15px] text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${category === cat ? 'bg-[#A94442] text-white shadow-lg shadow-red-900/10' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>

            <button 
              onClick={() => scrollNav('right')}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-gray-300 hover:text-gray-900 transition-colors active:scale-90 shrink-0"
              aria-label="Next Categories"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          
          <div className="flex justify-between items-center px-4 md:px-8 py-3 border-t border-gray-100/50">
             <span className="text-[7px] md:text-[8px] font-black text-gray-300 uppercase tracking-[0.3em]">{filtered.length} CULINARY OPTIONS</span>
             <button onClick={() => setShowOutletToggle(!showOutletToggle)} className="text-[7px] md:text-[8px] font-black text-[#A94442] uppercase tracking-widest hover:underline">SWITCH STATION ↑</button>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl w-full mx-auto px-4 md:px-3 pb-30">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-[400px] md:h-[500px] bg-gray-50 animate-pulse rounded-[15px] border border-gray-100"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {filtered.length > 0 ? filtered.map((item, idx) => (
              <ProductCard key={item.id} item={item} onAddToCart={onAddToCart} onUpdateQty={onUpdateQty} cart={cart} idx={idx} />
            )) : (
              <div className="col-span-full py-20 md:py-40 text-center bg-gray-50/50 rounded-[15px] border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">No {foodTypeFilter !== 'All' ? foodTypeFilter : ''} matches found in the Sanctuary.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ProductCard: React.FC<{ item: MenuItem; onAddToCart: any; onUpdateQty: any; cart: OrderItem[]; idx: number }> = ({ item, onAddToCart, onUpdateQty, cart, idx }) => {
  const [selectedVariant, setSelectedVariant] = useState<'full' | 'half' | 'qtr'>(item.price.qtr ? 'qtr' : (item.price.half ? 'half' : 'full'));
  const currentPrice = item.price[selectedVariant] || item.price.full;
  const discountedPrice = item.discountPercentage ? Math.round(currentPrice * (1 - item.discountPercentage / 100)) : currentPrice;
  const cartItem = cart.find(c => c.menuItemId === item.id && c.variant === selectedVariant);

  const VariantRow: React.FC<{ v: 'full' | 'half' | 'qtr' }> = ({ v }) => {
    if (!item.price[v]) return null;
    const isActive = selectedVariant === v;
    const qtyLabel = item.variantQuantities?.[v];
    const servesLabel = item.serves?.[v];

    return (
      <button
        onClick={() => setSelectedVariant(v)}
        className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-[12px] sm:rounded-[15px] transition-all duration-300 ${isActive ? 'bg-white shadow-sm border border-gray-100' : 'hover:bg-gray-100/50'}`}
      >
        <div className="flex items-center gap-2">
           <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#C0392B]' : 'bg-gray-200'}`}></div>
           <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-[#C0392B]' : 'text-gray-400'}`}>{v}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
           {qtyLabel && <span className="text-[6px] sm:text-[7px] font-bold text-gray-300 uppercase hidden xs:inline">{qtyLabel}</span>}
           {servesLabel && <span className="text-[6px] sm:text-[7px] font-black text-gray-400">👥 {servesLabel}</span>}
           <span className={`text-[9px] sm:text-[10px] font-black ${isActive ? 'text-[#C0392B]' : 'text-gray-900'} tabular-nums`}>₹{item.price[v]}</span>
        </div>
      </button>
    );
  };

  return (
    <div 
      className="group bg-white rounded-[15px] overflow-hidden transition-all duration-500 animate-fade-up border border-gray-100 hover:shadow-2xl flex flex-col h-full"
      style={{ animationDelay: `${(idx % 3) * 100}ms` }}
    >
      <div className="relative aspect-[5/3] mb-3 md:mb-4 overflow-hidden rounded-[15px] bg-gray-50 m-2">
        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" />
        <div className="absolute top-3 left-3">
          <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-white shadow-sm ${item.foodType === 'Veg' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
        </div>
        {item.discountPercentage && item.discountPercentage > 0 && (
          <div className="absolute top-3 right-3 bg-black text-white text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded-[15px]">
            {item.discountPercentage}% OFF
          </div>
        )}
      </div>

      <div className="px-5 md:px-8 pb-8 md:pb-10 pt-1 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1 gap-2">
           <h3 className="text-lg md:text-2xl font-bold text-gray-900 leading-tight group-hover:text-[#C0392B] transition-colors line-clamp-2">{item.name}</h3>
           <span className="text-lg md:text-2xl font-black text-[#C0392B] tracking-tighter tabular-nums shrink-0">₹{discountedPrice}</span>
        </div>
        <p className="text-[7px] md:text-[8px] font-black text-gray-300 uppercase tracking-widest mb-3 md:mb-4">{item.category} {item.isSpicy !== 'None' ? '🌶️'.repeat(item.isSpicy === 'Mild' ? 1 : item.isSpicy === 'Medium' ? 2 : 3) : ''}</p>
        
        <p className="text-[10px] md:text-[11px] text-gray-400 italic mb-6 md:mb-8 line-clamp-2">"{item.description}"</p>

        <div className="mt-auto space-y-4 md:space-y-6">
          <div className="bg-gray-50 p-1 rounded-[15px] flex flex-col gap-0.5 shadow-inner border border-gray-100">
            <VariantRow v="qtr" />
            <VariantRow v="half" />
            <VariantRow v="full" />
          </div>

          {cartItem ? (
            <div className="flex items-center bg-[#C0392B] text-white rounded-[15px] overflow-hidden h-12 md:h-14 shadow-xl">
              <button onClick={() => onUpdateQty(item.id, selectedVariant, -1)} className="flex-1 h-full flex items-center justify-center hover:bg-black transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M20 12H4" /></svg>
              </button>
              <div className="w-12 md:w-14 h-full flex items-center justify-center font-black tabular-nums border-x border-white/10">{cartItem.quantity}</div>
              <button onClick={() => onUpdateQty(item.id, selectedVariant, 1)} className="flex-1 h-full flex items-center justify-center hover:bg-black transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onAddToCart(item, selectedVariant)}
              className="w-full py-4 bg-[#C0392B] text-white rounded-[15px] font-black uppercase tracking-widest text-[8px] md:text-[9px] flex items-center justify-center space-x-2 md:space-x-3 transition-all hover:bg-black active:scale-95 shadow-xl shadow-red-900/10 h-12 md:h-14"
            >
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg>
              <span>Add To Sanctuary</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
