import React, { useState, useEffect, useMemo } from "react";
import FirestoreDB from "../services/firestoreDb";
import {
  Order,
  MenuItem,
  InventoryItem,
  Outlet,
  OrderStatus,
  UserRole,
  UserProfile,
  StaffPermissions,
  GlobalSettings,
  ManualInvoice,
  OrderItem,
} from "../types";

interface AdminDashboardProps {
  user: UserProfile;
  onBack?: () => void;
  onLogout?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  onBack,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<
    | "stats"
    | "orders"
    | "menu"
    | "inventory"
    | "outlets"
    | "history"
    | "users"
    | "settings"
    | "billing"
  >("stats");
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>(
    user.outletId || "all"
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [staffUsers, setStaffUsers] = useState<UserProfile[]>([]);
  const [manualInvoices, setManualInvoices] = useState<ManualInvoice[]>([]);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    gstPercentage: 5,
    deliveryBaseCharge: 40,
    deliveryChargePerKm: 10,
    freeDeliveryThreshold: 500,
    freeDeliveryDistanceLimit: 5,
    deliveryTiers: [],
    invoiceSettings: {
      brandName: 'HAVENS KITCHEN',
      logoUrl: '',
      tagline: 'ESTABLISHED 1984 • CULINARY SANCTUARY',
      address: 'HQ - South Delhi, India',
      contact: '9899466466',
      showTagline: true,
      showNotice: true,
      primaryColor: '#C0392B'
    }
  });

  const [statsYear, setStatsYear] = useState<number>(2026);
  const [statsMonth, setStatsMonth] = useState<number | "all">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isOutletModalOpen, setIsOutletModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isManualInvoiceModalOpen, setIsManualInvoiceModalOpen] =
    useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingOutletId, setEditingOutletId] = useState<string | null>(null);
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(
    null
  );
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [formItem, setFormItem] = useState({
    name: "",
    description: "",
    category: "",
    fullPrice: "",
    halfPrice: "",
    qtrPrice: "",
    fullQty: "",
    halfQty: "",
    qtrQty: "",
    fullServes: "",
    halfServes: "",
    qtrServes: "",
    imageUrl:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400",
    isSpicy: "None" as "None" | "Mild" | "Medium" | "Hot",
    foodType: "Veg" as "Veg" | "Non-Veg",
    outletId: user.outletId || "outlet-1",
    discount: "0",
  });

  const [inventoryForm, setInventoryForm] = useState({
    name: "",
    stock: 0,
    minStock: 5,
    unit: "Portions",
    imageUrl: "",
    outletId: user.outletId || "outlet-1",
  });

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: UserRole.MANAGER,
    outletId: user.outletId || "all",
    permissions: {
      manageMenu: true,
      manageInventory: true,
      viewStats: true,
      manageOrders: true,
      manageOutlets: false,
      manageManagers: false,
    } as StaffPermissions,
  });

  const [outletForm, setOutletForm] = useState({
    name: "",
    address: "",
    contact: "",
    email: "",
    imageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
    lat: 28.6,
    lng: 77.2,
    radius: 5,
    ownerEmail: "",
    isActive: true,
  });

  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    const refresh = async () => {
      try {
        const [
          outletsData,
          ordersData,
          menuData,
          inventoryData,
          staffData,
          invoicesData,
          settingsData
        ] = await Promise.all([
          FirestoreDB.getOutlets(),
          FirestoreDB.getOrders(),
          FirestoreDB.getMenu(),
          FirestoreDB.getInventory(selectedOutlet === 'all' ? undefined : selectedOutlet),
          FirestoreDB.getStaffUsers(),
          FirestoreDB.getManualInvoices(),
          FirestoreDB.getGlobalSettings()
        ]);

        setOutlets(outletsData);
        setOrders(ordersData);
        setMenu(menuData);
        setInventory(inventoryData);
        setCategories(['Signature Selection', 'Momo Factory', 'Appetizers', 'Main Course', 'Beverages', 'Desserts']);
        setStaffUsers(staffData);
        setManualInvoices(invoicesData);
        setGlobalSettings(settingsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    refresh();
  }, [selectedOutlet]);

  const filteredStaff = useMemo(() => {
    return staffUsers.filter(
      (u) =>
        selectedOutlet === "all" ||
        u.outletId === selectedOutlet ||
        u.outletId === "all"
    );
  }, [staffUsers, selectedOutlet]);

  const stats = useMemo(() => {
    const filteredOrders =
      selectedOutlet === "all"
        ? orders
        : orders.filter((o) => o.outletId === selectedOutlet);
    const filteredInventory =
      selectedOutlet === "all"
        ? inventory
        : inventory.filter((i) => i.outletId === selectedOutlet);
    const deliveredOrders = filteredOrders.filter(
      (o) => o.status === OrderStatus.DELIVERED
    );
    const chartData: { label: string; value: number }[] = [];

    if (statsMonth === "all") {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      months.forEach((m, i) => {
        const rev = deliveredOrders
          .filter((o) => {
            const d = new Date(o.timestamp);
            return d.getFullYear() === statsYear && d.getMonth() === i;
          })
          .reduce((sum, o) => sum + o.total, 0);
        chartData.push({ label: m, value: rev });
      });
    } else {
      const daysInMonth = new Date(
        statsYear,
        Number(statsMonth) + 1,
        0
      ).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const rev = deliveredOrders
          .filter((o) => {
            const d = new Date(o.timestamp);
            return (
              d.getFullYear() === statsYear &&
              d.getMonth() === Number(statsMonth) &&
              d.getDate() === day
            );
          })
          .reduce((sum, o) => sum + o.total, 0);
        chartData.push({ label: `${day}`, value: rev });
      }
    }

    return {
      totalRevenue: deliveredOrders.reduce((sum, o) => sum + o.total, 0),
      active: filteredOrders.filter(
        (o) =>
          o.status !== OrderStatus.DELIVERED &&
          o.status !== OrderStatus.REJECTED
      ).length,
      lowStock: filteredInventory.filter((i) => i.stock < i.minStock).length,
      deliveredToday: deliveredOrders.filter(
        (o) =>
          new Date(o.timestamp).toDateString() === new Date().toDateString()
      ).length,
      chartData,
      currentRevenue: chartData.reduce((sum, d) => sum + d.value, 0),
    };
  }, [orders, inventory, selectedOutlet, statsYear, statsMonth]);

  const handleDownloadCSV = () => {
    const filteredOrders = orders.filter((o) => {
      const d = new Date(o.timestamp);
      return (
        o.status === OrderStatus.DELIVERED &&
        d.getFullYear() === statsYear &&
        (statsMonth === "all" || d.getMonth() === statsMonth) &&
        (selectedOutlet === "all" || o.outletId === selectedOutlet)
      );
    });

    if (filteredOrders.length === 0) return alert("No sales records found.");
    const headers = [
      "Order ID",
      "Date",
      "Outlet",
      "Customer",
      "Items",
      "Total",
      "Payment",
    ];
    const rows = filteredOrders.map((order) => [
      order.id,
      new Date(order.timestamp).toLocaleDateString(),
      outlets.find((o) => o.id === order.outletId)?.name,
      order.customerName,
      order.items
        .map((i) => `${i.quantity}x ${i.name} (${i.variant})`)
        .join("; "),
      order.total,
      order.paymentMethod,
    ]);
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Havens_Kitchen_Report_${Date.now()}.csv`;
    link.click();
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    const item: MenuItem = {
      id: editingId || `item-${Date.now()}`,
      outletId: formItem.outletId,
      name: formItem.name,
      description: formItem.description,
      category: formItem.category,
      price: {
        full: Number(formItem.fullPrice),
        half: formItem.halfPrice ? Number(formItem.halfPrice) : undefined,
        qtr: formItem.qtrPrice ? Number(formItem.qtrPrice) : undefined,
      },
      variantQuantities: {
        full: formItem.fullQty || undefined,
        half: formItem.halfQty || undefined,
        qtr: formItem.qtrQty || undefined,
      },
      serves: {
        full: formItem.fullServes || undefined,
        half: formItem.halfServes || undefined,
        qtr: formItem.qtrServes || undefined,
      },
      imageUrl: formItem.imageUrl,
      isAvailable: true,
      isSpicy: formItem.isSpicy,
      foodType: formItem.foodType === "Veg" ? "Veg" : "Non-Veg",
      inventoryItems: [],
      discountPercentage: Number(formItem.discount),
    };
    FirestoreDB.saveMenuItem(item).then(() => {
      setIsModalOpen(false);
      FirestoreDB.getMenu().then(setMenu);
    }).catch(console.error);
  };

  const handleSaveInventory = (e: React.FormEvent) => {
    e.preventDefault();
    const item: InventoryItem = {
      id: editingInventoryId || `inv-${Date.now()}`,
      outletId: inventoryForm.outletId,
      name: inventoryForm.name,
      stock: Number(inventoryForm.stock),
      minStock: Number(inventoryForm.minStock),
      unit: inventoryForm.unit,
      imageUrl: inventoryForm.imageUrl,
    };
    FirestoreDB.saveInventoryItem(item).then(() => {
      setIsInventoryModalOpen(false);
      FirestoreDB.getInventory(selectedOutlet === 'all' ? undefined : selectedOutlet).then(setInventory);
    }).catch(console.error);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    FirestoreDB.saveStaffUser({
      id: editingUserId || `staff-${Date.now()}`,
      name: userForm.name,
      email: userForm.email,
      phone: "",
      address: "",
      password: userForm.password,
      role: userForm.role,
      outletId: userForm.outletId,
      permissions: userForm.permissions,
    }).then(() => {
      setIsUserModalOpen(false);
      FirestoreDB.getStaffUsers().then(setStaffUsers);
    }).catch(console.error);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    FirestoreDB.saveGlobalSettings(globalSettings).then(() => {
      alert("System parameters synchronized.");
    }).catch(console.error);
  };

  const handleSaveOutlet = (e: React.FormEvent) => {
    e.preventDefault();
    const outlet: Outlet = {
      id: editingOutletId || `outlet-${Date.now()}`,
      name: outletForm.name,
      address: outletForm.address,
      contact: outletForm.contact,
      email: outletForm.email,
      imageUrl: outletForm.imageUrl,
      coordinates: { lat: Number(outletForm.lat), lng: Number(outletForm.lng) },
      deliveryRadiusKm: Number(outletForm.radius),
      ownerEmail: outletForm.ownerEmail,
      isActive: outletForm.isActive,
      rating: 4.5,
      totalRatings: 0,
    };
    FirestoreDB.saveOutlet(outlet).then(() => {
      setIsOutletModalOpen(false);
      FirestoreDB.getOutlets().then(setOutlets);
    }).catch(console.error);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryName.trim() && !categories.includes(categoryName.trim())) {
      setCategories([...categories, categoryName.trim()]);
      setCategoryName("");
      setIsCategoryModalOpen(false);
    }
  };

  return (
    <div className="pt-40 pb-12 px-6 min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-montserrat font-medium text-gray-900">
              Management Portal
            </h1>
            <p className="text-gray-500 text-sm mt-2 font-medium">
              Authorized{" "}
              <span className="text-[#C0392B] font-black">
                {user.role.replace("_", " ")}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user.role === UserRole.SUPER_ADMIN && (
              <select
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                className="bg-white border border-gray-100 rounded-[15px] px-5 py-3 text-sm font-medium shadow-sm outline-none"
              >
                <option value="all">All Stations</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            )}
            <button
              className="bg-[#C0392B] text-white px-6 py-3 rounded-[15px] text-[10px] font-black uppercase hover:bg-black transition-all shadow-xl shadow-red-900/10"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex space-x-1 bg-white p-1 rounded-[15px] shadow-sm border border-gray-100 mb-10 overflow-x-auto no-scrollbar">
          {(
            [
              "stats",
              "orders",
              "menu",
              "inventory",
              "outlets",
              "history",
              "users",
              "billing",
              "settings",
            ] as const
          ).map((tab) => {
            if (
              tab === "users" &&
              user.role !== UserRole.SUPER_ADMIN &&
              user.role !== UserRole.OUTLET_OWNER
            )
              return null;
            if (tab === "outlets" && user.role !== UserRole.SUPER_ADMIN)
              return null;
            if (tab === "settings" && user.role !== UserRole.SUPER_ADMIN)
              return null;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[120px] py-3.5 rounded-[15px] text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab
                    ? "bg-[#C0392B] text-white shadow-lg"
                    : "text-gray-400 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="animate-fade-up">
          {activeTab === "stats" && (
            <StatsTab
              stats={stats}
              statsYear={statsYear}
              setStatsYear={setStatsYear}
              statsMonth={statsMonth}
              setStatsMonth={setStatsMonth}
              handleDownloadCSV={handleDownloadCSV}
            />
          )}
          {activeTab === "orders" && (
            <OrderTab
              selectedOutlet={selectedOutlet}
              user={user}
              orders={orders}
            />
          )}
          {activeTab === "menu" && (
            <MenuTab
              selectedOutlet={selectedOutlet}
              menu={menu}
              setIsModalOpen={setIsModalOpen}
              setEditingId={setEditingId}
              setFormItem={setFormItem}
              categories={categories}
              outlets={outlets}
              setIsCategoryModalOpen={setIsCategoryModalOpen}
            />
          )}
          {activeTab === "inventory" && (
            <InventoryTab
              selectedOutlet={selectedOutlet}
              inventory={inventory}
              setIsInventoryModalOpen={setIsInventoryModalOpen}
              setEditingInventoryId={setEditingInventoryId}
              setInventoryForm={setInventoryForm}
              outlets={outlets}
              menu={menu}
            />
          )}
          {activeTab === "outlets" && (
            <OutletTab
              outlets={outlets}
              setIsOutletModalOpen={setIsOutletModalOpen}
              setEditingOutletId={setEditingOutletId}
              setOutletForm={setOutletForm}
            />
          )}
          {activeTab === "history" && (
            <HistoryTab selectedOutlet={selectedOutlet} orders={orders} />
          )}
          {activeTab === "users" && (
            <UsersTab
              filteredStaff={filteredStaff}
              user={user}
              setIsUserModalOpen={setIsUserModalOpen}
              setEditingUserId={setEditingUserId}
              setUserForm={setUserForm}
              outlets={outlets}
            />
          )}
          {activeTab === "billing" && (
            <BillingTab
              selectedOutlet={selectedOutlet}
              orders={orders}
              manualInvoices={manualInvoices}
              outlets={outlets}
              globalSettings={globalSettings}
              setIsManualInvoiceModalOpen={setIsManualInvoiceModalOpen}
            />
          )}
          {activeTab === "settings" && (
            <SettingsTab
              globalSettings={globalSettings}
              setGlobalSettings={setGlobalSettings}
              handleSaveSettings={handleSaveSettings}
            />
          )}
        </div>
      </div>

      {/* --- MODALS --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <form
            onSubmit={handleSaveMenu}
            className="relative w-full max-w-5xl bg-white rounded-[15px] shadow-2xl p-10 md:p-14 animate-fade-up max-h-[95vh] overflow-y-auto border border-gray-100 no-scrollbar"
          >
            <h3 className="text-4xl font-montserrat font-medium mb-10 text-gray-900">
              {editingId ? "Refine Heritage Dish" : "Draft Legacy Recipe"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                  Recipe Identity
                </label>
                <input
                  required
                  value={formItem.name}
                  onChange={(e) =>
                    setFormItem({ ...formItem, name: e.target.value })
                  }
                  className="w-full p-5 bg-gray-50 rounded-[15px] font-medium outline-none border border-transparent focus:bg-white focus:border-red-100 transition-all text-xl"
                  placeholder="E.g. Signature Dal Makhani"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                  Culinary Narrative
                </label>
                <textarea
                  required
                  value={formItem.description}
                  onChange={(e) =>
                    setFormItem({ ...formItem, description: e.target.value })
                  }
                  className="w-full p-5 bg-gray-50 rounded-[15px] font-medium outline-none border border-transparent focus:bg-white focus:border-red-100 transition-all resize-none italic"
                  rows={2}
                  placeholder="Brief story about the dish flavors..."
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                  Heritage Category
                </label>
                <select
                  value={formItem.category}
                  onChange={(e) =>
                    setFormItem({ ...formItem, category: e.target.value })
                  }
                  className="w-full p-5 bg-gray-50 rounded-[15px] font-medium outline-none border border-transparent focus:bg-white focus:border-red-100 transition-all appearance-none cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                  Spice Protocol
                </label>
                <select
                  value={formItem.isSpicy}
                  onChange={(e) =>
                    setFormItem({ ...formItem, isSpicy: e.target.value as any })
                  }
                  className="w-full p-5 bg-gray-50 rounded-[15px] font-medium outline-none border border-transparent focus:bg-white focus:border-red-100 transition-all appearance-none cursor-pointer"
                >
                  <option value="None">None</option>
                  <option value="Mild">Mild</option>
                  <option value="Medium">Medium</option>
                  <option value="Hot">Hot</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                  Visual Asset (Image URL)
                </label>
                <input
                  required
                  value={formItem.imageUrl}
                  onChange={(e) =>
                    setFormItem({ ...formItem, imageUrl: e.target.value })
                  }
                  className="w-full p-5 bg-gray-50 rounded-[15px] font-medium outline-none border border-transparent focus:bg-white focus:border-red-100 transition-all"
                  placeholder="https://..."
                />
              </div>

              <div className="md:col-span-2 pt-6 border-t border-gray-100">
                <label className="text-[10px] font-black uppercase text-gray-400 mb-8 block tracking-[0.3em] text-center">
                  Portion Architect & Variants
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* FULL PORTION CARD */}
                  <div className="bg-gray-50/50 p-8 rounded-[15px] border border-gray-100 shadow-sm flex flex-col gap-6 group hover:bg-white hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-[11px] uppercase tracking-widest text-gray-400">
                        Full Portion
                      </h4>
                      <span className="text-xl">🏆</span>
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-gray-300 block mb-2">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={formItem.fullPrice}
                        onChange={(e) =>
                          setFormItem({
                            ...formItem,
                            fullPrice: e.target.value,
                          })
                        }
                        className="w-full p-4 bg-white rounded-[15px] font-black outline-none border border-transparent focus:border-red-50 text-center"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-gray-300 block mb-2">
                        Quantity Label
                      </label>
                      <input
                        type="text"
                        value={formItem.fullQty}
                        onChange={(e) =>
                          setFormItem({ ...formItem, fullQty: e.target.value })
                        }
                        className="w-full p-4 bg-white rounded-[15px] font-medium outline-none text-xs text-center"
                        placeholder="E.g. 8 Pieces"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-gray-300 block mb-2">
                        Sufficient For
                      </label>
                      <input
                        type="text"
                        value={formItem.fullServes}
                        onChange={(e) =>
                          setFormItem({
                            ...formItem,
                            fullServes: e.target.value,
                          })
                        }
                        className="w-full p-4 bg-white rounded-[15px] font-medium outline-none text-xs text-center border-2 border-dashed border-gray-100 focus:border-red-200"
                        placeholder="E.g. 3-4 People"
                      />
                    </div>
                  </div>

                  {/* HALF PORTION CARD */}
                  <div className="bg-gray-50/50 p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col gap-6 group hover:bg-white hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-[11px] uppercase tracking-widest text-gray-400">
                        Half Portion
                      </h4>
                      <span className="text-xl">🥈</span>
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-gray-300 block mb-2">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        value={formItem.halfPrice}
                        onChange={(e) =>
                          setFormItem({
                            ...formItem,
                            halfPrice: e.target.value,
                          })
                        }
                        className="w-full p-4 bg-white rounded-2xl font-black outline-none border border-transparent focus:border-red-50 text-center"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-gray-300 block mb-2">
                        Quantity Label
                      </label>
                      <input
                        type="text"
                        value={formItem.halfQty}
                        onChange={(e) =>
                          setFormItem({ ...formItem, halfQty: e.target.value })
                        }
                        className="w-full p-4 bg-white rounded-2xl font-medium outline-none text-xs text-center"
                        placeholder="E.g. 4 Pieces"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-gray-300 block mb-2">
                        Sufficient For
                      </label>
                      <input
                        type="text"
                        value={formItem.halfServes}
                        onChange={(e) =>
                          setFormItem({
                            ...formItem,
                            halfServes: e.target.value,
                          })
                        }
                        className="w-full p-4 bg-white rounded-2xl font-medium outline-none text-xs text-center border-2 border-dashed border-gray-100 focus:border-red-200"
                        placeholder="E.g. 1-2 People"
                      />
                    </div>
                  </div>

                  {/* QUARTER PORTION CARD */}
                  <div className="bg-gray-50/50 p-8 rounded-[15px] border border-gray-100 shadow-sm flex flex-col gap-6 group hover:bg-white hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-[11px] uppercase tracking-widest text-gray-400">
                        Qtr Portion
                      </h4>
                      <span className="text-xl">🥉</span>
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-gray-300 block mb-2">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        value={formItem.qtrPrice}
                        onChange={(e) =>
                          setFormItem({ ...formItem, qtrPrice: e.target.value })
                        }
                        className="w-full p-4 bg-white rounded-[15px] font-black outline-none border border-transparent focus:border-red-50 text-center"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-gray-300 block mb-2">
                        Quantity Label
                      </label>
                      <input
                        type="text"
                        value={formItem.qtrQty}
                        onChange={(e) =>
                          setFormItem({ ...formItem, qtrQty: e.target.value })
                        }
                        className="w-full p-4 bg-white rounded-[15px] font-medium outline-none text-xs text-center"
                        placeholder="E.g. 2 Pieces"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-gray-300 block mb-2">
                        Sufficient For
                      </label>
                      <input
                        type="text"
                        value={formItem.qtrServes}
                        onChange={(e) =>
                          setFormItem({
                            ...formItem,
                            qtrServes: e.target.value,
                          })
                        }
                        className="w-full p-4 bg-white rounded-[15px] font-medium outline-none text-xs text-center border-2 border-dashed border-gray-100 focus:border-red-200"
                        placeholder="E.g. Solo Snack"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-6 pt-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Food Archetype
                  </label>
                  <select
                    value={formItem.foodType}
                    onChange={(e) =>
                      setFormItem({
                        ...formItem,
                        foodType: e.target.value as any,
                      })
                    }
                    className="w-full p-5 bg-gray-50 rounded-[15px] font-medium outline-none"
                  >
                    <option value="Veg">Veg (Pure Heritage)</option>
                    <option value="Non-Veg">Non-Veg (Legacy Selection)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Promotion (%)
                  </label>
                  <input
                    type="number"
                    value={formItem.discount}
                    onChange={(e) =>
                      setFormItem({ ...formItem, discount: e.target.value })
                    }
                    className="w-full p-5 bg-gray-50 rounded-[15px] font-medium outline-none text-center"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-6 mt-12 pt-10 border-t border-gray-50">
              <button
                type="submit"
                className="flex-1 py-6 bg-gray-900 text-white rounded-[15px] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl border-2 border-[#FFB30E] hover:bg-black transition-all"
              >
                Synchronize Records
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-12 py-6 bg-gray-50 text-gray-400 rounded-[15px] font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- OTHER MODALS --- */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setIsCategoryModalOpen(false)}
          ></div>
          <form
            onSubmit={handleAddCategory}
            className="relative w-full max-w-md bg-white rounded-[15px] p-10 animate-fade-up border border-gray-100"
          >
            <h3 className="text-2xl font-montserrat font-medium mb-6">
              New Category
            </h3>
            <input
              required
              autoFocus
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full p-5 bg-gray-50 rounded-[15px] font-medium mb-8 outline-none border border-transparent focus:bg-white focus:border-red-100"
              placeholder="e.g. Desserts"
            />
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 py-4 bg-[#C0392B] text-white rounded-[15px] font-black uppercase text-[10px] tracking-widest border-2 border-[#FFB30E]"
              >
                Save Category
              </button>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-6 py-4 bg-gray-50 text-gray-400 rounded-[15px] font-black uppercase text-[10px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isOutletModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setIsOutletModalOpen(false)}
          ></div>
          <form
            onSubmit={handleSaveOutlet}
            className="relative w-full max-w-2xl bg-white rounded-[15px] p-12 animate-fade-up border border-gray-100 max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            <h3 className="text-3xl font-montserrat font-medium mb-8">
              Station Configuration
            </h3>
            <div className="space-y-6 mb-10">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">
                  Name
                </label>
                <input
                  required
                  value={outletForm.name}
                  onChange={(e) =>
                    setOutletForm({ ...outletForm, name: e.target.value })
                  }
                  className="w-full p-5 bg-gray-50 rounded-2xl font-medium outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">
                  Address
                </label>
                <input
                  required
                  value={outletForm.address}
                  onChange={(e) =>
                    setOutletForm({ ...outletForm, address: e.target.value })
                  }
                  className="w-full p-5 bg-gray-50 rounded-2xl font-medium outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">
                    Contact
                  </label>
                  <input
                    required
                    value={outletForm.contact}
                    onChange={(e) =>
                      setOutletForm({ ...outletForm, contact: e.target.value })
                    }
                    className="w-full p-5 bg-gray-50 rounded-2xl font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">
                    Email
                  </label>
                  <input
                    required
                    value={outletForm.email}
                    onChange={(e) =>
                      setOutletForm({ ...outletForm, email: e.target.value })
                    }
                    className="w-full p-5 bg-gray-50 rounded-2xl font-medium outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">
                  Image URL
                </label>
                <input
                  required
                  value={outletForm.imageUrl}
                  onChange={(e) =>
                    setOutletForm({ ...outletForm, imageUrl: e.target.value })
                  }
                  className="w-full p-5 bg-gray-50 rounded-2xl font-medium outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">
                    Lat
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={outletForm.lat}
                    onChange={(e) =>
                      setOutletForm({
                        ...outletForm,
                        lat: Number(e.target.value),
                      })
                    }
                    className="w-full p-5 bg-gray-50 rounded-2xl font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">
                    Lng
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={outletForm.lng}
                    onChange={(e) =>
                      setOutletForm({
                        ...outletForm,
                        lng: Number(e.target.value),
                      })
                    }
                    className="w-full p-5 bg-gray-50 rounded-2xl font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">
                    Radius (km)
                  </label>
                  <input
                    type="number"
                    required
                    value={outletForm.radius}
                    onChange={(e) =>
                      setOutletForm({
                        ...outletForm,
                        radius: Number(e.target.value),
                      })
                    }
                    className="w-full p-5 bg-gray-50 rounded-2xl font-medium outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={outletForm.isActive}
                  onChange={(e) =>
                    setOutletForm({ ...outletForm, isActive: e.target.checked })
                  }
                  id="outlet-active"
                  className="w-5 h-5 accent-[#C0392B]"
                />
                <label
                  htmlFor="outlet-active"
                  className="text-sm font-medium text-gray-700"
                >
                  Station Active & Taking Orders
                </label>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 py-5 bg-[#C0392B] text-white rounded-[15px] font-black uppercase text-[11px] tracking-widest border-2 border-[#FFB30E]"
              >
                Sync Station
              </button>
              <button
                type="button"
                onClick={() => setIsOutletModalOpen(false)}
                className="px-8 py-5 bg-gray-50 text-gray-400 rounded-[15px] font-black uppercase text-[10px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isInventoryModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setIsInventoryModalOpen(false)}
          ></div>
          <form
            onSubmit={handleSaveInventory}
            className="relative w-full max-w-xl bg-white rounded-[15px] p-12 animate-fade-up border border-gray-100"
          >
            <h3 className="text-3xl font-montserrat font-medium mb-8">
              Stock Adjustment
            </h3>
            <div className="space-y-6 mb-10">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">
                  Item Name
                </label>
                <input
                  required
                  value={inventoryForm.name}
                  onChange={(e) =>
                    setInventoryForm({ ...inventoryForm, name: e.target.value })
                  }
                  className="w-full p-5 bg-gray-50 rounded-2xl font-medium outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    required
                    value={inventoryForm.stock}
                    onChange={(e) =>
                      setInventoryForm({
                        ...inventoryForm,
                        stock: Number(e.target.value),
                      })
                    }
                    className="w-full p-5 bg-gray-50 rounded-2xl font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">
                    Min Stock Alert
                  </label>
                  <input
                    type="number"
                    required
                    value={inventoryForm.minStock}
                    onChange={(e) =>
                      setInventoryForm({
                        ...inventoryForm,
                        minStock: Number(e.target.value),
                      })
                    }
                    className="w-full p-5 bg-gray-50 rounded-2xl font-medium outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block">
                  Unit
                </label>
                <input
                  required
                  value={inventoryForm.unit}
                  onChange={(e) =>
                    setInventoryForm({ ...inventoryForm, unit: e.target.value })
                  }
                  className="w-full p-5 bg-gray-50 rounded-2xl font-medium outline-none"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 py-5 bg-[#C0392B] text-white rounded-[15px] font-black uppercase text-[11px] tracking-widest border-2 border-[#FFB30E]"
              >
                Sync Inventory
              </button>
              <button
                type="button"
                onClick={() => setIsInventoryModalOpen(false)}
                className="px-8 py-5 bg-gray-50 text-gray-400 rounded-[15px] font-black uppercase text-[10px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isUserModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setIsUserModalOpen(false)}
          ></div>
          <form
            onSubmit={handleSaveUser}
            className="relative w-full max-w-xl bg-white rounded-[15px] p-12 animate-fade-up border border-gray-100 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-3xl font-montserrat font-medium mb-8">
              Personnel Configuration
            </h3>
            <div className="space-y-6 mb-10">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                  Full Name
                </label>
                <input
                  required
                  value={userForm.name}
                  onChange={(e) =>
                    setUserForm({ ...userForm, name: e.target.value })
                  }
                  className="w-full p-5 bg-gray-50 rounded-2xl font-medium outline-none"
                  placeholder="Staff Name"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                  Login ID (Email/Code)
                </label>
                <input
                  required
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
                  className="w-full p-5 bg-gray-50 rounded-2xl font-medium outline-none"
                  placeholder="staff@1290"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                  Security Code
                </label>
                <input
                  required
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm({ ...userForm, password: e.target.value })
                  }
                  className="w-full p-5 bg-gray-50 rounded-2xl font-medium outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Assigned Role
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm({ ...userForm, role: e.target.value as any })
                    }
                    className="w-full p-5 bg-gray-50 rounded-[15px] font-medium outline-none"
                  >
                    <option value={UserRole.MANAGER}>Manager</option>
                    <option value={UserRole.OUTLET_OWNER}>Outlet Owner</option>
                    <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Station Access
                  </label>
                  <select
                    value={userForm.outletId}
                    onChange={(e) =>
                      setUserForm({ ...userForm, outletId: e.target.value })
                    }
                    className="w-full p-5 bg-gray-50 rounded-[15px] font-medium outline-none"
                  >
                    <option value="all">Universal</option>
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 py-5 bg-[#C0392B] text-white rounded-[15px] font-black uppercase text-[11px] tracking-widest shadow-2xl border-2 border-[#FFB30E]"
              >
                Sync Personnel
              </button>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="px-8 py-5 bg-gray-50 text-gray-400 rounded-[15px] font-black uppercase text-[10px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isManualInvoiceModalOpen && (
        <ManualInvoiceModal
          isOpen={isManualInvoiceModalOpen}
          onClose={() => setIsManualInvoiceModalOpen(false)}
          outlets={outlets}
          menu={menu}
          selectedOutletId={
            selectedOutlet === "all" ? outlets[0]?.id : selectedOutlet
          }
          gstPercentage={globalSettings.gstPercentage}
          onSave={(invoice: any) => {
            FirestoreDB.saveManualInvoice(invoice).then(() => {
              setIsManualInvoiceModalOpen(false);
              FirestoreDB.getManualInvoices().then(setManualInvoices);
            }).catch(console.error);
          }}
        />
      )}
    </div>
  );
};

// --- SUB-TAB COMPONENTS ---

const StatsTab: React.FC<any> = ({
  stats,
  statsYear,
  setStatsYear,
  statsMonth,
  setStatsMonth,
  handleDownloadCSV,
}) => (
  <div className="space-y-12">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <StatCard
        label="Total Revenue"
        value={`₹${stats.totalRevenue.toLocaleString()}`}
        icon="💰"
        color="emerald"
      />
      <StatCard
        label="Live Orders"
        value={stats.active}
        icon="🔥"
        color="orange"
      />
      <StatCard
        label="Low Stock Alert"
        value={stats.lowStock}
        icon="⚠️"
        color="red"
      />
      <StatCard
        label="Delivered Today"
        value={stats.deliveredToday}
        icon="✅"
        color="blue"
      />
    </div>
    <div className="bg-white rounded-[15px] p-10 md:p-14 border border-gray-100 shadow-sm transition-all hover:shadow-2xl">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-2xl font-montserrat font-medium text-gray-900">
          Revenue Analytics
        </h3>
        <div className="flex gap-3">
          <select
            value={statsMonth}
            onChange={(e) =>
              setStatsMonth(
                e.target.value === "all" ? "all" : Number(e.target.value)
              )
            }
            className="bg-gray-50 border border-gray-100 rounded-[15px] px-4 py-2 text-xs font-medium shadow-sm outline-none focus:ring-2 ring-red-50 transition-all"
          >
            <option value="all">All Months</option>
            {[
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ].map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={statsYear}
            onChange={(e) => setStatsYear(Number(e.target.value))}
            className="bg-gray-50 border border-gray-100 rounded-[15px] px-4 py-2 text-xs font-medium shadow-sm outline-none focus:ring-2 ring-red-50 transition-all"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
          <button
            onClick={handleDownloadCSV}
            className="bg-[#C0392B] text-white px-6 py-2 rounded-[15px] text-[10px] font-black uppercase shadow-lg shadow-red-900/10 hover:bg-black transition-all"
          >
            Export Dataset
          </button>
        </div>
      </div>
      <div className="h-80 flex items-end justify-between gap-3 px-4 border-b border-gray-100 pb-2">
        {stats.chartData.map((d: any, i: number) => {
          const max =
            Math.max(...stats.chartData.map((x: any) => x.value)) || 1;
          const height = (d.value / max) * 100;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center group relative h-full justify-end"
            >
              <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                <div className="bg-gray-900 text-white px-3 py-1.5 rounded-[15px] text-[9px] font-black shadow-2xl">
                  ₹{d.value.toLocaleString()}
                </div>
                <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1"></div>
              </div>
              <div
                className="w-full max-w-[35px] bg-gradient-to-t from-[#C0392B] to-[#E74C3C] rounded-t-[15px] transition-all duration-700 ease-out shadow-lg"
                style={{ height: `${Math.max(height, d.value > 0 ? 2 : 0)}%` }}
              ></div>
              <p className="mt-4 text-[9px] font-black uppercase text-gray-400 rotate-45 md:rotate-0 tracking-tighter tracking-widest">
                {d.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// Add missing OutletTab component
const OutletTab: React.FC<any> = ({
  outlets,
  setIsOutletModalOpen,
  setEditingOutletId,
  setOutletForm,
}) => {
  const handleDelete = (id: string) => {
    if (window.confirm("Strike this sanctuary station from the records?")) {
      FirestoreDB.deleteOutlet(id).then(() => {
        FirestoreDB.getOutlets().then(setOutlets);
      }).catch(console.error);
    }
  };

  return (
    <div className="bg-white rounded-[15px] p-10 md:p-14 border border-gray-100 shadow-sm animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
          <h3 className="text-4xl font-montserrat font-medium text-gray-800">
            Sanctuary Stations
          </h3>
          <p className="text-[10px] font-black uppercase text-[#C0392B] tracking-[0.3em] mt-2">
            Global Outlet Management
          </p>
        </div>
        <button
          onClick={() => {
            setEditingOutletId(null);
            setOutletForm({
              name: "",
              address: "",
              contact: "",
              email: "",
              imageUrl:
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
              lat: 28.6,
              lng: 77.2,
              radius: 5,
              ownerEmail: "",
              isActive: true,
            });
            setIsOutletModalOpen(true);
          }}
          className="bg-[#C0392B] text-white px-10 py-4 rounded-[15px] font-black uppercase text-[11px] shadow-xl border-2 border-[#FFB30E] hover:bg-black transition-all tracking-widest"
        >
          + Establish Station
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {outlets.map((o: any) => (
          <div
            key={o.id}
            className="bg-white border border-gray-100 rounded-[15px] p-8 group hover:shadow-2xl transition-all relative overflow-hidden flex flex-col"
          >
            <div className="aspect-video mb-6 overflow-hidden rounded-[15px] shadow-sm bg-gray-50 relative">
              <img
                src={o.imageUrl}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute top-4 left-4">
                <span
                  className={`px-4 py-1 rounded-[15px] text-[8px] font-black uppercase tracking-widest ${
                    o.isActive
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-400 text-white"
                  }`}
                >
                  {o.isActive ? "Active" : "Closed"}
                </span>
              </div>
            </div>
            <h4 className="text-2xl font-medium font-montserrat text-gray-900 mb-2 group-hover:text-[#C0392B] transition-colors">
              {o.name}
            </h4>
            <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest mb-6 truncate">
              {o.address}
            </p>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-[15px] bg-gray-50 flex items-center justify-center text-[#C0392B]">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-600">
                {o.contact}
              </span>
            </div>
            <div className="mt-auto flex gap-4 pt-6 border-t border-gray-50">
              <button
                onClick={() => {
                  setEditingOutletId(o.id);
                  setOutletForm({
                    name: o.name,
                    address: o.address,
                    contact: o.contact,
                    email: o.email,
                    imageUrl: o.imageUrl,
                    lat: o.coordinates.lat,
                    lng: o.coordinates.lng,
                    radius: o.deliveryRadiusKm,
                    ownerEmail: o.ownerEmail,
                    isActive: o.isActive,
                  });
                  setIsOutletModalOpen(true);
                }}
                className="flex-1 py-3 bg-gray-50 text-gray-400 rounded-[15px] text-[10px] font-black uppercase hover:bg-gray-900 hover:text-white transition-all"
              >
                Adjust
              </button>
              <button
                onClick={() => handleDelete(o.id)}
                className="px-5 py-3 text-red-400 hover:text-red-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const InventoryTab: React.FC<any> = ({
  selectedOutlet,
  inventory,
  setIsInventoryModalOpen,
  setEditingInventoryId,
  setInventoryForm,
  outlets,
  menu,
}) => {
  const handleDeleteLink = (id: string) => {
    if (
      window.confirm(
        "Strike this automated stock link from the records? Stock tracking for this dish will stop immediately."
      )
    ) {
      FirestoreDB.deleteInventoryItem(id).then(() => {
        FirestoreDB.getInventory(selectedOutlet === 'all' ? undefined : selectedOutlet).then(setInventory);
      }).catch(console.error);
    }
  };

  return (
    <div className="bg-white rounded-[15px] p-10 md:p-14 border border-gray-100 shadow-sm animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
          <h3 className="text-4xl font-montserrat font-medium text-gray-800">
            Inventory Control
          </h3>
          <p className="text-[10px] font-black uppercase text-[#C0392B] tracking-[0.3em] mt-2">
            Sanctuary Supply Monitor
          </p>
        </div>
        <button
          onClick={() => {
            setEditingInventoryId(null);
            setInventoryForm({
              name: "",
              stock: 0,
              minStock: 5,
              unit: "Portions",
              imageUrl: "",
              outletId:
                selectedOutlet === "all"
                  ? outlets[0]?.id || ""
                  : selectedOutlet,
            });
            setIsInventoryModalOpen(true);
          }}
          className="bg-[#C0392B] text-white px-10 py-4 rounded-[15px] font-black uppercase text-[11px] shadow-xl border-2 border-[#FFB30E] hover:bg-black active:scale-95 transition-all tracking-widest"
        >
          + Add Dish Stock
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        {inventory
          .filter(
            (i: any) =>
              selectedOutlet === "all" || i.outletId === selectedOutlet
          )
          .map((item: any) => (
            <div
              key={item.id}
              className="relative group bg-white rounded-[15px] p-10 border border-gray-100 shadow-sm flex flex-col hover:shadow-2xl transition-all duration-500 overflow-hidden"
            >
              <button
                onClick={() => handleDeleteLink(item.id)}
                className="absolute top-6 right-6 w-10 h-10 bg-white rounded-[15px] flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-all shadow hover:bg-red-500 hover:text-white z-10"
                title="Delete stock record"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>

              <div className="flex-grow">
                <h4 className="text-2xl font-montserrat font-medium text-gray-800 mb-2 leading-tight group-hover:text-[#C0392B] transition-colors">
                  {item.name}
                </h4>
                <p className="text-[8px] font-black uppercase text-gray-300 tracking-widest mb-10">
                  {outlets.find((o: any) => o.id === item.outletId)?.name}
                </p>

                <div className="flex items-center justify-between mb-8">
                  <span className="text-6xl font-montserrat font-black text-gray-900 tabular-nums">
                    {item.stock}
                  </span>
                  <button
                    onClick={() => {
                      setEditingInventoryId(item.id);
                      setInventoryForm({
                        name: item.name,
                        stock: item.stock,
                        minStock: item.minStock,
                        unit: item.unit,
                        imageUrl: item.imageUrl || "",
                        outletId: item.outletId,
                      });
                      setIsInventoryModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-gray-50 hover:bg-red-50 text-[10px] font-black uppercase text-[#C0392B] rounded-[15px] shadow-sm active:scale-90 transition-all tracking-widest"
                  >
                    Refill
                  </button>
                </div>
              </div>

              <div className="w-full bg-gray-100 h-2.5 rounded-[15px] overflow-hidden mt-auto">
                <div
                  className={`h-full transition-all duration-1000 ease-out ${
                    item.stock < item.minStock
                      ? "bg-gradient-to-r from-red-500 to-red-400 animate-pulse"
                      : "bg-gradient-to-r from-emerald-600 to-emerald-400"
                  }`}
                  style={{
                    width: `${Math.min(
                      (item.stock / (item.minStock * 2.5 || 100)) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              {item.stock < item.minStock && (
                <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mt-4 text-center">
                  ⚠️ Critical Refill Required
                </p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

const OrderTab: React.FC<any> = ({ selectedOutlet, orders, user }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
    {orders
      .filter(
        (o: any) =>
          o.status !== OrderStatus.DELIVERED &&
          o.status !== OrderStatus.REJECTED &&
          (selectedOutlet === "all" || o.outletId === selectedOutlet)
      )
      .map((order: any) => (
        <div
          key={order.id}
          className="bg-white p-10 rounded-[15px] border border-gray-100 shadow-sm animate-fade-up hover:shadow-2xl transition-all relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-2 h-full bg-[#C0392B] opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C0392B] bg-red-50 px-4 py-1.5 rounded-[15px]">
              {order.status}
            </span>
            <span className="text-xl font-black text-gray-900 tabular-nums">
              ₹{order.total.toFixed(0)}
            </span>
          </div>
          <h4 className="text-2xl font-medium text-gray-800 mb-2 truncate">
            {order.customerName}
          </h4>
          <p className="text-xs text-gray-400 mb-10 font-medium italic line-clamp-1">
            "{order.address}"
          </p>
          <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-50">
            {order.status === OrderStatus.PENDING && (
              <button
                onClick={() => {
                  FirestoreDB.updateOrderStatus(order.id, OrderStatus.ACCEPTED).then(() => {
                    FirestoreDB.getOrders().then(setOrders);
                  }).catch(console.error);
                }}
                className="flex-1 py-4 bg-emerald-500 text-white rounded-[15px] text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                Accept
              </button>
            )}
            {order.status === OrderStatus.ACCEPTED && (
              <button
                onClick={() => {
                  FirestoreDB.updateOrderStatus(order.id, OrderStatus.PREPARING).then(() => {
                    FirestoreDB.getOrders().then(setOrders);
                  }).catch(console.error);
                }}
                className="flex-1 py-4 bg-amber-500 text-white rounded-[15px] text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                Start Prep
              </button>
            )}
            {order.status === OrderStatus.PREPARING && (
              <button
                onClick={() => {
                  FirestoreDB.updateOrderStatus(order.id, OrderStatus.READY).then(() => {
                    FirestoreDB.getOrders().then(setOrders);
                  }).catch(console.error);
                }}
                className="flex-1 py-4 bg-blue-500 text-white rounded-[15px] text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                Ready
              </button>
            )}
            {order.status === OrderStatus.READY && (
              <button
                onClick={() => {
                  FirestoreDB.updateOrderStatus(order.id, OrderStatus.OUT_FOR_DELIVERY).then(() => {
                    FirestoreDB.getOrders().then(setOrders);
                  }).catch(console.error);
                }}
                className="flex-1 py-4 bg-purple-500 text-white rounded-[15px] text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                Hand Over
              </button>
            )}
            {order.status === OrderStatus.OUT_FOR_DELIVERY && (
              <button
                onClick={() => {
                  FirestoreDB.updateOrderStatus(order.id, OrderStatus.DELIVERED).then(() => {
                    FirestoreDB.getOrders().then(setOrders);
                  }).catch(console.error);
                }}
                className="flex-1 py-4 bg-[#C0392B] text-white rounded-[15px] text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                Delivered
              </button>
            )}
            <button
              onClick={() => {
                FirestoreDB.updateOrderStatus(order.id, OrderStatus.REJECTED).then(() => {
                  FirestoreDB.getOrders().then(setOrders);
                }).catch(console.error);
              }}
              className="px-6 py-4 bg-gray-50 text-red-500 rounded-[15px] text-[10px] font-black hover:bg-red-50 active:scale-95 transition-all"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
  </div>
);

const MenuTab: React.FC<any> = ({
  selectedOutlet,
  menu,
  outlets,
  categories,
  setIsModalOpen,
  setEditingId,
  setFormItem,
  setIsCategoryModalOpen,
}) => {
  const sortedMenu = useMemo(
    () => [...menu].sort((a, b) => b.id.localeCompare(a.id)),
    [menu]
  );

  const handleDelete = (id: string) => {
    if (window.confirm("Strike this recipe from the sanctuary collection?")) {
      FirestoreDB.deleteMenuItem(id).then(() => {
        FirestoreDB.getMenu().then(setMenu);
      }).catch(console.error);
    }
  };

  return (
    <div className="bg-white rounded-[15px] p-12 border border-gray-100 shadow-sm animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
          <h3 className="text-4xl font-montserrat font-medium text-gray-900">
            Heritage Menu
          </h3>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
            Archives of Purity since 1984
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-8 py-3 border-2 border-gray-100 rounded-[15px] font-black uppercase text-[10px] text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all tracking-widest"
          >
            + Category
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setFormItem({
                name: "",
                description: "",
                category: categories[0] || "",
                fullPrice: "",
                halfPrice: "",
                qtrPrice: "",
                fullQty: "",
                halfQty: "",
                qtrQty: "",
                fullServes: "",
                halfServes: "",
                qtrServes: "",
                imageUrl:
                  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400",
                isSpicy: "None",
                foodType: "Veg",
                outletId:
                  selectedOutlet === "all" ? outlets[0]?.id : selectedOutlet,
                discount: "0",
              });
              setIsModalOpen(true);
            }}
            className="bg-[#C0392B] bg-gradient-to-r from-[#C0392B] to-[#E74C3C] text-white px-10 py-3 rounded-[15px] font-black uppercase text-[10px] shadow-xl border-2 border-[#FFB30E] transition-all hover:scale-105 active:scale-95 tracking-widest"
          >
            + New Recipe
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {sortedMenu
          .filter(
            (m: any) =>
              selectedOutlet === "all" || m.outletId === selectedOutlet
          )
          .map((item: any) => (
            <div
              key={item.id}
              className="bg-white border border-gray-50 rounded-[15px] p-4 group hover:shadow-2xl transition-all relative overflow-hidden"
            >
              <div className="aspect-video mb-8 overflow-hidden rounded-[15px] shadow-sm bg-gray-50 relative">
                <img
                  src={item.imageUrl}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                />
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/60 backdrop-blur-md text-white rounded-[15px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
              <h4 className="text-2xl font-medium font-montserrat text-gray-900 mb-2 group-hover:text-[#C0392B] transition-colors">
                {item.name}
              </h4>
              <p className="text-[10px] font-black uppercase text-gray-300 tracking-[0.2em] mb-10">
                {item.category}
              </p>
              <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                <span className="text-2xl font-black text-gray-900 tabular-nums">
                  ₹{item.price.full}
                </span>
                <button
                  onClick={() => {
                    setEditingId(item.id);
                    setFormItem({
                      name: item.name,
                      description: item.description,
                      category: item.category,
                      fullPrice: String(item.price.full),
                      halfPrice: String(item.price.half || ""),
                      qtrPrice: String(item.price.qtr || ""),
                      fullQty: item.variantQuantities?.full || "",
                      halfQty: item.variantQuantities?.half || "",
                      qtrQty: item.variantQuantities?.qtr || "",
                      fullServes: item.serves?.full || "",
                      halfServes: item.serves?.half || "",
                      qtrServes: item.serves?.qtr || "",
                      imageUrl: item.imageUrl,
                      isSpicy: item.isSpicy,
                      foodType: item.foodType,
                      outletId: item.outletId,
                      discount: String(item.discountPercentage || 0),
                    });
                    setIsModalOpen(true);
                  }}
                  className="px-6 py-2.5 bg-gray-50 text-gray-400 rounded-[15px] text-[10px] font-black uppercase hover:bg-gray-900 hover:text-white transition-all tracking-widest"
                >
                  Adjust
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

const HistoryTab: React.FC<any> = ({ selectedOutlet, orders }) => (
  <div className="bg-white rounded-[15px] p-10 md:p-14 border border-gray-100 shadow-sm animate-fade-up">
    <h3 className="text-4xl font-montserrat font-medium text-gray-800 mb-12">
      Universal Sales Log
    </h3>
    <div className="space-y-6">
      {orders
        .filter(
          (o: any) =>
            o.status === OrderStatus.DELIVERED ||
            o.status === OrderStatus.REJECTED
        )
        .filter(
          (o: any) => selectedOutlet === "all" || o.outletId === selectedOutlet
        )
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .map((order: any) => (
          <div
            key={order.id}
            className="bg-gray-50 p-8 rounded-[15px] flex flex-col md:flex-row justify-between items-center gap-6 hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-red-50 group"
          >
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                <span
                  className={`px-4 py-1.5 rounded-[15px] text-[9px] font-black uppercase tracking-widest ${
                    order.status === OrderStatus.DELIVERED
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {order.status}
                </span>
                <span className="text-[11px] font-mono text-gray-400 font-medium">
                  #{order.id}
                </span>
              </div>
              <h4 className="text-2xl font-medium text-gray-800 group-hover:text-[#C0392B] transition-colors">
                {order.customerName}
              </h4>
            </div>
            <div className="text-center md:text-right">
              <p className="text-3xl font-montserrat font-black text-gray-900 tabular-nums">
                ₹{order.total.toFixed(0)}
              </p>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">
                {order.paymentMethod} •{" "}
                {new Date(order.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
    </div>
  </div>
);

const BillingTab: React.FC<any> = ({
  selectedOutlet,
  orders,
  manualInvoices,
  outlets,
  globalSettings,
  setIsManualInvoiceModalOpen,
}) => (
  <div className="bg-white rounded-[15px] p-10 md:p-14 border border-gray-100 shadow-sm animate-fade-up">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
      <div>
        <h3 className="text-4xl font-montserrat font-medium text-gray-900">
          Billing Registry
        </h3>
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
          Central Revenue Management
        </p>
      </div>
      <button
        onClick={() => setIsManualInvoiceModalOpen(true)}
        className="bg-[#C0392B] text-white px-10 py-4 rounded-[15px] font-black uppercase text-[11px] shadow-xl border-2 border-[#FFB30E] hover:bg-black transition-all"
      >
        + Create Manual Invoice
      </button>
    </div>
    <div className="space-y-4">
      {[
        ...orders.map((o: any) => ({ ...o, type: "AUTO" })),
        ...manualInvoices.map((i: any) => ({ ...i, type: "MANUAL" })),
      ]
        .filter(
          (i) => selectedOutlet === "all" || i.outletId === selectedOutlet
        )
        .sort((a, b) => b.timestamp - a.timestamp)
        .map((inv) => (
          <div
            key={inv.id}
            className="flex flex-col sm:flex-row justify-between items-center p-8 bg-gray-50 rounded-[15px] border border-transparent hover:border-red-100 transition-all hover:bg-white hover:shadow-xl group"
          >
            <div className="mb-4 sm:mb-0">
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`px-3 py-1 rounded-[15px] text-[9px] font-black uppercase tracking-widest ${
                    inv.type === "AUTO"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-[#C0392B] text-white"
                  }`}
                >
                  {inv.type}
                </span>
                <p className="text-[10px] font-mono text-gray-400">
                  ID: {inv.id}
                </p>
              </div>
              <h4 className="text-xl font-medium text-gray-800">
                {inv.customerName}
              </h4>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                {new Date(inv.timestamp).toLocaleString()} •{" "}
                {outlets.find((o: any) => o.id === inv.outletId)?.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-gray-900 tabular-nums mb-1">
                ₹{inv.total.toFixed(0)}
              </p>
              <p className="text-[9px] font-black text-gray-400 uppercase mb-3 tracking-widest">
                {inv.paymentMethod}
              </p>
              <button className="text-[#C0392B] text-[10px] font-black uppercase tracking-widest hover:underline opacity-40 group-hover:opacity-100">
                Reprint Invoice
              </button>
            </div>
          </div>
        ))}
    </div>
  </div>
);

const SettingsTab: React.FC<any> = ({
  globalSettings,
  setGlobalSettings,
  handleSaveSettings,
}) => (
  <div className="bg-white rounded-[15px] p-12 border border-gray-100 shadow-sm animate-fade-up max-w-2xl mx-auto">
    <h3 className="text-3xl font-montserrat font-medium mb-8">
      System Parameters
    </h3>
    <form onSubmit={handleSaveSettings} className="space-y-8">
      <div>
        <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
          Global GST (%)
        </label>
        <input
          type="number"
          value={globalSettings.gstPercentage}
          onChange={(e) =>
            setGlobalSettings({
              ...globalSettings,
              gstPercentage: Number(e.target.value),
            })
          }
          className="w-full p-5 bg-gray-50 rounded-[15px] font-medium outline-none text-xl focus:bg-white focus:ring-4 ring-red-50 transition-all border border-transparent focus:border-red-100 text-center"
        />
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
            Base Delivery (₹)
          </label>
          <input
            type="number"
            value={globalSettings.deliveryBaseCharge}
            onChange={(e) =>
              setGlobalSettings({
                ...globalSettings,
                deliveryBaseCharge: Number(e.target.value),
              })
            }
            className="w-full p-5 bg-gray-50 rounded-[15px] font-medium outline-none text-xl focus:bg-white focus:ring-4 ring-red-50 transition-all text-center"
          />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
            Rate/Km (₹)
          </label>
          <input
            type="number"
            value={globalSettings.deliveryChargePerKm}
            onChange={(e) =>
              setGlobalSettings({
                ...globalSettings,
                deliveryChargePerKm: Number(e.target.value),
              })
            }
            className="w-full p-5 bg-gray-50 rounded-[15px] font-medium outline-none text-xl focus:bg-white focus:ring-4 ring-red-50 transition-all text-center"
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full py-6 bg-gray-900 text-white rounded-[15px] font-black uppercase text-xs shadow-2xl border-2 border-[#FFB30E] hover:bg-black transition-all tracking-widest"
      >
        Commit Global Parameters
      </button>
    </form>
  </div>
);

const UsersTab: React.FC<any> = ({
  filteredStaff,
  user,
  setIsUserModalOpen,
  setEditingUserId,
  setUserForm,
  outlets,
}) => (
  <div className="bg-white rounded-[15px] p-10 md:p-14 border border-gray-100 shadow-sm animate-fade-up">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
      <h3 className="text-4xl font-montserrat font-medium text-gray-800">
        Staff Personnel
      </h3>
      <button
        onClick={() => {
          setEditingUserId(null);
          setUserForm({
            name: "",
            email: "",
            password: "",
            role: UserRole.MANAGER,
            outletId: "all",
            permissions: {
              manageMenu: true,
              manageInventory: true,
              viewStats: true,
              manageOrders: true,
              manageOutlets: false,
              manageManagers: false,
            },
          });
          setIsUserModalOpen(true);
        }}
        className="bg-[#C0392B] text-white px-10 py-4 rounded-[15px] font-black uppercase text-[11px] shadow-xl border-2 border-[#FFB30E] hover:bg-black transition-all"
      >
        + Add Member
      </button>
    </div>
    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-50">
            <th className="py-4 px-4 text-[10px] font-black uppercase text-gray-400">
              Staff Identity
            </th>
            <th className="py-4 px-4 text-[10px] font-black uppercase text-gray-400">
              Role
            </th>
            <th className="py-4 px-4 text-[10px] font-black uppercase text-gray-400">
              Station
            </th>
            <th className="py-4 px-4"></th>
          </tr>
        </thead>
        <tbody>
          {filteredStaff.map((u: any) => (
            <tr
              key={u.id}
              className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
            >
              <td className="py-6 px-4">
                <p className="font-medium text-sm text-gray-900">{u.name}</p>
                <p className="text-[10px] font-medium text-gray-400">
                  {u.email}
                </p>
              </td>
              <td className="py-6 px-4">
                <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-[15px] text-[9px] font-black uppercase tracking-widest">
                  {u.role}
                </span>
              </td>
              <td className="py-6 px-4 text-xs font-medium text-gray-600">
                {u.outletId === "all"
                  ? "Universal"
                  : outlets.find((o: any) => o.id === u.outletId)?.name}
              </td>
              <td className="py-6 px-4 text-right">
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setEditingUserId(u.id);
                      setUserForm({
                        name: u.name,
                        email: u.email,
                        password: u.password || "",
                        role: u.role,
                        outletId: u.outletId || "all",
                        permissions: u.permissions || {
                          manageMenu: false,
                          manageInventory: false,
                          viewStats: false,
                          manageOrders: true,
                          manageOutlets: false,
                          manageManagers: false,
                        },
                      });
                      setIsUserModalOpen(true);
                    }}
                    className="text-[#C0392B] text-[10px] font-black uppercase hover:underline opacity-60 hover:opacity-100"
                  >
                    Configure
                  </button>
                  {u.id !== user.id && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Strike this personnel from the sanctuary records?"
                          )
                        ) {
                          FirestoreDB.deleteStaffUser(u.id).then(() => {
                            FirestoreDB.getStaffUsers().then(setStaffUsers);
                          }).catch(console.error);
                        }
                      }}
                      className="text-red-500 text-[10px] font-black uppercase hover:underline opacity-40 hover:opacity-100"
                    >
                      Excommunicate
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ManualInvoiceModal: React.FC<any> = ({
  isOpen,
  onClose,
  outlets,
  menu,
  selectedOutletId,
  gstPercentage,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    customerName: "",
    outletId: selectedOutletId,
    paymentMethod: "CASH" as any,
  });
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [search, setSearch] = useState("");
  const subtotal = selectedItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );
  const tax = subtotal * (gstPercentage / 100);
  const total = subtotal + tax;

  const addItem = (
    item: MenuItem,
    variant: "full" | "half" | "qtr" = "full"
  ) => {
    const price = item.price[variant] || item.price.full;
    setSelectedItems((prev) => {
      const existing = prev.find(
        (i) => i.menuItemId === item.id && i.variant === variant
      );
      if (existing)
        return prev.map((i) =>
          i.menuItemId === item.id && i.variant === variant
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      return [
        ...prev,
        { menuItemId: item.id, name: item.name, variant, price, quantity: 1 },
      ];
    });
  };

  const removeItem = (id: string, variant: string) => {
    setSelectedItems((prev) =>
      prev
        .map((i) =>
          i.menuItemId === id && i.variant === variant
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-7xl bg-white rounded-[15px] shadow-2xl p-10 md:p-14 flex flex-col md:flex-row gap-12 max-h-[90vh] overflow-hidden border border-gray-100 animate-zoom">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-6">
            <div>
              <h3 className="text-4xl font-montserrat font-medium text-gray-900 leading-none">
                Manual Billing Console
              </h3>
              <p className="text-[10px] font-black uppercase text-[#C0392B] tracking-[0.3em] mt-3">
                Establishing Synchronized Invoice
              </p>
            </div>
            <div className="flex gap-4">
              <select
                value={formData.outletId}
                onChange={(e) =>
                  setFormData({ ...formData, outletId: e.target.value })
                }
                className="bg-gray-50 text-[9px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl outline-none border border-gray-100 focus:bg-white transition-all cursor-pointer"
              >
                {outlets.map((o: any) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentMethod: e.target.value as any,
                  })
                }
                className="bg-gray-50 text-[9px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl outline-none border border-gray-100 focus:bg-white transition-all cursor-pointer"
              >
                <option value="CASH">CASH MODE</option>
                <option value="UPI">UPI PROTOCOL</option>
                <option value="CARD">CARD PROTOCOL</option>
                <option value="COD">COD PROTOCOL</option>
              </select>
            </div>
          </div>
          <div className="bg-gray-50 p-8 rounded-[15px] mb-8 border border-gray-100 flex flex-col gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 ml-1 block tracking-widest">
                Customer Identity
              </label>
              <input
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
                placeholder="Guest Name..."
                className="w-full p-5 bg-white rounded-2xl font-medium outline-none shadow-sm focus:ring-4 ring-red-50 transition-all border border-transparent focus:border-red-100"
              />
            </div>
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Quick Heritage Recipe Search..."
                className="w-full p-5 bg-white rounded-2xl font-medium outline-none shadow-sm border border-transparent pl-14"
              />
              <svg
                className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-grow overflow-y-auto pr-6 space-y-5 no-scrollbar pb-10">
            {menu
              .filter((m: any) =>
                m.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((m: any) => (
                <div
                  key={m.id}
                  className="p-6 bg-white border border-gray-100 rounded-[15px] flex flex-col lg:flex-row justify-between items-center gap-8 group hover:border-[#C0392B] transition-all hover:shadow-xl relative overflow-hidden"
                >
                  <div className="flex-1 text-center lg:text-left">
                    <h5 className="font-medium text-gray-800 text-lg leading-tight mb-1">
                      {m.name}
                    </h5>
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">
                      {m.category}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    {(["full", "half", "qtr"] as const).map(
                      (v) =>
                        m.price[v] && (
                          <div
                            key={v}
                            className="bg-gray-50/80 p-4 rounded-[15px] flex flex-col items-center min-w-[140px] border border-gray-100 hover:bg-white transition-colors"
                          >
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">
                              {v.toUpperCase()} PORTION (₹{m.price[v]})
                            </span>
                            <div className="flex items-center gap-3">
                              {selectedItems.find(
                                (i) => i.menuItemId === m.id && i.variant === v
                              ) ? (
                                <div className="flex items-center bg-white rounded-[15px] p-1 shadow-sm border border-gray-100">
                                  <button
                                    onClick={() => removeItem(m.id, v)}
                                    className="w-8 h-8 flex items-center justify-center text-red-500 font-black hover:bg-red-50 rounded-[15px] transition-colors text-lg"
                                  >
                                    ×
                                  </button>
                                  <span className="w-10 text-center text-sm font-black tabular-nums">
                                    {
                                      selectedItems.find(
                                        (i) =>
                                          i.menuItemId === m.id &&
                                          i.variant === v
                                      )?.quantity
                                    }
                                  </span>
                                  <button
                                    onClick={() => addItem(m, v)}
                                    className="w-8 h-8 flex items-center justify-center text-emerald-500 font-black hover:bg-emerald-50 rounded-[15px] transition-colors text-lg"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addItem(m, v)}
                                  className="px-6 py-2.5 bg-gray-900 text-white text-[9px] font-black uppercase rounded-[15px] hover:bg-[#C0392B] transition-all tracking-widest shadow-lg"
                                >
                                  ADD {v.toUpperCase()}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div className="w-full md:w-[420px] bg-gray-50 rounded-[15px] p-12 flex flex-col shadow-inner border border-gray-100">
          <div className="text-center mb-10">
            <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-[0.4em]">
              Invoice Preview
            </h4>
            <p className="text-[9px] font-medium text-gray-300 mt-2 italic">
              Real-time Inventory Link Active
            </p>
          </div>
          <div className="flex-grow overflow-y-auto space-y-6 no-scrollbar mb-10 pr-2">
            {selectedItems.map((item) => (
              <div
                key={`${item.menuItemId}-${item.variant}`}
                className="bg-white p-6 rounded-[15px] border border-gray-100 flex justify-between items-center animate-fade-up shadow-sm group"
              >
                <div className="flex-1">
                  <p className="text-sm font-black text-gray-800 group-hover:text-[#C0392B] transition-colors">
                    {item.name}
                  </p>
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">
                    {item.variant.toUpperCase()} • ₹{item.price} ×{" "}
                    {item.quantity}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.menuItemId, item.variant)}
                  className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-[15px] hover:bg-red-500 hover:text-white transition-all ml-4"
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
              </div>
            ))}
            {selectedItems.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale py-20">
                <div className="text-8xl mb-6">🍱</div>
                <p className="text-[10px] font-black uppercase tracking-widest">
                  No Sanctuary Selection
                </p>
              </div>
            )}
          </div>
          <div className="space-y-5 border-t-2 border-dashed border-gray-200 pt-10">
            <div className="flex justify-between text-[11px] font-black uppercase text-gray-400 tracking-widest">
              <span>SUBTOTAL</span>
              <span className="tabular-nums">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px] font-black uppercase text-gray-400 tracking-widest">
              <span>GST ({gstPercentage}%)</span>
              <span className="tabular-nums">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-4xl font-montserrat font-black pt-8 border-t border-gray-100 mt-6 text-gray-900">
              <span>TOTAL</span>
              <span className="text-[#C0392B] tabular-nums">
                ₹{total.toFixed(0)}
              </span>
            </div>
          </div>
          <button
            disabled={selectedItems.length === 0 || !formData.customerName}
            onClick={() =>
              onSave({
                ...formData,
                customerPhone: "",
                address: "",
                id: `INV-MAN-${Date.now()}`,
                items: selectedItems,
                subtotal,
                tax,
                deliveryCharge: 0,
                total,
                timestamp: Date.now(),
              })
            }
            className="w-full py-6 bg-gray-900 text-white rounded-[32px] font-black uppercase text-[11px] tracking-[0.3em] mt-12 hover:bg-[#C0392B] transition-all shadow-2xl border-2 border-transparent hover:border-[#FFB30E] active:scale-95 disabled:opacity-30"
          >
            Finalize & Print
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: any;
  icon: string;
  color: string;
}> = ({ label, value, icon, color }) => (
  <div className="bg-white p-12 rounded-[60px] shadow-sm border border-gray-100 transition-all hover:shadow-2xl animate-fade-up">
    <div
      className={`w-20 h-20 rounded-[30px] bg-${color}-50 flex items-center justify-center text-4xl mb-10 shadow-inner`}
    >
      {icon}
    </div>
    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2">
      {label}
    </h4>
    <p className="text-6xl font-montserrat font-medium text-gray-900 tracking-tighter">
      {value}
    </p>
  </div>
);

export default AdminDashboard;
