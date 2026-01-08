// AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";
import FirestoreDB from "../services/firestoreDb";
import html2pdf from "html2pdf.js";
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

// Utility function to calculate delivery charge based on distance and tiers
const calculateDeliveryCharge = (
  distanceKm: number,
  subtotal: number,
  globalSettings: GlobalSettings
): number => {
  // Free delivery for orders above threshold
  if (subtotal >= globalSettings.freeDeliveryThreshold) {
    return 0;
  }

  // Free delivery within distance limit
  if (distanceKm <= globalSettings.freeDeliveryDistanceLimit) {
    return 0;
  }

  // Use delivery tiers if configured
  if (globalSettings.deliveryTiers && globalSettings.deliveryTiers.length > 0) {
    // Sort tiers by distance ascending
    const sortedTiers = [...globalSettings.deliveryTiers].sort(
      (a, b) => a.upToKm - b.upToKm
    );

    // Find the appropriate tier for the distance
    for (const tier of sortedTiers) {
      if (distanceKm <= tier.upToKm) {
        return tier.charge;
      }
    }

    // If distance is beyond all tiers, use the last tier's charge
    return sortedTiers[sortedTiers.length - 1]?.charge || 0;
  }

  // Fallback to old logic if no tiers configured
  return (
    globalSettings.deliveryBaseCharge +
    (distanceKm - globalSettings.freeDeliveryDistanceLimit) *
      globalSettings.deliveryChargePerKm
  );
};

interface AdminDashboardProps {
  user: UserProfile;
  onBack?: () => void;
  onLogout?: () => void;
}

// ✅ Tailwind-safe mapping (NO bg-${color}-50)
const statBgMap: Record<string, string> = {
  emerald: "bg-emerald-50",
  orange: "bg-orange-50",
  red: "bg-red-50",
  blue: "bg-blue-50",
};

// ✅ ONE canonical list of permissions (always same order)
const PERMISSION_KEYS: Array<keyof StaffPermissions> = [
  "manageMenu",
  "manageInventory",
  "viewStats",
  "manageOrders",
  "manageOutlets",
  "manageManagers",
];

// ✅ Normalize permissions (prevents missing keys from DB)
const normalizePermissions = (
  p?: Partial<StaffPermissions> | null
): StaffPermissions => ({
  manageMenu: !!p?.manageMenu,
  manageInventory: !!p?.manageInventory,
  viewStats: !!p?.viewStats,
  manageOrders: !!p?.manageOrders,
  manageOutlets: !!p?.manageOutlets,
  manageManagers: !!p?.manageManagers,
});

