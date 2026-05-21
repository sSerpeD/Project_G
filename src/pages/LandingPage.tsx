import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, getRoomById } from "../lib/roomService";
import {
  getDisplayName,
  setDisplayName,
  setGuestName,
  isGuest,
} from "../lib/storage";

type Step = "identity" | "intent";
type IntentTab = "create" | "join";

export default function LandingPage() {
  const navigate = useNavigate();

  const savedName = getDisplayName();

  // Start at intent if a real (non-guest) name is already saved
  const [step, setStep] = useState<Step>(
    savedName && !isGuest() ? "intent" : "identity",
  );
  const [intentTab, setIntentTab] = useState<IntentTab>("create");

  // Identity step
  const [nameInput, setNameInput] = useState(
    savedName && !isGuest() ? savedName : "",
  );

  // Display name shown after identity step
  const [displayName, setLocalDisplayName] = useState(savedName ?? "");

  // Create form
  const [roomName, setRoomName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Join form
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");

  function handleNameProceed() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setDisplayName(trimmed);
    setLocalDisplayName(trimmed);
    setStep("intent");
  }

  function handleGuestProceed() {
    const name = setGuestName();
    setLocalDisplayName(name);
    setStep("intent");
  }

  async function handleCreate() {
    setCreateLoading(true);
    setCreateError("");
    try {
      const id = await createRoom(
        roomName.trim() || undefined,
        createPassword.trim() || undefined,
      );
      navigate(`/room/${id}?from=create`);
    } catch {
      setCreateError("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
      setCreateLoading(false);
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toLowerCase();
    if (!code) return;
    setJoinLoading(true);
    setJoinError("");
    try {
      const room = await getRoomById(code);
      if (!room || new Date(room.expires_at) < new Date()) {
        setJoinError("ไม่พบห้องนี้ หรือห้องหมดอายุแล้ว");
        setJoinLoading(false);
        return;
      }
      navigate(`/room/${code}`);
    } catch {
      setJoinError("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
      setJoinLoading(false);
    }
  }

  // ─── Identity Step ──────────────────────────────────────────────────────────
  if (step === "identity") {
    return (
      <div className="landing-shell">
        <div className="landing-card">
          <div className="l-wordmark">📍 จุดนัดพบ</div>

          <div className="l-identity">
            <h1 className="l-identity-heading">เรียกคุณว่าอะไรดี?</h1>
            <p className="l-identity-sub">ชื่อจะแสดงให้คนในกลุ่มเห็น</p>

            <input
              className="l-input"
              type="text"
              placeholder="ชื่อเล่นหรือชื่อจริงก็ได้"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && nameInput.trim() && handleNameProceed()
              }
              maxLength={30}
              autoFocus
            />

            <button
              className="l-cta"
              disabled={!nameInput.trim()}
              onClick={handleNameProceed}
            >
              ต่อไป
            </button>

            <button
              className="l-ghost-btn"
              onClick={handleGuestProceed}
              type="button"
            >
              เข้าแบบไม่ระบุชื่อ
            </button>
          </div>

          <div className="l-pills">
            {[
              "ไม่ต้องสมัครสมาชิก",
              "หาจุดกลางอัตโนมัติ",
              "ห้องหายใน 7 วัน",
            ].map((f) => (
              <span key={f} className="l-pill">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Intent Step ────────────────────────────────────────────────────────────
  return (
    <div className="landing-shell">
      <div className="landing-card">
        <div className="l-wordmark">📍 จุดนัดพบ</div>

        <div className="l-greeting">
          <span>สวัสดี,&nbsp;</span>
          <span className="l-greeting-name">{displayName}</span>
          <button
            className="l-change-name"
            onClick={() => setStep("identity")}
            type="button"
          >
            เปลี่ยน
          </button>
        </div>

        {/* Tabs */}
        <div className="l-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={intentTab === "create"}
            className={`l-tab${intentTab === "create" ? " active" : ""}`}
            onClick={() => setIntentTab("create")}
          >
            สร้างห้อง
          </button>
          <button
            role="tab"
            aria-selected={intentTab === "join"}
            className={`l-tab${intentTab === "join" ? " active" : ""}`}
            onClick={() => setIntentTab("join")}
          >
            เข้าร่วมห้อง
          </button>
        </div>

        {/* Create panel */}
        {intentTab === "create" && (
          <div className="l-panel" role="tabpanel">
            <p className="l-panel-hint">ตั้งชื่อแผน แล้วแชร์ลิงก์ให้เพื่อน</p>

            <input
              className="l-input"
              type="text"
              placeholder="ชื่อแผน เช่น 'ไปทะเลกัน?'"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              maxLength={60}
            />

            <button
              className="l-password-toggle"
              onClick={() => setShowCreatePassword((v) => !v)}
              type="button"
            >
              {showCreatePassword
                ? "🔓 ไม่ใส่รหัส"
                : "🔒 เพิ่มรหัสห้อง (ไม่บังคับ)"}
            </button>

            {showCreatePassword && (
              <input
                className="l-input"
                type="password"
                placeholder="รหัสห้อง"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                maxLength={50}
              />
            )}

            {createError && <p className="l-error">{createError}</p>}

            <button
              className="l-cta"
              onClick={handleCreate}
              disabled={createLoading}
            >
              {createLoading ? "กำลังสร้าง..." : "สร้างห้อง"}
            </button>
          </div>
        )}

        {/* Join panel */}
        {intentTab === "join" && (
          <div className="l-panel" role="tabpanel">
            <p className="l-panel-hint">ใส่รหัสห้อง 6 ตัวที่ได้รับมา</p>

            <input
              className="l-input l-input--code"
              type="text"
              placeholder="ABC123"
              value={joinCode}
              onChange={(e) =>
                setJoinCode(e.target.value.replace(/\s/g, "").slice(0, 6))
              }
              onKeyDown={(e) =>
                e.key === "Enter" && joinCode.trim() && handleJoin()
              }
              maxLength={6}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />

            {joinError && <p className="l-error">{joinError}</p>}

            <button
              className="l-cta"
              onClick={handleJoin}
              disabled={!joinCode.trim() || joinLoading}
            >
              {joinLoading ? "กำลังค้นหา..." : "เข้าห้อง"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
