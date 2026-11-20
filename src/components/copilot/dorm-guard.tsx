import { useMemo, useRef, useState } from "react";
import {
  BellRing,
  Camera,
  Download,
  HandHeart,
  PackageOpen,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DORM_DEPOSIT_RON } from "@/lib/copilot/upt";
import {
  DEMO_OFFERS,
  matchOffers,
  PASSDOWN_ITEMS,
  type Offer,
  type PassdownItem,
} from "@/lib/copilot/passdown";
import { useLocalStorage } from "@/lib/copilot/use-local-storage";

const AREAS = [
  "Walls & paint",
  "Floor",
  "Mattress & bed frame",
  "Desk & chair",
  "Wardrobe",
  "Window & blinds",
  "Door & lock",
  "Shower & sink",
  "Sockets & lights",
] as const;
type Condition = "ok" | "wear" | "damaged";
type Photo = { id: string; name: string; takenAt: number; loggedAt: number; thumb: string };

function makeThumb(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = 240 / Math.max(img.width, img.height);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

const fmt = (t: number) =>
  new Date(t).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function download(name: string, content: string, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function DormGuard() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <RoomLogger />
      <PassDown />
    </div>
  );
}

function RoomLogger() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [room, setRoom] = useLocalStorage("upt-dorm-room", "");
  const [photos, setPhotos] = useLocalStorage<Photo[]>("upt-dorm-photos", []);
  const [conditions, setConditions] = useLocalStorage<Record<string, Condition>>(
    "upt-dorm-cond",
    {},
  );
  const [departure, setDeparture] = useLocalStorage("upt-dorm-departure", "");

  const addPhotos = async (files: FileList) => {
    const list = Array.from(files).slice(0, 12 - photos.length);
    const added: Photo[] = [];
    for (const f of list) {
      try {
        added.push({
          id: crypto.randomUUID(),
          name: f.name,
          takenAt: f.lastModified,
          loggedAt: Date.now(),
          thumb: await makeThumb(f),
        });
      } catch {
        toast.error(`Couldn't read ${f.name}`);
      }
    }
    setPhotos((p) => [...p, ...added]);
    if (added.length)
      toast.success(`${added.length} photo${added.length > 1 ? "s" : ""} timestamped`);
  };

  const reminder = departure
    ? new Date(new Date(`${departure}T09:00:00`).getTime() - 14 * 86_400_000)
    : null;

  const report = () => {
    const lines = [
      `DORM 11C — MOVE-IN CONDITION REPORT`,
      `Room: ${room || "[room number]"} · Generated: ${fmt(Date.now())}`,
      `Purpose: evidence for the ${DORM_DEPOSIT_RON} RON warranty refund`,
      "",
      "CHECKLIST",
      ...AREAS.map(
        (a) =>
          `- ${a}: ${{ ok: "OK", wear: "Minor wear (pre-existing)", damaged: "DAMAGED (pre-existing)" }[conditions[a] ?? "ok"]}`,
      ),
      "",
      `PHOTOS (${photos.length})`,
      ...photos.map((p) => `- ${p.name} · taken ${fmt(p.takenAt)} · logged ${fmt(p.loggedAt)}`),
      "",
      departure
        ? `Departure: ${departure} · Reminder: ${reminder?.toISOString().slice(0, 10)}`
        : "",
    ];
    download(`dorm-11C-${room || "room"}-condition.txt`, lines.join("\n"), "text/plain");
  };

  const ics = () => {
    if (!reminder) return;
    const d = reminder.toISOString().replace(/[-:]/g, "").slice(0, 8);
    const body = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Erasmus Copilot UPT//EN",
      "BEGIN:VEVENT",
      `UID:${crypto.randomUUID()}`,
      `DTSTART;VALUE=DATE:${d}`,
      `SUMMARY:Dorm 11C check-out prep — protect your ${DORM_DEPOSIT_RON} RON warranty`,
      "DESCRIPTION:Compare your room with your day-1 photos, fix or report anything new and book the check-out inspection.",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    download("dorm-11C-checkout-reminder.ics", body, "text/calendar");
  };

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <ShieldCheck className="size-5 text-success" />
        <h3 className="flex-1 whitespace-nowrap font-bold">Day-1 Room Condition Logger</h3>
        <Badge variant="success">{DORM_DEPOSIT_RON} RON protected</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="room">Room</Label>
          <Input
            id="room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="11C · 214"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="departure">Departure date</Label>
          <Input
            id="departure"
            type="date"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
          />
        </div>
      </div>

      <div>
        <div className="grid grid-cols-4 gap-2">
          {photos.map((p) => (
            <figure key={p.id} className="group relative overflow-hidden rounded-lg border">
              <img src={p.thumb} alt={p.name} className="aspect-square w-full object-cover" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-navy/80 px-1 py-0.5 font-mono text-[9px] text-navy-foreground">
                {fmt(p.takenAt)}
              </figcaption>
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))}
                className="absolute right-1 top-1 hidden rounded bg-card/90 p-1 group-hover:block"
              >
                <Trash2 className="size-3" />
              </button>
            </figure>
          ))}
          {photos.length < 12 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="grid aspect-square place-items-center rounded-lg border border-dashed text-muted-foreground hover:bg-muted"
            >
              <span className="flex flex-col items-center gap-1 text-[11px]">
                <Camera className="size-5" />
                Add photos
              </span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files && addPhotos(e.target.files)}
        />
      </div>

      <ul className="divide-y rounded-lg border">
        {AREAS.map((a) => (
          <li key={a} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
            <span>{a}</span>
            <div className="flex rounded-md bg-muted p-0.5 text-[11px]">
              {(["ok", "wear", "damaged"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setConditions((s) => ({ ...s, [a]: c }))}
                  className={`rounded px-2 py-1 font-medium ${(conditions[a] ?? "ok") === c ? (c === "ok" ? "bg-success text-success-foreground" : c === "wear" ? "bg-warning text-warning-foreground" : "bg-destructive text-destructive-foreground") : "text-muted-foreground"}`}
                >
                  {c === "ok" ? "OK" : c === "wear" ? "Wear" : "Damage"}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {reminder && (
        <p className="flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-sm text-accent-foreground">
          <BellRing className="size-4 shrink-0" /> Check-out reminder set for{" "}
          <b>
            {reminder.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </b>{" "}
          — 2 weeks before you leave.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={report}>
          <Download /> Download checklist
        </Button>
        <Button type="button" variant="outline" onClick={ics} disabled={!reminder}>
          <BellRing /> Add reminder to calendar
        </Button>
      </div>
    </div>
  );
}

function PassDown() {
  const [needs, setNeeds] = useState<PassdownItem[]>(["Pots & pans", "Pillow", "Hairdryer"]);
  const [myOffers, setMyOffers] = useLocalStorage<Offer[]>("upt-passdown-offers", []);
  const [requested, setRequested] = useLocalStorage<string[]>("upt-passdown-requested", []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", room: "", leaves: "", items: [] as PassdownItem[] });

  const offers = useMemo(() => [...myOffers, ...DEMO_OFFERS], [myOffers]);
  const matches = matchOffers(offers, needs);
  const toggle = <T,>(arr: T[], v: T) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const addOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.items.length === 0) {
      toast.error("Add your name and at least one item");
      return;
    }
    setMyOffers((o) => [
      {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        country: "",
        room: form.room.trim() || "11C",
        leaves: form.leaves,
        items: form.items,
      },
      ...o,
    ]);
    setForm({ name: "", room: "", leaves: "", items: [] });
    setShowForm(false);
    toast.success("Your items are listed for arriving students");
  };

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <HandHeart className="size-5 text-primary" />
        <h3 className="flex-1 whitespace-nowrap font-bold">Kitchen & Bedding Pass-Down</h3>
        <Button type="button" size="sm" variant="soft" onClick={() => setShowForm((s) => !s)}>
          <Plus /> I'm leaving
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Dorm 11C doesn't provide cookware, pillows or hairdryers. Pick what you need — we match you
        with departing students.
      </p>

      {showForm && (
        <form onSubmit={addOffer} className="space-y-3 rounded-lg border bg-muted/50 p-3">
          <div className="grid grid-cols-3 gap-2">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              maxLength={40}
            />
            <Input
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
              placeholder="Room"
              maxLength={20}
            />
            <Input
              type="date"
              value={form.leaves}
              onChange={(e) => setForm({ ...form, leaves: e.target.value })}
              aria-label="Leaving on"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PASSDOWN_ITEMS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setForm({ ...form, items: toggle(form.items, i) })}
                className={`rounded-full border px-2.5 py-1 text-xs ${form.items.includes(i) ? "border-success bg-success text-success-foreground" : "bg-card"}`}
              >
                {i}
              </button>
            ))}
          </div>
          <Button type="submit" size="sm" variant="success">
            List my items
          </Button>
        </form>
      )}

      <div>
        <Label className="mb-1.5 block">I'm arriving and need…</Label>
        <div className="flex flex-wrap gap-1.5">
          {PASSDOWN_ITEMS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setNeeds((n) => toggle(n, i))}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${needs.includes(i) ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-2">
        {matches.length === 0 && (
          <li className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Pick items above to see matches.
          </li>
        )}
        {matches.map(({ offer, matched }) => (
          <li key={offer.id} className="flex items-center gap-3 rounded-lg border p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-sm font-bold text-primary">
              {offer.name.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {offer.name}{" "}
                <span className="font-normal text-muted-foreground">
                  {offer.country} · {offer.room}
                  {offer.leaves
                    ? ` · leaves ${new Date(offer.leaves).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                    : ""}
                </span>
              </p>
              <p className="flex flex-wrap gap-1 pt-1">
                {matched.map((m) => (
                  <Badge key={m} variant="success" className="text-[10px]">
                    {m}
                  </Badge>
                ))}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant={requested.includes(offer.id) ? "success" : "outline"}
              onClick={() => {
                setRequested((r) => toggle(r, offer.id));
                if (!requested.includes(offer.id)) toast.success(`Request sent to ${offer.name}`);
              }}
            >
              <PackageOpen /> {requested.includes(offer.id) ? "Requested" : "Request"}
            </Button>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        Sample listings for the demo; your own listings stay on this phone.
      </p>
    </div>
  );
}
