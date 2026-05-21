const TIME_BLOCKS = [
  { id: "morning", label: "🌅 เช้า", sub: "6:00 – 12:00" },
  { id: "afternoon", label: "☀️ บ่าย", sub: "12:00 – 17:00" },
  { id: "evening", label: "🌆 เย็น", sub: "17:00 – 21:00" },
  { id: "night", label: "🌙 ดึก", sub: "21:00 – 24:00" },
];

function getNext14Days(): { iso: string; label: string; dayName: string }[] {
  const days = [];
  const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const dayName = dayNames[d.getDay()];
    days.push({ iso, label: `${day}/${month}`, dayName });
  }
  return days;
}

interface TimeSelectorProps {
  selectedDates: string[];
  selectedBlocks: string[];
  onDatesChange: (dates: string[]) => void;
  onBlocksChange: (blocks: string[]) => void;
}

export default function TimeSelector({
  selectedDates,
  selectedBlocks,
  onDatesChange,
  onBlocksChange,
}: TimeSelectorProps) {
  const days = getNext14Days();

  function toggleDate(iso: string) {
    onDatesChange(
      selectedDates.includes(iso)
        ? selectedDates.filter((d) => d !== iso)
        : [...selectedDates, iso],
    );
  }

  function toggleBlock(id: string) {
    onBlocksChange(
      selectedBlocks.includes(id)
        ? selectedBlocks.filter((b) => b !== id)
        : [...selectedBlocks, id],
    );
  }

  return (
    <div className="time-selector">
      {/* Date chips */}
      <div className="date-chips">
        {days.map((d) => (
          <button
            key={d.iso}
            className={`date-chip ${selectedDates.includes(d.iso) ? "active" : ""}`}
            onClick={() => toggleDate(d.iso)}
            type="button"
          >
            <span className="date-chip-day">{d.dayName}</span>
            <span className="date-chip-num">{d.label}</span>
          </button>
        ))}
      </div>

      {/* Time block toggles */}
      <div className="block-grid">
        {TIME_BLOCKS.map((b) => (
          <button
            key={b.id}
            className={`block-btn ${selectedBlocks.includes(b.id) ? "active" : ""}`}
            onClick={() => toggleBlock(b.id)}
            type="button"
          >
            <span className="block-label">{b.label}</span>
            <span className="block-sub">{b.sub}</span>
          </button>
        ))}
      </div>

      {selectedDates.length > 0 && selectedBlocks.length > 0 && (
        <p className="time-summary">
          ✅ เลือก {selectedDates.length} วัน · {selectedBlocks.length} ช่วงเวลา
        </p>
      )}
    </div>
  );
}
