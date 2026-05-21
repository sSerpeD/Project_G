import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getParticipants } from "../lib/roomService";
import type { Participant } from "../types";

export function useRoom(roomId: string) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    if (!roomId) return;
    setIsLoading(true);
    getParticipants(roomId)
      .then(setParticipants)
      .finally(() => setIsLoading(false));
  }, [roomId]);

  // Realtime subscription
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "participants",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setParticipants((prev) => {
            // Avoid duplicates (INSERT might fire twice in StrictMode dev)
            if (prev.find((p) => p.id === (payload.new as Participant).id)) return prev;
            return [...prev, payload.new as Participant];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return { participants, isLoading };
}
