import { useEffect, useRef } from "react";
import L from "leaflet";
import {
  haversine,
  btsSukhumvit,
  mrtBlueLoop,
  mrtBlueLakSong,
  arl,
  srtRedNorth,
  btsStations,
  mrtStations,
  redStations,
} from "../data/mapData";
import type { Participant } from "../types";
import type { CenterResult } from "../lib/centerCalc";

interface MapViewProps {
  radius: number;
  onFlyToReady: (fn: (lat: number, lng: number, zoom: number) => void) => void;
  participants: Participant[];
  center: CenterResult | null;
}

const lineOpts = (color: string, weight = 4): L.PolylineOptions => ({
  color,
  weight,
  opacity: 0.85,
  smoothFactor: 0,
  lineJoin: "round",
  lineCap: "round",
});

export default function MapView({ radius, onFlyToReady, participants, center }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const participantLayerRef = useRef<L.LayerGroup | null>(null);
  const centerLayerRef = useRef<L.LayerGroup | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([13.756, 100.502], 11);

    mapRef.current = map;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current!);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 },
    ).addTo(map);

    // Transit lines
    L.polyline(btsSukhumvit, lineOpts("#1DB954")).addTo(map);
    L.polyline(mrtBlueLoop, lineOpts("#1A56DB")).addTo(map);
    L.polyline(mrtBlueLakSong, lineOpts("#1A56DB")).addTo(map);
    L.polyline(arl, lineOpts("#E53935")).addTo(map);
    L.polyline(srtRedNorth, lineOpts("#E53935")).addTo(map);

    // Station dots — BTS
    btsStations.forEach((s) => {
      L.circleMarker([s.lat, s.lng], {
        radius: 4, fillColor: "#1DB954", color: "#fff", weight: 1.5, fillOpacity: 1, opacity: 1,
      }).addTo(map).bindPopup(`<div class="popup-title" style="color:#1DB954">🚆 BTS: ${s.name}</div>`);
    });

    // MRT stations
    mrtStations.forEach((s) => {
      L.circleMarker([s.lat, s.lng], {
        radius: 4, fillColor: "#1A56DB", color: "#fff", weight: 1.5, fillOpacity: 1, opacity: 1,
      }).addTo(map).bindPopup(`<div class="popup-title" style="color:#1A56DB">🚇 MRT: ${s.name}</div>`);
    });

    // Red/ARL stations
    redStations.forEach((s) => {
      L.circleMarker([s.lat, s.lng], {
        radius: 4, fillColor: "#E53935", color: "#fff", weight: 1.5, fillOpacity: 1, opacity: 1,
      }).addTo(map).bindPopup(`<div class="popup-title" style="color:#E53935">🚆 Red: ${s.name}</div>`);
    });

    // Dynamic layer groups
    participantLayerRef.current = L.layerGroup().addTo(map);
    centerLayerRef.current = L.layerGroup().addTo(map);

    // Expose flyTo
    const flyToWithOffset = (lat: number, lng: number, zoom: number) => {
      map.setView([lat, lng], zoom, { animate: true });
      map.once("moveend", () => {
        const h = map.getContainer().offsetHeight;
        map.panBy([0, Math.round(h * 0.15)], { animate: false });
      });
    };
    onFlyToReady(flyToWithOffset);

    return () => {
      ro.disconnect();
    };
  }, []);

  // Sync radius circle when prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (radiusCircleRef.current) {
      map.removeLayer(radiusCircleRef.current);
      radiusCircleRef.current = null;
    }

    if (radius > 0 && center) {
      radiusCircleRef.current = L.circle([center.lat, center.lng], {
        radius,
        color: "#FFD600",
        weight: 2,
        opacity: 0.7,
        fillColor: "#FFD600",
        fillOpacity: 0.06,
        dashArray: "8,6",
      }).addTo(map);
    }
  }, [radius, center]);

  // Update participant markers
  useEffect(() => {
    const layer = participantLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    participants.forEach((p) => {
      const icon = L.divIcon({
        className: "",
        html: `<div class="member-marker-icon">${p.emoji}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });
      L.marker([p.lat, p.lng], { icon })
        .addTo(layer)
        .bindPopup(`
          <div class="popup-title">${p.emoji} ${p.display_name}</div>
          <div class="popup-sub">${p.location_name ?? `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`}</div>
        `);

      if (center) {
        const dist = haversine(p.lat, p.lng, center.lat, center.lng);
        L.polyline([[p.lat, p.lng], [center.lat, center.lng]], {
          color: "#ff7043", weight: 1.5, opacity: 0.35, dashArray: "4,6",
        }).addTo(layer);
        // Silent dist usage — satisfies linter
        void dist;
      }
    });
  }, [participants, center]);

  // Update center marker
  useEffect(() => {
    const layer = centerLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!center) return;

    const centerIcon = L.divIcon({
      className: "",
      html: `<div class="center-marker-icon">⭐</div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -25],
    });

    L.marker([center.lat, center.lng], { icon: centerIcon, zIndexOffset: 1000 })
      .addTo(layer)
      .bindPopup(`
        <div class="popup-title">⭐ จุดกลาง</div>
        <div class="popup-sub">ใกล้ ${center.nearestStationName}</div>
        <div class="popup-dist">รัศมีครอบคลุม ${center.maxDistKm.toFixed(1)} กม.</div>
      `);

    const stationIcon = L.divIcon({
      className: "",
      html: `<div class="station-suggest-icon">🚆</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    L.marker([center.nearestStationLat, center.nearestStationLng], { icon: stationIcon })
      .addTo(layer)
      .bindPopup(`<div class="popup-title" style="color:#FFD600">🚆 แนะนำ: ${center.nearestStationName}</div>`);
  }, [center]);

  return <div ref={containerRef} className="flex-1 w-full min-h-0" />;
}
