<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- UPT facts and rules (doctors, office hours, IGI, dorm) live as pure functions in `src/lib/copilot/upt.ts` and are covered by `src/test/copilot-rules.test.ts` — keeps the rule logic testable and in one place.
- Every AI tool has an offline demo path in `src/lib/copilot/*` and a live path through server functions in `src/lib/copilot/ai.functions.ts` (Lovable AI Gateway) — the app must keep working during demos with no network or credits.
- Shared sign-ups and poll votes are insert-only for visitors; totals are read via security-definer count functions — visitors never read other students' contact details.
- Per-device tool state (router checklist, dorm logger, pass-down) uses the hydration-safe `useLocalStorage` hook — avoids SSR hydration mismatches.
- Virtual Campus (cv.upt.ro, Moodle) access goes through `src/lib/copilot/vc.functions.ts`: the student's password is exchanged once for a Moodle mobile token, which is stored in `vc_connections` (service-role only, no client policies) and only used server-side for the caller's own row — the token grants full account access and must never reach the browser.
