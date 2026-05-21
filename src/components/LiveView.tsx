import { useRef, useState } from "react";
import MapView from "./MapView";
import BottomPanel from "./BottomPanel";
import type { Participant, Room } from "../types";
import type { CenterResult } from "../lib/centerCalc";

const LEGEND = [
  { dotClass: "dot-center", label: "จุดกลาง" },
  { dotClass: "dot-member", label: "สมาชิก" },
  { dotClass: "dot-bts", label: "BTS" },
  { dotClass: "dot-mrt", label: "MRT" },
  { dotClass: "dot-red", label: "Red Line" },
];

interface LiveViewProps {
  room: Room;
  participants: Participant[];
  isLoading: boolean;
  center: CenterResult | null;
  bestTimes: Array<{ date: string; block: string; count: number; names: string[] }>;
}

export default function LiveView({
  room,
  participants,
  isLoading,
  center,
  bestTimes,
}: LiveViewProps) {
  const [radius, setRadius] = useState(5000);
  const flyToRef = useRef<(lat: number, lng: number, zoom: number) => void>(() => {});

  // Expiry badge
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(room.expires_at).getTime() - Date.now()) / 86400000),
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-top">
          <span className="header-icon">🗺️</span>
          <div style={{ flex: 1 }}>
            <h1>{room.name ?? "ห้องนัดพบ"}</h1>
            <div className="subtitle">
              {isLoading
                ? "กำลังโหลด..."
                : `${participants.length} คน · หมดอายุใน ${daysLeft} วัน`}
            </div>
          </div>
          <span className="expiry-badge">{participants.length} 👥</span>
        </div>
        <div className="legend">
          {LEGEND.map((l) => (
            <div key={l.label} className="legend-pill">
              <div className={`dot ${l.dotClass}`} />
              {l.label}
            </div>
          ))}
        </div>
      </header>

      <MapView
        radius={radius}
        onFlyToReady={(fn) => { flyToRef.current = fn; }}
        participants={participants}
        center={center}
      />

      <BottomPanel
        radius={radius}
        onRadiusChange={setRadius}
        onFlyTo={(lat, lng, zoom) => flyToRef.current(lat, lng, zoom)}
        participants={participants}
        center={center}
        bestTimes={bestTimes}
        roomName={room.name}
      />
    </div>
  );
}
