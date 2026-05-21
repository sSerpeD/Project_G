import { useState } from "react";
import { haversine } from "../data/mapData";
import type { Participant } from "../types";
import type { CenterResult } from "../lib/centerCalc";
import BestTimeCard from "./BestTimeCard";

interface BottomPanelProps {
  radius: number;
  onRadiusChange: (r: number) => void;
  onFlyTo: (lat: number, lng: number, zoom: number) => void;
  participants: Participant[];
  center: CenterResult | null;
  bestTimes: Array<{ date: string; block: string; count: number; names: string[] }>;
  roomName?: string | null;
}

const RADIUS_OPTIONS = [
  { label: "2 กม.", value: 2000 },
  { label: "5 กม.", value: 5000 },
  { label: "10 กม.", value: 10000 },
  { label: "15 กม.", value: 15000 },
  { label: "ซ่อน", value: 0 },
];

export default function BottomPanel({
  radius,
  onRadiusChange,
  onFlyTo,
  participants,
  center,
  bestTimes,
  roomName,
}: BottomPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const distances = participants
    .map((p) => ({
      ...p,
      dist: center ? haversine(p.lat, p.lng, center.lat, center.lng) : 0,
    }))
    .sort((a, b) => a.dist - b.dist);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  }

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
        {center ? (
          <div
            className="center-card"
            onClick={() => onFlyTo(center.lat, center.lng, 12)}
          >
            <div className="center-card-label">⭐ จุดกลางกลุ่ม</div>
            <div className="center-card-name">{roomName ?? "ห้องนัดพบ"}</div>
            <div className="center-card-sub">
              ใกล้ {center.nearestStationName} · รัศมี {center.maxDistKm.toFixed(1)} กม.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <a
                href={`https://www.google.com/maps/search/restaurants/@${center.lat},${center.lng},15z`}
                className="center-card-gmaps"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                🗺️ เปิด Google Maps
              </a>
              <button className="share-btn" onClick={(e) => { e.stopPropagation(); handleShare(); }}>
                🔗 แชร์ลิงก์
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-emoji">👥</div>
            <div className="empty-text">รอเพื่อนเข้าร่วม...</div>
            <button className="landing-cta" style={{ marginTop: 8 }} onClick={handleShare}>
              🔗 คัดลอกลิงก์เชิญ
            </button>
          </div>
        )}

        {/* Best time */}
        <BestTimeCard entries={bestTimes} totalParticipants={participants.length} />

        {/* Radius toggle */}
        {center && (
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
        )}

        {/* Members grid */}
        <div className="members-grid">
          {distances.map((p) => (
            <div
              key={p.id}
              className="member-card"
              onClick={() => onFlyTo(p.lat, p.lng, 13)}
            >
              <div className="member-dot" />
              <div className="member-card-name">
                {p.emoji} {p.display_name}
              </div>
              <div className="member-card-dist">
                {center ? `ห่าง ${p.dist.toFixed(1)} กม.` : p.location_name ?? ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
