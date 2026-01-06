// Script to initialize Firestore with sample data
// Run this once to populate your database with initial data

import FirestoreDB from './services/firestoreDb';
import { UserRole } from './types';

export async function initializeDatabase() {
  try {
    console.log('Initializing database with sample data...');

    // Create sample outlets
    const outlets = [
      {
        id: 'outlet-1',
        name: "Heaven's Kalka Ji",
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
        name: "Heaven's Def Col",
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
    ];

    // Create super admin user
    const superAdmin = {
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
    };

    // Save outlets
    for (const outlet of outlets) {
      await FirestoreDB.saveOutlet(outlet);
      console.log(`✓ Created outlet: ${outlet.name}`);
    }

    // Save super admin
    await FirestoreDB.saveStaffUser(superAdmin);
    console.log(`✓ Created super admin user`);

    // Create sample menu items
    const menuItems = [
      {
        id: 'm1',
        outletId: 'outlet-1',
        name: 'Paneer Tikka Sanctuary',
        category: 'Signature Selection',
        description: 'Smoked cottage cheese marinated in the original 1984 secret spice blend.',
        price: { full: 349, half: 199, qtr: 129 },
        variantQuantities: { full: '8 Pcs', half: '4 Pcs', qtr: '2 Pcs' },
        serves: { full: '3 People', half: '1 Person', qtr: 'Snack' },
        isAvailable: true,
        isSpicy: 'Medium',
        foodType: 'Veg',
        inventoryItems: [],
        imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 'm2',
        outletId: 'outlet-1',
        name: 'Legacy Butter Chicken',
        category: 'Signature Selection',
        description: 'Velvety tomato gravy with charcoal-grilled chicken. A Delhi legend.',
        price: { full: 499, half: 289 },
        variantQuantities: { full: 'Full Handi', half: 'Half Handi' },
        serves: { full: '3-4 People', half: '1-2 People' },
        isAvailable: true,
        isSpicy: 'Mild',
        foodType: 'Non-Veg',
        inventoryItems: [],
        imageUrl: 'https://images.unsplash.com/photo-1603894584134-f139fdec7fa2?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 'm3',
        outletId: 'outlet-1',
        name: 'Drums of Heaven',
        category: 'Signature Selection',
        description: 'Tossed in a fiery Schezwan glaze with aromatic herbs.',
        price: { full: 389, half: 219 },
        variantQuantities: { full: '8 Wings', half: '4 Wings' },
        serves: { full: '2-3 People', half: '1 Person' },
        isAvailable: true,
        isSpicy: 'Hot',
        foodType: 'Non-Veg',
        inventoryItems: [],
        imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&q=80&w=800'
      }
    ];

    for (const item of menuItems) {
      await FirestoreDB.saveMenuItem(item);
      console.log(`✓ Created menu item: ${item.name}`);
    }

    console.log('\n✅ Database initialization complete!');
    console.log('\nYou can now login with:');
    console.log('Email: superadmin@1290');
    console.log('Password: pass123');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

// Note: Call this function from browser console or create a button in admin to run it once
// Example: import { initializeDatabase } from './initDb'; initializeDatabase();
