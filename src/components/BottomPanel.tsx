import { useState } from "react";
import { CENTER, members, haversine } from "../data/mapData";

interface BottomPanelProps {
  radius: number;
  onRadiusChange: (r: number) => void;
  onFlyTo: (lat: number, lng: number, zoom: number) => void;
}

const RADIUS_OPTIONS = [
  { label: "2 กม.", value: 2000 },
  { label: "5 กม.", value: 5000 },
  { label: "10 กม.", value: 10000 },
  { label: "15 กม.", value: 15000 },
  { label: "ซ่อน", value: 0 },
];

const distances = members
  .map((m) => ({ ...m, dist: haversine(m.lat, m.lng, CENTER.lat, CENTER.lng) }))
  .sort((a, b) => a.dist - b.dist);

const maxDist = Math.max(...distances.map((d) => d.dist));

export default function BottomPanel({
  radius,
  onRadiusChange,
  onFlyTo,
}: BottomPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="bottom-panel"
      style={{ flexShrink: 0, paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      {/* Handle */}
      <div className="panel-handle" onClick={() => setCollapsed((c) => !c)}>
        {collapsed ? "↑ เปิด ↑" : "↓ ปิด ↓"}
      </div>

      {/* Content */}
      <div className={`panel-content${collapsed ? " collapsed" : ""}`}>
        {/* Center card */}
        <div
          className="center-card"
          onClick={() => onFlyTo(CENTER.lat, CENTER.lng, 11)}
        >
          <div className="center-card-label">⭐ จุดกลางกลุ่ม</div>
          <div className="center-card-name">{CENTER.name}</div>
          <div className="center-card-sub">
            {CENTER.lat.toFixed(4)}°N, {CENTER.lng.toFixed(4)}°E · รัศมีครอบ{" "}
            {maxDist.toFixed(1)} กม.
          </div>
          <a
            href={`https://www.google.com/maps/search/restaurants/@${CENTER.lat},${CENTER.lng},15z`}
            className="center-card-gmaps"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            🗺️ เปิด Google Maps
          </a>
        </div>

        {/* Radius toggle */}
        <div className="radius-toggle">
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`r-btn${radius === opt.value ? " active" : ""}`}
              onClick={() => onRadiusChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Members grid */}
        <div className="members-grid">
          {distances.map((m) => (
            <div
              key={m.name}
              className="member-card"
              onClick={() => onFlyTo(m.lat, m.lng, 12)}
            >
              <div className="member-dot" />
              <div className="member-card-name">
                {m.emoji} {m.name}
              </div>
              <div className="member-card-dist">
                ห่าง {m.dist.toFixed(1)} กม.
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
