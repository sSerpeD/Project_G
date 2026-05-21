import { useRef, useState } from "react";
import MapView from "./components/MapView";
import BottomPanel from "./components/BottomPanel";

const LEGEND = [
  { dotClass: "dot-center", label: "จุดกลาง" },
  { dotClass: "dot-member", label: "สมาชิก" },
  { dotClass: "dot-bts", label: "BTS Skytrain" },
  { dotClass: "dot-mrt", label: "MRT Blue" },
  { dotClass: "dot-red", label: "Red Line" },
];

export default function App() {
  const [radius, setRadius] = useState(5000);
  const flyToRef = useRef<(lat: number, lng: number, zoom: number) => void>(() => {});

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-top">
          <span className="header-icon">🗺️</span>
          <div>
            <h1>จุดนัดพบกลาง</h1>
            <div className="subtitle">คำนวณจากทุกตำแหน่งในกลุ่ม</div>
          </div>
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
      />

      <BottomPanel
        radius={radius}
        onRadiusChange={setRadius}
        onFlyTo={(lat, lng, zoom) => flyToRef.current(lat, lng, zoom)}
      />
    </div>
  );
}
