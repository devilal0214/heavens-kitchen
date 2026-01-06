
import { Outlet, MenuItem, InventoryItem, Order, OrderStatus, Review, UserProfile, UserRole, GlobalSettings, ManualInvoice, OrderItem } from '../types';

type Listener = () => void;

export class RealtimeDB {
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

  private static get<T>(key: string, initial: T): T {
    const data = localStorage.getItem(`havens_${key}`);
    return data ? JSON.parse(data) : initial;
  }

  private static set(key: string, data: any) {
    localStorage.setItem(`havens_${key}`, JSON.stringify(data));
    this.notify();
  }

  // --- SETTINGS ---
  static getGlobalSettings(): GlobalSettings {
    return this.get('global_settings', {
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
    });
  }

  static saveGlobalSettings(settings: GlobalSettings) {
    this.set('global_settings', settings);
  }

  // --- STAFF USERS ---
  static getStaffUsers(): UserProfile[] {
    return this.get('staff_users', [
      {
        id: 'super-1',
        name: 'Super Admin',
        email: 'superadmin@1290',
        password: 'pass123',
        phone: '9899466466',
        address: 'HQ',
        role: UserRole.SUPER_ADMIN,
        permissions: {
          manageMenu: true,
          manageInventory: true,
          viewStats: true,
          manageOrders: true,
          manageOutlets: true,
          manageManagers: true
        }
      }
    ]);
  }

  static saveStaffUser(user: UserProfile) {
    const all = this.getStaffUsers();
    const idx = all.findIndex(u => u.id === user.id);
    if (idx >= 0) all[idx] = user; else all.push(user);
    this.set('staff_users', all);
  }

  static deleteStaffUser(id: string) {
    const all = this.getStaffUsers();
    this.set('staff_users', all.filter(u => u.id !== id));
  }

  // --- CUSTOMERS ---
  static getCustomers(): UserProfile[] {
    return this.get('customers', []);
  }

  static saveCustomer(user: UserProfile) {
    const all = this.getCustomers();
    const idx = all.findIndex(u => u.email === user.email);
    if (idx >= 0) all[idx] = user; else all.push(user);
    this.set('customers', all);
  }

  // --- OUTLETS ---
  static getOutlets(): Outlet[] {
    return this.get('outlets', [
      { 
        id: 'outlet-1', 
        name: 'Heaven\'s Kalka Ji', 
        address: 'Near Lotus Temple, South Delhi', 
        contact: '9899466466', 
        email: 'kalka@havens.com',
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
        coordinates: { lat: 28.5432, lng: 77.2476 }, 
        deliveryRadiusKm: 5, 
        ownerEmail: 'kalka@havens.com', 
        isActive: true,
        rating: 4.8,
        totalRatings: 124
      },
      { 
        id: 'outlet-2', 
        name: 'Heaven\'s Def Col', 
        address: 'D-Block, Defence Colony', 
        contact: '9899813999', 
        email: 'def@havens.com',
        imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800',
        coordinates: { lat: 28.5746, lng: 77.2284 }, 
        deliveryRadiusKm: 5, 
        ownerEmail: 'def@havens.com', 
        isActive: true,
        rating: 4.5,
        totalRatings: 89
      }
    ]);
  }

  static saveOutlet(outlet: Outlet) {
    const all = this.getOutlets();
    const idx = all.findIndex(o => o.id === outlet.id);
    if (idx >= 0) all[idx] = outlet; else all.push(outlet);
    this.set('outlets', all);
  }

  static deleteOutlet(id: string) {
    const all = this.getOutlets();
    this.set('outlets', all.filter(o => o.id !== id));
  }

