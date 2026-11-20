// Server-only helpers for UPT Virtual Campus (cv.upt.ro, Moodle) web services.
export const VC_BASE = "https://cv.upt.ro";

type MoodleError = { exception?: string; errorcode?: string; message?: string; error?: string };

export class VcError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export async function vcLogin(username: string, password: string) {
  const body = new URLSearchParams({ username, password, service: "moodle_mobile_app" });
  const res = await fetch(`${VC_BASE}/login/token.php`, {
    method: "POST",
    body,
    redirect: "manual",
  });
  if (!res.ok) throw new VcError(`Virtual Campus didn't answer (${res.status}). Try again later.`);
  const json = (await res.json()) as { token?: string } & MoodleError;
  if (!json.token) {
    if (json.errorcode === "invalidlogin")
      throw new VcError("Wrong Virtual Campus username or password.", "invalidlogin");
    throw new VcError(json.error ?? "Virtual Campus refused the sign-in.", json.errorcode);
  }
  return json.token;
}

export async function vcCall<T>(
  token: string,
  wsfunction: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  const body = new URLSearchParams({ wstoken: token, wsfunction, moodlewsrestformat: "json" });
  for (const [k, v] of Object.entries(params)) body.set(k, String(v));
  const res = await fetch(`${VC_BASE}/webservice/rest/server.php`, {
    method: "POST",
    body,
    redirect: "manual",
  });
  if (!res.ok) throw new VcError(`Virtual Campus didn't answer (${res.status}).`);
  const json = (await res.json()) as T & MoodleError;
  if (json && typeof json === "object" && "exception" in json && json.exception) {
    if (json.errorcode === "invalidtoken")
      throw new VcError("Your Virtual Campus connection expired — connect again.", "invalidtoken");
    throw new VcError(json.message ?? "Virtual Campus returned an error.", json.errorcode);
  }
  return json;
}

export function htmlToText(html: string) {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_m, n: string) => String.fromCharCode(Number(n)))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function withToken(fileUrl: string, token: string) {
  const url = new URL(fileUrl);
  if (url.origin !== VC_BASE) throw new VcError("File is not on the Virtual Campus.");
  url.searchParams.set("token", token);
  return url.toString();
}
