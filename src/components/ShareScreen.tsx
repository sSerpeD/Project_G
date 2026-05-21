import { useState } from "react";
import type { Room } from "../types";

interface ShareScreenProps {
  room: Room;
  onFillAvailability: () => void;
}

export default function ShareScreen({
  room,
  onFillAvailability,
}: ShareScreenProps) {
  const [copied, setCopied] = useState(false);

  const roomUrl = `${window.location.origin}/room/${room.id}`;

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(room.expires_at).getTime() - Date.now()) / 86400000),
  );

  function copyLink() {
    navigator.clipboard.writeText(roomUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareLink() {
    if (navigator.share) {
      navigator.share({
        title: room.name ?? "จุดนัดพบ",
        text: "มาวางแผนเจอกันกับฉันเลย!",
        url: roomUrl,
      });
    } else {
      copyLink();
    }
  }

  return (
    <div className="landing-shell">
      <div className="landing-card share-card">
        <div className="share-header">
          <div className="share-icon">🎉</div>
          <h2 className="share-title">ห้องพร้อมแล้ว!</h2>
          <p className="share-sub">
            {room.name ? (
              <>
                <strong>{room.name}</strong> ·{" "}
              </>
            ) : null}
            ห้องจะหายใน {daysLeft} วัน
          </p>
        </div>

        <div className="share-link-box">
          <span className="share-link-text">{roomUrl}</span>
          <button
            className={`share-copy-btn${copied ? " copied" : ""}`}
            onClick={copyLink}
            aria-label="คัดลอกลิงก์"
          >
            {copied ? "✓ คัดลอก" : "คัดลอก"}
          </button>
        </div>

        <button className="l-cta" onClick={shareLink}>
          แชร์ลิงก์ให้เพื่อน
        </button>

        <div className="share-divider">
          <span>หรือ</span>
        </div>

        <button className="share-fill-btn" onClick={onFillAvailability}>
          กรอกวันเวลาของฉันเลย →
        </button>
      </div>
    </div>
  );
}
