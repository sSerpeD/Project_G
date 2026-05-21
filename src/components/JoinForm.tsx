import { useState, useCallback } from "react";
import type { Room } from "../types";
import { MEMBER_EMOJIS } from "../types";
import { joinRoom } from "../lib/roomService";
import LocationSearch from "./LocationSearch";
import TimeSelector from "./TimeSelector";

interface JoinFormProps {
  room: Room;
  onJoined: () => void;
  initialName: string;
}

type Step = "time" | "location";

export default function JoinForm({
  room,
  onJoined,
  initialName,
}: JoinFormProps) {
  const [step, setStep] = useState<Step>("time");
  const [emoji] = useState(
    () => MEMBER_EMOJIS[Math.floor(Math.random() * MEMBER_EMOJIS.length)],
  );

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
        display_name: initialName,
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

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(room.expires_at).getTime() - Date.now()) / 86400000),
  );

  const steps: Step[] = ["time", "location"];
  const stepIndex = steps.indexOf(step);

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
          {steps.map((s, i) => (
            <div
              key={s}
              className={`step-dot${s === step ? " active" : ""}${i < stepIndex ? " done" : ""}`}
            />
          ))}
        </div>

        {/* User badge */}
        <div className="join-user-badge">
          <span>{emoji}</span>
          <span className="join-user-name">{initialName}</span>
        </div>

        {/* Step: Time */}
        {step === "time" && (
          <div className="step-content">
            <h3 className="step-title">ว่างวันไหน?</h3>
            <p className="step-sub">เลือกได้หลายวัน หลายช่วงเวลา</p>
            <TimeSelector
              selectedDates={selectedDates}
              selectedBlocks={selectedBlocks}
              onDatesChange={setSelectedDates}
              onBlocksChange={setSelectedBlocks}
            />
            <button
              className="landing-cta"
              disabled={
                selectedDates.length === 0 || selectedBlocks.length === 0
              }
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
            {error && <p className="landing-error">{error}</p>}
            <div className="step-nav">
              <button className="back-btn" onClick={() => setStep("time")}>
                ← กลับ
              </button>
              <button
                className="landing-cta"
                style={{ flex: 1 }}
                disabled={loading || lat === null}
                onClick={handleSubmit}
              >
                {loading ? "กำลังเข้าร่วม..." : "เข้าร่วม!"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
