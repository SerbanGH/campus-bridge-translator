import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type VcCourse = { id: number; fullname: string; shortname: string };
export type VcItem =
  | { kind: "announcement"; id: string; title: string; date: number; text: string }
  | {
      kind: "file";
      id: string;
      title: string;
      date: number;
      section: string;
      fileUrl: string;
      mimetype: string;
      size: number;
    }
  | { kind: "page"; id: string; title: string; date: number; section: string; text: string };

// The Virtual Campus key lives in a table only server code can read; every query is scoped to the caller's own row.
async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function loadConnection(userId: string) {
  const db = await admin();
  const { data, error } = await db
    .from("vc_connections")
    .select("token, moodle_user_id, fullname")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("Couldn't load your Virtual Campus connection.");
  if (!data) throw new Error("Connect your Virtual Campus first.");
  return data;
}

function friendly(err: unknown): never {
  if (err instanceof Error) throw new Error(err.message);
  throw new Error("Something went wrong talking to Virtual Campus.");
}

export const vcStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    const { data } = await db
      .from("vc_connections")
      .select("fullname")
      .eq("user_id", context.userId)
      .maybeSingle();
    return { connected: !!data, fullname: data?.fullname ?? null };
  });

export const vcConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ username: z.string().trim().min(1).max(100), password: z.string().min(1).max(200) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { vcLogin, vcCall } = await import("./vc.server");
    try {
      // The password is only used for this one exchange and is never stored.
      const token = await vcLogin(data.username, data.password);
      const info = await vcCall<{ userid: number; fullname: string }>(
        token,
        "core_webservice_get_site_info",
      );
      const db = await admin();
      const { error } = await db
        .from("vc_connections")
        .upsert({
          user_id: context.userId,
          token,
          moodle_user_id: info.userid,
          fullname: info.fullname,
        });
      if (error) throw new Error("Couldn't save your Virtual Campus connection.");
      return { fullname: info.fullname };
    } catch (e) {
      friendly(e);
    }
  });

export const vcDisconnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin();
    await db.from("vc_connections").delete().eq("user_id", context.userId);
    return { ok: true };
  });

export const vcCourses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VcCourse[]> => {
    const { vcCall } = await import("./vc.server");
    const conn = await loadConnection(context.userId);
    try {
      const list = await vcCall<{ id: number; fullname: string; shortname: string }[]>(
        conn.token,
        "core_enrol_get_users_courses",
        { userid: conn.moodle_user_id },
      );
      return list.map(({ id, fullname, shortname }) => ({ id, fullname, shortname }));
    } catch (e) {
      friendly(e);
    }
  });

type Forum = { id: number; type: string; name: string };
type Discussion = {
  id: number;
  discussion: number;
  name: string;
  subject: string;
  message: string;
  timemodified: number;
  created?: number;
};
type Section = {
  name: string;
  modules: {
    id: number;
    name: string;
    modname: string;
    description?: string;
    contents?: {
      type: string;
      filename: string;
      fileurl: string;
      mimetype?: string;
      filesize: number;
      timemodified: number;
    }[];
  }[];
};

export const vcCourseItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ courseId: z.number().int().positive() }).parse(d))
  .handler(async ({ data, context }): Promise<VcItem[]> => {
    const { vcCall, htmlToText } = await import("./vc.server");
    const conn = await loadConnection(context.userId);
    try {
      const items: VcItem[] = [];
      const forums = await vcCall<Forum[]>(conn.token, "mod_forum_get_forums_by_courses", {
        "courseids[0]": data.courseId,
      }).catch(() => [] as Forum[]);
      const news = forums.find((f) => f.type === "news") ?? forums[0];
      if (news) {
        const res = await vcCall<{ discussions: Discussion[] }>(
          conn.token,
          "mod_forum_get_forum_discussions",
          { forumid: news.id, sortorder: 1, perpage: 15 },
        ).catch(() => ({ discussions: [] as Discussion[] }));
        for (const d of res.discussions) {
          items.push({
            kind: "announcement",
            id: `d${d.discussion}`,
            title: d.subject || d.name,
            date: d.timemodified,
            text: htmlToText(`${d.subject}\n\n${d.message}`),
          });
        }
      }
      const sections = await vcCall<Section[]>(conn.token, "core_course_get_contents", {
        courseid: data.courseId,
      });
      for (const s of sections) {
        for (const m of s.modules) {
          if (m.modname === "resource" || m.modname === "folder") {
            for (const c of m.contents ?? []) {
              if (c.type !== "file") continue;
              const mime = c.mimetype ?? "";
              if (!(mime === "application/pdf" || mime.startsWith("text/"))) continue;
              items.push({
                kind: "file",
                id: `f${m.id}-${c.filename}`,
                title: c.filename,
                date: c.timemodified,
                section: s.name,
                fileUrl: c.fileurl,
                mimetype: mime,
                size: c.filesize,
              });
            }
          } else if (
            (m.modname === "page" || m.modname === "label" || m.modname === "assign") &&
            m.description
          ) {
            const text = htmlToText(m.description);
            if (text.length > 40)
              items.push({
                kind: "page",
                id: `p${m.id}`,
                title: m.name,
                date: 0,
                section: s.name,
                text,
              });
          }
        }
      }
      return items.slice(0, 60);
    } catch (e) {
      friendly(e);
    }
  });

export const vcFetchFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ fileUrl: z.string().url().max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { withToken, VcError } = await import("./vc.server");
    const conn = await loadConnection(context.userId);
    try {
      const res = await fetch(withToken(data.fileUrl, conn.token), { redirect: "manual" });
      if (!res.ok) throw new VcError(`Couldn't download the file (${res.status}).`);
      const type = res.headers.get("content-type") ?? "";
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength > 5_000_000)
        throw new VcError("This file is larger than 5 MB — open it on Virtual Campus instead.");
      if (type.includes("pdf")) {
        let bin = "";
        for (let i = 0; i < buf.length; i += 0x8000)
          bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        return { kind: "pdf" as const, dataUrl: `data:application/pdf;base64,${btoa(bin)}` };
      }
      return { kind: "text" as const, text: new TextDecoder().decode(buf).slice(0, 20000) };
    } catch (e) {
      friendly(e);
    }
  });
