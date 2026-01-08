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
  Query,
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
 * ✅ Firestore doesn't allow undefined anywhere inside objects.
 * This removes undefined deeply (also removes empty objects/arrays if they become empty).
 */
function removeUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    const cleanedArr = value
      .map((v) => removeUndefinedDeep(v))
      .filter((v) => v !== undefined) as any;
    return cleanedArr as T;
  }

  if (value && typeof value === "object") {
    const obj: any = value;
    const cleaned: any = {};
    Object.keys(obj).forEach((k) => {
      const v = removeUndefinedDeep(obj[k]);
      if (v !== undefined) cleaned[k] = v;
    });
    return cleaned as T;
  }

  return value;
}

/**
 * ✅ IMPORTANT FIX:
 * When mapping firestore docs, ALWAYS do:
 *   { ...doc.data(), id: doc.id }
 * NOT:
 *   { id: doc.id, ...doc.data() }
 * Because your doc.data() has its own "id" field like "ord-xxxx"
 * which was overriding doc.id and breaking updateOrderStatus().
 */
function mapWithDocId<T>(snapDoc: { id: string; data: () => DocumentData }): T {
  return { ...(snapDoc.data() as any), id: snapDoc.id } as T;
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
    try {
      const docRef = doc(db, "settings", "global");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as GlobalSettings;
      }

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
    } catch (error) {
      console.error("Error getting global settings:", error);
      throw error;
    }
  }

  static async saveGlobalSettings(settings: GlobalSettings): Promise<void> {
    try {
      await setDoc(
        doc(db, "settings", "global"),
        removeUndefinedDeep(settings)
      );
      this.notify();
    } catch (error) {
      console.error("Error saving global settings:", error);
      throw error;
    }
  }

  // ---------------- STAFF USERS ----------------
  static async getStaffUsers(): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "in", [
          "SUPER_ADMIN",
          "ADMIN",
          "OUTLET_OWNER",
          "MANAGER",
          "DELIVERY_BOY",
          "DELIVERY",
        ])
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => mapWithDocId<UserProfile>(d));
    } catch (error) {
      console.error("Error getting staff users:", error);
      return [];
    }
  }

  static async saveStaffUser(user: UserProfile): Promise<void> {
    try {
      const cleanUser = removeUndefinedDeep(user);

      if (cleanUser.id) {
        await setDoc(doc(db, "users", cleanUser.id), cleanUser);
      } else {
        const docRef = await addDoc(collection(db, "users"), cleanUser);
        (cleanUser as any).id = docRef.id;
      }

      this.notify();
    } catch (error) {
      console.error("Error saving staff user:", error);
      throw error;
    }
  }

  static async deleteStaffUser(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "users", id));
      this.notify();
    } catch (error) {
      console.error("Error deleting staff user:", error);
      throw error;
    }
  }

  // ---------------- OUTLETS ----------------
  static async getOutlets(): Promise<Outlet[]> {
    try {
      const snapshot = await getDocs(collection(db, "outlets"));
      return snapshot.docs.map((d) => mapWithDocId<Outlet>(d));
    } catch (error) {
      console.error("Error getting outlets:", error);
      return [];
    }
  }

  static async saveOutlet(outlet: Outlet): Promise<void> {
    try {
      const cleanOutlet = removeUndefinedDeep(outlet);

      if (cleanOutlet.id) {
        await setDoc(doc(db, "outlets", cleanOutlet.id), cleanOutlet);
      } else {
        const docRef = await addDoc(collection(db, "outlets"), cleanOutlet);
        (cleanOutlet as any).id = docRef.id;
      }

      this.notify();
    } catch (error) {
      console.error("Error saving outlet:", error);
      throw error;
    }
  }

  static async deleteOutlet(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "outlets", id));
      this.notify();
    } catch (error) {
      console.error("Error deleting outlet:", error);
      throw error;
    }
  }

  // ---------------- MENU ----------------
  static async getMenu(outletId?: string): Promise<MenuItem[]> {
    try {
      let qRef: Query<DocumentData>;
      if (outletId && outletId !== "all") {
        qRef = query(
          collection(db, "menu"),
          where("outletId", "in", [outletId, "all"])
        );
      } else {
        qRef = query(collection(db, "menu"));
      }

      const snapshot = await getDocs(qRef);
      return snapshot.docs.map((d) => mapWithDocId<MenuItem>(d));
    } catch (error) {
      console.error("Error getting menu:", error);
      return [];
    }
  }

  static async saveMenuItem(item: MenuItem): Promise<void> {
    try {
      // ✅ remove undefined in nested objects
      const cleanItem = removeUndefinedDeep(item);

      // ✅ Also: avoid writing undefined in variantQuantities / serves / price
      // removeUndefinedDeep already handles it.

      if (cleanItem.id) {
        await setDoc(doc(db, "menu", cleanItem.id), cleanItem);
      } else {
        const docRef = await addDoc(collection(db, "menu"), cleanItem);
        (cleanItem as any).id = docRef.id;
      }

      this.notify();
    } catch (error) {
      console.error("Error saving menu item:", error);
      throw error;
    }
  }

  static async deleteMenuItem(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "menu", id));
      this.notify();
    } catch (error) {
      console.error("Error deleting menu item:", error);
      throw error;
    }
  }

  // ---------------- INVENTORY ----------------
  // ✅ FIX: allow outletId OPTIONAL to avoid where(outletId == undefined) crash
  static async getInventory(outletId?: string): Promise<InventoryItem[]> {
    try {
      let qRef: Query<DocumentData>;
      if (outletId && outletId !== "all") {
        qRef = query(
          collection(db, "inventory"),
          where("outletId", "in", [outletId, "all"])
        );
      } else {
        qRef = query(collection(db, "inventory"));
      }

      const snapshot = await getDocs(qRef);
      return snapshot.docs.map((d) => mapWithDocId<InventoryItem>(d));
    } catch (error) {
      console.error("Error getting inventory:", error);
      return [];
    }
  }

  static async getInventoryItem(id: string): Promise<InventoryItem | null> {
    try {
      const docSnap = await getDoc(doc(db, "inventory", id));
      if (!docSnap.exists()) return null;

      // ✅ preserve doc.id as id
      return { ...(docSnap.data() as any), id: docSnap.id } as InventoryItem;
    } catch (error) {
      console.error("Error getting inventory item:", error);
      return null;
    }
  }

  static async saveInventoryItem(item: InventoryItem): Promise<void> {
    try {
      const cleanItem = removeUndefinedDeep(item);

      if (cleanItem.id) {
        await setDoc(doc(db, "inventory", cleanItem.id), cleanItem);
      } else {
        const docRef = await addDoc(collection(db, "inventory"), cleanItem);
        (cleanItem as any).id = docRef.id;
      }

      this.notify();
    } catch (error) {
      console.error("Error saving inventory item:", error);
      throw error;
    }
  }

  static async deleteInventoryItem(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "inventory", id));
      this.notify();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      throw error;
    }
  }

  // ---------------- ORDERS ----------------
  static async getOrders(userId?: string, outletId?: string): Promise<Order[]> {
    try {
      let qRef: Query<DocumentData>;

      // ✅ Your DB uses createdAt in createOrder() and some places use timestamp.
      // We'll orderBy createdAt if exists, else fallback to timestamp.
      // But Firestore needs indexed fields. We'll use createdAt and assume it's present.
      if (userId) {
        qRef = query(
          collection(db, "orders"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );
      } else if (outletId) {
        qRef = query(
          collection(db, "orders"),
          where("outletId", "==", outletId),
          orderBy("createdAt", "desc")
        );
      } else {
        qRef = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      }

      const snapshot = await getDocs(qRef);

      // ✅ FIX: doc.data().id was overriding doc.id earlier, breaking updateOrderStatus
      return snapshot.docs.map((d) => mapWithDocId<Order>(d));
    } catch (error) {
      console.error("Error getting orders:", error);
      return [];
    }
  }

  static async saveOrder(order: Order): Promise<string> {
    try {
      const cleanOrder = removeUndefinedDeep(order);

      if (cleanOrder.id) {
        await setDoc(doc(db, "orders", cleanOrder.id), cleanOrder);
        this.notify();
        return cleanOrder.id;
      }

      const docRef = await addDoc(collection(db, "orders"), cleanOrder);
      this.notify();
      return docRef.id;
    } catch (error) {
      console.error("Error saving order:", error);
      throw error;
    }
  }

  static async createOrder(order: Order): Promise<string> {
    try {
      // Deduct inventory based on menu inventory links
      const menuItems = await this.getMenu(order.outletId);

      for (const orderItem of order.items) {
        const menuItem = menuItems.find((m) => m.id === orderItem.menuItemId);

        if (menuItem?.inventoryItems?.length) {
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
              Number(inventoryItem.stock) - deductQty
            );

            await this.saveInventoryItem({ ...inventoryItem, stock: newStock });
          }
        }
      }

      const orderData = removeUndefinedDeep({
        ...order,
        createdAt: Timestamp.now(),
      });

      const docRef = await addDoc(collection(db, "orders"), orderData);
      this.notify();
      return docRef.id;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<void> {
    try {
      // ✅ Now orderId is guaranteed to be doc.id (thanks to mapWithDocId fix)
      await updateDoc(doc(db, "orders", orderId), {
        status,
        updatedAt: Timestamp.now(),
      });
      this.notify();
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }

  // ---------------- REVIEWS ----------------
  static async getReviews(outletId?: string): Promise<Review[]> {
    try {
      let qRef: Query<DocumentData>;
      if (outletId) {
        qRef = query(
          collection(db, "reviews"),
          where("outletId", "==", outletId)
        );
      } else {
        qRef = query(collection(db, "reviews"));
      }
      const snapshot = await getDocs(qRef);
      return snapshot.docs.map((d) => mapWithDocId<Review>(d));
    } catch (error) {
      console.error("Error getting reviews:", error);
      return [];
    }
  }

  static async saveReview(review: Review): Promise<void> {
    try {
      const clean = removeUndefinedDeep(review);

      if ((clean as any).id) {
        await setDoc(doc(db, "reviews", (clean as any).id), clean);
      } else {
        await addDoc(collection(db, "reviews"), clean);
      }

      this.notify();
    } catch (error) {
      console.error("Error saving review:", error);
      throw error;
    }
  }

  // ---------------- MANUAL INVOICES ----------------
  static async getManualInvoices(outletId?: string): Promise<ManualInvoice[]> {
    try {
      let qRef: Query<DocumentData>;
      if (outletId) {
        qRef = query(
          collection(db, "manualInvoices"),
          where("outletId", "==", outletId)
        );
      } else {
        qRef = query(collection(db, "manualInvoices"));
      }
      const snapshot = await getDocs(qRef);
      return snapshot.docs.map((d) => mapWithDocId<ManualInvoice>(d));
    } catch (error) {
      console.error("Error getting manual invoices:", error);
      return [];
    }
  }

  static async saveManualInvoice(invoice: ManualInvoice): Promise<void> {
    try {
      const clean = removeUndefinedDeep(invoice);

      if ((clean as any).id) {
        await setDoc(doc(db, "manualInvoices", (clean as any).id), clean);
      } else {
        await addDoc(collection(db, "manualInvoices"), clean);
      }

      this.notify();
    } catch (error) {
      console.error("Error saving manual invoice:", error);
      throw error;
    }
  }

  // ---------------- REALTIME LISTENERS ----------------
  static subscribeToOrders(
    callback: (orders: Order[]) => void,
    userId?: string,
    outletId?: string
  ): () => void {
    let qRef: Query<DocumentData>;

    if (userId) {
      qRef = query(
        collection(db, "orders"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
    } else if (outletId) {
      qRef = query(
        collection(db, "orders"),
        where("outletId", "==", outletId),
        orderBy("createdAt", "desc")
      );
    } else {
      qRef = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    }

    return onSnapshot(qRef, (snapshot) => {
      const orders = snapshot.docs.map((d) => mapWithDocId<Order>(d));
      callback(orders);
    });
  }
}

export default FirestoreDB;
