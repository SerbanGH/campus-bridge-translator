export const PASSDOWN_ITEMS = [
  "Pots & pans",
  "Plates & cutlery",
  "Kettle",
  "Pillow",
  "Duvet & bedding",
  "Hairdryer",
  "Desk lamp",
] as const;
export type PassdownItem = (typeof PASSDOWN_ITEMS)[number];

export type Offer = {
  id: string;
  name: string;
  country: string;
  room: string;
  leaves: string;
  items: PassdownItem[];
  demo?: boolean;
};

export const DEMO_OFFERS: Offer[] = [
  {
    id: "d1",
    name: "Lukas",
    country: "🇩🇪 Germany",
    room: "11C · 214",
    leaves: "2027-01-28",
    items: ["Pots & pans", "Kettle", "Pillow"],
    demo: true,
  },
  {
    id: "d2",
    name: "Marta",
    country: "🇪🇸 Spain",
    room: "11C · 307",
    leaves: "2027-02-02",
    items: ["Hairdryer", "Duvet & bedding", "Plates & cutlery"],
    demo: true,
  },
  {
    id: "d3",
    name: "Emre",
    country: "🇹🇷 Türkiye",
    room: "11C · 118",
    leaves: "2027-01-31",
    items: ["Kettle", "Pots & pans", "Plates & cutlery", "Desk lamp"],
    demo: true,
  },
  {
    id: "d4",
    name: "Chiara",
    country: "🇮🇹 Italy",
    room: "11C · 402",
    leaves: "2027-02-05",
    items: ["Pillow", "Duvet & bedding", "Hairdryer"],
    demo: true,
  },
];

export function matchOffers(offers: Offer[], needs: PassdownItem[]) {
  if (needs.length === 0) return [];
  return offers
    .map((o) => ({ offer: o, matched: o.items.filter((i) => needs.includes(i)) }))
    .filter((m) => m.matched.length > 0)
    .sort((a, b) => b.matched.length - a.matched.length);
}