  // --- MENU ---
  static getMenu(outletId?: string): MenuItem[] {
    const initialItems: MenuItem[] = [
      {
        id: 'm1', outletId: 'outlet-1', name: 'Paneer Tikka Sanctuary', category: 'Signature Selection',
        description: 'Smoked cottage cheese marinated in the original 1984 secret spice blend.',
        price: { full: 349, half: 199, qtr: 129 }, 
        variantQuantities: { full: '8 Pcs', half: '4 Pcs', qtr: '2 Pcs' },
        serves: { full: '3 People', half: '1 Person', qtr: 'Snack' },
        isAvailable: true, isSpicy: 'Medium', foodType: 'Veg', 
        inventoryItems: [], 
        imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 'm2', outletId: 'outlet-1', name: 'Legacy Butter Chicken', category: 'Signature Selection',
        description: 'Velvety tomato gravy with charcoal-grilled chicken. A Delhi legend.',
        price: { full: 499, half: 289 }, 
        variantQuantities: { full: 'Full Handi', half: 'Half Handi' },
        serves: { full: '3-4 People', half: '1-2 People' },
        isAvailable: true, isSpicy: 'Mild', foodType: 'Non-Veg', 
        inventoryItems: [], 
        imageUrl: 'https://images.unsplash.com/photo-1603894584134-f139fdec7fa2?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 'm3', outletId: 'outlet-1', name: 'Drums of Heaven', category: 'Signature Selection',
        description: 'Tossed in a fiery Schezwan glaze with aromatic herbs.',
        price: { full: 389, half: 219 }, 
        variantQuantities: { full: '8 Wings', half: '4 Wings' },
        serves: { full: '2-3 People', half: '1 Person' },
        isAvailable: true, isSpicy: 'Hot', foodType: 'Non-Veg', 
        inventoryItems: [], 
        imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 'm4', outletId: 'outlet-1', name: 'Paradise Mojito', category: 'Signature Selection',
        description: 'Fresh mint, lime, and a hint of elderflower to refresh your sanctuary.',
        price: { full: 189 }, isAvailable: true, isSpicy: 'None', foodType: 'Veg', inventoryItems: [],
        serves: { full: '1 Person' },
        imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 'm5', outletId: 'outlet-1', name: 'Steamed Momo Factory', category: 'Momo Factory',
        description: 'Hand-folded dumplings served with the infamous red garlic dip.',
        price: { full: 249, half: 149, qtr: 89 }, 
        variantQuantities: { full: '10 Pcs', half: '6 Pcs', qtr: '3 Pcs' },
        serves: { full: '2 People', half: '1 Person', qtr: 'Solo Snack' },
        isAvailable: true, isSpicy: 'Hot', foodType: 'Veg', 
        inventoryItems: [], 
        imageUrl: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&q=80&w=800'
      }
    ];
    const all = this.get<MenuItem[]>('menu', initialItems);
    return outletId ? all.filter(m => m.outletId === outletId) : all;
  }

  static saveMenuItem(item: MenuItem) {
    const all = this.getMenu();
    const idx = all.findIndex(m => m.id === item.id);
    if (idx >= 0) all[idx] = item; else all.push(item);
    this.set('menu', all);
  }

  static deleteMenuItem(id: string) {
    const all = this.getMenu();
    this.set('menu', all.filter(m => m.id !== id));
  }

  static getCategories(): string[] {
    return this.get('categories', ['Signature Selection', 'Indian Main Course', 'Chinese Main', 'Coolers', 'Momo Factory', 'Starters']);
  }

  static saveCategory(name: string) {
    const all = this.getCategories();
    if (!all.includes(name)) {
      all.push(name);
      this.set('categories', all);
    }
  }

