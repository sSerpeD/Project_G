// Shared types for rooms and participants

export interface Room {
  id: string;
  name: string | null;
  password: string | null;
  created_at: string;
  expires_at: string;
}

export interface Availability {
  dates: string[];   // ISO date strings e.g. "2026-05-25"
  blocks: string[];  // "morning" | "afternoon" | "evening" | "night"
}

export interface Participant {
  id: string;
  room_id: string;
  display_name: string;
  lat: number;
  lng: number;
  location_name: string | null;
  availability: Availability | null;
  emoji: string;
  joined_at: string;
}

export const MEMBER_EMOJIS = ["🐶", "🐱", "🦊", "🐼", "🐸", "🦁", "🐯", "🐨", "🐻", "🦉", "🦋", "🌸"];
