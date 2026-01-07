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
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  Outlet,
  MenuItem,
  InventoryItem,
  Order,
  OrderStatus,
  Review,
  UserProfile,
  UserRole,
  GlobalSettings,
  ManualInvoice
} from '../types';

type Listener = () => void;

export class FirestoreDB {
  private static listeners: Set<Listener> = new Set();

  static onUpdate(callback: Listener) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  static notify() {
    this.listeners.forEach(l => l());
  }

  // --- SETTINGS ---
  static async getGlobalSettings(): Promise<GlobalSettings> {
    try {
      const docRef = doc(db, 'settings', 'global');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as GlobalSettings;
      } else {
        // Return default settings
        const defaultSettings: GlobalSettings = {
          gstPercentage: 5,
          deliveryBaseCharge: 40,
          deliveryChargePerKm: 10,
          freeDeliveryThreshold: 500,
          freeDeliveryDistanceLimit: 5,
          deliveryTiers: [
            { id: 't1', upToKm: 3, charge: 30 },
            { id: 't2', upToKm: 5, charge: 50 },
            { id: 't3', upToKm: 10, charge: 100 }
          ],
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
        };
        // Save default settings
        await setDoc(docRef, defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.error('Error getting global settings:', error);
      throw error;
    }
  }

  static async saveGlobalSettings(settings: GlobalSettings): Promise<void> {
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
      this.notify();
    } catch (error) {
      console.error('Error saving global settings:', error);
      throw error;
    }
  }

