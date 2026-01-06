import React, { useMemo, useState, useEffect } from "react";
import { MenuItem, UserProfile, OrderItem } from "../types";
import { MockDB } from "../services/mockDb";

interface HomeContentProps {
  onExploreMenu: () => void;
  onAddToCart: (item: MenuItem, variant: "full" | "half" | "qtr") => void;
  onUpdateQty: (id: string, variant: string, delta: number) => void;
  cart: OrderItem[];
  user: UserProfile | null;
}

const HomeContent: React.FC<HomeContentProps> = ({
  onExploreMenu,
  onAddToCart,
  onUpdateQty,
  cart,
  user,
}) => {
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);

  const features = [
    {
      title: "Fresh Ingredients",
      desc: "Sourced daily from local organic farms to ensure the highest quality.",
      icon: "🥗",
    },
    {
      title: "Master Chefs",
      desc: "Our kitchen is led by award-winning chefs with decades of experience.",
      icon: "👨‍🍳",
    },
    {
      title: "Express Delivery",
      desc: "Hot and fresh meals at your doorstep within 30 minutes guaranteed.",
      icon: "🛵",
    },
    {
      title: "Safe Dining",
      desc: "Highest standards of hygiene and safety for a worry-free experience.",
      icon: "🛡️",
    },
  ];

  const testimonials = [
    {
      name: "Arjun Kapoor",
      role: "Food Critic, Delhi Times",
      quote:
        "The legendary recipes from 1984 are literally the best I've ever had in Delhi. Truly a culinary sanctuary!",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    },
    {
      name: "Priya Sharma",
      role: "Lifestyle Blogger",
      quote:
        "Every bite of the Butter Chicken feels like a warm hug. The delivery is always on time and packaging is great.",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    },
    {
      name: "Vikram Seth",
      role: "Local Foodie",
      quote:
        "Def Col's best-kept secret. I've been ordering since the 90s, and the quality hasn't dropped a bit.",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    },
    {
      name: "Ananya Gupta",
      role: "Marketing Executive",
      quote:
        "Perfect for our office lunch parties. The specialized admin panel makes it so easy for us to track.",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    },
    {
      name: "Rohan Mehra",
      role: "Tech Professional",
      quote:
        "The online ordering experience is seamless. Consistent taste every single time. 5 stars for Havens!",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
    },
  ];

  const maxIndex = testimonials.length - 3; // For showing 3 cards

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonialIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [maxIndex]);

  const signatureItems = useMemo(() => {
    const allItems = MockDB.getMenu();
    return allItems.filter((i) => i.category === "Signature Selection");
  }, []);

  const nextTestimonial = () => {
    setActiveTestimonialIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevTestimonial = () => {
    setActiveTestimonialIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  return (
    <div className="bg-white">
      {/* Signature Dishes Grid - Updated to match MenuPage 3-column Product Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <div className="max-w-xl animate-fade-down">
            <h4 className="text-[#C0392B] font-black uppercase tracking-[0.4em] text-[10px] mb-4">
              SIGNATURE SELECTION
            </h4>
            <h2 className="text-4xl md:text-5xl font-montserrat font-medium text-gray-900 leading-tight">
              Loved by Our Regulars
            </h2>
          </div>
          <button
            onClick={onExploreMenu}
            className="text-[#C0392B] font-black uppercase tracking-widest text-[10px] mt-6 md:mt-0 flex items-center group animate-fade-up"
          >
            View All Dishes{" "}
            <span className="ml-2 group-hover:translate-x-2 transition-transform">
              →
            </span>
          </button>
        </div>

        {/* 3-Column Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {signatureItems.length > 0 ? (
            signatureItems.map((item, i) => (
              <ProductCard
                key={item.id}
                item={item}
                onAddToCart={onAddToCart}
                onUpdateQty={onUpdateQty}
                cart={cart}
                idx={i}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
              <p className="text-gray-400 font-medium uppercase tracking-widest text-[10px]">
                No dishes tagged for Signature Selection yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Story Section */}
      <section className="bg-gray-50/50 py-24 px-6 border-y border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative animate-fade-up">
            <div className="relative z-10 rounded-[15px] overflow-hidden shadow-2xl group cursor-pointer">
              <img
                src="https://plus.unsplash.com/premium_photo-1687697861242-03e99059e833?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Our Master Chef"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#FFB30E] rounded-[15px] -z-10 opacity-20 blur-xl animate-pulse"></div>
            <div className="absolute -top-10 -right-10 w-48 h-48 border-4 border-[#E31E24]/10 rounded-[15px] -z-10"></div>
            <div className="absolute -bottom-6 -right-6 z-20 bg-white p-6 rounded-[15px] shadow-2xl border border-gray-100 text-center animate-bounce-slow">
              <p className="text-[#E31E24] font-black text-3xl leading-none">
                1984
              </p>
              <p className="text-gray-400 text-[10px] font-medium uppercase tracking-widest mt-1">
                Founding Year
              </p>
            </div>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
            <h4 className="text-[#E31E24] font-montserrat tracking-[0.2em] uppercase text-sm mb-4 font-medium">
              The Haven Story
            </h4>
            <h2 className="text-4xl md:text-6xl font-montserrat mb-8 leading-tight">
              A Journey of <br />
              <span className="text-[#E31E24]">Flavours</span> and{" "}
              <span className="text-[#FFB30E]">Memories</span>
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed text-lg">
              Havens Kitchen started with a simple vision: to create a sanctuary
              where food is not just a meal, but an experience. Since 1984,
              we've stayed true to our roots while evolving with the modern
              palate.
            </p>
            <div className="grid grid-cols-2 gap-10 mb-12">
              <div className="group">
                <h3 className="text-4xl font-montserrat font-medium text-[#E31E24] group-hover:scale-110 transition-transform origin-left inline-block">
                  40+
                </h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-black mt-2">
                  Years of Passion
                </p>
              </div>
              <div className="group">
                <h3 className="text-4xl font-montserrat font-medium text-[#E31E24] group-hover:scale-110 transition-transform origin-left inline-block">
                  100k+
                </h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-black mt-2">
                  Happy Diners
                </p>
              </div>
            </div>
            <button
              onClick={onExploreMenu}
              className="group px-10 py-5 bg-[#111827] text-white rounded-[15px] font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-2xl border border-transparent hover:border-[#FFB30E]/30"
            >
              See Our Menu{" "}
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-2">
                →
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#050505] text-white py-32 px-6 overflow-hidden relative border-y-8 border-[#FFB30E]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[25vw] opacity-[0.03] font-montserrat select-none leading-none pointer-events-none">
          HAVENS
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h4 className="text-[#FFB30E] font-black uppercase tracking-[0.4em] text-[10px] mb-4">
              Guest Experiences
            </h4>
            <h2 className="text-4xl md:text-5xl font-montserrat font-medium text-white tracking-tight">
              Voices of the Sanctuary
            </h2>
          </div>

          <div className="relative group/slider px-4">
            <div className="overflow-visible md:overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-out gap-8"
                style={{
                  transform: `translateX(-${
                    activeTestimonialIndex * (100 / 3)
                  }%)`,
                }}
              >
                {testimonials.map((t, i) => (
                  <div
                    key={i}
                    className="w-full md:w-[calc(33.333%-1.35rem)] shrink-0"
                  >
                    <div className="bg-[#111] p-10 rounded-[15px] border border-white/5 h-full flex flex-col shadow-2xl relative group/card transition-all duration-300 hover:border-[#FFB30E]/20 hover:bg-[#161616]">
                      <div className="text-[#FFB30E] text-6xl mb-4 italic leading-none opacity-20 group-hover/card:opacity-40 transition-opacity font-serif">
                        “
                      </div>
                      <p className="text-lg font-montserrat italic leading-relaxed mb-10 flex-grow text-white/80 line-clamp-4">
                        {t.quote}
                      </p>
                      <div className="flex items-center gap-4 border-t border-white/10 pt-8">
                        <div className="w-14 h-14 rounded-[15px] overflow-hidden border-2 border-[#E31E24]/30 shadow-xl shrink-0">
                          <img
                            src={t.image}
                            alt={t.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="overflow-hidden">
                          <h5 className="font-medium text-sm text-[#FFB30E] uppercase tracking-widest truncate">
                            {t.name}
                          </h5>
                          <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mt-1 truncate">
                            {t.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={prevTestimonial}
              className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 w-14 h-14 bg-black border border-white/10 rounded-[15px] flex items-center justify-center transition-all hover:bg-[#C0392B] hover:border-[#FFB30E] z-20 backdrop-blur-md shadow-2xl group/btn"
            >
              <svg
                className="w-6 h-6 transition-transform group-hover/btn:-translate-x-1"
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
            <button
              onClick={nextTestimonial}
              className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 w-14 h-14 bg-black border border-white/10 rounded-[15px] flex items-center justify-center transition-all hover:bg-[#C0392B] hover:border-[#FFB30E] z-20 backdrop-blur-md shadow-2xl group/btn"
            >
              <svg
                className="w-6 h-6 transition-transform group-hover/btn:translate-x-1"
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

          <div className="flex justify-center gap-3 mt-16">
            {Array.from({ length: testimonials.length - 2 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonialIndex(i)}
                className={`h-1.5 rounded-[15px] transition-all duration-700 ${
                  activeTestimonialIndex === i
                    ? "w-16 bg-[#FFB30E]"
                    : "w-4 bg-white/10 hover:bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Outlets CTA */}
      <section className="py-24 px-6 max-w-7xl mx-auto text-center">
        <h4 className="text-[#E31E24] font-black uppercase tracking-[0.4em] text-[10px] mb-4">
          Find Your Nearest
        </h4>
        <h2 className="text-4xl md:text-6xl font-montserrat mb-16 animate-fade-up">
          Our Sanctuaries
        </h2>
        <div className="flex flex-wrap justify-center gap-10">
          <div
            className="bg-white p-12 rounded-[15px] flex-1 min-w-[320px] border border-gray-100 shadow-xl hover:shadow-2xl transition-all group animate-fade-up"
            style={{ animationDelay: "0ms" }}
          >
            <h3 className="text-3xl font-montserrat mb-4 group-hover:text-[#E31E24] transition-colors">
              Kalka Ji
            </h3>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">
              Near Lotus Temple, South Delhi. <br />
              The original legacy kitchen.
            </p>
            <button className="text-[#E31E24] font-black uppercase tracking-widest text-xs border-b-2 border-[#E31E24]/20 pb-1 group-hover:border-[#E31E24] transition-all">
              Get Directions
            </button>
          </div>
          <div
            className="bg-white p-12 rounded-[15px] flex-1 min-w-[320px] border border-gray-100 shadow-xl hover:shadow-2xl transition-all group animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            <h3 className="text-3xl font-montserrat mb-4 group-hover:text-[#E31E24] transition-colors">
              Defence Colony
            </h3>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed">
              D-Block Market, South Delhi. <br />
              Fine takeaway and express delivery.
            </p>
            <button className="text-[#E31E24] font-black uppercase tracking-widest text-xs border-b-2 border-[#E31E24]/20 pb-1 group-hover:border-[#E31E24] transition-all">
              Get Directions
            </button>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h4 className="text-[#E31E24] font-montserrat tracking-[0.2em] uppercase text-sm mb-4 animate-fade-down">
            Our Craft
          </h4>
          <h2 className="text-4xl md:text-5xl font-montserrat mb-6 animate-fade-up">
            Experience Culinary Excellence
          </h2>
          <div className="w-20 h-1 bg-[#FFB30E] mx-auto rounded-[15px] animate-blur-in"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {features.map((f, i) => (
            <div
              key={i}
              className="text-center group p-8 rounded-[15px] hover:bg-gray-50 transition-all duration-300 border border-transparent hover:border-gray-100 animate-fade-up"
              style={{
                animationDelay: `${i * 150}ms`,
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                {f.icon}
              </div>
              <h3 className="text-xl font-medium mb-4 font-montserrat">
                {f.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// Standardized ProductCard component that matches MenuPage design exactly
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
        className={`w-full flex items-center justify-between p-3 rounded-[15px] transition-all duration-300 ${
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
          ></div>
          <span
            className={`text-[12px] font-black uppercase tracking-widest ${
              isActive ? "text-[#C0392B]" : "text-gray-400"
            }`}
          >
            {v}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {qtyLabel && (
            <span className="text-[10px] font-medium text-gray-300 uppercase">
              {qtyLabel}
            </span>
          )}
          {servesLabel && (
            <span className="text-[10px] font-black text-gray-400">
              {" "}
              {servesLabel}
            </span>
          )}
          <span
            className={`text-[11px] font-black ${
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
      <div className="relative aspect-[5/3] mb-5 overflow-hidden rounded-[15px] bg-gray-50">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
        />
        <div className="absolute top-4 left-4">
          <div
            className={`w-4 h-4 rounded-full border-2 border-white shadow-sm ${
              item.foodType === "Veg" ? "bg-emerald-500" : "bg-red-500"
            }`}
          ></div>
        </div>
        {item.discountPercentage && item.discountPercentage > 0 && (
          <div className="absolute top-4 right-4 bg-black text-white text-[8px] font-black px-2 py-1 rounded-[15px]">
            {item.discountPercentage}% OFF
          </div>
        )}
      </div>

      <div className="px-8 pb-10 pt-2 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-2xl font-medium text-gray-900 leading-tight group-hover:text-[#C0392B] transition-colors">
            {item.name}
          </h3>
          <span className="text-2xl font-black text-[#C0392B] tracking-tighter tabular-nums">
            ₹{discountedPrice}
          </span>
        </div>
        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-4">
          {item.category}{" "}
          {item.isSpicy !== "None"
            ? "🌶️".repeat(
                item.isSpicy === "Mild" ? 1 : item.isSpicy === "Medium" ? 2 : 3
              )
            : ""}
        </p>

        <p className="text-[11px] text-gray-400 italic mb-8 line-clamp-2">
          "{item.description}"
        </p>

        <div className="mt-auto space-y-6">
          <div className="bg-gray-50 p-1 rounded-[15px] flex flex-col gap-0.5 shadow-inner border border-gray-100">
            <VariantRow v="qtr" />
            <VariantRow v="half" />
            <VariantRow v="full" />
          </div>

          {cartItem ? (
            <div className="flex items-center bg-[#C0392B] text-white rounded-[15px] overflow-hidden h-14 shadow-xl">
              <button
                onClick={() => onUpdateQty(item.id, selectedVariant, -1)}
                className="flex-1 h-full flex items-center justify-center hover:bg-black transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="4"
                    d="M20 12H4"
                  />
                </svg>
              </button>
              <div className="w-14 h-full flex items-center justify-center font-black tabular-nums border-x border-white/10">
                {cartItem.quantity}
              </div>
              <button
                onClick={() => onUpdateQty(item.id, selectedVariant, 1)}
                className="flex-1 h-full flex items-center justify-center hover:bg-black transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="4"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(item, selectedVariant)}
              className="w-full py-5 bg-[#C0392B] text-white rounded-[15px] font-black uppercase tracking-widest text-[9px] flex items-center justify-center space-x-3 transition-all hover:bg-black active:scale-95 shadow-xl shadow-red-900/10 h-14"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Add To Cart</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeContent;
