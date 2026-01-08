import React, { useMemo, useState, useEffect } from "react";
import {
  Order,
  InventoryItem,
  OrderStatus,
  UserProfile,
  UserRole,
} from "../types";
import FirestoreDB from "../services/firestoreDb";

type Tab = "live" | "inventory" | "staff";

const OutletOwnerDashboard: React.FC<{ outletId: string }> = ({ outletId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("live");

  // Staff modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    role: UserRole.MANAGER as UserRole,
  });

  useEffect(() => {
    refreshData();
    const timer = setInterval(refreshData, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  const refreshData = async () => {
    try {
      const [ordersData, inventoryData, staffData] = await Promise.all([
        FirestoreDB.getOrders(undefined, outletId),
        FirestoreDB.getInventory(outletId),
        FirestoreDB.getStaffUsers(),
      ]);

      setOrders(ordersData);
      setInventory(inventoryData);

      // ✅ Outlet owner can only SEE staff from their own outlet,
      // and only roles: MANAGER + DELIVERY_BOY
      const allowed = staffData.filter((u) => {
        const sameOutlet = u.outletId === outletId;
        const allowedRole =
          u.role === UserRole.MANAGER ||
          u.role === (UserRole as any).DELIVERY_BOY;
        return sameOutlet && allowedRole;
      });

      setStaff(allowed);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const updateStatus = (orderId: string, status: OrderStatus) => {
    FirestoreDB.updateOrderStatus(orderId, status)
      .then(refreshData)
      .catch(console.error);
  };

  const updateStock = (id: string, newQty: number) => {
    const item = inventory.find((i) => i.id === id);
    if (!item) return;

    FirestoreDB.saveInventoryItem({ ...item, stock: newQty })
      .then(refreshData)
      .catch(console.error);
  };

  // ✅ Only 2 roles allowed for outlet owner staff ops
  const allowedRoleOptions = useMemo(() => {
    const opts: { label: string; value: UserRole }[] = [
      { label: "Manager", value: UserRole.MANAGER },
    ];

    // If your enum has DELIVERY_BOY, add it
    if ((UserRole as any).DELIVERY_BOY) {
      opts.push({
        label: "Delivery Boy",
        value: (UserRole as any).DELIVERY_BOY,
      });
    } else if ((UserRole as any).DELIVERY) {
      // fallback if your enum name is DELIVERY
      opts.push({ label: "Delivery Boy", value: (UserRole as any).DELIVERY });
    }

    return opts;
  }, []);

  const openAddStaff = () => {
    setEditingStaffId(null);
    setStaffForm({
      name: "",
      email: "",
      password: "",
      role: allowedRoleOptions[0]?.value || UserRole.MANAGER,
    });
    setIsStaffModalOpen(true);
  };

  const openEditStaff = (u: UserProfile) => {
    setEditingStaffId(u.id);
    setStaffForm({
      name: u.name || "",
      email: u.email || "",
      password: (u as any).password || "",
      role: u.role,
    });
    setIsStaffModalOpen(true);
  };

  const saveStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ HARD BLOCK: outlet owner can only create/edit MANAGER or DELIVERY_BOY
    const isAllowedRole =
      staffForm.role === UserRole.MANAGER ||
      staffForm.role === (UserRole as any).DELIVERY_BOY ||
      staffForm.role === (UserRole as any).DELIVERY;

    if (!isAllowedRole) {
      alert("You can only create Manager or Delivery Boy.");
      return;
    }

    const payload: UserProfile = {
      id: editingStaffId || `staff-${Date.now()}`,
      name: staffForm.name.trim(),
      email: staffForm.email.trim(),
      password: staffForm.password,
      role: staffForm.role,
      outletId: outletId, // ✅ FORCE to this outlet only
      phone: "",
      address: "",
      permissions: {
        manageMenu: staffForm.role === UserRole.MANAGER,
        manageInventory: staffForm.role === UserRole.MANAGER,
        viewStats: staffForm.role === UserRole.MANAGER,
        manageOrders: true, // both can manage order status
        manageOutlets: false,
        manageManagers: false,
      } as any,
    };

    try {
      await FirestoreDB.saveStaffUser(payload);
      setIsStaffModalOpen(false);
      refreshData();
    } catch (err) {
      console.error(err);
      alert("Failed to save staff. Check console.");
    }
  };

  const deleteStaff = async (u: UserProfile) => {
    // ✅ Outlet owner can delete only allowed roles from their own outlet
    const allowedRole =
      u.role === UserRole.MANAGER ||
      u.role === (UserRole as any).DELIVERY_BOY ||
      u.role === (UserRole as any).DELIVERY;
    if (!allowedRole || u.outletId !== outletId) {
      alert("Not allowed.");
      return;
    }

    if (!window.confirm("Remove this staff member?")) return;

    try {
      await FirestoreDB.deleteStaffUser(u.id);
      refreshData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete staff. Check console.");
    }
  };

  return (
    <div className="pt-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-playfair font-bold">Outlet Control</h1>
          <p className="text-[#C0392B] font-bold">
            Managing: {outletId === "kalka-ji" ? "Kalka Ji" : "Defence Colony"}
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("live")}
            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "live"
                ? "bg-[#C0392B] text-white shadow-lg"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Live Kitchen
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "inventory"
                ? "bg-[#C0392B] text-white shadow-lg"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Inventory
          </button>

          <button
            onClick={() => setActiveTab("staff")}
            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === "staff"
                ? "bg-[#C0392B] text-white shadow-lg"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Staff
          </button>
        </div>
      </div>

      {/* LIVE */}
      {activeTab === "live" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up">
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center">
              <span className="w-3 h-3 bg-amber-500 rounded-full mr-3 animate-pulse"></span>
              New Orders (
              {orders.filter((o) => o.status === OrderStatus.PENDING).length})
            </h3>
            {orders
              .filter((o) => o.status === OrderStatus.PENDING)
              .map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdate={updateStatus}
                />
              ))}
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></span>
              In Kitchen (
              {
                orders.filter((o) =>
                  [OrderStatus.ACCEPTED, OrderStatus.PREPARING].includes(
                    o.status
                  )
                ).length
              }
              )
            </h3>
            {orders
              .filter((o) =>
                [OrderStatus.ACCEPTED, OrderStatus.PREPARING].includes(o.status)
              )
              .map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdate={updateStatus}
                />
              ))}
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
              Ready & Out (
              {
                orders.filter((o) =>
                  [OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY].includes(
                    o.status
                  )
                ).length
              }
              )
            </h3>
            {orders
              .filter((o) =>
                [OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY].includes(
                  o.status
                )
              )
              .map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdate={updateStatus}
                />
              ))}
          </div>
        </div>
      )}

      {/* INVENTORY */}
      {activeTab === "inventory" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up">
          {inventory.map((item) => (
            <div
              key={item.id}
              className={`bg-white p-6 rounded-3xl border shadow-sm transition-all ${
                item.stock < item.minStock ? "border-red-500 bg-red-50" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-xl font-bold">{item.name}</h4>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">
                    {item.unit}
                  </p>
                </div>
                {item.stock < item.minStock && (
                  <span className="text-red-600 animate-bounce">
                    ⚠️ Low Stock
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mb-8">
                <span className="text-4xl font-playfair font-bold">
                  {Number(item.stock).toFixed(1)}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateStock(item.id, Number(item.stock) - 1)}
                    className="w-10 h-10 border rounded-xl flex items-center justify-center hover:bg-white"
                  >
                    -
                  </button>
                  <button
                    onClick={() => updateStock(item.id, Number(item.stock) + 5)}
                    className="w-10 h-10 border rounded-xl flex items-center justify-center hover:bg-white"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    item.stock < item.minStock ? "bg-red-500" : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (Number(item.stock) / Number(item.minStock)) * 50,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STAFF */}
      {activeTab === "staff" && (
        <div className="animate-fade-up">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold">Outlet Staff</h3>
              <p className="text-sm text-gray-500">
                You can manage only <b>Manager</b> and <b>Delivery Boy</b> for
                this outlet.
              </p>
            </div>
            <button
              onClick={openAddStaff}
              className="bg-[#C0392B] text-white px-6 py-3 rounded-2xl font-black uppercase text-[11px] shadow-xl hover:bg-black transition-all"
            >
              + Add Staff
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-4 px-5 text-[10px] font-black uppercase text-gray-400">
                    Name
                  </th>
                  <th className="py-4 px-5 text-[10px] font-black uppercase text-gray-400">
                    Email
                  </th>
                  <th className="py-4 px-5 text-[10px] font-black uppercase text-gray-400">
                    Role
                  </th>
                  <th className="py-4 px-5"></th>
                </tr>
              </thead>
              <tbody>
                {staff.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50"
                  >
                    <td className="py-5 px-5 font-bold">{u.name}</td>
                    <td className="py-5 px-5 text-sm text-gray-500">
                      {u.email}
                    </td>
                    <td className="py-5 px-5">
                      <span className="px-3 py-1 rounded-xl bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest">
                        {String(u.role).replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-5 px-5 text-right">
                      <div className="flex justify-end gap-4">
                        <button
                          onClick={() => openEditStaff(u)}
                          className="text-[#C0392B] text-[10px] font-black uppercase hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteStaff(u)}
                          className="text-red-500 text-[10px] font-black uppercase hover:underline opacity-70"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {staff.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-16 text-center text-gray-400 font-bold"
                    >
                      No staff added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* STAFF MODAL */}
          {isStaffModalOpen && (
            <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={() => setIsStaffModalOpen(false)}
              ></div>

              <form
                onSubmit={saveStaff}
                className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-10 border border-gray-100"
              >
                <h3 className="text-2xl font-bold mb-8">
                  {editingStaffId ? "Edit Staff" : "Add Staff"}
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">
                      Name
                    </label>
                    <input
                      required
                      value={staffForm.name}
                      onChange={(e) =>
                        setStaffForm((p) => ({ ...p, name: e.target.value }))
                      }
                      className="w-full p-4 rounded-2xl bg-gray-50 outline-none border border-transparent focus:border-red-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">
                      Email
                    </label>
                    <input
                      required
                      value={staffForm.email}
                      onChange={(e) =>
                        setStaffForm((p) => ({ ...p, email: e.target.value }))
                      }
                      className="w-full p-4 rounded-2xl bg-gray-50 outline-none border border-transparent focus:border-red-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">
                      Password
                    </label>
                    <input
                      required
                      value={staffForm.password}
                      onChange={(e) =>
                        setStaffForm((p) => ({
                          ...p,
                          password: e.target.value,
                        }))
                      }
                      className="w-full p-4 rounded-2xl bg-gray-50 outline-none border border-transparent focus:border-red-100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 tracking-widest">
                      Role
                    </label>
                    <select
                      value={staffForm.role as any}
                      onChange={(e) =>
                        setStaffForm((p) => ({
                          ...p,
                          role: e.target.value as any,
                        }))
                      }
                      className="w-full p-4 rounded-2xl bg-gray-50 outline-none border border-transparent focus:border-red-100"
                    >
                      {allowedRoleOptions.map((r) => (
                        <option key={String(r.value)} value={r.value as any}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mt-10">
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-[#C0392B] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsStaffModalOpen(false)}
                    className="px-8 py-4 bg-gray-100 rounded-2xl text-gray-600 font-black uppercase text-[10px] tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const OrderCard: React.FC<{
  order: Order;
  onUpdate: (id: string, s: OrderStatus) => void;
}> = ({ order, onUpdate }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h5 className="font-bold text-lg">{order.customerName}</h5>
        <p className="text-xs text-gray-400 font-mono">{order.id}</p>
      </div>
      <span className="text-sm font-bold text-[#C0392B]">
        ₹{Number(order.total).toFixed(0)}
      </span>
    </div>

    <div className="space-y-2 mb-6">
      {order.items.map((item, idx) => (
        <div key={idx} className="flex justify-between text-xs font-medium">
          <span className="text-gray-600">
            {item.quantity}x {item.name} ({item.variant})
          </span>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-2 gap-2">
      {order.status === OrderStatus.PENDING && (
        <>
          <button
            onClick={() => onUpdate(order.id, OrderStatus.ACCEPTED)}
            className="py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600"
          >
            Accept
          </button>
          <button
            onClick={() => onUpdate(order.id, OrderStatus.REJECTED)}
            className="py-2 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200"
          >
            Reject
          </button>
        </>
      )}

      {order.status === OrderStatus.ACCEPTED && (
        <button
          onClick={() => onUpdate(order.id, OrderStatus.PREPARING)}
          className="col-span-2 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest"
        >
          Start Cooking
        </button>
      )}

      {order.status === OrderStatus.PREPARING && (
        <button
          onClick={() => onUpdate(order.id, OrderStatus.READY)}
          className="col-span-2 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest"
        >
          Mark Ready
        </button>
      )}

      {order.status === OrderStatus.READY && (
        <button
          onClick={() => onUpdate(order.id, OrderStatus.OUT_FOR_DELIVERY)}
          className="col-span-2 py-2 bg-[#C0392B] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest"
        >
          Hand Over
        </button>
      )}

      {order.status === OrderStatus.OUT_FOR_DELIVERY && (
        <button
          onClick={() => onUpdate(order.id, OrderStatus.DELIVERED)}
          className="col-span-2 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest"
        >
          Delivered
        </button>
      )}
    </div>
  </div>
);

export default OutletOwnerDashboard;
