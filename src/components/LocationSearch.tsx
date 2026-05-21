import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";

interface LocationSearchProps {
  onSelect: (lat: number, lng: number, name: string) => void;
  selectedLat: number | null;
  selectedLng: number | null;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const BANGKOK_CENTER: [number, number] = [13.756, 100.502];

export default function LocationSearch({
  onSelect,
  selectedLat,
  selectedLng,
}: LocationSearchProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Init mini map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(BANGKOK_CENTER, 11);

    mapRef.current = map;

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 },
    ).addTo(map);

    // Tap to pin
    map.on("click", (e) => {
      placePin(e.latlng.lat, e.latlng.lng, "");
      onSelect(e.latlng.lat, e.latlng.lng, `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
      setQuery("");
      setResults([]);
    });

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current!);

    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placePin = useCallback((lat: number, lng: number, name: string) => {
    const map = mapRef.current;
    if (!map) return;

    if (markerRef.current) map.removeLayer(markerRef.current);

    const icon = L.divIcon({
      className: "",
      html: `<div class="member-marker-icon">📍</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
    if (name) markerRef.current.bindPopup(name).openPopup();
    map.setView([lat, lng], 14, { animate: true });
  }, []);

  // Sync external selectedLat/Lng (e.g. on re-render after step back)
  useEffect(() => {
    if (selectedLat !== null && selectedLng !== null && !markerRef.current) {
      placePin(selectedLat, selectedLng, "");
    }
  }, [selectedLat, selectedLng, placePin]);

  // Debounced Nominatim search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=th&accept-language=th`;
        const res = await fetch(url, {
          headers: { "Accept-Language": "th" },
        });
        const data: NominatimResult[] = await res.json();
        setResults(data);
      } catch {
        // Silently ignore network errors in search
      } finally {
        setSearching(false);
      }
    }, 500);
  }, [query]);

  function handleResultClick(r: NominatimResult) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    // Trim display_name to first two parts
    const shortName = r.display_name.split(",").slice(0, 2).join(",").trim();
    placePin(lat, lng, shortName);
    onSelect(lat, lng, shortName);
    setQuery(shortName);
    setResults([]);
  }

  return (
    <div className="location-search">
      <div className="search-input-wrap">
        <input
          className="landing-input"
          type="text"
          placeholder="🔍 ค้นหาสถานที่ เช่น สยาม, มีนบุรี..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {searching && <span className="search-spinner">⌛</span>}
      </div>

      {results.length > 0 && (
        <ul className="search-results">
          {results.map((r) => (
            <li
              key={r.place_id}
              className="search-result-item"
              onClick={() => handleResultClick(r)}
            >
              📍 {r.display_name.split(",").slice(0, 3).join(",")}
            </li>
          ))}
        </ul>
      )}

      <div ref={containerRef} className="mini-map" />
      <p className="mini-map-hint">หรือแตะบนแผนที่เพื่อปักหมุด</p>
    </div>
  );
}
