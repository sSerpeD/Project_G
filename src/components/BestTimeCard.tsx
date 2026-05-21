const BLOCK_LABELS: Record<string, string> = {
  morning: "🌅 เช้า",
  afternoon: "☀️ บ่าย",
  evening: "🌆 เย็น",
  night: "🌙 ดึก",
};

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  return `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

interface BestTimeEntry {
  date: string;
  block: string;
  count: number;
  names: string[];
}

interface BestTimeCardProps {
  entries: BestTimeEntry[];
  totalParticipants: number;
}

export default function BestTimeCard({ entries, totalParticipants }: BestTimeCardProps) {
  if (entries.length === 0) return null;

  return (
    <div className="best-time-card">
      <div className="best-time-title">📅 เวลาที่เหมาะที่สุด</div>
      <div className="best-time-list">
        {entries.slice(0, 3).map((e, i) => (
          <div key={`${e.date}-${e.block}`} className={`best-time-item ${i === 0 ? "top" : ""}`}>
            <div className="best-time-rank">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</div>
            <div className="best-time-info">
              <div className="best-time-slot">
                {formatDate(e.date)} · {BLOCK_LABELS[e.block] ?? e.block}
              </div>
              <div className="best-time-names">{e.names.join(", ")}</div>
            </div>
            <div className="best-time-count">
              {e.count}/{totalParticipants}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
