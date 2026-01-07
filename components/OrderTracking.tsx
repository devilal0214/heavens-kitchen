// components/OrderTracking.tsx

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, UserProfile, Review } from '../types';
import FirestoreDB from '../services/firestoreDb';

const STAGES = [
  { id: OrderStatus.PENDING, label: "Accepted", icon: "📝" },
  { id: OrderStatus.PREPARING, label: "Preparing", icon: "👨‍🍳" },
  { id: OrderStatus.READY, label: "Ready", icon: "✅" },
  { id: OrderStatus.OUT_FOR_DELIVERY, label: "Out", icon: "🛵" },
  { id: OrderStatus.DELIVERED, label: "Delivered", icon: "🏠" },
];

interface OrderTrackingProps {
  orderId: string | null;
  user: UserProfile | null;
  onGoToLogin: () => void;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({
  orderId,
  user,
  onGoToLogin,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Firestore realtime order fetch (fixes "Locating your meal..." forever)
  useEffect(() => {
    if (!orderId) return;

<<<<<<< HEAD
    setLoading(true);
=======
    const fetchOrder = async () => {
      try {
        const orders = await FirestoreDB.getOrders();
        const found = orders.find(o => o.id === orderId);
        if (found) setOrder(found);
      } catch (error) {
        console.error('Error fetching order:', error);
      }
    };
>>>>>>> 87b2a69 (Complete migration to Firebase Firestore - remove all localStorage and compatibility layers)

    const cleanId = String(orderId).trim();
    const ref = doc(db, "orders", cleanId);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setOrder(null);
          setLoading(false);
          return;
        }
        setOrder({ id: snap.id, ...(snap.data() as any) } as Order);
        setLoading(false);
      },
      (err) => {
        console.error("OrderTracking Firestore error:", err);
        setOrder(null);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [orderId]);

  const handleRatingSubmit = async () => {
    if (!order || rating === 0) return;

    const review: Review = {
      id: `rev-${Date.now()}`,
      outletId: order.outletId,
      orderId: order.id,
      rating,
      comment,
      customerName: user?.name || (order as any).customerName || "Anonymous",
      timestamp: Date.now(),
    };
<<<<<<< HEAD

    try {
      setSubmitting(true);

      // ✅ Save review in Firestore (collection: "reviews")
      await addDoc(collection(db, "reviews"), {
        ...review,
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (e) {
      console.error("Failed to submit review:", e);
      alert("Could not submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
=======
    
    FirestoreDB.saveReview(review).then(() => {
      setSubmitted(true);
    }).catch(console.error);
>>>>>>> 87b2a69 (Complete migration to Firebase Firestore - remove all localStorage and compatibility layers)
  };

  // No orderId at all
  if (!orderId) {
    return (
      <div className="pt-40 pb-20 max-w-xl mx-auto px-6">
        <div className="bg-white rounded-[50px] p-12 shadow-2xl border border-gray-100 text-center animate-fade-up">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-5xl mx-auto mb-8">
            🍲
          </div>
          <h2 className="text-4xl font-playfair font-bold mb-4">
            No Active Order
          </h2>
          <p className="text-gray-500 mb-10 leading-relaxed">
            You don't have any orders currently in progress. Why not explore our
            signature legacy recipes?
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-5 bg-[#C0392B] text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl border border-[#FFB30E]"
          >
            Browse Our Menu
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="pt-40 p-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest">
        Locating your meal...
      </div>
    );
  }

  // Order not found in Firestore
  if (!order) {
    return (
      <div className="pt-40 pb-20 max-w-xl mx-auto px-6">
        <div className="bg-white rounded-[50px] p-12 shadow-2xl border border-gray-100 text-center animate-fade-up">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
            🔎
          </div>

          <h2 className="text-3xl font-playfair font-bold mb-3">
            Order not found
          </h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            We couldn’t locate this order ID in our system. If you just placed
            the order, wait a few seconds and retry. Otherwise, please login and
            check “My Orders”.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-[#C0392B] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl border border-[#FFB30E]"
            >
              Try Again
            </button>

            <button
              onClick={onGoToLogin}
              className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentIdx = STAGES.findIndex((s) => s.id === order.status);
  const isDelivered = order.status === OrderStatus.DELIVERED;

  return (
    <div className="pt-40 pb-20 max-w-3xl mx-auto px-6">
      <div className="bg-white rounded-[50px] p-12 shadow-2xl animate-fade-up border border-gray-50">
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-inner">
            ✨
          </div>
          <h2 className="text-4xl font-playfair font-bold mb-2">
            Order Tracking
          </h2>
          <p className="text-xs text-gray-400 font-black uppercase tracking-widest">
            Order ID: {order.id}
          </p>
        </div>

        {!isDelivered ? (
          <div className="relative max-w-md mx-auto">
            <div className="absolute left-[31px] top-0 bottom-0 w-1 bg-gray-100 rounded-full"></div>

            <div className="space-y-12 relative">
              {STAGES.map((stage, idx) => {
                const isActive = idx <= currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div key={stage.id} className="flex items-center space-x-8">
                    <div
                      className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all duration-700 ${
                        isActive
                          ? "bg-[#C0392B] text-white scale-110 border-4 border-red-50"
                          : "bg-white text-gray-200 border-2 border-gray-100"
                      }`}
                    >
                      {stage.icon}
                    </div>

                    <div>
                      <h4
                        className={`text-lg font-bold transition-colors duration-500 ${
                          isActive ? "text-gray-900" : "text-gray-200"
                        }`}
                      >
                        {stage.label}
                      </h4>

                      {isCurrent && (
                        <div className="flex items-center mt-1">
                          <span className="w-2 h-2 bg-[#C0392B] rounded-full animate-ping mr-2"></span>
                          <p className="text-[10px] text-[#C0392B] font-black uppercase tracking-widest">
                            Happening now...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 animate-fade-up">
            <div className="text-6xl mb-6">🛵🏠</div>

            <h3 className="text-3xl font-playfair font-bold text-gray-900 mb-4">
              Delivered!
            </h3>

            <p className="text-gray-500 mb-10">
              We hope you enjoyed your Heaven's Kitchen experience.
            </p>

            {!submitted ? (
              <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100 max-w-md mx-auto">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">
                  Rate Your Meal
                </h4>

                <div className="flex justify-center space-x-4 mb-8">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-4xl transition-transform ${
                        rating >= star ? "scale-125" : "grayscale opacity-30"
                      }`}
                      aria-label={`Rate ${star} star`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you loved..."
                  className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-sm outline-none mb-6 resize-none"
                  rows={3}
                />

                <button
                  disabled={rating === 0 || submitting}
                  onClick={handleRatingSubmit}
                  className="w-full py-4 bg-[#C0392B] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl border border-[#FFB30E] disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50 p-8 rounded-[40px] border border-emerald-100 max-w-md mx-auto">
                <p className="text-emerald-600 font-bold uppercase tracking-widest text-[10px]">
                  Thank you for your feedback! ✨
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
