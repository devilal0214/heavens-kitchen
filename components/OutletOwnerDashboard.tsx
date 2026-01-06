
import React, { useState, useEffect } from 'react';
import { Order, InventoryItem, OrderStatus } from '../types';
import { MockDB } from '../services/mockDb';

const OutletOwnerDashboard: React.FC<{ outletId: string }> = ({ outletId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'live' | 'inventory'>('live');

  useEffect(() => {
    refreshData();
    const timer = setInterval(refreshData, 5000);
    return () => clearInterval(timer);
  }, [outletId]);

  const refreshData = () => {
    setOrders(MockDB.getOrders(outletId));
    setInventory(MockDB.getInventory(outletId));
  };

  const updateStatus = (orderId: string, status: OrderStatus) => {
    /* Added missing updatedBy argument (3rd parameter) */
    MockDB.updateOrderStatus(orderId, status, 'Outlet Owner');
    refreshData();
  };

  const updateStock = (id: string, newQty: number) => {
    MockDB.updateInventoryStock(id, newQty);
    refreshData();
  };

  return (
    <div className="pt-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-playfair font-bold">Outlet Control</h1>
          <p className="text-[#C0392B] font-bold">Managing: {outletId === 'kalka-ji' ? 'Kalka Ji' : 'Defence Colony'}</p>
        </div>
        <div className="mt-4 md:mt-0 flex bg-gray-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('live')}
            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'live' ? 'bg-[#C0392B] text-white shadow-lg' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Live Kitchen
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'inventory' ? 'bg-[#C0392B] text-white shadow-lg' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Inventory
          </button>
        </div>
      </div>

      {activeTab === 'live' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up">
          {/* New Orders */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center">
              <span className="w-3 h-3 bg-amber-500 rounded-full mr-3 animate-pulse"></span>
              New Orders ({orders.filter(o => o.status === OrderStatus.PENDING).length})
            </h3>
            {orders.filter(o => o.status === OrderStatus.PENDING).map(order => (
              <OrderCard key={order.id} order={order} onUpdate={updateStatus} />
            ))}
          </div>

          {/* Active Preparation */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></span>
              In Kitchen ({orders.filter(o => [OrderStatus.ACCEPTED, OrderStatus.PREPARING].includes(o.status)).length})
            </h3>
            {orders.filter(o => [OrderStatus.ACCEPTED, OrderStatus.PREPARING].includes(o.status)).map(order => (
              <OrderCard key={order.id} order={order} onUpdate={updateStatus} />
            ))}
          </div>

          {/* Out for Delivery */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
              Ready & Out ({orders.filter(o => [OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY].includes(o.status)).length})
            </h3>
            {orders.filter(o => [OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY].includes(o.status)).map(order => (
              <OrderCard key={order.id} order={order} onUpdate={updateStatus} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up">
          {inventory.map(item => (
            <div key={item.id} className={`bg-white p-6 rounded-3xl border shadow-sm transition-all ${item.stock < item.minStock ? 'border-red-500 bg-red-50' : ''}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-xl font-bold">{item.name}</h4>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{item.unit}</p>
                </div>
                {item.stock < item.minStock && <span className="text-red-600 animate-bounce">⚠️ Low Stock</span>}
              </div>
              <div className="flex items-center justify-between mb-8">
                <span className="text-4xl font-playfair font-bold">{item.stock.toFixed(1)}</span>
                <div className="flex space-x-2">
                  <button onClick={() => updateStock(item.id, item.stock - 1)} className="w-10 h-10 border rounded-xl flex items-center justify-center hover:bg-white">-</button>
                  <button onClick={() => updateStock(item.id, item.stock + 5)} className="w-10 h-10 border rounded-xl flex items-center justify-center hover:bg-white">+</button>
                </div>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${item.stock < item.minStock ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((item.stock/item.minStock)*50, 100)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const OrderCard: React.FC<{ order: Order; onUpdate: (id: string, s: OrderStatus) => void }> = ({ order, onUpdate }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h5 className="font-bold text-lg">{order.customerName}</h5>
        <p className="text-xs text-gray-400 font-mono">{order.id}</p>
      </div>
      <span className="text-sm font-bold text-[#C0392B]">₹{order.total.toFixed(0)}</span>
    </div>
    
    <div className="space-y-2 mb-6">
      {order.items.map((item, idx) => (
        <div key={idx} className="flex justify-between text-xs font-medium">
          <span className="text-gray-600">{item.quantity}x {item.name} ({item.variant})</span>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-2 gap-2">
      {order.status === OrderStatus.PENDING && (
        <>
          <button onClick={() => onUpdate(order.id, OrderStatus.ACCEPTED)} className="py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600">Accept</button>
          <button onClick={() => onUpdate(order.id, OrderStatus.REJECTED)} className="py-2 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200">Reject</button>
        </>
      )}
      {order.status === OrderStatus.ACCEPTED && (
        <button onClick={() => onUpdate(order.id, OrderStatus.PREPARING)} className="col-span-2 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">Start Cooking</button>
      )}
      {order.status === OrderStatus.PREPARING && (
        <button onClick={() => onUpdate(order.id, OrderStatus.READY)} className="col-span-2 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">Mark Ready</button>
      )}
      {order.status === OrderStatus.READY && (
        <button onClick={() => onUpdate(order.id, OrderStatus.OUT_FOR_DELIVERY)} className="col-span-2 py-2 bg-[#C0392B] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">Hand Over</button>
      )}
      {order.status === OrderStatus.OUT_FOR_DELIVERY && (
        <button onClick={() => onUpdate(order.id, OrderStatus.DELIVERED)} className="col-span-2 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">Delivered</button>
      )}
    </div>
  </div>
);

export default OutletOwnerDashboard;
