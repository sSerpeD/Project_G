const NAME_KEY = "meetup_name";
const GUEST_KEY = "meetup_guest";

const GUEST_ANIMALS: [string, string][] = [
  ["Fox", "🦊"],
  ["Panda", "🐼"],
  ["Cat", "🐱"],
  ["Dog", "🐶"],
  ["Frog", "🐸"],
  ["Lion", "🦁"],
  ["Tiger", "🐯"],
  ["Koala", "🐨"],
  ["Bear", "🐻"],
  ["Owl", "🦉"],
  ["Butterfly", "🦋"],
  ["Blossom", "🌸"],
];

export function getDisplayName(): string | null {
  return localStorage.getItem(NAME_KEY);
}

export function setDisplayName(name: string): void {
  localStorage.setItem(NAME_KEY, name);
  localStorage.removeItem(GUEST_KEY);
}

export function setGuestName(): string {
  const [animal, emoji] =
    GUEST_ANIMALS[Math.floor(Math.random() * GUEST_ANIMALS.length)];
  const name = `Guest ${animal} ${emoji}`;
  localStorage.setItem(NAME_KEY, name);
  localStorage.setItem(GUEST_KEY, "true");
  return name;
}

export function isGuest(): boolean {
  return localStorage.getItem(GUEST_KEY) === "true";
}

export function clearIdentity(): void {
  localStorage.removeItem(NAME_KEY);
  localStorage.removeItem(GUEST_KEY);
}
