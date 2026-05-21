import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getRoomById, hashPassword } from "../lib/roomService";
import { useRoom } from "../hooks/useRoom";
import { calcCenter, calcBestTimes } from "../lib/centerCalc";
import { getDisplayName, setGuestName } from "../lib/storage";
import type { Room } from "../types";
import JoinForm from "../components/JoinForm";
import LiveView from "../components/LiveView";
import ShareScreen from "../components/ShareScreen";

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isFromCreate = searchParams.get("from") === "create";

  const [room, setRoom] = useState<Room | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  // Creators bypass password gate
  const [passwordUnlocked, setPasswordUnlocked] = useState(isFromCreate);
  const [hasJoined, setHasJoined] = useState(false);
  const [showShareScreen, setShowShareScreen] = useState(isFromCreate);

  const { participants, isLoading } = useRoom(roomId ?? "");
  const center = calcCenter(participants);
  const bestTimes = calcBestTimes(participants);

  // Resolve display name — generate guest name if none saved
  const displayName = getDisplayName() ?? setGuestName();

  // Load room info
  useEffect(() => {
    if (!roomId) return;
    getRoomById(roomId).then((r) => {
      if (!r) {
        setNotFound(true);
        return;
      }
      if (new Date(r.expires_at) < new Date()) {
        setNotFound(true);
        return;
      }
      setRoom(r);
      if (!r.password) setPasswordUnlocked(true);
    });
  }, [roomId]);

  // Check if already joined
  useEffect(() => {
    if (roomId && sessionStorage.getItem(`participant_${roomId}`)) {
      setHasJoined(true);
    }
  }, [roomId]);

  async function handlePasswordSubmit() {
    if (!room?.password) return;
    const hashed = await hashPassword(passwordInput);
    if (hashed === room.password) {
      setPasswordUnlocked(true);
      setPasswordError("");
    } else {
      setPasswordError("รหัสไม่ถูกต้อง");
    }
  }

  function handleFillAvailability() {
    setShowShareScreen(false);
    setSearchParams({});
  }

  // ─── Not found ──────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="landing-shell">
        <div className="landing-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{ marginBottom: 8 }}>ไม่พบห้องนี้</h2>
          <p style={{ color: "var(--muted)", marginBottom: 24 }}>
            ห้องอาจหมดอายุแล้ว หรือลิงก์อาจผิด
          </p>
          <button className="landing-cta" onClick={() => navigate("/")}>
            สร้างห้องใหม่
          </button>
        </div>
      </div>
    );
  }

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (!room) {
    return (
      <div className="landing-shell">
        <div style={{ color: "var(--muted)", fontSize: 14 }}>กำลังโหลด...</div>
      </div>
    );
  }

  // ─── Password gate ────────────────────────────────────────────────────────────
  if (room.password && !passwordUnlocked) {
    return (
      <div className="landing-shell">
        <div className="landing-card">
          <div className="landing-hero">
            <div className="landing-emoji">🔒</div>
            <h1 className="landing-title">{room.name ?? "ห้องนัดพบ"}</h1>
            <p className="landing-subtitle">ห้องนี้มีรหัสผ่าน</p>
          </div>
          <div className="landing-form">
            <input
              className="landing-input"
              type="password"
              placeholder="ใส่รหัสห้อง"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
              autoFocus
            />
            {passwordError && <p className="landing-error">{passwordError}</p>}
            <button className="landing-cta" onClick={handlePasswordSubmit}>
              เข้าห้อง
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Share screen (shown after creation) ─────────────────────────────────────
  if (showShareScreen) {
    return (
      <ShareScreen room={room} onFillAvailability={handleFillAvailability} />
    );
  }

  // ─── Live view (already joined) ───────────────────────────────────────────────
  if (hasJoined) {
    return (
      <LiveView
        room={room}
        participants={participants}
        isLoading={isLoading}
        center={center}
        bestTimes={bestTimes}
      />
    );
  }

  // ─── Join form ────────────────────────────────────────────────────────────────
  return (
    <JoinForm
      room={room}
      onJoined={() => setHasJoined(true)}
      initialName={displayName}
    />
  );
}
