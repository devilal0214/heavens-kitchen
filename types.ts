
export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  REJECTED = 'REJECTED'
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  OUTLET_OWNER = 'OUTLET_OWNER',
  MANAGER = 'MANAGER',
  CUSTOMER = 'CUSTOMER'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Outlet {
  id: string;
  name: string;
  address: string;
  contact: string;
  email: string;
  imageUrl: string;
  coordinates: Coordinates;
  deliveryRadiusKm: number;
  ownerEmail: string;
  isActive: boolean;
  rating: number;
  totalRatings: number;
}

export interface DeliveryTier {
  id: string;
  upToKm: number;
  charge: number;
}

export interface InvoiceSettings {
  brandName: string;
  logoUrl: string;
  tagline: string;
  address: string;
  contact: string;
  showTagline: boolean;
  showNotice: boolean;
  primaryColor: string;
}

export interface GlobalSettings {
  gstPercentage: number;
  deliveryBaseCharge: number;
  deliveryChargePerKm: number;
  freeDeliveryThreshold: number;
  freeDeliveryDistanceLimit: number;
  deliveryTiers: DeliveryTier[];
  invoiceSettings: InvoiceSettings;
}

export interface StaffPermissions {
  manageMenu: boolean;
  manageInventory: boolean;
  viewStats: boolean;
  manageOrders: boolean;
  manageOutlets: boolean;
  manageManagers: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: UserRole;
  outletId?: string;
  password?: string; // For staff login
  permissions?: StaffPermissions;
}

export interface InventoryItem {
  id: string;
  outletId: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
  imageUrl?: string;
}

export interface VariantQuantities {
  full?: string;
  half?: string;
  qtr?: string;
}

export interface VariantServings {
  full?: string;
  half?: string;
  qtr?: string;
}

export interface MenuItem {
  id: string;
  outletId: string;
  name: string;
  description: string;
  category: string;
  price: VariantPrices;
  variantQuantities?: VariantQuantities;
  serves?: VariantServings;
  imageUrl: string;
  isAvailable: boolean;
  isSpicy: 'None' | 'Mild' | 'Medium' | 'Hot';
  foodType: 'Veg' | 'Non-Veg';
  inventoryItems: { itemId: string; qty: number }[];
  discountPercentage?: number;
}

export interface VariantPrices {
  full: number;
  half?: number;
  qtr?: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  variant: 'full' | 'half' | 'qtr';
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  outletId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryCharge: number;
  total: number;
  status: OrderStatus;
  timestamp: number;
  paymentMethod: 'UPI' | 'CARD' | 'COD';
  history: { status: OrderStatus; time: number; updatedBy: string }[];
  isRated?: boolean;
}

export interface ManualInvoice {
  id: string;
  outletId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryCharge: number;
  total: number;
  timestamp: number;
  paymentMethod: 'UPI' | 'CARD' | 'COD' | 'CASH';
}

export interface Review {
  id: string;
  outletId: string;
  orderId: string;
  rating: number;
  comment: string;
  customerName: string;
  timestamp: number;
}

export interface AppState {
  currentUser: UserProfile | null;
  staffUser: UserProfile | null;
  outlets: Outlet[];
  currentOutlet: Outlet | null;
  userLocation: Coordinates | null;
  cart: OrderItem[];
}
