import { supabase } from "./supabase";
import type { Room, Participant, Availability } from "../types";

// Generate a short random room ID (6 URL-safe chars)
function generateRoomId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => chars[b % chars.length])
    .join("");
}

// Hash a password with SHA-256 (hex string)
export async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createRoom(
  name?: string,
  password?: string,
): Promise<string> {
  const id = generateRoomId();
  const hashed = password ? await hashPassword(password) : null;

  const { error } = await supabase.from("rooms").insert({
    id,
    name: name || null,
    password: hashed,
  });

  if (error) throw new Error(error.message);
  return id;
}

export async function getRoomById(roomId: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (error) return null;
  return data as Room;
}

export async function joinRoom(
  roomId: string,
  participant: {
    display_name: string;
    lat: number;
    lng: number;
    location_name?: string;
    availability: Availability;
    emoji: string;
  },
): Promise<Participant> {
  const { data, error } = await supabase
    .from("participants")
    .insert({ room_id: roomId, ...participant })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Participant;
}

export async function getParticipants(roomId: string): Promise<Participant[]> {
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Participant[];
}
