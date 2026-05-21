import type { Participant } from "../types";
import { haversine, btsStations, mrtStations, redStations } from "../data/mapData";

export interface CenterResult {
  lat: number;
  lng: number;
  nearestStationName: string;
  nearestStationLat: number;
  nearestStationLng: number;
  maxDistKm: number;
}

const ALL_STATIONS = [...btsStations, ...mrtStations, ...redStations];

export function calcCenter(participants: Participant[]): CenterResult | null {
  if (participants.length === 0) return null;

  // Geographic centroid
  const lat = participants.reduce((s, p) => s + p.lat, 0) / participants.length;
  const lng = participants.reduce((s, p) => s + p.lng, 0) / participants.length;

  // Nearest transit station to centroid
  let nearest = ALL_STATIONS[0];
  let nearestDist = haversine(lat, lng, nearest.lat, nearest.lng);
  for (const station of ALL_STATIONS) {
    const d = haversine(lat, lng, station.lat, station.lng);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = station;
    }
  }

  // Max distance from each participant to centroid
  const maxDistKm = Math.max(
    ...participants.map((p) => haversine(p.lat, p.lng, lat, lng)),
  );

  return {
    lat,
    lng,
    nearestStationName: nearest.name,
    nearestStationLat: nearest.lat,
    nearestStationLng: nearest.lng,
    maxDistKm,
  };
}

// Returns top overlapping date+block combinations sorted by participant count desc
export function calcBestTimes(
  participants: Participant[],
): Array<{ date: string; block: string; count: number; names: string[] }> {
  const map = new Map<string, { count: number; names: string[] }>();

  for (const p of participants) {
    if (!p.availability) continue;
    for (const date of p.availability.dates) {
      for (const block of p.availability.blocks) {
        const key = `${date}__${block}`;
        const existing = map.get(key) ?? { count: 0, names: [] };
        map.set(key, {
          count: existing.count + 1,
          names: [...existing.names, p.display_name],
        });
      }
    }
  }

  return Array.from(map.entries())
    .map(([key, val]) => {
      const [date, block] = key.split("__");
      return { date, block, ...val };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
