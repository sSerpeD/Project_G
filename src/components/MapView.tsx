import { useEffect, useRef } from "react";
import L from "leaflet";
import {
  CENTER,
  members,
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

interface MapViewProps {
  radius: number;
  onFlyToReady: (fn: (lat: number, lng: number, zoom: number) => void) => void;
}

const lineOpts = (color: string, weight = 4): L.PolylineOptions => ({
  color,
  weight,
  opacity: 0.85,
  smoothFactor: 0,
  lineJoin: "round",
  lineCap: "round",
});

export default function MapView({ radius, onFlyToReady }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([CENTER.lat, CENTER.lng], 11);

    mapRef.current = map;

    setTimeout(() => map.invalidateSize(), 50);
    window.addEventListener("resize", () => map.invalidateSize());

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
      },
    ).addTo(map);

    // Transit lines
    L.polyline(btsSukhumvit, lineOpts("#1DB954")).addTo(map);
    L.polyline(mrtBlueLoop, lineOpts("#1A56DB")).addTo(map);
    L.polyline(mrtBlueLakSong, lineOpts("#1A56DB")).addTo(map);
    L.polyline(arl, lineOpts("#E53935")).addTo(map);
    L.polyline(srtRedNorth, lineOpts("#E53935")).addTo(map);

    // Center marker
    const centerIcon = L.divIcon({
      className: "",
      html: `<div class="center-marker-icon">⭐</div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -25],
    });

    const distances = members.map((m) => ({
      ...m,
      dist: haversine(m.lat, m.lng, CENTER.lat, CENTER.lng),
    }));
    const maxDist = Math.max(...distances.map((d) => d.dist));

    L.marker([CENTER.lat, CENTER.lng], {
      icon: centerIcon,
      zIndexOffset: 1000,
    }).addTo(map).bindPopup(`
        <div class="popup-title">⭐ BTS สายหยุด (N19)</div>
        <div class="popup-sub">${CENTER.lat.toFixed(4)}, ${CENTER.lng.toFixed(4)}</div>
        <div class="popup-dist">รัศมีครอบคลุม ${maxDist.toFixed(1)} กม.</div>
      `);

    // Member markers + connector lines
    const memberIconFn = (emoji: string) =>
      L.divIcon({
        className: "",
        html: `<div class="member-marker-icon">${emoji}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

    distances.forEach((m) => {
      L.marker([m.lat, m.lng], { icon: memberIconFn(m.emoji) }).addTo(map)
        .bindPopup(`
          <div class="popup-title">${m.emoji} ${m.name}</div>
          <div class="popup-sub">${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}</div>
          <div class="popup-dist">ห่างจากจุดกลาง ${m.dist.toFixed(1)} กม.</div>
        `);

      L.polyline(
        [
          [m.lat, m.lng],
          [CENTER.lat, CENTER.lng],
        ],
        {
          color: "#ff7043",
          weight: 1.5,
          opacity: 0.35,
          dashArray: "4,6",
        },
      ).addTo(map);
    });

    // Station dots — BTS
    btsStations.forEach((s) => {
      L.circleMarker([s.lat, s.lng], {
        radius: 4,
        fillColor: "#1DB954",
        color: "#fff",
        weight: 1.5,
        fillOpacity: 1,
        opacity: 1,
      })
        .addTo(map)
        .bindPopup(
          `<div class="popup-title" style="color:#1DB954">🚆 BTS: ${s.name}</div>`,
        );
    });

    // Sai Yud highlighted
    L.circleMarker([CENTER.lat, CENTER.lng], {
      radius: 7,
      fillColor: "#1DB954",
      color: "#fff",
      weight: 2.5,
      fillOpacity: 1,
      opacity: 1,
    })
      .addTo(map)
      .bindPopup(
        `<div class="popup-title" style="color:#1DB954">🚆 BTS: Sai Yud (N19)</div>`,
      );

    // MRT stations
    mrtStations.forEach((s) => {
      L.circleMarker([s.lat, s.lng], {
        radius: 4,
        fillColor: "#1A56DB",
        color: "#fff",
        weight: 1.5,
        fillOpacity: 1,
        opacity: 1,
      })
        .addTo(map)
        .bindPopup(
          `<div class="popup-title" style="color:#1A56DB">🚇 MRT: ${s.name}</div>`,
        );
    });

    // Red/ARL stations
    redStations.forEach((s) => {
      L.circleMarker([s.lat, s.lng], {
        radius: 4,
        fillColor: "#E53935",
        color: "#fff",
        weight: 1.5,
        fillOpacity: 1,
        opacity: 1,
      })
        .addTo(map)
        .bindPopup(
          `<div class="popup-title" style="color:#E53935">🚆 Red: ${s.name}</div>`,
        );
    });

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
      window.removeEventListener("resize", () => map.invalidateSize());
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

    if (radius > 0) {
      radiusCircleRef.current = L.circle([CENTER.lat, CENTER.lng], {
        radius,
        color: "#FFD600",
        weight: 2,
        opacity: 0.7,
        fillColor: "#FFD600",
        fillOpacity: 0.06,
        dashArray: "8,6",
      }).addTo(map);
    }
  }, [radius]);

  return <div ref={containerRef} className="flex-1 w-full min-h-0" />;
}
