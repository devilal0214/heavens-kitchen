// Migration Helper: Provides synchronous-like interface using Firestore
// This helps transition from localStorage (mockDb) to Firestore without breaking all components

import FirestoreDB from './firestoreDb';
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

// In-memory cache to provide "synchronous" reads
class CacheManager {
  private static cache: Record<string, any> = {};
  private static listeners: Set<Listener> = new Set();
  private static initialized = false;

  static async initialize() {
    if (this.initialized) return;
    
    try {
      // Load all data into cache
      const [outlets, settings, staffUsers, customers] = await Promise.all([
        FirestoreDB.getOutlets(),
        FirestoreDB.getGlobalSettings(),
        FirestoreDB.getStaffUsers(),
        FirestoreDB.getCustomers()
      ]);

      this.cache.outlets = outlets;
      this.cache.settings = settings;
      this.cache.staffUsers = staffUsers;
      this.cache.customers = customers;
      this.cache.menu = [];
      this.cache.orders = [];
      this.cache.inventory = [];

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing cache:', error);
    }
  }

  static get<T>(key: string, defaultValue: T): T {
    return this.cache[key] !== undefined ? this.cache[key] : defaultValue;
  }

  static set(key: string, value: any) {
    this.cache[key] = value;
    this.notify();
  }

  static notify() {
    this.listeners.forEach(l => l());
  }

  static onUpdate(callback: Listener) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
}

// Initialize cache on module load
CacheManager.initialize();

