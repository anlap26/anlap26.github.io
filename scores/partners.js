export const PARTNERS = [
  { id: "aviasales", name: "Aviasales", hint: "Flights", href: "https://aviasales.tpx.lt/1sQ7N99K" },
  { id: "klook", name: "Klook", hint: "Tickets and tours", href: "https://klook.tpx.lt/xtutlwca" },
  { id: "kiwitaxi", name: "Kiwitaxi", hint: "Transfers", href: "https://kiwitaxi.tpx.lt/pmM77dyU" },
  { id: "welcome", name: "Welcome Pickups", hint: "Airport transfers", href: "https://tpx.lt/sJrz0dYS" },
  { id: "airalo", name: "Airalo", hint: "eSIM", href: "https://airalo.tpx.lt/nILAEUYZ" },
  { id: "yesim", name: "Yesim", hint: "eSIM", href: "https://yesim.tpx.lt/L3JvkZOj" },
];

export function amazonSearch(query) {
  const cleaned = String(query || "football boots jersey ball").replace(/\s+/g, " ").trim().slice(0, 80);
  return `https://www.amazon.de/s?k=${encodeURIComponent(cleaned)}&tag=cynews24-21`;
}
