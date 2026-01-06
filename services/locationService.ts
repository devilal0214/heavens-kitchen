
import { Coordinates, Outlet } from '../types';

export async function getUserLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true }
    );
  });
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

export function findNearestOutlet(loc: Coordinates, outlets: Outlet[]): { outlet: Outlet, distance: number } | null {
  if (!outlets || outlets.length === 0) {
    return null;
  }
  
  let nearest = outlets[0];
  if (!nearest || !nearest.coordinates) {
    return null;
  }
  
  let minDist = calculateDistance(loc.lat, loc.lng, nearest.coordinates.lat, nearest.coordinates.lng);

  outlets.forEach(o => {
    if (o && o.coordinates) {
      const d = calculateDistance(loc.lat, loc.lng, o.coordinates.lat, o.coordinates.lng);
      if (d < minDist) {
        minDist = d;
        nearest = o;
      }
    }
  });

  return { outlet: nearest, distance: minDist };
}
