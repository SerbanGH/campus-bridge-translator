import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  FileText,
  GraduationCap,
  Link2,
  Loader2,
  LogOut,
  Megaphone,
  ShieldCheck,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  vcConnect,
  vcCourseItems,
  vcCourses,
  vcDisconnect,
  vcFetchFile,
  vcStatus,
  type VcItem,
} from "@/lib/copilot/vc.functions";

export type VcPick = { title: string; text: string } | { title: string; pdfDataUrl: string };

export function VirtualCampusPanel({ onPick }: { onPick: (p: VcPick) => void }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user)
    return (
      <Shell>
        <p className="flex-1 text-sm">
          <span className="font-semibold">Skip the copy-paste.</span>{" "}
          <span className="text-muted-foreground">
            Connect your Virtual Campus and pick any announcement or lab file.
          </span>
        </p>
        <Button asChild size="sm">
          <Link to="/auth">
            <Link2 /> Sign in to connect
          </Link>
        </Button>
      </Shell>
    );
  return <ConnectedInner userKey={user.id} onPick={onPick} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary-soft/60 p-3">
      {children}
    </div>
  );
}

function ConnectedInner({
  userKey,
  onPick,
}: {
  userKey: string;
  onPick?: ((p: VcPick) => void) | undefined;
}) {
  const qc = useQueryClient();
  const status = useServerFn(vcStatus);
  const connect = useServerFn(vcConnect);
  const disconnect = useServerFn(vcDisconnect);
  const statusQ = useQuery({ queryKey: ["vc-status", userKey], queryFn: () => status() });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const connectM = useMutation({
    mutationFn: () => connect({ data: { username, password } }),
    onSuccess: (r) => {
      setPassword("");
      toast.success(`Connected as ${r?.fullname ?? "you"}`);
      qc.invalidateQueries({ queryKey: ["vc-status", userKey] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't connect"),
  });

  if (statusQ.isLoading)
    return (
      <Shell>
        <Loader2 className="size-4 animate-spin" />{" "}
        <span className="text-sm">Checking your Virtual Campus…</span>
      </Shell>
    );

  if (!statusQ.data?.connected)
    return (
      <form
        className="space-y-3 rounded-xl border border-primary/30 bg-primary-soft/60 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!username.trim() || !password) {
            toast.error("Enter your Virtual Campus username and password");
            return;
          }
          connectM.mutate();
        }}
      >
        <p className="flex items-center gap-2 text-sm font-semibold">
          <GraduationCap className="size-4 text-primary" /> Connect your Virtual Campus (cv.upt.ro)
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Virtual Campus username or email"
            autoComplete="username"
            aria-label="Virtual Campus username"
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            aria-label="Virtual Campus password"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-success" /> Used once to get your personal key —
            your password is never saved.
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => supabase.auth.signOut()}>
              Sign out
            </Button>
            <Button type="submit" size="sm" disabled={connectM.isPending}>
              {connectM.isPending ? <Loader2 className="animate-spin" /> : <Link2 />} Connect
            </Button>
          </div>
        </div>
      </form>
    );

  return (
    <CoursePicker
      fullname={statusQ.data.fullname ?? ""}
      onPick={onPick}
      onDisconnect={async () => {
        await disconnect();
        qc.invalidateQueries({ queryKey: ["vc-status", userKey] });
        toast("Virtual Campus disconnected");
      }}
    />
  );
}

const ICON = { announcement: Megaphone, file: FileText, page: StickyNote } as const;

function CoursePicker({
  fullname,
  onPick,
  onDisconnect,
}: {
  fullname: string;
  onPick?: ((p: VcPick) => void) | undefined;
  onDisconnect: () => void;
}) {
  const courses = useServerFn(vcCourses);
  const items = useServerFn(vcCourseItems);
  const fetchFile = useServerFn(vcFetchFile);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const coursesQ = useQuery({ queryKey: ["vc-courses"], queryFn: () => courses() });
  const itemsQ = useQuery({
    queryKey: ["vc-items", courseId],
    queryFn: () => items({ data: { courseId: courseId ?? 0 } }),
    enabled: courseId !== null,
  });

  const pick = async (it: VcItem) => {
    if (!onPick) return;
    if (it.kind !== "file") {
      onPick({ title: it.title, text: it.text });
      return;
    }
    setLoadingId(it.id);
    try {
      const f = await fetchFile({ data: { fileUrl: it.fileUrl } });
      if (f?.kind === "pdf") onPick({ title: it.title, pdfDataUrl: f.dataUrl });
      else if (f?.kind === "text") onPick({ title: it.title, text: f.text });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't open the file");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-primary/30 bg-primary-soft/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="live" className="gap-1">
          <GraduationCap className="size-3" /> Virtual Campus
        </Badge>
        <span className="flex-1 truncate text-sm font-medium">{fullname}</span>
        <Button type="button" size="sm" variant="ghost" onClick={onDisconnect}>
          <LogOut /> Disconnect
        </Button>
      </div>
      {coursesQ.isError ? (
        <p className="text-sm text-destructive">
          {coursesQ.error instanceof Error ? coursesQ.error.message : "Couldn't load courses"}
        </p>
      ) : (
        <Select
          value={courseId ? String(courseId) : ""}
          onValueChange={(v) => setCourseId(Number(v))}
          disabled={coursesQ.isLoading}
        >
          <SelectTrigger aria-label="Course" className="bg-card">
            <SelectValue
              placeholder={
                coursesQ.isLoading
                  ? "Loading your courses…"
                  : `Pick a course (${coursesQ.data?.length ?? 0})`
              }
            />
          </SelectTrigger>
          <SelectContent>
            {(coursesQ.data ?? []).map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.fullname}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {courseId !== null && (
        <div className="max-h-64 space-y-1.5 overflow-auto">
          {itemsQ.isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading announcements and files…
            </p>
          )}
          {itemsQ.isError && (
            <p className="text-sm text-destructive">
              {itemsQ.error instanceof Error ? itemsQ.error.message : "Couldn't load this course"}
            </p>
          )}
          {itemsQ.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No announcements or readable files in this course yet.
            </p>
          )}
          {itemsQ.data?.map((it) => {
            const Icon = ICON[it.kind];
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => pick(it)}
                disabled={loadingId !== null}
                className="flex w-full items-center gap-2.5 rounded-lg bg-card px-3 py-2 text-left text-sm hover:ring-1 hover:ring-primary disabled:opacity-60"
              >
                {loadingId === it.id ? (
                  <Loader2 className="size-4 shrink-0 animate-spin" />
                ) : (
                  <Icon className="size-4 shrink-0 text-primary" />
                )}
                <span className="min-w-0 flex-1 truncate">{it.title}</span>
                {it.date > 0 && (
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {new Date(it.date * 1000).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
