# Project G — Architecture & Design Document

> MVP is live. This doc covers the full system design, SQL, real-time architecture, and future roadmap.

---

## 1. Product Vision

A zero-friction hangout planner for friend groups. Creating a room and sharing the link should feel like starting a game, not filling out a work calendar.

**Emotional target:** "damn this is way easier than using group chat."

---

## 2. UX Philosophy

- One main action per screen
- No account required, ever
- Rooms feel temporary and fun (not "productivity software")
- Real-time presence builds excitement — see friends joining live
- Completion rate > feature richness

---

## 3. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vite + React 19 + TypeScript | Fast DX, modern React |
| Styling | Tailwind v4 + custom CSS vars | Utility + dark-mode design system |
| Map | Leaflet + CartoDB dark tiles | Bangkok transit viz, no API key |
| Backend | Supabase (Postgres + Realtime) | No-auth rooms, instant real-time |
| Geocoding | Nominatim (OpenStreetMap) | Free, no API key, Bangkok-optimized |
| Routing | React Router v7 | SPA with `/` and `/room/:id` |

---

## 4. Database Schema (Supabase / PostgreSQL)

```sql
-- Rooms table
CREATE TABLE public.rooms (
  id          text        PRIMARY KEY,                         -- 6-char alphanum e.g. "abc123"
  name        text,                                            -- optional room name
  password    text,                                            -- SHA-256 hex hash, null = open
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

-- Participants table
CREATE TABLE public.participants (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id        text        NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  display_name   text        NOT NULL,
  lat            float8      NOT NULL,
  lng            float8      NOT NULL,
  location_name  text,                                         -- human-readable place name
  availability   jsonb,                                        -- { dates: string[], blocks: string[] }
  emoji          text,                                         -- random animal emoji avatar
  joined_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX participants_room_id_idx ON public.participants(room_id);
CREATE INDEX rooms_expires_at_idx     ON public.rooms(expires_at);
```

### Availability JSONB shape

```json
{
  "dates": ["2026-05-25", "2026-05-26"],
  "blocks": ["morning", "evening"]
}
```

Time blocks: `morning` (6–12), `afternoon` (12–17), `evening` (17–21), `night` (21–24)

---

## 5. Row Level Security (RLS)

```sql
-- rooms: anyone can read or create; no update/delete
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_select_public" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert_public" ON public.rooms FOR INSERT WITH CHECK (true);

-- participants: anyone can read or join; no update/delete
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants_select_public" ON public.participants FOR SELECT USING (true);
CREATE POLICY "participants_insert_public" ON public.participants FOR INSERT WITH CHECK (true);
```

> For production: add UPDATE/DELETE policies gated on a participant-owned token or Supabase Auth.

---

## 6. Real-Time Architecture

```
Browser A (creator)          Supabase                    Browser B (joiner)
    |                            |                               |
    |── INSERT participant ──→   |                               |
    |                            |── broadcast INSERT event ──→  |
    |                            |                               | update state
    |   ←── broadcast ──────────  |                               |
    | update state               |                               |
```

- Channel: `room:{roomId}` per Supabase Realtime
- Event filter: `postgres_changes` → `INSERT` on `participants` where `room_id = roomId`
- Dedup guard: `prev.find(p => p.id === payload.new.id)` in `useRoom.ts`
- No polling needed — Realtime handles all updates

---

## 7. Center Calculation Algorithm

1. **Centroid**: `avgLat = Σ(lat) / n`, `avgLng = Σ(lng) / n`
2. **Nearest station**: iterate all BTS + MRT + Red Line stations, pick min haversine distance from centroid
3. **Max radius**: `max(haversine(participant, centroid))` for all participants

Centroid is approximate (flat-earth assumption). Works well for Bangkok's scale (<100 km).

---

## 8. File Structure