  // --- INVENTORY (DISH STOCK) ---
  static getInventory(outletId?: string): InventoryItem[] {
    const initialInv: InventoryItem[] = [
      { id: 'inv-m1-o1', outletId: 'outlet-1', name: 'Paneer Tikka Sanctuary', stock: 100, minStock: 10, unit: 'Portions' },
      { id: 'inv-m2-o1', outletId: 'outlet-1', name: 'Legacy Butter Chicken', stock: 40, minStock: 5, unit: 'Portions' },
      { id: 'inv-m3-o1', outletId: 'outlet-1', name: 'Drums of Heaven', stock: 35, minStock: 5, unit: 'Portions' },
      { id: 'inv-m5-o1', outletId: 'outlet-1', name: 'Steamed Momo Factory', stock: 100, minStock: 20, unit: 'Portions' },
      { id: 'inv-m1-o2', outletId: 'outlet-2', name: 'Paneer Tikka Sanctuary', stock: 30, minStock: 10, unit: 'Portions' },
      { id: 'inv-m2-o2', outletId: 'outlet-2', name: 'Legacy Butter Chicken', stock: 25, minStock: 5, unit: 'Portions' },
      { id: 'inv-m3-o2', outletId: 'outlet-2', name: 'Drums of Heaven', stock: 20, minStock: 5, unit: 'Portions' },
      { id: 'inv-m5-o2', outletId: 'outlet-2', name: 'Steamed Momo Factory', stock: 80, minStock: 20, unit: 'Portions' }
    ];
    const all = this.get('inventory', initialInv);
    return outletId ? all.filter(i => i.outletId === outletId) : all;
  }

  static saveInventoryItem(item: InventoryItem) {
    const all = this.getInventory();
    const idx = all.findIndex(i => i.id === item.id);
    if (idx >= 0) all[idx] = item; else all.push(item);
    this.set('inventory', all);
  }

  static deleteInventoryItem(id: string) {
    const all = this.getInventory();
    this.set('inventory', all.filter(i => i.id !== id));
  }

  static updateInventoryStock(id: string, newStock: number) {
    const all = this.getInventory();
    const idx = all.findIndex(i => i.id === id);
    if (idx >= 0) {
      all[idx].stock = Math.max(0, newStock);
      this.set('inventory', all);
    }
  }

  private static deductInventory(items: OrderItem[], outletId: string) {
    const allInventory = this.getInventory();
    
    items.forEach(item => {
      const invItem = allInventory.find(i => 
        i.name.toLowerCase().trim() === item.name.toLowerCase().trim() && 
        i.outletId === outletId
      );
      
      if (invItem) {
        invItem.stock = Math.max(0, invItem.stock - item.quantity);
      }
    });

    this.set('inventory', allInventory);
  }

  // --- ORDERS ---
  static getOrders(outletId?: string): Order[] {
    const all = this.get('orders', []);
    return outletId ? all.filter((o: Order) => o.outletId === outletId) : all;
  }

  static createOrder(order: Order) {
    const allOrders = this.getOrders();
    allOrders.push(order);
    this.set('orders', allOrders);
    this.deductInventory(order.items, order.outletId);
  }

  static deleteOrder(id: string) {
    const all = this.getOrders();
    this.set('orders', all.filter(o => o.id !== id));
  }

  static updateOrderStatus(orderId: string, status: OrderStatus, updatedBy: string) {
    const all = this.getOrders();
    const idx = all.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      const order = all[idx];
      order.status = status;
      order.history.push({ status, time: Date.now(), updatedBy });
      this.set('orders', all);
    }
  }

  // --- MANUAL INVOICES ---
  static getManualInvoices(outletId?: string): ManualInvoice[] {
    const all = this.get('manual_invoices', []);
    return outletId ? all.filter((i: ManualInvoice) => i.outletId === outletId) : all;
  }

  static createManualInvoice(invoice: ManualInvoice) {
    const allInvoices = this.getManualInvoices();
    allInvoices.push(invoice);
    this.set('manual_invoices', allInvoices);
    this.deductInventory(invoice.items, invoice.outletId);
  }

  static deleteManualInvoice(id: string) {
    const all = this.getManualInvoices();
    this.set('manual_invoices', all.filter(i => i.id !== id));
  }

  static submitReview(review: Review) {
    const allReviews = this.get('reviews', [] as Review[]);
    allReviews.push(review);
    this.set('reviews', allReviews);
  }
}

export const MockDB = RealtimeDB;
