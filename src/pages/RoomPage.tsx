import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRoomById } from "../lib/roomService";
import { hashPassword } from "../lib/roomService";
import { useRoom } from "../hooks/useRoom";
import { calcCenter, calcBestTimes } from "../lib/centerCalc";
import type { Room } from "../types";
import JoinForm from "../components/JoinForm";
import LiveView from "../components/LiveView";

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const { participants, isLoading } = useRoom(roomId ?? "");
  const center = calcCenter(participants);
  const bestTimes = calcBestTimes(participants);

  // Load room info
  useEffect(() => {
    if (!roomId) return;
    getRoomById(roomId).then((r) => {
      if (!r) {
        setNotFound(true);
        return;
      }
      // Check expiry
      if (new Date(r.expires_at) < new Date()) {
        setNotFound(true);
        return;
      }
      setRoom(r);
      // If no password, unlock immediately
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

  if (!room) {
    return (
      <div className="landing-shell">
        <div style={{ color: "var(--muted)", fontSize: 14 }}>กำลังโหลด...</div>
      </div>
    );
  }

  // Password gate
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

  // Show live view if already joined
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

  // Show join form
  return (
    <JoinForm
      room={room}
      onJoined={() => setHasJoined(true)}
    />
  );
}
