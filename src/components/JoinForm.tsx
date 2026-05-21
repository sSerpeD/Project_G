import { useState, useCallback } from "react";
import type { Room } from "../types";
import { MEMBER_EMOJIS } from "../types";
import { joinRoom } from "../lib/roomService";
import LocationSearch from "./LocationSearch";
import TimeSelector from "./TimeSelector";

interface JoinFormProps {
  room: Room;
  onJoined: () => void;
}

type Step = "name" | "location" | "time";

export default function JoinForm({ room, onJoined }: JoinFormProps) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [emoji] = useState(() => MEMBER_EMOJIS[Math.floor(Math.random() * MEMBER_EMOJIS.length)]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationName, setLocationName] = useState("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLocationSelect = useCallback(
    (newLat: number, newLng: number, newName: string) => {
      setLat(newLat);
      setLng(newLng);
      setLocationName(newName);
    },
    [],
  );

  async function handleSubmit() {
    if (lat === null || lng === null) return;
    setLoading(true);
    setError("");
    try {
      const participant = await joinRoom(room.id, {
        display_name: name.trim(),
        lat,
        lng,
        location_name: locationName || undefined,
        availability: { dates: selectedDates, blocks: selectedBlocks },
        emoji,
      });
      sessionStorage.setItem(`participant_${room.id}`, participant.id);
      onJoined();
    } catch {
      setError("เกิดข้อผิดพลาด ลองอีกครั้ง");
      setLoading(false);
    }
  }

  // Expiry badge
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(room.expires_at).getTime() - Date.now()) / 86400000),
  );

  return (
    <div className="landing-shell">
      <div className="landing-card join-card">
        {/* Room header */}
        <div className="join-room-header">
          <span className="expiry-badge">⏳ {daysLeft} วัน</span>
          <h2 className="join-room-name">{room.name ?? "ห้องนัดพบ"}</h2>
        </div>

        {/* Step indicator */}
        <div className="step-indicator">
          {(["name", "location", "time"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`step-dot ${step === s ? "active" : ""} ${
                (step === "location" && i === 0) ||
                (step === "time" && i <= 1)
                  ? "done"
                  : ""
              }`}
            />
          ))}
        </div>

        {/* Step: Name */}
        {step === "name" && (
          <div className="step-content">
            <div className="step-emoji">{emoji}</div>
            <h3 className="step-title">คุณชื่ออะไร?</h3>
            <input
              className="landing-input"
              type="text"
              placeholder="ชื่อเล่นหรือชื่อจริงก็ได้"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              autoFocus
            />
            <button
              className="landing-cta"
              disabled={!name.trim()}
              onClick={() => setStep("location")}
            >
              ต่อไป →
            </button>
          </div>
        )}

        {/* Step: Location */}
        {step === "location" && (
          <div className="step-content">
            <h3 className="step-title">คุณอยู่แถวไหน?</h3>
            <p className="step-sub">ค้นหาหรือแตะบนแผนที่</p>
            <LocationSearch
              onSelect={handleLocationSelect}
              selectedLat={lat}
              selectedLng={lng}
            />
            <div className="step-nav">
              <button className="back-btn" onClick={() => setStep("name")}>
                ← กลับ
              </button>
              <button
                className="landing-cta"
                style={{ flex: 1 }}
                disabled={lat === null}
                onClick={() => setStep("time")}
              >
                ต่อไป →
              </button>
            </div>
          </div>
        )}

        {/* Step: Time */}
        {step === "time" && (
          <div className="step-content">
            <h3 className="step-title">ว่างวันไหน?</h3>
            <p className="step-sub">เลือกได้หลายวัน</p>
            <TimeSelector
              selectedDates={selectedDates}
              selectedBlocks={selectedBlocks}
              onDatesChange={setSelectedDates}
              onBlocksChange={setSelectedBlocks}
            />
            {error && <p className="landing-error">{error}</p>}
            <div className="step-nav">
              <button className="back-btn" onClick={() => setStep("location")}>
                ← กลับ
              </button>
              <button
                className="landing-cta"
                style={{ flex: 1 }}
                disabled={loading || selectedDates.length === 0 || selectedBlocks.length === 0}
                onClick={handleSubmit}
              >
                {loading ? "กำลังเข้าร่วม..." : "🎉 เข้าร่วม!"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
