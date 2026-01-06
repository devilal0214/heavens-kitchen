# Heaven's Kitchen

A premium multi-outlet restaurant management and ordering platform with live location detection, inventory tracking, and specialized admin/owner panels.

## Features

- 🔥 **Firebase Firestore Database** - Real-time cloud database
- 📍 **Live Location Detection** - Automatic outlet detection based on user location
- 🛒 **Real-time Order Tracking** - Track orders from preparation to delivery
- 👨‍💼 **Admin Dashboard** - Complete system management
- 🏪 **Outlet Owner Dashboard** - Inventory and order management per outlet
- 📜 **Customer Order History** - View past and active orders
- 🎉 **Party/Event Booking** - Reserve tables and plan events

## Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Styling:** CSS3 with modern design

## Prerequisites

- Node.js (v20.19.0 or later recommended)
- Firebase project with Firestore enabled

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/devilal0214/heavens-kitchen.git
cd heavens-kitchen
```

### 2. Install dependencies

```bash
npm install
```

### 3. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database (Start in test mode for development)
3. Enable Authentication (Email/Password method)
4. Get your Firebase config from Project Settings

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your actual Firebase API key from the Firebase console.

### 5. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 6. Build for production

```bash
npm run build
```

## Firebase Setup Guide

### Firestore Collections Structure

The app uses the following Firestore collections:

- `settings` - Global application settings
- `users` - User profiles (customers, staff, admins)
- `outlets` - Restaurant outlet information
- `menu` - Menu items per outlet
- `inventory` - Inventory items per outlet
- `orders` - Customer orders
- `reviews` - Customer reviews
- `manualInvoices` - Manual invoices created by staff

### Firestore Security Rules (Development)

For development, you can use these basic rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 12, 31);
    }
  }
}
```

**Note:** Update these rules for production to include proper authentication and authorization.

## Project Structure

```
havens-kitchen/
├── components/          # React components
│   ├── AdminDashboard.tsx
│   ├── OutletOwnerDashboard.tsx
│   ├── MenuPage.tsx
│   ├── CartModal.tsx
│   └── ...
├── config/             # Configuration files
│   └── firebase.ts     # Firebase initialization
├── services/           # Service layer
│   ├── firestoreDb.ts  # Firestore operations
│   ├── dbAdapter.ts    # Database adapter layer
│   └── locationService.ts
├── App.tsx             # Main app component
├── types.ts            # TypeScript type definitions
└── package.json

```

## Default Credentials

### Super Admin
- Email: `superadmin@1290`
- Password: `pass123`

**Note:** Change these credentials in production!

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is for educational purposes.

## Contact

For support or queries, visit the Contact page in the app.
