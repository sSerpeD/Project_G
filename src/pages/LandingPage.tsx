import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../lib/roomService";

export default function LandingPage() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setLoading(true);
    setError("");
    try {
      const id = await createRoom(roomName.trim() || undefined, password.trim() || undefined);
      navigate(`/room/${id}`);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="landing-shell">
      <div className="landing-card">
        {/* Hero */}
        <div className="landing-hero">
          <div className="landing-emoji">📍</div>
          <h1 className="landing-title">จะไปไหนกันดี?</h1>
          <p className="landing-subtitle">
            สร้างห้อง แชร์ลิงก์ — ทุกคนกรอกพิกัด แอปหาจุดนัดให้เลย
          </p>
        </div>

        {/* Inputs */}
        <div className="landing-form">
          <input
            className="landing-input"
            type="text"
            placeholder="ชื่อแผน เช่น 'วันหยุดนี้ไปไหนกัน?'"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            maxLength={60}
          />

          <button
            className="password-toggle"
            onClick={() => setShowPassword((v) => !v)}
            type="button"
          >
            {showPassword ? "🔓 ไม่ใส่รหัสก็ได้" : "🔒 ใส่รหัสห้อง (ไม่บังคับ)"}
          </button>

          {showPassword && (
            <input
              className="landing-input"
              type="password"
              placeholder="รหัสห้อง"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={50}
            />
          )}

          {error && <p className="landing-error">{error}</p>}

          <button
            className="landing-cta"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? "กำลังสร้าง..." : "✨ สร้างห้องวางแผน"}
          </button>
        </div>

        {/* Feature pills */}
        <div className="landing-features">
          {["ไม่ต้องสมัครสมาชิก", "เจอกันผ่านลิงก์เดียว", "หาจุดกลางให้อัตโนมัติ", "ห้องหายใน 7 วัน"].map(
            (f) => (
              <span key={f} className="feature-pill">
                {f}
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