// Export interface matching RealtimeDB
export const RealtimeDB = {
  onUpdate: (callback: Listener) => CacheManager.onUpdate(callback),

  // Settings
  getGlobalSettings: (): GlobalSettings => {
    FirestoreDB.getGlobalSettings().then(settings => {
      CacheManager.set('settings', settings);
    });
    return CacheManager.get('settings', {
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
  },

  saveGlobalSettings: (settings: GlobalSettings) => {
    CacheManager.set('settings', settings);
    FirestoreDB.saveGlobalSettings(settings);
  },

  // Outlets
  getOutlets: (): Outlet[] => {
    FirestoreDB.getOutlets().then(outlets => {
      CacheManager.set('outlets', outlets);
    });
    return CacheManager.get('outlets', []);
  },

  saveOutlet: (outlet: Outlet) => {
    const outlets = CacheManager.get('outlets', []);
    const idx = outlets.findIndex((o: Outlet) => o.id === outlet.id);
    if (idx >= 0) outlets[idx] = outlet;
    else outlets.push(outlet);
    CacheManager.set('outlets', outlets);
    FirestoreDB.saveOutlet(outlet);
  },

  deleteOutlet: (id: string) => {
    const outlets = CacheManager.get('outlets', []);
    CacheManager.set('outlets', outlets.filter((o: Outlet) => o.id !== id));
    FirestoreDB.deleteOutlet(id);
  },

  // Menu
  getMenu: (outletId?: string): MenuItem[] => {
    FirestoreDB.getMenu(outletId).then(menu => {
      CacheManager.set(`menu_${outletId || 'all'}`, menu);
    });
    return CacheManager.get(`menu_${outletId || 'all'}`, []);
  },

  saveMenuItem: (item: MenuItem) => {
    const menu = CacheManager.get('menu_all', []);
    const idx = menu.findIndex((m: MenuItem) => m.id === item.id);
    if (idx >= 0) menu[idx] = item;
    else menu.push(item);
    CacheManager.set('menu_all', menu);
    FirestoreDB.saveMenuItem(item);
  },

  deleteMenuItem: (id: string) => {
    const menu = CacheManager.get('menu_all', []);
    CacheManager.set('menu_all', menu.filter((m: MenuItem) => m.id !== id));
    FirestoreDB.deleteMenuItem(id);
  },

  // Staff Users
  getStaffUsers: (): UserProfile[] => {
    FirestoreDB.getStaffUsers().then(users => {
      CacheManager.set('staffUsers', users);
    });
    return CacheManager.get('staffUsers', []);
  },

  saveStaffUser: (user: UserProfile) => {
    const users = CacheManager.get('staffUsers', []);
    const idx = users.findIndex((u: UserProfile) => u.id === user.id);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    CacheManager.set('staffUsers', users);
    FirestoreDB.saveStaffUser(user);
  },

  deleteStaffUser: (id: string) => {
    const users = CacheManager.get('staffUsers', []);
    CacheManager.set('staffUsers', users.filter((u: UserProfile) => u.id !== id));
    FirestoreDB.deleteStaffUser(id);
  },

  // Customers
  getCustomers: (): UserProfile[] => {
    FirestoreDB.getCustomers().then(customers => {
      CacheManager.set('customers', customers);
    });
    return CacheManager.get('customers', []);
  },

  saveCustomer: (user: UserProfile) => {
    const customers = CacheManager.get('customers', []);
    const idx = customers.findIndex((c: UserProfile) => c.email === user.email);
    if (idx >= 0) customers[idx] = user;
    else customers.push(user);
    CacheManager.set('customers', customers);
    FirestoreDB.saveCustomer(user);
  },

  // Inventory
  getInventory: (outletId?: string): InventoryItem[] => {
    if (outletId) {
      FirestoreDB.getInventory(outletId).then(inventory => {
        CacheManager.set(`inventory_${outletId}`, inventory);
      });
      return CacheManager.get(`inventory_${outletId}`, []);
    }
    return CacheManager.get('inventory_all', []);
  },

  saveInventoryItem: (item: InventoryItem) => {
    const inventory = CacheManager.get(`inventory_${item.outletId}`, []);
    const idx = inventory.findIndex((i: InventoryItem) => i.id === item.id);
    if (idx >= 0) inventory[idx] = item;
    else inventory.push(item);
    CacheManager.set(`inventory_${item.outletId}`, inventory);
    FirestoreDB.saveInventoryItem(item);
  },

  deleteInventoryItem: (id: string) => {
    FirestoreDB.deleteInventoryItem(id);
  },

  // Orders
  getOrders: (userIdOrOutletId?: string): Order[] => {
    FirestoreDB.getOrders(userIdOrOutletId).then(orders => {
      CacheManager.set(`orders_${userIdOrOutletId || 'all'}`, orders);
    });
    return CacheManager.get(`orders_${userIdOrOutletId || 'all'}`, []);
  },

  createOrder: (order: Order) => {
    const orders = CacheManager.get('orders_all', []);
    orders.unshift(order);
    CacheManager.set('orders_all', orders);
    FirestoreDB.saveOrder(order);
  },

  updateOrderStatus: (orderId: string, status: OrderStatus) => {
    FirestoreDB.updateOrderStatus(orderId, status);
    CacheManager.notify();
  },

  // Reviews
  getReviews: (outletId?: string): Review[] => {
    FirestoreDB.getReviews(outletId).then(reviews => {
      CacheManager.set(`reviews_${outletId || 'all'}`, reviews);
    });
    return CacheManager.get(`reviews_${outletId || 'all'}`, []);
  },

  saveReview: (review: Review) => {
    FirestoreDB.saveReview(review);
    CacheManager.notify();
  },

  // Manual Invoices
  getManualInvoices: (outletId?: string): ManualInvoice[] => {
    FirestoreDB.getManualInvoices(outletId).then(invoices => {
      CacheManager.set(`invoices_${outletId || 'all'}`, invoices);
    });
    return CacheManager.get(`invoices_${outletId || 'all'}`, []);
  },

  saveManualInvoice: (invoice: ManualInvoice) => {
    FirestoreDB.saveManualInvoice(invoice);
    CacheManager.notify();
  },

  // Categories (placeholder - implement based on your needs)
  getCategories: (): string[] => {
    return CacheManager.get('categories', [
      'Signature Selection',
      'Momo Factory',
      'Appetizers',
      'Main Course',
      'Beverages',
      'Desserts'
    ]);
  }
};

// Also export MockDB for components still using it
export const MockDB = RealtimeDB;
