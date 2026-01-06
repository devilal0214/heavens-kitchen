
import React, { useEffect, useState, useMemo } from 'react';
import { Order, OrderStatus, UserProfile, Outlet } from '../types';
import { RealtimeDB } from '../services/mockDb';

interface MyOrdersProps {
  user: UserProfile;
  onTrackOrder: (id: string) => void;
}

const MyOrders: React.FC<MyOrdersProps> = ({ user, onTrackOrder }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  
  // FILTERS
  const [selectedOutlet, setSelectedOutlet] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    const fetch = () => {
      const allOrders = RealtimeDB.getOrders();
      const allOutlets = RealtimeDB.getOutlets();
      setOutlets(allOutlets);
      setOrders(allOrders.filter(o => o.customerId === user.id));
    };
    fetch();
    return RealtimeDB.onUpdate(fetch);
  }, [user.id]);

  const generateInvoice = async (order: Order) => {
    const outlet = outlets.find(o => o.id === order.outletId);
    const globalSettings = RealtimeDB.getGlobalSettings();
    const invSettings = globalSettings.invoiceSettings;
    
    setIsGenerating(order.id);
    
    try {
      const { jsPDF } = await import('https://esm.sh/jspdf');
      const { default: autoTable } = await import('https://esm.sh/jspdf-autotable');
      
      const doc = new jsPDF();
      const primaryRgb = hexToRgb(invSettings.primaryColor || '#C0392B');
      
      // 1. BRAND HEADER
      if (invSettings.logoUrl) {
         try {
           doc.addImage(invSettings.logoUrl, 'PNG', 14, 10, 40, 15);
         } catch(e) {
           doc.setFontSize(24);
           doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
           doc.text(invSettings.brandName, 14, 22);
         }
      } else {
        doc.setFontSize(24);
        doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        doc.text(invSettings.brandName, 14, 22);
      }
      
      if (invSettings.showTagline) {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(invSettings.tagline, 14, 28);
      }
      
      // 2. INVOICE METADATA (RIGHT ALIGNED)
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(`INVOICE NO: ${order.id}`, 140, 22);
      doc.text(`DATE: ${new Date(order.timestamp).toLocaleString()}`, 140, 27);
      doc.text(`STATUS: ${order.status}`, 140, 32);

      // 3. FROM / TO SECTION
      doc.setDrawColor(240);
      doc.line(14, 40, 196, 40);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text("FROM:", 14, 50);
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.text(`${outlet?.name || invSettings.brandName}`, 14, 56);
      doc.text(`${invSettings.address}`, 14, 61, { maxWidth: 80 });
      doc.text(`Contact: ${invSettings.contact}`, 14, 72);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text("BILL TO:", 120, 50);
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.text(`${order.customerName}`, 120, 56);
      doc.text(`${order.address}`, 120, 61, { maxWidth: 75 });
      doc.text(`Phone: ${order.customerPhone}`, 120, 72);

      // 4. ITEMS TABLE
      const tableData = order.items.map(item => [
        item.name,
        item.variant.toUpperCase(),
        item.quantity.toString(),
        `INR ${item.price.toFixed(2)}`,
        `INR ${(item.price * item.quantity).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: 85,
        head: [['Dish Name', 'Portion', 'Qty', 'Unit Price', 'Subtotal']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [primaryRgb.r, primaryRgb.g, primaryRgb.b], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          4: { halign: 'right' },
          3: { halign: 'right' }
        }
      });

      // 5. SUMMARY CALCULATIONS
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("SUBTOTAL:", 135, finalY);
      doc.text(`GST (${globalSettings.gstPercentage}%):`, 135, finalY + 7);
      doc.text("DELIVERY FEE:", 135, finalY + 14);
      
      doc.setTextColor(0);
      doc.text(`INR ${order.subtotal.toFixed(2)}`, 190, finalY, { halign: 'right' });
      doc.text(`INR ${order.tax.toFixed(2)}`, 190, finalY + 7, { halign: 'right' });
      doc.text(`INR ${order.deliveryCharge.toFixed(2)}`, 190, finalY + 14, { halign: 'right' });
      
      doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.setLineWidth(0.5);
      doc.line(135, finalY + 18, 196, finalY + 18);
      
      doc.setFontSize(14);
      doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      doc.text("TOTAL AMOUNT:", 135, finalY + 26);
      doc.text(`INR ${order.total.toFixed(2)}`, 190, finalY + 26, { halign: 'right' });

      // 6. FOOTER NOTES
      if (invSettings.showNotice) {
        doc.setFontSize(8);
        doc.setTextColor(180);
        doc.text(`Thank you for choosing ${invSettings.brandName} - Your Sanctuary for Flavours.`, 105, 280, { halign: 'center' });
        doc.text("This is a computer-generated document. No signature required.", 105, 285, { halign: 'center' });
      }

      doc.save(`HK-INVOICE-${order.id}.pdf`);
    } catch (err) {
      console.error("Invoice generation failed:", err);
      alert("Failed to generate PDF. Falling back to print view.");
      window.print();
    } finally {
      setIsGenerating(null);
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 192, g: 57, b: 43 };
  };

  const filteredOrders = useMemo(() => {
    let result = orders;
    
    if (selectedOutlet !== 'all') {
      result = result.filter(o => o.outletId === selectedOutlet);
    }
    
    if (filterDate) {
      const targetDate = new Date(filterDate).toLocaleDateString();
      result = result.filter(o => new Date(o.timestamp).toLocaleDateString() === targetDate);
    }
    
    return result.sort((a,b) => b.timestamp - a.timestamp);
  }, [orders, selectedOutlet, filterDate]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.DELIVERED: return 'text-emerald-600 bg-emerald-50';
      case OrderStatus.REJECTED: return 'text-red-600 bg-red-50';
      case OrderStatus.PENDING: return 'text-amber-600 bg-amber-50';
      default: return 'text-[#C0392B] bg-red-50';
    }
  };

  return (
    <div className="pt-40 pb-20 px-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
        <div>
          <h2 className="text-5xl font-playfair font-bold mb-4">Order History</h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic">"Revisiting your culinary sanctuary moments."</p>
        </div>
        
        <div className="flex gap-3 bg-white p-3 rounded-[30px] border border-gray-100 shadow-sm">
           <div className="flex flex-col">
              <label className="text-[8px] font-black uppercase text-gray-400 mb-1 ml-2">Outlet</label>
              <select 
                value={selectedOutlet}
                onChange={e => setSelectedOutlet(e.target.value)}
                className="bg-gray-50 text-xs font-bold px-4 py-2 rounded-2xl outline-none"
              >
                <option value="all">All Outlets</option>
                {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
           </div>
           <div className="flex flex-col">
              <label className="text-[8px] font-black uppercase text-gray-400 mb-1 ml-2">Date</label>
              <input 
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="bg-gray-50 text-xs font-bold px-4 py-2 rounded-2xl outline-none"
              />
           </div>
           { (selectedOutlet !== 'all' || filterDate) && (
             <button 
               onClick={() => { setSelectedOutlet('all'); setFilterDate(''); }}
               className="self-end px-4 py-2 text-[10px] font-black uppercase text-[#C0392B] hover:underline"
             >
               Reset
             </button>
           )}
        </div>
      </div>

      <div className="space-y-8 animate-fade-up">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white p-10 rounded-[50px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col md:flex-row gap-10 items-stretch">
             <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-mono font-bold text-[#C0392B] uppercase tracking-widest bg-red-50 px-3 py-1 rounded-lg">#{order.id}</span>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="mb-8">
                  <h3 className="text-3xl font-playfair font-bold mb-1">₹{order.total.toFixed(0)} Legacy Box</h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                    {outlets.find(o => o.id === order.outletId)?.name} • {new Date(order.timestamp).toLocaleString()}
                  </p>
                </div>
                
                <div className="space-y-3 mb-10 flex-grow">
                   {order.items.map((item, i) => (
                     <div key={i} className="flex items-center text-sm text-gray-600">
                        <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-black mr-3 border border-gray-100">{item.quantity}</div>
                        <span className="font-bold">{item.name}</span>
                        <span className="mx-2 opacity-30">|</span>
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{item.variant}</span>
                     </div>
                   ))}
                </div>

                <div className="flex gap-4">
                   {order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.REJECTED ? (
                     <button 
                       onClick={() => onTrackOrder(order.id)}
                       className="px-10 py-4 bg-[#C0392B] text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-red-900/20 border border-[#FFB30E] hover:bg-black transition-all"
                     >
                       Track Live Status
                     </button>
                   ) : (
                     <button className="px-10 py-4 bg-gray-900 text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] hover:bg-black transition-all">
                       Order Again
                     </button>
                   )}
                   <button 
                    onClick={() => generateInvoice(order)}
                    disabled={isGenerating === order.id}
                    className="px-6 py-4 bg-gray-50 text-gray-600 hover:text-[#C0392B] rounded-[24px] font-black uppercase tracking-widest text-[10px] border border-gray-100 hover:bg-gray-100 transition-all disabled:opacity-50"
                   >
                     {isGenerating === order.id ? 'Generating...' : 'View Invoice'}
                   </button>
                </div>
             </div>
             
             <div className="w-full md:w-64 bg-gray-50/50 rounded-[40px] border border-gray-100 p-8 flex flex-col justify-center text-center shadow-inner">
                <div className="text-3xl mb-4">📍</div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Sanctuary Address</p>
                <p className="text-xs text-gray-600 font-medium italic leading-relaxed">"{order.address}"</p>
                <div className="mt-6 pt-6 border-t border-gray-100">
                   <p className="text-[8px] font-black uppercase tracking-widest text-gray-300">Payment Status</p>
                   <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-widest">{order.paymentMethod} Verified</p>
                </div>
             </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center py-40 bg-gray-50/50 rounded-[60px] border-4 border-dashed border-gray-100">
             <div className="text-7xl mb-10 opacity-30">🍱</div>
             <h3 className="text-3xl font-playfair font-bold text-gray-900 mb-3">No matching sanctuary records</h3>
             <p className="text-gray-400 text-xs font-bold uppercase tracking-widest italic">"Try adjusting your filters to find your past meals."</p>
             <button 
               onClick={() => { setSelectedOutlet('all'); setFilterDate(''); }}
               className="mt-10 px-10 py-4 bg-white border border-gray-200 rounded-[24px] text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all"
             >
               Clear All Filters
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
