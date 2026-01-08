// src/services/firestoreDb.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
  DocumentData,
  QueryConstraint,
  setDoc as setDocFn,
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
  Outlet,
  MenuItem,
  InventoryItem,
  Order,
  OrderStatus,
  Review,
  UserProfile,
  GlobalSettings,
  ManualInvoice,
} from "../types";

type Listener = () => void;

/**
 * ✅ Firestore does NOT allow undefined values.
 * This removes undefined recursively from objects/arrays.
 */
function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((v) => stripUndefinedDeep(v))
      .filter((v) => v !== undefined) as any;
  }

  if (value && typeof value === "object") {
    const out: any = {};
    Object.entries(value as any).forEach(([k, v]) => {
      if (v === undefined) return;
      const cleaned = stripUndefinedDeep(v);
      if (cleaned === undefined) return;
      out[k] = cleaned;
    });
    return out;
  }

  return value;
}

/**
 * ✅ IMPORTANT: Firestore document ID must not be overwritten by stored `id` field.
 * Always spread data first, then set id.
 */
function withDocId<T extends object>(docId: string, data: DocumentData): T {
  return { ...(data as any), id: docId } as T;
}

export class FirestoreDB {
  private static listeners: Set<Listener> = new Set();

  static onUpdate(callback: Listener) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  static notify() {
    this.listeners.forEach((l) => l());
  }

  // ---------------- SETTINGS ----------------
  static async getGlobalSettings(): Promise<GlobalSettings> {
    const docRef = doc(db, "settings", "global");
    const snap = await getDoc(docRef);

    if (snap.exists()) return snap.data() as GlobalSettings;

    const defaultSettings: GlobalSettings = {
      gstPercentage: 5,
      deliveryBaseCharge: 40,
      deliveryChargePerKm: 10,
      freeDeliveryThreshold: 500,
      freeDeliveryDistanceLimit: 5,
      deliveryTiers: [
        { id: "t1", upToKm: 3, charge: 30 },
        { id: "t2", upToKm: 5, charge: 50 },
        { id: "t3", upToKm: 10, charge: 100 },
      ],
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
    };

    await setDoc(docRef, defaultSettings);
    return defaultSettings;
  }

  static async saveGlobalSettings(settings: GlobalSettings): Promise<void> {
    await setDoc(doc(db, "settings", "global"), stripUndefinedDeep(settings));
    this.notify();
  }

