import { createFileRoute } from "@tanstack/react-router";
import { AiModeProvider } from "@/components/copilot/ai-mode";
import { Comparison } from "@/components/copilot/comparison";
import { Footer } from "@/components/copilot/footer";
import { Hero } from "@/components/copilot/hero";
import { Poll } from "@/components/copilot/poll";
import { SiteNav } from "@/components/copilot/site-nav";
import { Workspace } from "@/components/copilot/workspace";

const TITLE = "Erasmus Copilot UPT — AI assistant for Erasmus students in Timișoara";
const DESC = "Translate Romanian Virtual Campus labs, fix cross-faculty timetable clashes and get UPT paperwork steps with real office hours.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AiModeProvider>
      <SiteNav />
      <main>
        <Hero />
        <Workspace />
        <Poll />
        <Comparison />
      </main>
      <Footer />
    </AiModeProvider>
  );
}
