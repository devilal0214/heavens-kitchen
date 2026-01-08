import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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

const DROPDOWN_W = 320;
const DROPDOWN_MAX_H = 260;
const GAP = 8;

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

const MenuPage: React.FC<MenuPageProps> = ({
  outlet,
  outlets,
  onAddToCart,
  onUpdateQty,
  cart,
  onSelectOutlet,
  user,
}) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState("All");
  const [foodTypeFilter, setFoodTypeFilter] = useState<
    "All" | "Veg" | "Non-Veg"
  >("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [showOutletToggle, setShowOutletToggle] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  }>({
    top: 0,
    left: 0,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updateDropdownPosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Align dropdown with button (right aligned), clamp inside viewport
    const rawLeft = rect.right - DROPDOWN_W;
    const left = clamp(rawLeft, 12, viewportW - DROPDOWN_W - 12);

    // Always open below the button
    const top = rect.bottom + GAP;

    setDropdownPosition({ top, left });
  };

  // ✅ Keep dropdown attached to button while scrolling/resizing
  useEffect(() => {
    if (!showOutletToggle) return;

    updateDropdownPosition();

    // Use capture + passive for smoother updates
    const onScroll = () => updateDropdownPosition();
    const onResize = () => updateDropdownPosition();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll as any);
      window.removeEventListener("resize", onResize as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOutletToggle]);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const [menuItems, allCategories] = await Promise.all([
          FirestoreDB.getMenu(outlet.id),
          Promise.resolve([
            "Signature Selection",
            "Momo Factory",
            "Appetizers",
            "Main Course",
            "Beverages",
            "Desserts",
          ]),
        ]);
        setItems(menuItems);
        setCategories(allCategories);
      } catch (error) {
        console.error("Error loading menu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [outlet.id]);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowOutletToggle(false);
    };
    if (showOutletToggle) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showOutletToggle]);

  const scrollNav = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 250;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const filtered = items.filter(
    (i) =>
      i.isAvailable &&
      (category === "All" || i.category === category) &&
      (foodTypeFilter === "All" || i.foodType === foodTypeFilter) &&
      (searchQuery === "" ||
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.description || "").toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [category, foodTypeFilter, searchQuery]);

  return (
    <div className="w-full flex flex-col items-center bg-white overflow-x-hidden min-h-screen">
      {/* Top Menu Hero Banner */}
      <div className="w-full relative h-[35vh] md:h-[45vh] overflow-hidden mt-[70px] md:mt-0">
        <img
          src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2400&auto=format&fit=crop"
          alt="Culinary Sanctuary"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/65"></div>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="animate-fade-down max-w-2xl">
            <span className="inline-block px-4 py-1.5 bg-[#FFB30E] text-black text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] rounded-[15px] shadow-xl mb-4 md:mb-6">
              Now Serving Live
            </span>
            <h2 className="text-4xl md:text-7xl font-playfair font-bold text-white drop-shadow-2xl leading-tight">
              The <span className="italic text-[#FFB30E]">Sanctuary</span>{" "}
              Collection
            </h2>
            <div className="h-[1px] w-12 bg-white/30 mx-auto my-4 md:my-6"></div>
            <p className="text-white/90 font-black uppercase tracking-[0.4em] text-[10px] md:text-xs">
              Heritage Recipes • 100% Purity • Since 1984
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="w-full pt-12 md:pt-8 pb-8 md:pb-12 flex flex-col items-center justify-center bg-white text-center px-4 md:-mt-4 relative z-10">
        <div className="inline-flex items-center gap-3 mb-4 opacity-30">
          <div className="h-[1px] w-6 bg-black"></div>
          <span className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.6em]">
            CRAFTED WITH SOUL
          </span>
          <div className="h-[1px] w-6 bg-black"></div>
        </div>
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-playfair font-bold text-gray-900 tracking-tighter">
          Heritage{" "}
          <span className="italic text-[#C0392B]/80 font-normal">Menu.</span>
        </h1>
        <p className="text-[8px] md:text-[9px] font-black uppercase text-gray-400 tracking-widest mt-4 md:mt-6">
          Currently serving at {outlet.name.toUpperCase()}
        </p>
      </div>

      {/* Filter Navigator Bar */}
      <div className="max-w-4xl w-full mx-auto px-4 md:px-6 mb-10 md:mb-20 animate-fade-up">
        <div className="bg-[#F8F9FA] rounded-[15px] p-2 flex flex-col gap-3 shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-gray-100">
          {/* Dietary Filter */}
          <div className="flex justify-center pt-2">
            <div className="flex bg-gray-200/40 p-1 rounded-[15px] gap-1 items-center w-full sm:w-auto">
              {(["All", "Veg", "Non-Veg"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFoodTypeFilter(type)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 rounded-[15px] text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all duration-300 min-w-[70px] sm:min-w-[100px] ${
                    foodTypeFilter === type
                      ? "bg-white text-gray-900 shadow-md scale-105"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {type === "Veg" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div>
                  )}
                  {type === "Non-Veg" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></div>
                  )}
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[1px] w-1/4 bg-gray-100 mx-auto"></div>

          {/* Search Bar */}
          <div className="px-4 md:px-8">
            <div className="relative">
              <input
                type="text"
                placeholder="SEARCH MENU ITEMS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3 px-4 bg-white border border-gray-200 rounded-[15px] text-[8px] md:text-[9px] font-black uppercase tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C0392B] focus:border-transparent transition-all"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="h-[1px] w-1/4 bg-gray-100 mx-auto"></div>

          {/* Category scroller */}
          <div className="flex items-center px-1 md:px-2">
            <button
              onClick={() => scrollNav("left")}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-gray-300 hover:text-gray-900 transition-colors active:scale-90 shrink-0"
              aria-label="Previous Categories"
            >
              <svg
                className="w-4 h-4 md:w-5 md:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div
              ref={scrollRef}
              className="flex-1 flex overflow-x-auto no-scrollbar gap-1 px-1 py-1"
            >
              <button
                onClick={() => setCategory("All")}
                className={`whitespace-nowrap px-4 md:px-6 py-2 md:py-2.5 rounded-[15px] text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${
                  category === "All"
                    ? "bg-[#A94442] text-white shadow-lg shadow-red-900/10"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                ALL DISHES
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`whitespace-nowrap px-4 md:px-6 py-2 md:py-2.5 rounded-[15px] text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${
                    category === cat
                      ? "bg-[#A94442] text-white shadow-lg shadow-red-900/10"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => scrollNav("right")}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-gray-300 hover:text-gray-900 transition-colors active:scale-90 shrink-0"
              aria-label="Next Categories"
            >
              <svg
                className="w-4 h-4 md:w-5 md:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Bottom bar */}
          <div className="flex justify-between items-center px-4 md:px-8 py-3 border-t border-gray-100/50 relative">
            <span className="text-[7px] md:text-[8px] font-black text-gray-300 uppercase tracking-[0.3em]">
              {filtered.length} CULINARY OPTIONS • PAGE {currentPage} OF{" "}
              {totalPages}
            </span>

            <button
              ref={buttonRef}
              onClick={() => setShowOutletToggle((s) => !s)}
              className="flex items-center gap-2 text-[7px] md:text-[8px] font-black text-[#A94442] uppercase tracking-widest hover:underline transition-all"
            >
              <span>SWITCH STATION</span>
              <svg
                className={`w-3 h-3 transition-transform ${
                  showOutletToggle ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showOutletToggle &&
              createPortal(
                <>
                  {/* overlay */}
                  <div
                    className="fixed inset-0 z-[9998] bg-transparent"
                    onClick={() => setShowOutletToggle(false)}
                  />

                  {/* dropdown (fixed + recomputed on scroll so it stays glued to button) */}
                  <div
                    className="fixed z-[9999] animate-fade-up"
                    style={{
                      top: dropdownPosition.top,
                      left: dropdownPosition.left,
                      width: `${DROPDOWN_W}px`,
                    }}
                  >
                    <div className="bg-white rounded-[15px] shadow-2xl border border-gray-100 overflow-hidden">
                      <div className="p-3 border-b border-gray-100">
                        <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                          SELECT YOUR STATION
                        </div>
                      </div>

                      <div className="p-2">
                        <div className="space-y-1 max-h-[260px] overflow-y-auto no-scrollbar">
                          {outlets
                            .filter((o) => (o as any).isActive)
                            .map((o) => (
                              <button
                                key={o.id}
                                onClick={() => {
                                  onSelectOutlet(o);
                                  setShowOutletToggle(false);
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-[15px] transition-all hover:bg-gray-50 ${
                                  o.id === outlet.id
                                    ? "bg-red-50 border border-red-100"
                                    : ""
                                }`}
                              >
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-[15px] overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-50">
                                  <img
                                    src={
                                      o.imageUrl ||
                                      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400"
                                    }
                                    alt={o.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>

                                <div className="flex-1 text-left min-w-0">
                                  <div className="text-[9px] md:text-[10px] font-black text-gray-900 uppercase tracking-wider line-clamp-1">
                                    {o.name}
                                  </div>
                                  <div className="text-[7px] md:text-[8px] font-bold text-gray-400 uppercase tracking-widest line-clamp-1">
                                    {o.address}
                                  </div>
                                </div>

                                {o.id === outlet.id && (
                                  <div className="w-2 h-2 bg-[#C0392B] rounded-full" />
                                )}
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>,
                document.body
              )}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl w-full mx-auto px-4 md:px-3 pb-32">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-[400px] md:h-[500px] bg-gray-50 animate-pulse rounded-[15px] border border-gray-100"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {filtered.length > 0 ? (
              paginatedItems.map((item, idx) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onAddToCart={onAddToCart}
                  onUpdateQty={onUpdateQty}
                  cart={cart}
                  idx={idx}
                />
              ))
            ) : (
              <div className="col-span-full py-20 md:py-40 text-center bg-gray-50/50 rounded-[15px] border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">
                  No {foodTypeFilter !== "All" ? foodTypeFilter : ""} matches
                  found in the Sanctuary.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 mb-8">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-200 rounded-[15px] text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            ← PREV
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum =
                Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded-[15px] text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${
                    currentPage === pageNum
                      ? "bg-[#C0392B] text-white"
                      : "bg-white border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-200 rounded-[15px] text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            NEXT →
          </button>
        </div>
      )}
    </div>
  );
};

