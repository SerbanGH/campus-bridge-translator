import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Languages,
  CalendarClock,
  Route as RouteIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FACULTIES, FACULTY_NAMES, type Faculty } from "@/lib/copilot/upt";
import { signupCountQuery, submitSignup } from "@/lib/copilot/shared";
import { testerLabel } from "@/lib/copilot/poll";
import { useLocalStorage } from "@/lib/copilot/use-local-storage";

export function Hero() {
  const qc = useQueryClient();
  const { data: count } = useQuery(signupCountQuery);
  const [contact, setContact] = useState("");
  const [country, setCountry] = useState("");
  const [faculty, setFaculty] = useState<Faculty | "">("");
  const [joined, setJoined] = useLocalStorage<string | null>("upt-beta-joined", null);

  const mutation = useMutation({
    mutationFn: submitSignup,
    onSuccess: (_d, v) => {
      setJoined(v.contact);
      qc.setQueryData(signupCountQuery.queryKey, (c) => (c ?? 0) + 1);
      qc.invalidateQueries({ queryKey: signupCountQuery.queryKey });
      toast.success("You're on the UPT beta list!");
    },
    onError: () => toast.error("Couldn't save your sign-up — please try again."),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contact.trim().length < 2) {
      toast.error("Add your name, WhatsApp or email");
      return;
    }
    if (country.trim().length < 2) {
      toast.error("Add your home country");
      return;
    }
    if (!faculty) {
      toast.error("Pick your UPT faculty");
      return;
    }
    mutation.mutate({ contact, homeCountry: country, faculty });
  };

  return (
    <section id="top" className="relative overflow-hidden bg-hero text-navy-foreground">
      <div className="grid-lines pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-8 sm:pt-12 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:pb-24">
        <div>
          <Badge
            variant="navy"
            className="mb-6 gap-2 rounded-full px-3 py-1 text-[11px] font-medium sm:text-xs"
          >
            <span className="size-1.5 rounded-full bg-success animate-pulse-dot" />
            Built specifically for UPT Timișoara • Goes beyond generic EU checklists
          </Badge>
          <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
            Navigate UPT Like a Local — <span className="text-success">From Day One</span> to Exam
            Session.
          </h1>
          <p className="mt-5 max-w-xl text-base text-navy-muted sm:text-lg">
            The hyper-local AI copilot that translates Romanian Virtual Campus courses, resolves
            cross-faculty timetable clashes, and guides you through UPT paperwork.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2 text-xs sm:text-sm">
            {[
              { icon: Languages, t: "Romanian → English labs" },
              { icon: CalendarClock, t: "Timetable clash checks" },
              { icon: RouteIcon, t: "Office hours, live" },
            ].map(({ icon: Icon, t }) => (
              <li
                key={t}
                className="flex items-center gap-1.5 rounded-full border border-navy-border px-3 py-1.5 text-navy-foreground/90"
              >
                <Icon className="size-3.5 text-success" /> {t}
              </li>
            ))}
          </ul>
        </div>

        <div id="beta" className="rounded-2xl bg-card p-5 text-card-foreground shadow-card sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Get early access</h2>
              <p className="text-sm text-muted-foreground">Free beta for UPT Erasmus students</p>
            </div>
            <Badge variant="success" className="shrink-0 gap-1.5 rounded-full px-2.5 py-1">
              <span className="size-1.5 rounded-full bg-success animate-pulse-dot" /> Live
            </Badge>
          </div>
          <div className="mb-5 rounded-xl bg-success-soft px-4 py-3">
            <p className="font-display text-3xl font-extrabold text-success" aria-live="polite">
              {count === undefined ? "32+" : testerLabel(count)}
            </p>
            <p className="text-sm font-medium text-foreground">
              UPT Erasmus students already testing
            </p>
          </div>

          {joined ? (
            <div className="flex items-start gap-3 rounded-xl border border-success/30 p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              <div className="text-sm">
                <p className="font-semibold">You're in, {joined}!</p>
                <p className="text-muted-foreground">
                  We'll message you when your faculty's beta opens. Try the workspace below
                  meanwhile.
                </p>
                <button
                  type="button"
                  className="mt-2 text-xs font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => setJoined(null)}
                >
                  Sign up another student
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="contact">Name or WhatsApp / Email</Label>
                <Input
                  id="contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Elif · +90 5xx or elif@uni.edu"
                  maxLength={120}
                  className="h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="country">Home country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Türkiye"
                    maxLength={60}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>UPT faculty</Label>
                  <Select value={faculty} onValueChange={(v) => setFaculty(v as Faculty)}>
                    <SelectTrigger className="h-11" aria-label="UPT faculty">
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      {FACULTIES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f} <span className="text-muted-foreground">· {FACULTY_NAMES[f]}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="submit"
                variant="hero"
                size="xl"
                className="w-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Joining…" : "Join Beta"} <ArrowRight />
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