  // --- STAFF USERS ---
  static async getStaffUsers(): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', 'in', ['SUPER_ADMIN', 'ADMIN', 'OUTLET_OWNER', 'MANAGER'])
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
    } catch (error) {
      console.error('Error getting staff users:', error);
      return [];
    }
  }

  static async saveStaffUser(user: UserProfile): Promise<void> {
    try {
      if (user.id) {
        await setDoc(doc(db, 'users', user.id), user);
      } else {
        const docRef = await addDoc(collection(db, 'users'), user);
        user.id = docRef.id;
      }
      this.notify();
    } catch (error) {
      console.error('Error saving staff user:', error);
      throw error;
    }
  }

  static async deleteStaffUser(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', id));
      this.notify();
    } catch (error) {
      console.error('Error deleting staff user:', error);
      throw error;
    }
  }

  // --- CUSTOMERS ---
  static async getCustomers(): Promise<UserProfile[]> {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'CUSTOMER'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
    } catch (error) {
      console.error('Error getting customers:', error);
      return [];
    }
  }

  static async saveCustomer(user: UserProfile): Promise<void> {
    try {
      const q = query(collection(db, 'users'), where('email', '==', user.email));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await updateDoc(doc(db, 'users', docId), { ...user });
      } else {
        await addDoc(collection(db, 'users'), user);
      }
      this.notify();
    } catch (error) {
      console.error('Error saving customer:', error);
      throw error;
    }
  }

  // --- OUTLETS ---
  static async getOutlets(): Promise<Outlet[]> {
    try {
      const snapshot = await getDocs(collection(db, 'outlets'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Outlet));
    } catch (error) {
      console.error('Error getting outlets:', error);
      return [];
    }
  }

  static async saveOutlet(outlet: Outlet): Promise<void> {
    try {
      if (outlet.id) {
        await setDoc(doc(db, 'outlets', outlet.id), outlet);
      } else {
        const docRef = await addDoc(collection(db, 'outlets'), outlet);
        outlet.id = docRef.id;
      }
      this.notify();
    } catch (error) {
      console.error('Error saving outlet:', error);
      throw error;
    }
  }

  static async deleteOutlet(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'outlets', id));
      this.notify();
    } catch (error) {
      console.error('Error deleting outlet:', error);
      throw error;
    }
  }

  // --- MENU ---
  static async getMenu(outletId?: string): Promise<MenuItem[]> {
    try {
      let q;
      if (outletId) {
        q = query(collection(db, 'menu'), where('outletId', '==', outletId));
      } else {
        q = collection(db, 'menu');
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as object } as MenuItem));
    } catch (error) {
      console.error('Error getting menu:', error);
      return [];
    }
  }

  static async saveMenuItem(item: MenuItem): Promise<void> {
    try {
      if (item.id) {
        await setDoc(doc(db, 'menu', item.id), item);
      } else {
        const docRef = await addDoc(collection(db, 'menu'), item);
        item.id = docRef.id;
      }
      this.notify();
    } catch (error) {
      console.error('Error saving menu item:', error);
      throw error;
    }
  }

  static async deleteMenuItem(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'menu', id));
      this.notify();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  }

  // --- INVENTORY ---
  static async getInventory(outletId: string): Promise<InventoryItem[]> {
    try {
      const q = query(collection(db, 'inventory'), where('outletId', '==', outletId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
    } catch (error) {
      console.error('Error getting inventory:', error);
      return [];
    }
  }

  static async saveInventoryItem(item: InventoryItem): Promise<void> {
    try {
      if (item.id) {
        await setDoc(doc(db, 'inventory', item.id), item);
      } else {
        const docRef = await addDoc(collection(db, 'inventory'), item);
        item.id = docRef.id;
      }
      this.notify();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      throw error;
    }
  }

  static async deleteInventoryItem(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'inventory', id));
      this.notify();
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  // --- ORDERS ---
  static async getOrders(userId?: string, outletId?: string): Promise<Order[]> {
    try {
      let q;
      if (userId) {
        q = query(collection(db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
      } else if (outletId) {
        q = query(collection(db, 'orders'), where('outletId', '==', outletId), orderBy('createdAt', 'desc'));
      } else {
        q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as object } as Order));
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  static async saveOrder(order: Order): Promise<string> {
    try {
      if (order.id) {
        await setDoc(doc(db, 'orders', order.id), order);
        this.notify();
        return order.id;
      } else {
        const docRef = await addDoc(collection(db, 'orders'), order);
        this.notify();
        return docRef.id;
      }
    } catch (error) {
      console.error('Error saving order:', error);
      throw error;
    }
  }

  static async createOrder(order: Order): Promise<string> {
    try {
      const orderData = {
        ...order,
        createdAt: Timestamp.now(),
        orderDate: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      this.notify();
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      this.notify();
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // --- REVIEWS ---
  static async getReviews(outletId?: string): Promise<Review[]> {
    try {
      let q;
      if (outletId) {
        q = query(collection(db, 'reviews'), where('outletId', '==', outletId));
      } else {
        q = collection(db, 'reviews');
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as object } as Review));
    } catch (error) {
      console.error('Error getting reviews:', error);
      return [];
    }
  }

  static async saveReview(review: Review): Promise<void> {
    try {
      if (review.id) {
        await setDoc(doc(db, 'reviews', review.id), review);
      } else {
        await addDoc(collection(db, 'reviews'), review);
      }
      this.notify();
    } catch (error) {
      console.error('Error saving review:', error);
      throw error;
    }
  }

  // --- MANUAL INVOICES ---
  static async getManualInvoices(outletId?: string): Promise<ManualInvoice[]> {
    try {
      let q;
      if (outletId) {
        q = query(collection(db, 'manualInvoices'), where('outletId', '==', outletId));
      } else {
        q = collection(db, 'manualInvoices');
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as object } as ManualInvoice));
    } catch (error) {
      console.error('Error getting manual invoices:', error);
      return [];
    }
  }

  static async saveManualInvoice(invoice: ManualInvoice): Promise<void> {
    try {
      if (invoice.id) {
        await setDoc(doc(db, 'manualInvoices', invoice.id), invoice);
      } else {
        await addDoc(collection(db, 'manualInvoices'), invoice);
      }
      this.notify();
    } catch (error) {
      console.error('Error saving manual invoice:', error);
      throw error;
    }
  }

  // --- REALTIME LISTENERS ---
  static subscribeToOrders(
    callback: (orders: Order[]) => void,
    userId?: string,
    outletId?: string
  ): () => void {
    let q;
    if (userId) {
      q = query(collection(db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    } else if (outletId) {
      q = query(collection(db, 'orders'), where('outletId', '==', outletId), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    }

    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      callback(orders);
    });
  }
}

export default FirestoreDB;