const ProductCard: React.FC<{
  item: MenuItem;
  onAddToCart: any;
  onUpdateQty: any;
  cart: OrderItem[];
  idx: number;
}> = ({ item, onAddToCart, onUpdateQty, cart, idx }) => {
  const [selectedVariant, setSelectedVariant] = useState<
    "full" | "half" | "qtr"
  >(item.price.qtr ? "qtr" : item.price.half ? "half" : "full");

  const currentPrice = item.price[selectedVariant] || item.price.full;
  const discountedPrice = item.discountPercentage
    ? Math.round(currentPrice * (1 - item.discountPercentage / 100))
    : currentPrice;

  const cartItem = cart.find(
    (c) => c.menuItemId === item.id && c.variant === selectedVariant
  );

  const VariantRow: React.FC<{ v: "full" | "half" | "qtr" }> = ({ v }) => {
    if (!item.price[v]) return null;
    const isActive = selectedVariant === v;
    const qtyLabel = item.variantQuantities?.[v];
    const servesLabel = item.serves?.[v];

    return (
      <button
        onClick={() => setSelectedVariant(v)}
        className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-[15px] transition-all duration-300 ${
          isActive
            ? "bg-white shadow-sm border border-gray-100"
            : "hover:bg-gray-100/50"
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isActive ? "bg-[#C0392B]" : "bg-gray-200"
            }`}
          />
          <span
            className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${
              isActive ? "text-[#C0392B]" : "text-gray-400"
            }`}
          >
            {v}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {qtyLabel && (
            <span className="text-[6px] sm:text-[7px] font-bold text-gray-300 uppercase hidden xs:inline">
              {qtyLabel}
            </span>
          )}
          {servesLabel && (
            <span className="text-[6px] sm:text-[7px] font-black text-gray-400">
              👥 {servesLabel}
            </span>
          )}
          <span
            className={`text-[9px] sm:text-[10px] font-black ${
              isActive ? "text-[#C0392B]" : "text-gray-900"
            } tabular-nums`}
          >
            ₹{item.price[v]}
          </span>
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
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
        />
      </div>

      <div className="px-5 md:px-8 pb-8 md:pb-10 pt-1 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h3 className="text-lg md:text-2xl font-bold text-gray-900 leading-tight group-hover:text-[#C0392B] transition-colors line-clamp-2">
            {item.name}
          </h3>
          <span className="text-lg md:text-2xl font-black text-[#C0392B] tracking-tighter tabular-nums shrink-0">
            ₹{discountedPrice}
          </span>
        </div>

        <p className="text-[10px] md:text-[11px] text-gray-400 italic mb-6 md:mb-8 line-clamp-2">
          "{item.description}"
        </p>

        <div className="mt-auto space-y-4 md:space-y-6">
          <div className="bg-gray-50 p-1 rounded-[15px] flex flex-col gap-0.5 shadow-inner border border-gray-100">
            <VariantRow v="qtr" />
            <VariantRow v="half" />
            <VariantRow v="full" />
          </div>

          {cartItem ? (
            <div className="flex items-center bg-[#C0392B] text-white rounded-[15px] overflow-hidden h-12 md:h-14 shadow-xl">
              <button
                onClick={() => onUpdateQty(item.id, selectedVariant, -1)}
                className="flex-1 h-full flex items-center justify-center hover:bg-black transition-all"
              >
                −
              </button>
              <div className="w-12 md:w-14 h-full flex items-center justify-center font-black tabular-nums border-x border-white/10">
                {cartItem.quantity}
              </div>
              <button
                onClick={() => onUpdateQty(item.id, selectedVariant, 1)}
                className="flex-1 h-full flex items-center justify-center hover:bg-black transition-all"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(item, selectedVariant)}
              className="w-full py-4 bg-[#C0392B] text-white rounded-[15px] font-black uppercase tracking-widest text-[8px] md:text-[9px] flex items-center justify-center transition-all hover:bg-black active:scale-95 shadow-xl shadow-red-900/10 h-12 md:h-14"
            >
              <span>Add To Order</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