```
src/
├── main.tsx              — BrowserRouter + routes
├── App.tsx               — unused placeholder (routing replaced it)
├── types.ts              — Room, Participant, Availability, MEMBER_EMOJIS
├── index.css             — design system + all component styles
│
├── pages/
│   ├── LandingPage.tsx   — create room flow
│   └── RoomPage.tsx      — password gate → JoinForm → LiveView
│
├── components/
│   ├── JoinForm.tsx      — 3-step join: name → location → time
│   ├── LocationSearch.tsx — Nominatim search + tap-on-map mini-map
│   ├── TimeSelector.tsx  — date chips + time block grid
│   ├── LiveView.tsx      — map header + MapView + BottomPanel shell
│   ├── MapView.tsx       — Leaflet map (dynamic participants + center)
│   ├── BottomPanel.tsx   — collapsible panel: center card, best times, members
│   └── BestTimeCard.tsx  — top 3 overlapping date+block combos
│
├── hooks/
│   └── useRoom.ts        — Supabase Realtime subscription + initial fetch
│
├── lib/
│   ├── supabase.ts       — Supabase client singleton
│   ├── roomService.ts    — createRoom, getRoomById, joinRoom, getParticipants
│   └── centerCalc.ts     — calcCenter (centroid + nearest station), calcBestTimes
│
└── data/
    └── mapData.ts        — Bangkok transit lines, stations, haversine utility
```

---

## 9. Session Storage Pattern

After joining, the participant's UUID is stored in sessionStorage:

```
sessionStorage["participant_{roomId}"] = "{uuid}"
```

This prevents double-joining and lets `RoomPage` skip the join form on revisit within the same browser session.

---

## 10. Password Security

Client-side SHA-256 via Web Crypto API:

```ts
const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
```

The hash is stored in `rooms.password`. On join, the entered password is hashed and compared.

> **Note**: This prevents casual snooping but is not cryptographically hardened (no salt, no bcrypt). Suitable for MVP social use. For production, move password check to a Supabase Edge Function.

---

## 11. Design System

### Colors
| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0f1117` | App background |
| `--surface` | `#1a1d27` | Cards, header |
| `--card` | `#22263a` | Inner cards, inputs |
| `--text` | `#f0f2ff` | Primary text |
| `--muted` | `#8890b0` | Secondary text |
| `--center` / `--bts` | `#ffd600` / `#1db954` | Accent yellow / BTS green |
| `--mrt` | `#1a56db` | MRT blue |

### Typography
- **Sarabun** (Google Fonts) — Thai + Latin support
- Weights: 400 (body), 600 (UI), 700 (labels), 800 (headings)

### Spacing / Shape
- Border radius: `14–24px` for cards, `12px` for inputs, `20px` for pills
- Mobile-first: all layouts tested at 375px

---

## 12. Virality Mechanics (MVP)

1. **Share link** — `🔗 คัดลอกลิงก์เชิญ` button in BottomPanel copies URL to clipboard
2. **Zero signup friction** — open link → join in 3 taps
3. **Live participant count** in header — social proof drives more joins
4. **7-day expiry** — urgency without permanence
5. **Optional password** — feels exclusive, drives sharing in private groups

---

## 13. Future Features (Post-MVP)

### Phase 2 — Smarter Recommendations
- [ ] Transit-optimized center (minimize total travel time, not just distance)
- [ ] Place recommendations API (Foursquare / Google Places near center station)
- [ ] Travel time estimation (BTS fare calculator)

### Phase 3 — Social Layer
- [ ] Emoji reactions when best time is found ("🎉 everyone's free Saturday!")
- [ ] Celebration animation when all participants overlap on a time
- [ ] Shareable result card (PNG export of the plan)
- [ ] Collaborative voting on location options

### Phase 4 — Persistence
- [ ] Optional account to save past plans
- [ ] Room history in local storage
- [ ] Email/SMS reminder when room has a confirmed plan

### Phase 5 — Growth
- [ ] QR code for room links
- [ ] Preset location types (café, park, mall, restaurant)
- [ ] Multi-city support (not just Bangkok)
- [ ] Embed widget for LINE/Facebook groups

---

## 14. Known Limitations & Mitigations

| Limitation | Mitigation |
|---|---|
| No auth → anyone with link can join | Optional password; MVP scope is friend groups |
| No participant edit/delete | Add DELETE RLS policy gated on sessionStorage token in Phase 2 |
| Centroid ≠ optimal transit point | Phase 2: graph search on transit network |
| Nominatim rate limit (1 req/s) | 500ms debounce on search input |
| Chunk size 607KB | Code-split Leaflet in Phase 2 |
| No push notifications | Web Push API in Phase 3 |

---

## 15. Local Development

```bash
cd Project_G
cp .env.local.example .env.local   # add Supabase creds
npm install
npm run dev                         # http://localhost:5173
```

### Required env vars
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