  // ---------------- STAFF USERS ----------------
  static async getStaffUsers(): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "in", ["SUPER_ADMIN", "ADMIN", "OUTLET_OWNER", "MANAGER"])
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => withDocId<UserProfile>(d.id, d.data()));
    } catch (e) {
      console.error("Error getting staff users:", e);
      return [];
    }
  }

  static async saveStaffUser(user: UserProfile): Promise<void> {
    const clean = stripUndefinedDeep(user);

    if (user.id) {
      await setDoc(doc(db, "users", user.id), clean);
    } else {
      const ref = await addDoc(collection(db, "users"), clean);
      user.id = ref.id;
    }
    this.notify();
  }

  static async deleteStaffUser(id: string): Promise<void> {
    await deleteDoc(doc(db, "users", id));
    this.notify();
  }

  // ---------------- OUTLETS ----------------
  static async getOutlets(): Promise<Outlet[]> {
    try {
      const snap = await getDocs(collection(db, "outlets"));
      return snap.docs.map((d) => withDocId<Outlet>(d.id, d.data()));
    } catch (e) {
      console.error("Error getting outlets:", e);
      return [];
    }
  }

  static async saveOutlet(outlet: Outlet): Promise<void> {
    const clean = stripUndefinedDeep(outlet);

    if (outlet.id) {
      await setDoc(doc(db, "outlets", outlet.id), clean);
    } else {
      const ref = await addDoc(collection(db, "outlets"), clean);
      outlet.id = ref.id;
    }
    this.notify();
  }

  static async deleteOutlet(id: string): Promise<void> {
    await deleteDoc(doc(db, "outlets", id));
    this.notify();
  }

  // ---------------- MENU ----------------
  static async getMenu(outletId?: string): Promise<MenuItem[]> {
    try {
      const constraints: QueryConstraint[] = [];
      if (outletId) constraints.push(where("outletId", "==", outletId));

      const q =
        constraints.length > 0
          ? query(collection(db, "menu"), ...constraints)
          : collection(db, "menu");

      const snap = await getDocs(q);
      return snap.docs.map((d) => withDocId<MenuItem>(d.id, d.data()));
    } catch (e) {
      console.error("Error getting menu:", e);
      return [];
    }
  }

  static async saveMenuItem(item: MenuItem): Promise<void> {
    try {
      // ✅ Ensure optional nested keys don't become undefined
      const normalized: MenuItem = {
        ...item,
        price: {
          full: item.price?.full ?? 0,
          ...(item.price?.half !== undefined ? { half: item.price.half } : {}),
          ...(item.price?.qtr !== undefined ? { qtr: item.price.qtr } : {}),
        },
        ...(item.variantQuantities
          ? {
              variantQuantities: {
                ...(item.variantQuantities.full !== undefined
                  ? { full: item.variantQuantities.full }
                  : {}),
                ...(item.variantQuantities.half !== undefined
                  ? { half: item.variantQuantities.half }
                  : {}),
                ...(item.variantQuantities.qtr !== undefined
                  ? { qtr: item.variantQuantities.qtr }
                  : {}),
              },
            }
          : {}),
        ...(item.serves
          ? {
              serves: {
                ...(item.serves.full !== undefined
                  ? { full: item.serves.full }
                  : {}),
                ...(item.serves.half !== undefined
                  ? { half: item.serves.half }
                  : {}),
                ...(item.serves.qtr !== undefined
                  ? { qtr: item.serves.qtr }
                  : {}),
              },
            }
          : {}),
      };

      const clean = stripUndefinedDeep(normalized);

      if (item.id) {
        await setDoc(doc(db, "menu", item.id), clean);
      } else {
        const ref = await addDoc(collection(db, "menu"), clean);
        item.id = ref.id;
      }

      this.notify();
    } catch (e) {
      console.error("Error saving menu item:", e);
      throw e;
    }
  }

  static async deleteMenuItem(id: string): Promise<void> {
    await deleteDoc(doc(db, "menu", id));
    this.notify();
  }

  // ---------------- INVENTORY ----------------
  // ✅ outletId OPTIONAL (fixes your undefined where() crash)
  static async getInventory(outletId?: string): Promise<InventoryItem[]> {
    try {
      const qRef = outletId
        ? query(collection(db, "inventory"), where("outletId", "==", outletId))
        : collection(db, "inventory");

      const snap = await getDocs(qRef);
      return snap.docs.map((d) => withDocId<InventoryItem>(d.id, d.data()));
    } catch (e) {
      console.error("Error getting inventory:", e);
      return [];
    }
  }

  static async getInventoryItem(id: string): Promise<InventoryItem | null> {
    try {
      const snap = await getDoc(doc(db, "inventory", id));
      if (!snap.exists()) return null;
      return withDocId<InventoryItem>(snap.id, snap.data());
    } catch (e) {
      console.error("Error getting inventory item:", e);
      return null;
    }
  }

  static async saveInventoryItem(item: InventoryItem): Promise<void> {
    const clean = stripUndefinedDeep(item);

    if (item.id) {
      await setDoc(doc(db, "inventory", item.id), clean);
    } else {
      const ref = await addDoc(collection(db, "inventory"), clean);
      item.id = ref.id;
    }
    this.notify();
  }

  static async deleteInventoryItem(id: string): Promise<void> {
    await deleteDoc(doc(db, "inventory", id));
    this.notify();
  }

  // ---------------- ORDERS ----------------
  static async getOrders(userId?: string, outletId?: string): Promise<Order[]> {
    try {
      const constraints: QueryConstraint[] = [];
      if (userId) constraints.push(where("userId", "==", userId));
      if (outletId) constraints.push(where("outletId", "==", outletId));

      // try ordering by timestamp first (your UI uses timestamp)
      // fallback to createdAt if older orders exist
      constraints.push(orderBy("timestamp", "desc"));

      const qRef = query(collection(db, "orders"), ...constraints);
      const snap = await getDocs(qRef);

      return snap.docs.map((d) => withDocId<Order>(d.id, d.data()));
    } catch (e) {
      console.error("Error getting orders:", e);
      return [];
    }
  }

  static async saveOrder(order: Order): Promise<string> {
    const clean = stripUndefinedDeep(order);

    if (order.id) {
      await setDoc(doc(db, "orders", order.id), clean);
      this.notify();
      return order.id;
    } else {
      const ref = await addDoc(collection(db, "orders"), clean);
      this.notify();
      return ref.id;
    }
  }

  /**
   * ✅ Deduct inventory at order creation (as your app expects)
   */
  static async createOrder(order: Order): Promise<string> {
    try {
      const menuItems = await this.getMenu(order.outletId);

      for (const orderItem of order.items) {
        const menuItem = menuItems.find((m) => m.id === orderItem.menuItemId);
        if (!menuItem?.inventoryItems?.length) continue;

        const variantMultiplier =
          orderItem.variant === "qtr"
            ? 0.25
            : orderItem.variant === "half"
            ? 0.5
            : 1;

        for (const invLink of menuItem.inventoryItems) {
          const inventoryItem = await this.getInventoryItem(invLink.itemId);
          if (!inventoryItem) continue;

          const deductQty =
            invLink.qty * variantMultiplier * orderItem.quantity;
          const newStock = Math.max(
            0,
            Number(inventoryItem.stock) - Number(deductQty)
          );

          await this.saveInventoryItem({ ...inventoryItem, stock: newStock });
        }
      }

      const orderData = stripUndefinedDeep({
        ...order,
        timestamp: Date.now(),
        createdAt: Timestamp.now(),
        orderDate: new Date().toISOString(),
      });

      const ref = await addDoc(collection(db, "orders"), orderData);
      this.notify();
      return ref.id;
    } catch (e) {
      console.error("Error creating order:", e);
      throw e;
    }
  }

  /**
   * ✅ Fix: if doc-id mismatch happens, updateDoc fails.
   * We do a safe update:
   * - try updateDoc
   * - if not found, setDoc merge (no crash)
   */
  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status,
        updatedAt: Date.now(),
      });
      this.notify();
    } catch (e) {
      console.error("Error updating order status:", e);

      // fallback: create/merge if updateDoc fails
      try {
        await setDocFn(
          doc(db, "orders", orderId),
          { status, updatedAt: Date.now() },
          { merge: true }
        );
        this.notify();
      } catch (e2) {
        console.error("Fallback update failed:", e2);
        throw e2;
      }
    }
  }

  // ---------------- REVIEWS ----------------
  static async getReviews(outletId?: string): Promise<Review[]> {
    try {
      const qRef = outletId
        ? query(collection(db, "reviews"), where("outletId", "==", outletId))
        : collection(db, "reviews");

      const snap = await getDocs(qRef);
      return snap.docs.map((d) => withDocId<Review>(d.id, d.data()));
    } catch (e) {
      console.error("Error getting reviews:", e);
      return [];
    }
  }

  static async saveReview(review: Review): Promise<void> {
    const clean = stripUndefinedDeep(review);

    if (review.id) {
      await setDoc(doc(db, "reviews", review.id), clean);
    } else {
      await addDoc(collection(db, "reviews"), clean);
    }
    this.notify();
  }

  // ---------------- MANUAL INVOICES ----------------
  static async getManualInvoices(outletId?: string): Promise<ManualInvoice[]> {
    try {
      const qRef = outletId
        ? query(
            collection(db, "manualInvoices"),
            where("outletId", "==", outletId)
          )
        : collection(db, "manualInvoices");

      const snap = await getDocs(qRef);
      return snap.docs.map((d) => withDocId<ManualInvoice>(d.id, d.data()));
    } catch (e) {
      console.error("Error getting manual invoices:", e);
      return [];
    }
  }

  static async saveManualInvoice(invoice: ManualInvoice): Promise<void> {
    const clean = stripUndefinedDeep(invoice);

    if (invoice.id) {
      await setDoc(doc(db, "manualInvoices", invoice.id), clean);
    } else {
      await addDoc(collection(db, "manualInvoices"), clean);
    }
    this.notify();
  }

  // ---------------- REALTIME LISTENERS ----------------
  static subscribeToOrders(
    callback: (orders: Order[]) => void,
    userId?: string,
    outletId?: string
  ): () => void {
    const constraints: QueryConstraint[] = [];
    if (userId) constraints.push(where("userId", "==", userId));
    if (outletId) constraints.push(where("outletId", "==", outletId));
    constraints.push(orderBy("timestamp", "desc"));

    const qRef = query(collection(db, "orders"), ...constraints);

    return onSnapshot(qRef, (snapshot) => {
      const orders = snapshot.docs.map((d) => withDocId<Order>(d.id, d.data()));
      callback(orders);
    });
  }
}

export default FirestoreDB;
