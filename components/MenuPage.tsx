
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, MenuItem, UserProfile, OrderItem } from '../types';
import { MockDB } from '../services/mockDb';

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
    const timer = setTimeout(() => {
      setItems(MockDB.getMenu(outlet.id));
      const masterCats = MockDB.getCategories();
      setCategories(masterCats);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
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
    (category === 'All' || i.category === category) && 
    (foodTypeFilter === 'All' || i.foodType === foodTypeFilter) &&
    (searchQuery === '' || i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full flex flex-col items-center bg-white overflow-x-hidden min-h-screen">
      {/* Heritage Header */}
      <div className="w-full pt-32 pb-12 flex flex-col items-center justify-center bg-white text-center">
        <div className="inline-flex items-center gap-3 mb-4 opacity-30">
          <div className="h-[1px] w-6 bg-black"></div>
          <span className="text-[8px] font-black uppercase tracking-[0.6em]">SANCTUARY COLLECTION</span>
          <div className="h-[1px] w-6 bg-black"></div>
        </div>
        <h1 className="text-6xl md:text-8xl font-playfair font-bold text-gray-900 tracking-tighter">
          Heritage <span className="italic text-[#C0392B]/80 font-normal">Menu.</span>
        </h1>
        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mt-6">
          Currently serving at {outlet.name.toUpperCase()}
        </p>
      </div>

      {/* Filter Navigator Bar with Lateral Navigation Arrows */}
      <div className="max-w-4xl w-full mx-auto px-6 mb-20 animate-fade-up">
        <div className="bg-[#F8F9FA] rounded-[35px] p-2 flex flex-col gap-3 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-gray-100">
          
          {/* Centered Dietary Filter Toggle (Display: Flex) */}
          <div className="flex justify-center pt-2">
            <div className="flex bg-gray-200/40 p-1.5 rounded-full gap-1 items-center">
              {(['All', 'Veg', 'Non-Veg'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFoodTypeFilter(type)}
                  className={`flex items-center justify-center gap-2 px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 min-w-[100px] ${
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
          <div className="flex items-center px-2">
            <button 
              onClick={() => scrollNav('left')}
              className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-gray-900 transition-colors active:scale-90 shrink-0"
              aria-label="Previous Categories"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div ref={scrollRef} className="flex-1 flex overflow-x-auto no-scrollbar gap-1 px-1 py-1">
              <button 
                onClick={() => setCategory('All')} 
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${category === 'All' ? 'bg-[#A94442] text-white shadow-lg shadow-red-900/10' : 'text-gray-400 hover:text-gray-600'}`}
              >
                ALL DISHES
              </button>
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setCategory(cat)} 
                  className={`whitespace-nowrap px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${category === cat ? 'bg-[#A94442] text-white shadow-lg shadow-red-900/10' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>

            <button 
              onClick={() => scrollNav('right')}
              className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-gray-900 transition-colors active:scale-90 shrink-0"
              aria-label="Next Categories"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          
          <div className="flex justify-between items-center px-8 py-3 border-t border-gray-100/50">
             <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.3em]">{filtered.length} CULINARY OPTIONS</span>
             <button onClick={() => setShowOutletToggle(!showOutletToggle)} className="text-[8px] font-black text-[#A94442] uppercase tracking-widest hover:underline">SWITCH STATION ↑</button>
          </div>
        </div>
      </div>

      {/* Product Grid - Fixed 3-Column Display */}
      <div className="max-w-7xl w-full mx-auto px-6 pb-40">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-[500px] bg-gray-50 animate-pulse rounded-[40px] border border-gray-100"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.length > 0 ? filtered.map((item, idx) => (
              <ProductCard key={item.id} item={item} onAddToCart={onAddToCart} onUpdateQty={onUpdateQty} cart={cart} idx={idx} />
            )) : (
              <div className="col-span-full py-40 text-center bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No {foodTypeFilter !== 'All' ? foodTypeFilter : ''} matches found in the Sanctuary.</p>
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
        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-white shadow-sm border border-gray-100' : 'hover:bg-gray-100/50'}`}
      >
        <div className="flex items-center gap-2">
           <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#C0392B]' : 'bg-gray-200'}`}></div>
           <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-[#C0392B]' : 'text-gray-400'}`}>{v}</span>
        </div>
        <div className="flex items-center gap-4">
           {qtyLabel && <span className="text-[7px] font-bold text-gray-300 uppercase">{qtyLabel}</span>}
           {servesLabel && <span className="text-[7px] font-black text-gray-400">👥 {servesLabel}</span>}
           <span className={`text-[10px] font-black ${isActive ? 'text-[#C0392B]' : 'text-gray-900'} tabular-nums`}>₹{item.price[v]}</span>
        </div>
      </button>
    );
  };

  return (
    <div 
      className="group bg-white rounded-[40px] overflow-hidden transition-all duration-500 animate-fade-up border border-gray-100 hover:shadow-2xl flex flex-col h-full"
      style={{ animationDelay: `${(idx % 3) * 100}ms` }}
    >
      <div className="relative aspect-[4/3] m-2.5 overflow-hidden rounded-[30px] bg-gray-50">
        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" />
        <div className="absolute top-4 left-4">
          <div className={`w-4 h-4 rounded-full border-2 border-white shadow-sm ${item.foodType === 'Veg' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
        </div>
        {item.discountPercentage && item.discountPercentage > 0 && (
          <div className="absolute top-4 right-4 bg-black text-white text-[8px] font-black px-2 py-1 rounded-full">
            {item.discountPercentage}% OFF
          </div>
        )}
      </div>

      <div className="px-8 pb-10 pt-2 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
           <h3 className="text-2xl font-bold text-gray-900 leading-tight group-hover:text-[#C0392B] transition-colors">{item.name}</h3>
           <span className="text-2xl font-black text-[#C0392B] tracking-tighter tabular-nums">₹{discountedPrice}</span>
        </div>
        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-4">{item.category} {item.isSpicy !== 'None' ? '🌶️'.repeat(item.isSpicy === 'Mild' ? 1 : item.isSpicy === 'Medium' ? 2 : 3) : ''}</p>
        
        <p className="text-[11px] text-gray-400 italic mb-8 line-clamp-2">"{item.description}"</p>

        <div className="mt-auto space-y-6">
          {/* Vertical Portion Selection Stack */}
          <div className="bg-gray-50 p-1 rounded-[22px] flex flex-col gap-0.5 shadow-inner border border-gray-100">
            <VariantRow v="qtr" />
            <VariantRow v="half" />
            <VariantRow v="full" />
          </div>

          {cartItem ? (
            <div className="flex items-center bg-[#C0392B] text-white rounded-[20px] overflow-hidden h-14 shadow-xl">
              <button onClick={() => onUpdateQty(item.id, selectedVariant, -1)} className="flex-1 h-full flex items-center justify-center hover:bg-black transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M20 12H4" /></svg>
              </button>
              <div className="w-14 h-full flex items-center justify-center font-black tabular-nums border-x border-white/10">{cartItem.quantity}</div>
              <button onClick={() => onUpdateQty(item.id, selectedVariant, 1)} className="flex-1 h-full flex items-center justify-center hover:bg-black transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onAddToCart(item, selectedVariant)}
              className="w-full py-5 bg-[#C0392B] text-white rounded-[20px] font-black uppercase tracking-widest text-[9px] flex items-center justify-center space-x-3 transition-all hover:bg-black active:scale-95 shadow-xl shadow-red-900/10 h-14"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg>
              <span>Add To Sanctuary</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