// ✅ Labels
const permissionLabel = (k: keyof StaffPermissions) =>
  ({
    manageMenu: "Manage Menu",
    manageInventory: "Manage Inventory",
    viewStats: "View Stats",
    manageOrders: "Manage Orders",
    manageOutlets: "Manage Outlets",
    manageManagers: "Manage Managers",
  }[k] || String(k));

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
      brandName: "HAVENS KITCHEN",
      logoUrl: "",
      tagline: "ESTABLISHED 1984 • CULINARY SANCTUARY",
      address: "HQ - South Delhi, India",
      contact: "9899466466",
      showTagline: true,
      showNotice: true,
      primaryColor: "#C0392B",
    },
  });

  const [statsYear, setStatsYear] = useState<number>(2026);
  const [statsMonth, setStatsMonth] = useState<number | "all">("all");

  // history pagination and filter
  const [historyPage, setHistoryPage] = useState(1);
  const [historyDateFilter, setHistoryDateFilter] = useState<string>("");

  // billing pagination and filters
  const [billingPage, setBillingPage] = useState(1);
  const [billingDateFilter, setBillingDateFilter] = useState<string>("");
  const [billingCategoryFilter, setBillingCategoryFilter] =
    useState<string>("all");

  // modals
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isOutletModalOpen, setIsOutletModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isManualInvoiceModalOpen, setIsManualInvoiceModalOpen] =
    useState(false);

  // editing IDs
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editingOutletId, setEditingOutletId] = useState<string | null>(null);
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(
    null
  );
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // forms
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
    isAvailable: true,
    inventoryItems: [] as { itemId: string; qty: number }[],
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
    permissions: normalizePermissions({
      manageMenu: true,
      manageInventory: true,
      viewStats: true,
      manageOrders: true,
      manageOutlets: false,
      manageManagers: false,
    }),
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
    directionsLink: "",
  });

  const [categoryName, setCategoryName] = useState("");

  // --------------------------
  // ✅ IMAGE UPLOAD
  // --------------------------
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const storageRef = ref(storage, `menu/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormItem((p) => ({ ...p, imageUrl: url }));
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Image upload failed.");
    }
  };

  // -----------------------
  // ✅ SINGLE SOURCE refresh
  // -----------------------
  const refreshAll = async () => {
    const canSeeAllOutlets =
      user.role === UserRole.SUPER_ADMIN || (user as any).role === "ADMIN";

    const userOutletId = user.outletId;

    const outletsData = await FirestoreDB.getOutlets();
    const accessibleOutlets = canSeeAllOutlets
      ? outletsData
      : outletsData.filter((o: any) => o.id === userOutletId);

    const outletToFetch = canSeeAllOutlets
      ? selectedOutlet === "all"
        ? undefined
        : selectedOutlet
      : userOutletId;

    const [
      ordersData,
      menuData,
      inventoryData,
      staffData,
      invoicesData,
      settingsData,
    ] = await Promise.all([
      canSeeAllOutlets
        ? FirestoreDB.getOrders(undefined, outletToFetch)
        : FirestoreDB.getOrders(undefined, userOutletId),

      canSeeAllOutlets
        ? FirestoreDB.getMenu(outletToFetch)
        : FirestoreDB.getMenu(userOutletId),

      FirestoreDB.getInventory(outletToFetch),

      canSeeAllOutlets
        ? FirestoreDB.getStaffUsers()
        : FirestoreDB.getStaffUsers().then((users: any[]) =>
            users.filter((u) => u.outletId === userOutletId || u.id === user.id)
          ),

      FirestoreDB.getManualInvoices(),
      FirestoreDB.getGlobalSettings(),
    ]);

    setOutlets(accessibleOutlets || []);
    setOrders(ordersData || []);
    setMenu(menuData || []);
    setInventory(inventoryData || []);
    setStaffUsers(staffData || []);
    setManualInvoices(invoicesData || []);
    setGlobalSettings(settingsData || globalSettings);

    const fromMenu = Array.from(
      new Set((menuData || []).map((m: any) => m.category).filter(Boolean))
    );
    const defaults = [
      "Signature Selection",
      "Momo Factory",
      "Appetizers",
      "Main Course",
      "Beverages",
      "Desserts",
    ];
    setCategories(Array.from(new Set([...fromMenu, ...defaults])));
  };

  useEffect(() => {
    (async () => {
      try {
        await refreshAll();
      } catch (e) {
        console.error("Error loading data:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOutlet, user.role, user.outletId]);

  // ---------------------------------------
  // ✅ INVENTORY DEDUCTION (client-side)
  // ---------------------------------------
  const deductInventoryForOrder = async (order: Order) => {
    const invMap = new Map<string, InventoryItem>();
    inventory.forEach((i) => invMap.set(i.id, { ...i }));

    const menuMap = new Map<string, MenuItem>();
    menu.forEach((m) => menuMap.set(m.id, m));

    for (const oi of order.items || []) {
      const m = menuMap.get((oi as any).menuItemId);
      if (!m?.inventoryItems?.length) continue;

      for (const link of m.inventoryItems) {
        const invItem = invMap.get(link.itemId);
        if (!invItem) continue;

        const perUnit = Number(link.qty || 0);
        const qty = Number((oi as any).quantity || 0);
        const variant = (oi as any).variant || "full";
        const variantMultiplier =
          variant === "half" ? 0.5 : variant === "qtr" ? 0.25 : 1;
        const deduction = perUnit * qty * variantMultiplier;
        if (deduction <= 0) continue;

        invItem.stock = Math.max(0, Number(invItem.stock) - deduction);
        invMap.set(invItem.id, invItem);
      }
    }

    const updates = Array.from(invMap.values());
    const onlyThisOutlet = updates.filter(
      (i) => i.outletId === order.outletId || i.outletId === "all"
    );
    await Promise.all(
      onlyThisOutlet.map((inv) => FirestoreDB.saveInventoryItem(inv))
    );

    const fresh = await FirestoreDB.getInventory(
      selectedOutlet === "all" ? undefined : selectedOutlet
    );
    setInventory(fresh || []);
  };

  // --------------------------
  // ✅ ORDER STATUS UPDATE
  // --------------------------
  const handleUpdateOrderStatus = async (order: Order, next: OrderStatus) => {
    try {
      // NOTE: If your firestoreDb.ts has updateOrderStatus(orderId, status) only,
      // keep this line as:
      // await FirestoreDB.updateOrderStatus(order.id, next);
      await (FirestoreDB as any).updateOrderStatus(order.id, next, user.name);

      if (
        order.status === OrderStatus.PENDING &&
        next === OrderStatus.ACCEPTED
      ) {
        await deductInventoryForOrder(order);
      }

      const freshOrders = await FirestoreDB.getOrders(
        undefined,
        selectedOutlet === "all" ? undefined : selectedOutlet
      );
      setOrders(freshOrders || []);
    } catch (e) {
      console.error(e);
      alert("Order update failed. Check console for details.");
    }
  };

  // --------------------------
  // ✅ SAVE MENU / INVENTORY
  // --------------------------
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const item: MenuItem = {
        id: editingMenuId || `item-${Date.now()}`,
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
        isAvailable: formItem.isAvailable,
        isSpicy: formItem.isSpicy,
        foodType: formItem.foodType === "Veg" ? "Veg" : "Non-Veg",
        inventoryItems: formItem.inventoryItems || [],
        discountPercentage: Number(formItem.discount || 0),
      };

      await FirestoreDB.saveMenuItem(item);
      setIsMenuModalOpen(false);

      const fresh = await FirestoreDB.getMenu(
        selectedOutlet === "all" ? undefined : selectedOutlet
      );
      setMenu(fresh || []);
    } catch (e) {
      console.error(e);
      alert("Saving menu failed.");
    }
  };

  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const item: InventoryItem = {
        id: editingInventoryId || `inv-${Date.now()}`,
        outletId: inventoryForm.outletId,
        name: inventoryForm.name,
        stock: Number(inventoryForm.stock),
        minStock: Number(inventoryForm.minStock),
        unit: inventoryForm.unit,
        imageUrl: inventoryForm.imageUrl,
      };

      await FirestoreDB.saveInventoryItem(item);
      setIsInventoryModalOpen(false);

      const fresh = await FirestoreDB.getInventory(
        selectedOutlet === "all" ? undefined : selectedOutlet
      );
      setInventory(fresh || []);
    } catch (e) {
      console.error(e);
      alert("Saving inventory failed.");
    }
  };

  // --------------------------
  // ✅ USERS
  // --------------------------
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (user.role === UserRole.MANAGER) {
        alert("Managers do not have permission to manage users.");
        return;
      }

      if (user.role === UserRole.OUTLET_OWNER) {
        if (
          userForm.outletId !== user.outletId &&
          userForm.outletId !== "all"
        ) {
          alert("You can only manage users for your outlet.");
          return;
        }
        if (
          userForm.role === UserRole.SUPER_ADMIN ||
          userForm.role === UserRole.OUTLET_OWNER
        ) {
          alert("You cannot create Super Admins or Outlet Owners.");
          return;
        }
      }

      const safePermissions = normalizePermissions(userForm.permissions);

      await FirestoreDB.saveStaffUser({
        id: editingUserId || `staff-${Date.now()}`,
        name: userForm.name,
        email: userForm.email,
        phone: "",
        address: "",
        password: userForm.password,
        role: userForm.role,
        outletId: userForm.outletId,
        permissions: safePermissions,
      } as any);

      setIsUserModalOpen(false);
      const fresh = await FirestoreDB.getStaffUsers();
      setStaffUsers(fresh || []);
    } catch (e) {
      console.error(e);
      alert("Saving staff user failed.");
    }
  };

  // --------------------------
  // ✅ OUTLETS
  // --------------------------
  const handleSaveOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const outlet: Outlet = {
        id: editingOutletId || `outlet-${Date.now()}`,
        name: outletForm.name,
        address: outletForm.address,
        contact: outletForm.contact,
        email: outletForm.email,
        imageUrl: outletForm.imageUrl,
        coordinates: {
          lat: Number(outletForm.lat),
          lng: Number(outletForm.lng),
        },
        deliveryRadiusKm: Number(outletForm.radius),
        ownerEmail: outletForm.ownerEmail,
        isActive: outletForm.isActive,
        rating: 4.5,
        totalRatings: 0,
        directionsLink: outletForm.directionsLink || undefined,
      };

      await FirestoreDB.saveOutlet(outlet);
      setIsOutletModalOpen(false);

      const fresh = await FirestoreDB.getOutlets();
      setOutlets(fresh || []);
    } catch (e) {
      console.error(e);
      alert("Saving outlet failed.");
    }
  };

  // --------------------------
  // ✅ SETTINGS
  // --------------------------
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await FirestoreDB.saveGlobalSettings(globalSettings);
      alert("System parameters synchronized.");
    } catch (e) {
      console.error(e);
      alert("Saving settings failed.");
    }
  };

  // --------------------------
  // ✅ EXPORT
  // --------------------------
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
      outlets.find((o) => o.id === order.outletId)?.name || "",
      order.customerName,
      order.items
        .map((i: any) => `${i.quantity}x ${i.name} (${i.variant})`)
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

  // --------------------------
  // ✅ MEMOS
  // --------------------------
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
    };
  }, [orders, inventory, selectedOutlet, statsYear, statsMonth]);

  // --------------------------
  // ✅ UI
  // --------------------------
  const canSeeAllOutlets =
    user.role === UserRole.SUPER_ADMIN || (user as any).role === "ADMIN";

  return (
    <div className="pt-40 pb-12 px-6 min-h-screen bg-gray-50/50">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gray-900">
              Management Portal
            </h1>
            <p className="text-gray-400 text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] mt-3">
              Authorized Sanctuary Monitor{" "}
              <span className="text-[#C0392B]">
                • {String(user.role).replace("_", " ")}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            {canSeeAllOutlets ? (
              <div className="relative group">
                <select
                  value={selectedOutlet}
                  onChange={(e) => setSelectedOutlet(e.target.value)}
                  className="appearance-none bg-white border border-gray-100 rounded-[20px] px-8 py-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-black/5 outline-none hover:border-[#C0392B] transition-all cursor-pointer min-w-[220px]"
                >
                  <option value="all">All Outlets</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-[20px] px-8 py-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-black/5">
                {outlets.find((o) => o.id === user.outletId)?.name ||
                  "Your Outlet"}
              </div>
            )}

            <button
              className="bg-[#C0392B] text-white px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-red-900/10 border border-[#FFB30E]"
              onClick={onLogout}
            >
              LOGOUT
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white p-2 rounded-[25px] shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-gray-100 mb-10 overflow-x-auto no-scrollbar flex items-center">
          <div className="flex flex-nowrap gap-1 w-full">
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
                user.role !== UserRole.OUTLET_OWNER &&
                (user as any).role !== "ADMIN"
              )
                return null;
              if (
                tab === "outlets" &&
                user.role !== UserRole.SUPER_ADMIN &&
                (user as any).role !== "ADMIN"
              )
                return null;
              if (
                tab === "settings" &&
                user.role !== UserRole.SUPER_ADMIN &&
                (user as any).role !== "ADMIN"
              )
                return null;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 min-w-[120px] px-4 py-4 rounded-[18px] text-[9px] font-black uppercase tracking-[0.2em] transition-all shrink-0 ${
                    activeTab === tab
                      ? "bg-[#C0392B] text-white shadow-xl shadow-red-900/10 scale-105"
                      : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="w-full animate-fade-up">
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
              orders={orders}
              onUpdateStatus={handleUpdateOrderStatus}
            />
          )}

          {activeTab === "menu" && (
            <MenuTab
              selectedOutlet={selectedOutlet}
              menu={menu}
              outlets={outlets}
              categories={categories}
              onAdd={() => {
                if (selectedOutlet === "all" && outlets.length === 0) {
                  alert("No outlets available. Please add an outlet first.");
                  return;
                }
                setEditingMenuId(null);
                setFormItem((p) => ({
                  ...p,
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
                  outletId:
                    selectedOutlet === "all"
                      ? outlets[0]?.id || ""
                      : selectedOutlet,
                  discount: "0",
                  isAvailable: true,
                  inventoryItems: [],
                }));
                setIsMenuModalOpen(true);
              }}
              onEdit={(item: MenuItem) => {
                setEditingMenuId(item.id);
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
                  foodType: item.foodType as any,
                  outletId: item.outletId,
                  discount: String(item.discountPercentage || 0),
                  isAvailable: item.isAvailable ?? true,
                  inventoryItems: (item.inventoryItems || []) as any,
                });
                setIsMenuModalOpen(true);
              }}
              onDelete={async (id: string) => {
                if (!window.confirm("Delete this menu item?")) return;
                await FirestoreDB.deleteMenuItem(id);
                const fresh = await FirestoreDB.getMenu(
                  selectedOutlet === "all" ? undefined : selectedOutlet
                );
                setMenu(fresh || []);
              }}
              onAddCategory={() => setIsCategoryModalOpen(true)}
            />
          )}

          {activeTab === "inventory" && (
            <InventoryTab
              selectedOutlet={selectedOutlet}
              inventory={inventory}
              outlets={outlets}
              onAdd={() => {
                if (selectedOutlet === "all" && outlets.length === 0) {
                  alert("No outlets available. Please add an outlet first.");
                  return;
                }
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
              onEdit={(item: InventoryItem) => {
                setEditingInventoryId(item.id);
                setInventoryForm({
                  name: item.name,
                  stock: Number(item.stock),
                  minStock: Number(item.minStock),
                  unit: item.unit,
                  imageUrl: item.imageUrl || "",
                  outletId: item.outletId,
                });
                setIsInventoryModalOpen(true);
              }}
              onDelete={async (id: string) => {
                if (!window.confirm("Delete this inventory item?")) return;
                await FirestoreDB.deleteInventoryItem(id);
                const fresh = await FirestoreDB.getInventory(
                  selectedOutlet === "all" ? undefined : selectedOutlet
                );
                setInventory(fresh || []);
              }}
            />
          )}

          {activeTab === "outlets" && (
            <OutletTab
              user={user}
              outlets={outlets}
              onAdd={() => {
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
                  directionsLink: "",
                });
                setIsOutletModalOpen(true);
              }}
              onEdit={(o: Outlet) => {
                setEditingOutletId(o.id);
                setOutletForm({
                  name: o.name,
                  address: o.address,
                  contact: o.contact,
                  email: (o as any).email || "",
                  imageUrl: o.imageUrl,
                  lat: o.coordinates.lat,
                  lng: o.coordinates.lng,
                  radius: o.deliveryRadiusKm,
                  ownerEmail: (o as any).ownerEmail || "",
                  isActive: (o as any).isActive ?? true,
                  directionsLink: (o as any).directionsLink || "",
                });
                setIsOutletModalOpen(true);
              }}
              onDelete={async (id: string) => {
                if (user.role !== UserRole.SUPER_ADMIN) {
                  alert("Only Super Admin can delete outlets.");
                  return;
                }
                if (!window.confirm("Delete this outlet?")) return;
                await FirestoreDB.deleteOutlet(id);
                const fresh = await FirestoreDB.getOutlets();
                setOutlets(fresh || []);
              }}
            />
          )}

          {activeTab === "history" && (
            <HistoryTab
              selectedOutlet={selectedOutlet}
              orders={orders}
              historyPage={historyPage}
              setHistoryPage={setHistoryPage}
              historyDateFilter={historyDateFilter}
              setHistoryDateFilter={setHistoryDateFilter}
            />
          )}

          {activeTab === "users" && (
            <UsersTab
              user={user}
              outlets={outlets}
              staffUsers={filteredStaff}
              onAdd={() => {
                setEditingUserId(null);
                setUserForm({
                  name: "",
                  email: "",
                  password: "",
                  role: UserRole.MANAGER,
                  outletId:
                    user.role === UserRole.OUTLET_OWNER ? user.outletId : "all",
                  permissions: normalizePermissions({
                    manageMenu: true,
                    manageInventory: true,
                    viewStats: true,
                    manageOrders: true,
                    manageOutlets: false,
                    manageManagers: false,
                  }),
                } as any);
                setIsUserModalOpen(true);
              }}
              onEdit={(u: any) => {
                setEditingUserId(u.id);
                setUserForm({
                  name: u.name,
                  email: u.email,
                  password: u.password || "",
                  role: u.role,
                  outletId: u.outletId || "all",
                  permissions: normalizePermissions(u.permissions),
                });
                setIsUserModalOpen(true);
              }}
              onDelete={async (
                id: string,
                targetRole: any,
                targetOutletId: any
              ) => {
                if (user.role === UserRole.MANAGER) {
                  alert("Managers cannot delete users.");
                  return;
                }
                if (user.role === UserRole.OUTLET_OWNER) {
                  if (targetOutletId !== user.outletId) {
                    alert("You can only manage users of your outlet.");
                    return;
                  }
                  if (
                    targetRole === UserRole.SUPER_ADMIN ||
                    targetRole === UserRole.OUTLET_OWNER
                  ) {
                    alert(
                      "Only Super Admin can remove Super Admin / Outlet Owner."
                    );
                    return;
                  }
                }
                if (!window.confirm("Delete this user?")) return;
                await FirestoreDB.deleteStaffUser(id);
                const fresh = await FirestoreDB.getStaffUsers();
                setStaffUsers(fresh || []);
              }}
            />
          )}

          {activeTab === "billing" && (
            <BillingTab
              selectedOutlet={selectedOutlet}
              orders={orders}
              manualInvoices={manualInvoices}
              outlets={outlets}
              globalSettings={globalSettings}
              billingPage={billingPage}
              setBillingPage={setBillingPage}
              billingDateFilter={billingDateFilter}
              setBillingDateFilter={setBillingDateFilter}
              billingCategoryFilter={billingCategoryFilter}
              setBillingCategoryFilter={setBillingCategoryFilter}
              onCreateManualInvoice={() => setIsManualInvoiceModalOpen(true)}
            />
          )}

          {activeTab === "settings" && (
            <SettingsTab
              globalSettings={globalSettings}
              setGlobalSettings={setGlobalSettings}
              onSave={handleSaveSettings}
            />
          )}
        </div>
      </div>

      {/* ---------------- MODALS ---------------- */}
      {isMenuModalOpen && (
        <ModalShell onClose={() => setIsMenuModalOpen(false)}>
          <form
            onSubmit={handleSaveMenu}
            className="relative w-full max-w-5xl bg-white rounded-[50px] shadow-2xl p-10 md:p-14 animate-fade-up max-h-[95vh] overflow-y-auto border border-gray-100 no-scrollbar"
          >
            <h3 className="text-4xl font-playfair font-bold mb-10 text-gray-900">
              {editingMenuId ? "Edit Menu Item" : "Add Menu Item"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                  Name
                </label>
                <input
                  required
                  value={formItem.name}
                  onChange={(e) =>
                    setFormItem({ ...formItem, name: e.target.value })
                  }
                  className="w-full p-5 bg-gray-50 rounded-[24px] font-bold outline-none border border-transparent focus:bg-white focus:border-red-100 transition-all text-xl"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                  Description
                </label>
                <textarea
                  value={formItem.description}
                  onChange={(e) =>
                    setFormItem({ ...formItem, description: e.target.value })
                  }
                  className="w-full p-5 bg-gray-50 rounded-[24px] font-bold outline-none border border-transparent focus:bg-white focus:border-red-100 transition-all resize-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                  Category
                </label>
                <select
                  value={formItem.category}
                  onChange={(e) =>
                    setFormItem({ ...formItem, category: e.target.value })
                  }
                  className="w-full p-5 bg-gray-50 rounded-[24px] font-bold outline-none border border-transparent focus:bg-white focus:border-red-100 transition-all"
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
                  Outlet
                </label>
                <select
                  value={formItem.outletId}
                  onChange={(e) =>
                    setFormItem({ ...formItem, outletId: e.target.value })
                  }
                  className="w-full p-5 bg-gray-50 rounded-[24px] font-bold outline-none border border-transparent focus:bg-white focus:border-red-100 transition-all"
                >
                  <option value="all">All Outlets</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                  Food Type
                </label>
                <select
                  value={formItem.foodType}
                  onChange={(e) =>
                    setFormItem({
                      ...formItem,
                      foodType: e.target.value as any,
                    })
                  }
                  className="w-full p-5 bg-gray-50 rounded-[24px] font-bold outline-none border border-transparent focus:bg-white focus:border-red-100 transition-all"
                >
                  <option value="Veg">Veg</option>
                  <option value="Non-Veg">Non-Veg</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                  Spice Level
                </label>
                <select
                  value={formItem.isSpicy}
                  onChange={(e) =>
                    setFormItem({ ...formItem, isSpicy: e.target.value as any })
                  }
                  className="w-full p-5 bg-gray-50 rounded-[24px] font-bold outline-none border border-transparent focus:bg-white focus:border-red-100 transition-all"
                >
                  <option value="None">None</option>
                  <option value="Mild">Mild</option>
                  <option value="Medium">Medium</option>
                  <option value="Hot">Hot</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                  Image URL
                </label>
                <input
                  value={formItem.imageUrl}
                  onChange={(e) =>
                    setFormItem({ ...formItem, imageUrl: e.target.value })
                  }
                  className="w-full p-5 bg-gray-50 rounded-[24px] font-bold outline-none border border-transparent focus:bg-white focus:border-red-100 transition-all mb-4"
                  placeholder="Enter image URL or upload below"
                />

                <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                  Or Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full p-5 bg-gray-50 rounded-[24px] font-bold outline-none border border-transparent focus:bg-white focus:border-red-100 transition-all"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 md:col-span-2">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Full Price
                  </label>
                  <input
                    type="number"
                    required
                    value={formItem.fullPrice}
                    onChange={(e) =>
                      setFormItem({ ...formItem, fullPrice: e.target.value })
                    }
                    className="w-full p-5 bg-gray-50 rounded-[24px] font-bold outline-none text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Half Price
                  </label>
                  <input
                    type="number"
                    value={formItem.halfPrice}
                    onChange={(e) =>
                      setFormItem({ ...formItem, halfPrice: e.target.value })
                    }
                    className="w-full p-5 bg-gray-50 rounded-[24px] font-bold outline-none text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Qtr Price
                  </label>
                  <input
                    type="number"
                    value={formItem.qtrPrice}
                    onChange={(e) =>
                      setFormItem({ ...formItem, qtrPrice: e.target.value })
                    }
                    className="w-full p-5 bg-gray-50 rounded-[24px] font-bold outline-none text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 md:col-span-2">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Full Qty
                  </label>
                  <input
                    type="text"
                    value={formItem.fullQty}
                    onChange={(e) =>
                      setFormItem({ ...formItem, fullQty: e.target.value })
                    }
                    className="w-full p-5 bg-gray-50 rounded-[24px] font-bold outline-none text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Half Qty
                  </label>
                  <input
                    type="text"
                    value={formItem.halfQty}
                    onChange={(e) =>
                      setFormItem({ ...formItem, halfQty: e.target.value })
                    }
                    className="w-full p-5 bg-gray-50 rounded-[24px] font-bold outline-none text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Qtr Qty
                  </label>
                  <input
                    type="text"
                    value={formItem.qtrQty}
                    onChange={(e) =>
                      setFormItem({ ...formItem, qtrQty: e.target.value })
                    }
                    className="w-full p-5 bg-gray-50 rounded-[24px] font-bold outline-none text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 md:col-span-2">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Full Serves
                  </label>
                  <input
                    type="text"
                    value={formItem.fullServes}
                    onChange={(e) =>
                      setFormItem({ ...formItem, fullServes: e.target.value })
                    }
                    className="w-full p-5 bg-gray-50 rounded-[24px] font-bold outline-none text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Half Serves
                  </label>
                  <input
                    type="text"
                    value={formItem.halfServes}
                    onChange={(e) =>
                      setFormItem({ ...formItem, halfServes: e.target.value })
                    }
                    className="w-full p-5 bg-gray-50 rounded-[24px] font-bold outline-none text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Qtr Serves
                  </label>
                  <input
                    type="text"
                    value={formItem.qtrServes}
                    onChange={(e) =>
                      setFormItem({ ...formItem, qtrServes: e.target.value })
                    }
                    className="w-full p-5 bg-gray-50 rounded-[24px] font-bold outline-none text-center"
                  />
                </div>
              </div>

              <div className="md:col-span-2 pt-4">
                <label className="flex items-center justify-between p-6 bg-gray-50 rounded-[24px]">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Available
                  </span>
                  <input
                    type="checkbox"
                    checked={formItem.isAvailable}
                    onChange={(e) =>
                      setFormItem({
                        ...formItem,
                        isAvailable: e.target.checked,
                      })
                    }
                    className="w-6 h-6 accent-[#C0392B]"
                  />
                </label>
              </div>

              {/* Inventory links */}
              <div className="md:col-span-2">
                <p className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">
                  Inventory Links (for auto minus)
                </p>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 no-scrollbar">
                  {inventory
                    .filter((inv) => inv.outletId === formItem.outletId)
                    .map((inv) => {
                      const linked = formItem.inventoryItems.find(
                        (x) => x.itemId === inv.id
                      );
                      return (
                        <div
                          key={inv.id}
                          className="bg-gray-50 rounded-[20px] p-4 flex items-center gap-4"
                        >
                          <input
                            type="checkbox"
                            checked={!!linked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormItem((prev) => ({
                                  ...prev,
                                  inventoryItems: [
                                    ...prev.inventoryItems,
                                    { itemId: inv.id, qty: 1 },
                                  ],
                                }));
                              } else {
                                setFormItem((prev) => ({
                                  ...prev,
                                  inventoryItems: prev.inventoryItems.filter(
                                    (x) => x.itemId !== inv.id
                                  ),
                                }));
                              }
                            }}
                            className="w-5 h-5 accent-[#C0392B]"
                          />
                          <div className="flex-1">
                            <p className="font-bold text-sm text-gray-900">
                              {inv.name}{" "}
                              <span className="text-xs text-gray-400">
                                ({inv.stock} {inv.unit})
                              </span>
                            </p>
                          </div>
                          {linked && (
                            <input
                              type="number"
                              min={0}
                              step={0.25}
                              value={linked.qty}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setFormItem((prev) => ({
                                  ...prev,
                                  inventoryItems: prev.inventoryItems.map((x) =>
                                    x.itemId === inv.id ? { ...x, qty: val } : x
                                  ),
                                }));
                              }}
                              className="w-24 p-3 bg-white rounded-[14px] font-bold text-center"
                              title="How much to minus per 1 order quantity"
                            />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="flex gap-6 mt-12 pt-10 border-t border-gray-50">
              <button
                type="submit"
                className="flex-1 py-6 bg-gray-900 text-white rounded-[32px] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl border-2 border-[#FFB30E] hover:bg-black transition-all"
              >
                SAVE
              </button>
              <button
                type="button"
                onClick={() => setIsMenuModalOpen(false)}
                className="px-12 py-6 bg-gray-50 text-gray-400 rounded-[32px] font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all"
              >
                CANCEL
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {isCategoryModalOpen && (
        <ModalShell onClose={() => setIsCategoryModalOpen(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = categoryName.trim();
              if (!name) return;
              if (!categories.includes(name))
                setCategories((p) => [...p, name]);
              setCategoryName("");
              setIsCategoryModalOpen(false);
            }}
            className="relative w-full max-w-md bg-white rounded-[40px] p-10 animate-fade-up border border-gray-100"
          >
            <h3 className="text-2xl font-playfair font-bold mb-6">
              New Category
            </h3>
            <input
              required
              autoFocus
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full p-5 bg-gray-50 rounded-2xl font-bold mb-8 outline-none border border-transparent focus:bg-white focus:border-red-100"
              placeholder="e.g. Desserts"
            />
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 py-4 bg-[#C0392B] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 border-[#FFB30E]"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-6 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase text-[10px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {isOutletModalOpen && (
        <ModalShell onClose={() => setIsOutletModalOpen(false)}>
          <form
            onSubmit={handleSaveOutlet}
            className="relative w-full max-w-2xl bg-white rounded-[40px] p-12 animate-fade-up border border-gray-100 max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            <h3 className="text-3xl font-playfair font-bold mb-8">Outlet</h3>

            <div className="space-y-6 mb-10">
              <Input
                label="Name"
                value={outletForm.name}
                onChange={(v) => setOutletForm({ ...outletForm, name: v })}
              />
              <Input
                label="Address"
                value={outletForm.address}
                onChange={(v) => setOutletForm({ ...outletForm, address: v })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Contact"
                  value={outletForm.contact}
                  onChange={(v) => setOutletForm({ ...outletForm, contact: v })}
                />
                <Input
                  label="Email"
                  value={outletForm.email}
                  onChange={(v) => setOutletForm({ ...outletForm, email: v })}
                />
              </div>
              <Input
                label="Image URL"
                value={outletForm.imageUrl}
                onChange={(v) => setOutletForm({ ...outletForm, imageUrl: v })}
              />
              <Input
                label="Directions Link"
                value={outletForm.directionsLink}
                onChange={(v) =>
                  setOutletForm({ ...outletForm, directionsLink: v })
                }
              />

              <div className="grid grid-cols-3 gap-4">
                <NumberInput
                  label="Lat"
                  value={outletForm.lat}
                  onChange={(v) => setOutletForm({ ...outletForm, lat: v })}
                />
                <NumberInput
                  label="Lng"
                  value={outletForm.lng}
                  onChange={(v) => setOutletForm({ ...outletForm, lng: v })}
                />
                <NumberInput
                  label="Radius (km)"
                  value={outletForm.radius}
                  onChange={(v) => setOutletForm({ ...outletForm, radius: v })}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={outletForm.isActive}
                  onChange={(e) =>
                    setOutletForm({ ...outletForm, isActive: e.target.checked })
                  }
                  className="w-5 h-5 accent-[#C0392B]"
                />
                <span className="text-sm font-bold text-gray-700">Active</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 py-5 bg-[#C0392B] text-white rounded-2xl font-black uppercase text-[11px] tracking-widest border-2 border-[#FFB30E]"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsOutletModalOpen(false)}
                className="px-8 py-5 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase text-[10px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {isInventoryModalOpen && (
        <ModalShell onClose={() => setIsInventoryModalOpen(false)}>
          <form
            onSubmit={handleSaveInventory}
            className="relative w-full max-w-xl bg-white rounded-[40px] p-12 animate-fade-up border border-gray-100"
          >
            <h3 className="text-3xl font-playfair font-bold mb-8">Inventory</h3>

            <div className="space-y-6 mb-10">
              <Input
                label="Item Name"
                value={inventoryForm.name}
                onChange={(v) =>
                  setInventoryForm({ ...inventoryForm, name: v })
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <NumberInput
                  label="Stock"
                  value={inventoryForm.stock}
                  onChange={(v) =>
                    setInventoryForm({ ...inventoryForm, stock: v })
                  }
                />
                <NumberInput
                  label="Min Stock"
                  value={inventoryForm.minStock}
                  onChange={(v) =>
                    setInventoryForm({ ...inventoryForm, minStock: v })
                  }
                />
              </div>
              <Input
                label="Unit"
                value={inventoryForm.unit}
                onChange={(v) =>
                  setInventoryForm({ ...inventoryForm, unit: v })
                }
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 py-5 bg-[#C0392B] text-white rounded-2xl font-black uppercase text-[11px] tracking-widest border-2 border-[#FFB30E]"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsInventoryModalOpen(false)}
                className="px-8 py-5 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase text-[10px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {isUserModalOpen && (
        <ModalShell onClose={() => setIsUserModalOpen(false)}>
          <form
            onSubmit={handleSaveUser}
            className="relative w-full max-w-xl bg-white rounded-[40px] p-12 animate-fade-up border border-gray-100 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-3xl font-playfair font-bold mb-8">
              Staff User
            </h3>

            <div className="space-y-6 mb-10">
              <Input
                label="Name"
                value={userForm.name}
                onChange={(v) => setUserForm((p) => ({ ...p, name: v }))}
              />
              <Input
                label="Email / Code"
                value={userForm.email}
                onChange={(v) => setUserForm((p) => ({ ...p, email: v }))}
              />
              <Input
                label="Password"
                value={userForm.password}
                onChange={(v) => setUserForm((p) => ({ ...p, password: v }))}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Role
                  </label>

                  {/* ✅ Outlet owner: ONLY Manager + Delivery Boy */}
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm((p) => ({
                        ...p,
                        role: e.target.value as any,
                      }))
                    }
                    className="w-full p-5 bg-gray-50 rounded-[15px] font-medium outline-none"
                  >
                    {user.role === UserRole.OUTLET_OWNER ? (
                      <>
                        <option value={UserRole.MANAGER}>Manager</option>
                        {(UserRole as any).DELIVERY_BOY && (
                          <option value={(UserRole as any).DELIVERY_BOY}>
                            Delivery Boy
                          </option>
                        )}
                        {!(UserRole as any).DELIVERY_BOY &&
                          (UserRole as any).DELIVERY && (
                            <option value={(UserRole as any).DELIVERY}>
                              Delivery Boy
                            </option>
                          )}
                      </>
                    ) : (
                      <>
                        <option value={UserRole.MANAGER}>Manager</option>
                        <option value={UserRole.OUTLET_OWNER}>
                          Outlet Owner
                        </option>
                        <option value={UserRole.SUPER_ADMIN}>
                          Super Admin
                        </option>
                        {(UserRole as any).DELIVERY_BOY && (
                          <option value={(UserRole as any).DELIVERY_BOY}>
                            Delivery Boy
                          </option>
                        )}
                        {!(UserRole as any).DELIVERY_BOY &&
                          (UserRole as any).DELIVERY && (
                            <option value={(UserRole as any).DELIVERY}>
                              Delivery Boy
                            </option>
                          )}
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                    Outlet
                  </label>
                  <select
                    value={userForm.outletId}
                    onChange={(e) =>
                      setUserForm((p) => ({ ...p, outletId: e.target.value }))
                    }
                    className="w-full p-5 bg-gray-50 rounded-2xl font-bold outline-none"
                  >
                    <option value="all">All Outlets</option>
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ✅ WORKING PERMISSIONS */}
              <div className="pt-8 border-t border-gray-100">
                <label className="text-[11px] font-black uppercase text-gray-900 mb-6 block tracking-[0.3em] text-center">
                  Sanctuary Powers & Privileges
                </label>

                <div className="space-y-4">
                  {PERMISSION_KEYS.map((key) => {
                    const isOn = !!userForm.permissions?.[key];

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all"
                      >
                        <div className="flex-1">
                          <p className="text-[10px] font-black uppercase text-gray-700 tracking-wider">
                            {permissionLabel(key)}
                          </p>
                        </div>

                        <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setUserForm((prev) => ({
                                ...prev,
                                permissions: {
                                  ...normalizePermissions(prev.permissions),
                                  [key]: true,
                                },
                              }))
                            }
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                              isOn
                                ? "bg-[#C0392B] text-white shadow-lg"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            Grant
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setUserForm((prev) => ({
                                ...prev,
                                permissions: {
                                  ...normalizePermissions(prev.permissions),
                                  [key]: false,
                                },
                              }))
                            }
                            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                              !isOn
                                ? "bg-black text-white shadow-lg"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 py-5 bg-[#C0392B] text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl border-2 border-[#FFB30E]"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="px-8 py-5 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase text-[10px]"
              >
                Cancel
              </button>
            </div>
          </form>
        </ModalShell>
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
          globalSettings={globalSettings}
          onSave={async (invoice: any) => {
            await FirestoreDB.saveManualInvoice(invoice);
            setIsManualInvoiceModalOpen(false);
            const fresh = await FirestoreDB.getManualInvoices();
            setManualInvoices(fresh || []);
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;

/* -------------------- SUB COMPONENTS -------------------- */

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

    <div className="bg-white rounded-[50px] p-10 md:p-14 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-2xl font-playfair font-bold text-gray-900">
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
            className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold shadow-sm outline-none"
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
            className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold shadow-sm outline-none"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>

          <button
            onClick={handleDownloadCSV}
            className="bg-[#C0392B] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-black transition-all"
          >
            Export
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
              <div
                className="w-full max-w-[35px] bg-gradient-to-t from-[#C0392B] to-[#E74C3C] rounded-t-xl transition-all duration-700 ease-out shadow-lg"
                style={{ height: `${Math.max(height, d.value > 0 ? 2 : 0)}%` }}
              />
              <p className="mt-4 text-[9px] font-black uppercase text-gray-400 tracking-widest">
                {d.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const OrderTab: React.FC<{
  selectedOutlet: string;
  orders: Order[];
  onUpdateStatus: (order: Order, status: OrderStatus) => void;
}> = ({ selectedOutlet, orders, onUpdateStatus }) => {
  const live = orders
    .filter(
      (o) =>
        o.status !== OrderStatus.DELIVERED &&
        o.status !== OrderStatus.REJECTED &&
        (selectedOutlet === "all" || o.outletId === selectedOutlet)
    )
    .sort((a: any, b: any) => Number(b.timestamp) - Number(a.timestamp));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {live.map((order) => (
        <div
          key={order.id}
          className="bg-white p-10 rounded-[50px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all"
        >
          <div className="flex justify-between mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C0392B] bg-red-50 px-4 py-1.5 rounded-xl">
              {order.status}
            </span>
            <span className="text-xl font-black text-gray-900 tabular-nums">
              ₹{Number(order.total).toFixed(0)}
            </span>
          </div>

          <h4 className="text-2xl font-bold text-gray-800 mb-2 truncate">
            {order.customerName}
          </h4>

          <div className="text-xs text-gray-500 mb-6">
            {order.items?.slice(0, 3).map((i: any, idx: number) => (
              <div key={idx} className="flex justify-between">
                <span className="truncate">
                  {i.quantity}x {i.name} ({i.variant})
                </span>
                <span>₹{(i.price * i.quantity).toFixed(0)}</span>
              </div>
            ))}
            {order.items?.length > 3 && (
              <div className="text-[10px] text-gray-400 mt-2">
                +{order.items.length - 3} more items
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-50">
            {order.status === OrderStatus.PENDING && (
              <button
                onClick={() => onUpdateStatus(order, OrderStatus.ACCEPTED)}
                className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg"
              >
                Accept
              </button>
            )}

            {order.status === OrderStatus.ACCEPTED && (
              <button
                onClick={() => onUpdateStatus(order, OrderStatus.PREPARING)}
                className="flex-1 py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg"
              >
                Start Prep
              </button>
            )}

            {order.status === OrderStatus.PREPARING && (
              <button
                onClick={() => onUpdateStatus(order, OrderStatus.READY)}
                className="flex-1 py-4 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg"
              >
                Ready
              </button>
            )}

            {order.status === OrderStatus.READY && (
              <button
                onClick={() =>
                  onUpdateStatus(order, OrderStatus.OUT_FOR_DELIVERY)
                }
                className="flex-1 py-4 bg-purple-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg"
              >
                Hand Over
              </button>
            )}

            {order.status === OrderStatus.OUT_FOR_DELIVERY && (
              <button
                onClick={() => onUpdateStatus(order, OrderStatus.DELIVERED)}
                className="flex-1 py-4 bg-[#C0392B] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg"
              >
                Delivered
              </button>
            )}

            <button
              onClick={() => onUpdateStatus(order, OrderStatus.REJECTED)}
              className="px-6 py-4 bg-gray-50 text-red-500 rounded-2xl text-[10px] font-black hover:bg-red-50"
            >
              Reject
            </button>
          </div>
        </div>
      ))}

      {live.length === 0 && (
        <div className="col-span-full py-40 text-center bg-gray-50/50 rounded-[50px] border border-dashed border-gray-200">
          <div className="text-6xl mb-6 opacity-20">📜</div>
          <p className="text-gray-400 font-black uppercase tracking-[0.4em] text-[10px]">
            No Live Orders
          </p>
        </div>
      )}
    </div>
  );
};

const MenuTab: React.FC<any> = ({
  selectedOutlet,
  menu,
  outlets,
  categories,
  onAdd,
  onEdit,
  onDelete,
  onAddCategory,
}) => {
  const sorted = useMemo(
    () => [...menu].sort((a, b) => b.id.localeCompare(a.id)),
    [menu]
  );

  return (
    <div className="bg-white rounded-[50px] p-12 border border-gray-100 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
          <h3 className="text-4xl font-playfair font-bold text-gray-900">
            Menu
          </h3>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
            Manage dishes
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onAddCategory}
            className="px-8 py-3 border-2 border-gray-100 rounded-2xl font-black uppercase text-[10px] text-gray-400 hover:bg-gray-50 transition-all tracking-widest"
          >
            + Category
          </button>
          <button
            onClick={onAdd}
            className="bg-[#C0392B] text-white px-10 py-3 rounded-2xl font-black uppercase text-[10px] shadow-xl border-2 border-[#FFB30E] hover:bg-black transition-all tracking-widest"
          >
            + New Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {sorted
          .filter(
            (m: any) =>
              selectedOutlet === "all" ||
              m.outletId === selectedOutlet ||
              m.outletId === "all"
          )
          .map((item: MenuItem) => (
            <div
              key={item.id}
              className="bg-white border border-gray-50 rounded-[45px] p-10 hover:shadow-2xl transition-all"
            >
              <div className="aspect-video mb-8 overflow-hidden rounded-[35px] shadow-sm bg-gray-50 relative">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/400x300?text=No+Image";
                  }}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000"
                />
                <button
                  onClick={() => onDelete(item.id)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-red-500"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>

              <div className="flex items-center justify-between mb-2">
                <h4 className="text-2xl font-bold font-playfair text-gray-900">
                  {item.name}
                </h4>
                <span
                  className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-xl ${
                    item.isAvailable
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {item.isAvailable ? "Available" : "Hidden"}
                </span>
              </div>

              <p className="text-[10px] font-black uppercase text-gray-300 tracking-[0.2em] mb-10">
                {item.category}
              </p>

              <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                <span className="text-2xl font-black text-gray-900 tabular-nums">
                  ₹{item.price.full}
                </span>
                <button
                  onClick={() => onEdit(item)}
                  className="px-6 py-2.5 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase hover:bg-gray-900 hover:text-white transition-all tracking-widest"
                >
                  Edit
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
  outlets,
  onAdd,
  onEdit,
  onDelete,
}) => (
  <div className="bg-white rounded-[40px] p-10 md:p-14 border border-gray-100 shadow-sm">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
      <div>
        <h3 className="text-4xl font-playfair font-bold text-gray-800">
          Inventory
        </h3>
        <p className="text-[10px] font-black uppercase text-[#C0392B] tracking-[0.3em] mt-2">
          Stock Monitor
        </p>
      </div>
      <button
        onClick={onAdd}
        className="bg-[#C0392B] text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] shadow-xl border-2 border-[#FFB30E] hover:bg-black transition-all tracking-widest"
      >
        + Add Inventory
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {inventory
        .filter(
          (i: any) =>
            selectedOutlet === "all" ||
            i.outletId === selectedOutlet ||
            i.outletId === "all"
        )
        .map((item: InventoryItem) => (
          <div
            key={item.id}
            className="relative bg-white rounded-[45px] p-10 border border-gray-100 shadow-sm hover:shadow-2xl transition-all"
          >
            <button
              onClick={() => onDelete(item.id)}
              className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-400 shadow hover:bg-red-500 hover:text-white"
              title="Delete"
            >
              🗑️
            </button>

            <h4 className="text-2xl font-playfair font-bold text-gray-800 mb-2">
              {item.name}
            </h4>
            <p className="text-[8px] font-black uppercase text-gray-300 tracking-widest mb-8">
              {item.outletId === "all"
                ? "All Outlets"
                : outlets.find((o: any) => o.id === item.outletId)?.name || ""}
            </p>

            <div className="flex items-center justify-between mb-8">
              <span className="text-6xl font-playfair font-black text-gray-900 tabular-nums">
                {item.stock}
              </span>
              <button
                onClick={() => onEdit(item)}
                className="px-5 py-2.5 bg-gray-50 hover:bg-red-50 text-[10px] font-black uppercase text-[#C0392B] rounded-2xl shadow-sm transition-all tracking-widest"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
    </div>
  </div>
);

const OutletTab: React.FC<any> = ({
  user,
  outlets,
  onAdd,
  onEdit,
  onDelete,
}) => (
  <div className="bg-white rounded-[40px] p-10 md:p-14 border border-gray-100 shadow-sm">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
      <div>
        <h3 className="text-4xl font-playfair font-bold text-gray-800">
          Outlets
        </h3>
        <p className="text-[10px] font-black uppercase text-[#C0392B] tracking-[0.3em] mt-2">
          Outlet Management
        </p>
      </div>
      <button
        onClick={onAdd}
        className="bg-[#C0392B] text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] shadow-xl border-2 border-[#FFB30E] hover:bg-black transition-all tracking-widest"
      >
        + Add Outlet
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {outlets.map((o: Outlet) => (
        <div
          key={o.id}
          className="bg-white border border-gray-100 rounded-[45px] p-8 hover:shadow-2xl transition-all"
        >
          <div className="aspect-video mb-6 overflow-hidden rounded-[35px] shadow-sm bg-gray-50 relative">
            <img
              src={o.imageUrl}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000"
            />
            <div className="absolute top-4 left-4">
              <span
                className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                  (o as any).isActive
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-400 text-white"
                }`}
              >
                {(o as any).isActive ? "Active" : "Closed"}
              </span>
            </div>
          </div>

          <h4 className="text-2xl font-bold font-playfair text-gray-900 mb-2">
            {o.name}
          </h4>
          <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest mb-6 truncate">
            {o.address}
          </p>

          <div className="flex gap-4 pt-6 border-t border-gray-50">
            <button
              onClick={() => onEdit(o)}
              className="flex-1 py-3 bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase hover:bg-gray-900 hover:text-white transition-all"
            >
              Edit
            </button>

            {user.role === UserRole.SUPER_ADMIN && (
              <button
                onClick={() => onDelete(o.id)}
                className="px-5 py-3 text-red-400 hover:text-red-600 transition-colors"
                title="Delete"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const HistoryTab: React.FC<{
  selectedOutlet: string;
  orders: Order[];
  historyPage: number;
  setHistoryPage: (page: number) => void;
  historyDateFilter: string;
  setHistoryDateFilter: (date: string) => void;
}> = ({
  selectedOutlet,
  orders,
  historyPage,
  setHistoryPage,
  historyDateFilter,
  setHistoryDateFilter,
}) => {
  const filteredOrders = orders
    .filter(
      (o: any) =>
        o.status === OrderStatus.DELIVERED || o.status === OrderStatus.REJECTED
    )
    .filter(
      (o: any) => selectedOutlet === "all" || o.outletId === selectedOutlet
    )
    .filter((o: any) => {
      if (!historyDateFilter) return true;
      const orderDate = new Date(o.timestamp).toDateString();
      const filterDate = new Date(historyDateFilter).toDateString();
      return orderDate === filterDate;
    })
    .sort((a: any, b: any) => Number(b.timestamp) - Number(a.timestamp));

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (historyPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset page when filter changes
  React.useEffect(() => {
    setHistoryPage(1);
  }, [historyDateFilter, setHistoryPage]);

  return (
    <div className="bg-white rounded-[40px] p-10 md:p-14 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-12">
        <h3 className="text-4xl font-playfair font-bold text-gray-800">
          Order History
        </h3>
        <div className="flex gap-4 items-center">
          <input
            type="date"
            value={historyDateFilter}
            onChange={(e) => setHistoryDateFilter(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold shadow-sm outline-none"
          />
          {historyDateFilter && (
            <button
              onClick={() => setHistoryDateFilter("")}
              className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="space-y-6">
        {paginatedOrders.map((order: any) => (
          <div
            key={order.id}
            className="bg-gray-50 p-8 rounded-[40px] flex justify-between items-center"
          >
            <div>
              <h4 className="text-xl font-bold text-gray-900">
                {order.customerName}
              </h4>
              <p className="text-[10px] font-mono text-gray-400 font-bold">
                #{order.id}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-gray-900 tabular-nums">
                ₹{Number(order.total).toFixed(0)}
              </p>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                {order.paymentMethod} •{" "}
                {new Date(order.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => setHistoryPage(Math.max(1, historyPage - 1))}
            disabled={historyPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {historyPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setHistoryPage(Math.min(totalPages, historyPage + 1))
            }
            disabled={historyPage === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const BillingTab: React.FC<{
  selectedOutlet: string;
  orders: Order[];
  manualInvoices: ManualInvoice[];
  outlets: Outlet[];
  globalSettings: GlobalSettings;
  billingPage: number;
  setBillingPage: (page: number) => void;
  billingDateFilter: string;
  setBillingDateFilter: (date: string) => void;
  billingCategoryFilter: string;
  setBillingCategoryFilter: (filter: string) => void;
  onCreateManualInvoice: () => void;
}> = ({
  selectedOutlet,
  orders,
  manualInvoices,
  outlets,
  globalSettings,
  billingPage,
  setBillingPage,
  billingDateFilter,
  setBillingDateFilter,
  billingCategoryFilter,
  setBillingCategoryFilter,
  onCreateManualInvoice,
}) => {
  const allInvoices = [
    ...orders.map((o: any) => ({ ...o, type: "AUTO" })),
    ...manualInvoices.map((i: any) => ({ ...i, type: "MANUAL" })),
  ];

  const filteredInvoices = allInvoices
    .filter((i) => selectedOutlet === "all" || i.outletId === selectedOutlet)
    .filter((i) => {
      if (!billingDateFilter) return true;
      const invoiceDate = new Date(i.timestamp).toDateString();
      const filterDate = new Date(billingDateFilter).toDateString();
      return invoiceDate === filterDate;
    })
    .filter((i) => {
      if (billingCategoryFilter === "all") return true;
      return i.type === billingCategoryFilter;
    })
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (billingPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset page when filters change
  React.useEffect(() => {
    setBillingPage(1);
  }, [
    billingDateFilter,
    billingCategoryFilter,
    selectedOutlet,
    setBillingPage,
  ]);

  const handlePrintInvoice = (inv: any) => {
    const outlet = outlets.find((o: any) => o.id === inv.outletId);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${inv.id}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .details { margin-bottom: 20px; }
              .items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .total { text-align: right; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Havens Kitchen Invoice</h1>
              <p>Invoice ID: ${inv.id}</p>
            </div>
            <div class="details">
              <p><strong>Customer:</strong> ${inv.customerName}</p>
              <p><strong>Outlet:</strong> ${outlet?.name || "N/A"}</p>
              <p><strong>Date:</strong> ${new Date(
                inv.timestamp
              ).toLocaleString()}</p>
              <p><strong>Payment Method:</strong> ${inv.paymentMethod}</p>
            </div>
            <table class="items">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${
                  inv.items
                    ?.map(
                      (item: any) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price}</td>
                    <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `
                    )
                    .join("") || ""
                }
              </tbody>
            </table>
            <div class="total">
              <p>Subtotal: ₹${inv.subtotal?.toFixed(2) || inv.total}</p>
              <p>Tax: ₹${inv.tax?.toFixed(2) || 0}</p>
              <p>Delivery: ₹${inv.deliveryCharge?.toFixed(2) || 0}</p>
              <p>Total: ₹${inv.total}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadInvoice = (inv: any) => {
    const outlet = outlets.find((o: any) => o.id === inv.outletId);
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${inv.id} - Havens Kitchen</title>
          <style>
            body { font-family: 'Times New Roman', serif; margin: 0; padding: 20px; background: white; }
            .invoice-header { text-align: center; border-bottom: 2px solid #C0392B; padding-bottom: 20px; margin-bottom: 30px; }
            .invoice-header h1 { color: #C0392B; margin: 0; font-size: 28px; }
            .invoice-header p { margin: 5px 0; font-size: 14px; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .detail-section { flex: 1; }
            .detail-section h3 { margin-top: 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .items-table th { background-color: #f5f5f5; font-weight: bold; }
            .items-table .text-right { text-align: right; }
            .totals { text-align: right; margin-top: 20px; }
            .totals p { margin: 5px 0; font-size: 16px; }
            .totals .grand-total { font-size: 20px; font-weight: bold; color: #C0392B; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <h1>Havens Kitchen</h1>
            <p>Established 1984 • Culinary Sanctuary</p>
            <p>Invoice #${inv.id}</p>
          </div>
          
          <div class="invoice-details">
            <div class="detail-section">
              <h3>Bill To:</h3>
              <p><strong>${inv.customerName}</strong></p>
              <p>${inv.customerPhone || ""}</p>
              <p>${inv.address || ""}</p>
            </div>
            <div class="detail-section">
              <h3>Invoice Details:</h3>
              <p><strong>Date:</strong> ${new Date(
                inv.timestamp
              ).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${new Date(
                inv.timestamp
              ).toLocaleTimeString()}</p>
              <p><strong>Outlet:</strong> ${outlet?.name || "N/A"}</p>
              <p><strong>Payment:</strong> ${inv.paymentMethod}</p>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Rate</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${
                inv.items
                  ?.map(
                    (item: any) => `
                <tr>
                  <td>${item.name}${
                      item.variant ? ` (${item.variant})` : ""
                    }</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.price.toFixed(2)}</td>
                  <td class="text-right">₹${(
                    item.price * item.quantity
                  ).toFixed(2)}</td>
                </tr>
              `
                  )
                  .join("") || ""
              }
            </tbody>
          </table>
          
          <div class="totals">
            <p>Subtotal: ₹${
              inv.subtotal?.toFixed(2) ||
              (inv.total - (inv.tax || 0) - (inv.deliveryCharge || 0)).toFixed(
                2
              )
            }</p>
            ${
              inv.tax
                ? `<p>Tax (${
                    globalSettings.gstPercentage
                  }%): ₹${inv.tax.toFixed(2)}</p>`
                : ""
            }
            ${
              inv.deliveryCharge
                ? `<p>Delivery Charge: ₹${inv.deliveryCharge.toFixed(2)}</p>`
                : ""
            }
            <p class="grand-total">Total: ₹${inv.total.toFixed(2)}</p>
          </div>
          
          <div class="footer">
            <p>Thank you for dining with us!</p>
            <p>HQ - South Delhi, India | Contact: 9899466466</p>
          </div>
        </body>
      </html>
    `;

    // Create a temporary element to hold the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = invoiceHTML;
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    document.body.appendChild(tempDiv);

    // Configure html2pdf options
    const options = {
      margin: 0.5,
      filename: `invoice_${inv.id}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: {
        unit: "in" as const,
        format: "a4" as const,
        orientation: "portrait" as const,
      },
    };

    // Generate and download PDF
    html2pdf()
      .set(options)
      .from(tempDiv)
      .save()
      .then(() => {
        // Clean up
        document.body.removeChild(tempDiv);
      });
  };

  return (
    <div className="bg-white rounded-[40px] p-10 md:p-14 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-start mb-12 gap-6">
        <div>
          <h3 className="text-4xl font-playfair font-bold text-gray-900">
            Billing
          </h3>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
            Invoices & Sales
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <select
            value={billingCategoryFilter}
            onChange={(e) => setBillingCategoryFilter(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold shadow-sm outline-none"
          >
            <option value="all">All Orders</option>
            <option value="AUTO">Online Orders</option>
            <option value="MANUAL">Manual Orders</option>
          </select>
          <input
            type="date"
            value={billingDateFilter}
            onChange={(e) => setBillingDateFilter(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold shadow-sm outline-none"
          />
          {billingDateFilter && (
            <button
              onClick={() => setBillingDateFilter("")}
              className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-600"
            >
              Clear
            </button>
          )}
          <button
            onClick={onCreateManualInvoice}
            className="bg-[#C0392B] text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] shadow-xl border-2 border-[#FFB30E] hover:bg-black transition-all"
          >
            + Manual Invoice
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {paginatedInvoices.map((inv) => (
          <div
            key={inv.id}
            className="flex justify-between items-center p-8 bg-gray-50 rounded-[35px]"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-xl font-bold text-gray-800">
                  {inv.customerName}
                </h4>
                {inv.type === "AUTO" && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold uppercase">
                    Online
                  </span>
                )}
                {inv.type === "MANUAL" && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold uppercase">
                    Manual
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                {new Date(inv.timestamp).toLocaleString()} •{" "}
                {outlets.find((o: any) => o.id === inv.outletId)?.name}
              </p>
            </div>
            <div className="text-right flex items-center gap-4">
              <div>
                <p className="text-2xl font-black text-gray-900 tabular-nums">
                  ₹{Number(inv.total).toFixed(0)}
                </p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  {inv.paymentMethod}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadInvoice(inv)}
                  className="px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600"
                >
                  Download
                </button>
                <button
                  onClick={() => handlePrintInvoice(inv)}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => setBillingPage(Math.max(1, billingPage - 1))}
            disabled={billingPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {billingPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setBillingPage(Math.min(totalPages, billingPage + 1))
            }
            disabled={billingPage === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const SettingsTab: React.FC<any> = ({
  globalSettings,
  setGlobalSettings,
  onSave,
}) => {
  const addDeliveryTier = () => {
    const newTier = {
      id: Date.now().toString(),
      upToKm: 5,
      charge: 40,
    };
    setGlobalSettings({
      ...globalSettings,
      deliveryTiers: [...globalSettings.deliveryTiers, newTier],
    });
  };

  const updateDeliveryTier = (id: string, field: string, value: number) => {
    setGlobalSettings({
      ...globalSettings,
      deliveryTiers: globalSettings.deliveryTiers.map((tier) =>
        tier.id === id ? { ...tier, [field]: value } : tier
      ),
    });
  };

  const removeDeliveryTier = (id: string) => {
    setGlobalSettings({
      ...globalSettings,
      deliveryTiers: globalSettings.deliveryTiers.filter(
        (tier) => tier.id !== id
      ),
    });
  };

  return (
    <div className="bg-white rounded-[50px] p-12 border border-gray-100 shadow-sm max-w-4xl mx-auto">
      <h3 className="text-3xl font-playfair font-bold mb-8">Settings</h3>

      <form onSubmit={onSave} className="space-y-8">
        <div>
          <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
            GST (%)
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
            className="w-full p-5 bg-gray-50 rounded-2xl font-bold outline-none text-xl text-center"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
              Free Delivery Threshold (₹)
            </label>
            <input
              type="number"
              value={globalSettings.freeDeliveryThreshold}
              onChange={(e) =>
                setGlobalSettings({
                  ...globalSettings,
                  freeDeliveryThreshold: Number(e.target.value),
                })
              }
              className="w-full p-5 bg-gray-50 rounded-2xl font-bold outline-none text-xl text-center"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
              Free Delivery Distance Limit (km)
            </label>
            <input
              type="number"
              step="0.1"
              value={globalSettings.freeDeliveryDistanceLimit}
              onChange={(e) =>
                setGlobalSettings({
                  ...globalSettings,
                  freeDeliveryDistanceLimit: Number(e.target.value),
                })
              }
              className="w-full p-5 bg-gray-50 rounded-2xl font-bold outline-none text-xl text-center"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
              Delivery Tiers (Distance-based Charges)
            </label>
            <button
              type="button"
              onClick={addDeliveryTier}
              className="bg-[#C0392B] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600"
            >
              + Add Tier
            </button>
          </div>
          <div className="space-y-3">
            {globalSettings.deliveryTiers
              .sort((a, b) => a.upToKm - b.upToKm)
              .map((tier, index) => (
                <div
                  key={tier.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl"
                >
                  <div className="flex-1">
                    <label className="text-[9px] font-black uppercase text-gray-500 mb-1 block tracking-widest">
                      Up to {index === 0 ? "" : "Next"} {tier.upToKm} km
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[8px] font-bold uppercase text-gray-400 mb-1 block">
                          Distance (km)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={tier.upToKm}
                          onChange={(e) =>
                            updateDeliveryTier(
                              tier.id,
                              "upToKm",
                              Number(e.target.value)
                            )
                          }
                          className="w-full p-3 bg-white rounded-xl font-bold text-center text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-bold uppercase text-gray-400 mb-1 block">
                          Charge (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={tier.charge}
                          onChange={(e) =>
                            updateDeliveryTier(
                              tier.id,
                              "charge",
                              Number(e.target.value)
                            )
                          }
                          className="w-full p-3 bg-white rounded-xl font-bold text-center text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDeliveryTier(tier.id)}
                    className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
          </div>
          {globalSettings.deliveryTiers.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">
              No delivery tiers configured. Add tiers to set distance-based
              delivery charges.
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-6 bg-gray-900 text-white rounded-[32px] font-black uppercase text-xs shadow-2xl border-2 border-[#FFB30E] hover:bg-black transition-all tracking-widest"
        >
          Save
        </button>
      </form>
    </div>
  );
};

const UsersTab: React.FC<any> = ({
  user,
  outlets,
  staffUsers,
  onAdd,
  onEdit,
  onDelete,
}) => (
  <div className="bg-white rounded-[40px] p-10 md:p-14 border border-gray-100 shadow-sm">
    <div className="flex justify-between items-start mb-12 gap-6">
      <h3 className="text-4xl font-playfair font-bold text-gray-800">Staff</h3>

      <button
        onClick={onAdd}
        className="bg-[#C0392B] text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] shadow-xl border-2 border-[#FFB30E] hover:bg-black transition-all"
      >
        + Add Staff
      </button>
    </div>

    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-50">
            <th className="py-4 px-4 text-[10px] font-black uppercase text-gray-400">
              Name
            </th>
            <th className="py-4 px-4 text-[10px] font-black uppercase text-gray-400">
              Role
            </th>
            <th className="py-4 px-4 text-[10px] font-black uppercase text-gray-400">
              Outlet
            </th>
            <th className="py-4 px-4"></th>
          </tr>
        </thead>

        <tbody>
          {staffUsers.map((u: any) => (
            <tr
              key={u.id}
              className="border-b border-gray-50 hover:bg-gray-50/50"
            >
              <td className="py-6 px-4">
                <p className="font-bold text-sm text-gray-900">{u.name}</p>
                <p className="text-[10px] font-medium text-gray-400">
                  {u.email}
                </p>
              </td>
              <td className="py-6 px-4">
                <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  {u.role}
                </span>
              </td>
              <td className="py-6 px-4 text-xs font-bold text-gray-600">
                {u.outletId === "all"
                  ? "Universal"
                  : outlets.find((o: any) => o.id === u.outletId)?.name}
              </td>
              <td className="py-6 px-4 text-right">
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => onEdit(u)}
                    className="text-[#C0392B] text-[10px] font-black uppercase hover:underline opacity-60 hover:opacity-100"
                  >
                    Edit
                  </button>
                  {u.id !== user.id && (
                    <button
                      onClick={() => onDelete(u.id, u.role, u.outletId)}
                      className="text-red-500 text-[10px] font-black uppercase hover:underline opacity-40 hover:opacity-100"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {staffUsers.length === 0 && (
            <tr>
              <td
                colSpan={4}
                className="py-16 text-center text-gray-400 font-bold"
              >
                No staff users
              </td>
            </tr>
          )}
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
  globalSettings,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    customerName: "",
    outletId: selectedOutletId,
    paymentMethod: "CASH" as any,
  });

  const [distanceKm, setDistanceKm] = useState<number>(0);

  useEffect(() => {
    setFormData((p) => ({ ...p, outletId: selectedOutletId }));
  }, [selectedOutletId]);

  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [search, setSearch] = useState("");

  const subtotal = selectedItems.reduce(
    (sum, i: any) => sum + i.price * i.quantity,
    0
  );
  const tax = subtotal * (gstPercentage / 100);
  const deliveryCharge = calculateDeliveryCharge(
    distanceKm,
    subtotal,
    globalSettings
  );
  const total = subtotal + tax + deliveryCharge;

  const addItem = (
    item: MenuItem,
    variant: "full" | "half" | "qtr" = "full"
  ) => {
    const price = (item.price as any)[variant] || item.price.full;
    setSelectedItems((prev: any[]) => {
      const existing = prev.find(
        (i) => i.menuItemId === item.id && i.variant === variant
      );
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id && i.variant === variant
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        { menuItemId: item.id, name: item.name, variant, price, quantity: 1 },
      ];
    });
  };

  const removeItem = (id: string, variant: string) => {
    setSelectedItems((prev: any[]) =>
      prev
        .map((i) =>
          i.menuItemId === id && i.variant === variant
            ? { ...i, quantity: i.quantity - 1 }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  if (!isOpen) return null;

  return (
    <ModalShell onClose={onClose}>
      <div className="relative w-full max-w-7xl bg-white rounded-[60px] shadow-2xl p-10 md:p-14 flex flex-col md:flex-row gap-12 max-h-[90vh] overflow-hidden border border-gray-100">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-8">
            <h3 className="text-4xl font-playfair font-bold text-gray-900">
              Manual Invoice
            </h3>
          </div>

          <div className="bg-gray-50 p-8 rounded-[40px] mb-8 border border-gray-100 flex flex-col gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                Customer
              </label>
              <input
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
                className="w-full p-5 bg-white rounded-2xl font-bold outline-none"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={formData.outletId}
                onChange={(e) =>
                  setFormData({ ...formData, outletId: e.target.value })
                }
                className="bg-white border border-gray-100 rounded-2xl px-5 py-3 text-xs font-bold"
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
                className="bg-white border border-gray-100 rounded-2xl px-5 py-3 text-xs font-bold"
              >
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
                <option value="CARD">CARD</option>
                <option value="COD">COD</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
                Distance (km)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value) || 0)}
                className="w-full p-5 bg-white rounded-2xl font-bold outline-none"
                placeholder="Enter delivery distance"
              />
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu..."
              className="w-full p-5 bg-white rounded-2xl font-bold outline-none"
            />
          </div>

          <div className="flex-grow overflow-y-auto pr-2 space-y-4 no-scrollbar">
            {menu
              .filter((m: any) => m.outletId === formData.outletId)
              .filter((m: any) =>
                m.name.toLowerCase().includes(search.toLowerCase())
              )
              .map((m: any) => (
                <div
                  key={m.id}
                  className="p-5 bg-white border border-gray-100 rounded-[25px] flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold">{m.name}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                      {m.category}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {(["full", "half", "qtr"] as const).map(
                      (v) =>
                        m.price[v] && (
                          <button
                            key={v}
                            onClick={() => addItem(m, v)}
                            className="px-4 py-2 bg-gray-900 text-white text-[9px] font-black uppercase rounded-xl hover:bg-[#C0392B]"
                          >
                            ADD {v.toUpperCase()}
                          </button>
                        )
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="w-full md:w-[420px] bg-gray-50 rounded-[50px] p-10 flex flex-col border border-gray-100">
          <div className="flex-grow overflow-y-auto space-y-4 no-scrollbar mb-8 pr-2">
            {selectedItems.map((item: any) => (
              <div
                key={`${item.menuItemId}-${item.variant}`}
                className="bg-white p-5 rounded-[22px] border border-gray-100 flex justify-between items-center"
              >
                <div>
                  <p className="font-black text-sm">{item.name}</p>
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                    {item.variant.toUpperCase()} • ₹{item.price} ×{" "}
                    {item.quantity}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.menuItemId, item.variant)}
                  className="w-10 h-10 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white"
                >
                  −
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-dashed border-gray-200 pt-6">
            <div className="flex justify-between text-[11px] font-black uppercase text-gray-400 tracking-widest">
              <span>SUBTOTAL</span>
              <span>₹{subtotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-black uppercase text-gray-400 tracking-widest">
              <span>GST ({gstPercentage}%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-black uppercase text-gray-400 tracking-widest">
              <span>DELIVERY ({distanceKm}km)</span>
              <span>₹{deliveryCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-3xl font-playfair font-black pt-3 border-t border-gray-100 text-gray-900">
              <span>TOTAL</span>
              <span className="text-[#C0392B]">₹{total.toFixed(0)}</span>
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
                deliveryCharge,
                total,
                timestamp: Date.now(),
              })
            }
            className="w-full py-5 bg-gray-900 text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.25em] mt-8 hover:bg-[#C0392B] disabled:opacity-30"
          >
            Finalize
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

const StatCard: React.FC<{
  label: string;
  value: any;
  icon: string;
  color: "emerald" | "orange" | "red" | "blue";
}> = ({ label, value, icon, color }) => (
  <div className="bg-white p-12 rounded-[60px] shadow-sm border border-gray-100 hover:shadow-2xl transition-all">
    <div
      className={`w-20 h-20 rounded-[30px] ${statBgMap[color]} flex items-center justify-center text-4xl mb-10 shadow-inner`}
    >
      {icon}
    </div>
    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2">
      {label}
    </h4>
    <p className="text-6xl font-playfair font-black text-gray-900 tracking-tighter">
      {value}
    </p>
  </div>
);

const ModalShell: React.FC<{
  onClose: () => void;
  children: React.ReactNode;
}> = ({ onClose, children }) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
    <div
      className="absolute inset-0 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    />
    {children}
  </div>
);

const Input: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <div>
    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
      {label}
    </label>
    <input
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-5 bg-gray-50 rounded-2xl font-bold outline-none"
    />
  </div>
);

const NumberInput: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
}> = ({ label, value, onChange }) => (
  <div>
    <label className="text-[10px] font-black uppercase text-gray-400 mb-2 block tracking-widest">
      {label}
    </label>
    <input
      type="number"
      step="any"
      required
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full p-5 bg-gray-50 rounded-2xl font-bold outline-none"
    />
  </div>
);
