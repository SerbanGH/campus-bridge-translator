import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Faculty } from "./upt";
import type { PollOptionId } from "./poll";

export const signupCountQuery = queryOptions({
  queryKey: ["signup-count"],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("get_signup_count");
    if (error) throw error;
    return data ?? 0;
  },
  refetchInterval: 15_000,
});

export const pollResultsQuery = queryOptions({
  queryKey: ["poll-results"],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("get_poll_results");
    if (error) throw error;
    const counts: Partial<Record<PollOptionId, number>> = {};
    for (const row of data ?? []) counts[row.option_id as PollOptionId] = row.votes;
    return counts;
  },
  refetchInterval: 10_000,
});

export async function submitSignup(input: {
  contact: string;
  homeCountry: string;
  faculty: Faculty;
}) {
  const { error } = await supabase
    .from("beta_signups")
    .insert({
      contact: input.contact.trim(),
      home_country: input.homeCountry.trim(),
      faculty: input.faculty,
    });
  if (error) throw error;
}

export async function submitVote(option: PollOptionId) {
  const { error } = await supabase.from("poll_votes").insert({ option_id: option });
  if (error) throw error;
}
