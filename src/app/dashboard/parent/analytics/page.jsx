import { createClient } from "@/lib/supabase/server";
import ParentAnalytics from "./ParentAnalytics";

export default async function Page({ searchParams }) {
  const supabase = createClient();
  const scholarId = searchParams.scholar;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <ParentAnalytics scholar={null} results={[]} />;
  }

  const { data: scholar } = await supabase
    .from("scholars")
    .select("*")
    .eq("parent_id", user.id)
    .eq("id", scholarId)
    .single();

  const { data: results } = await supabase
    .from("quiz_results")
    .select("*")
    .eq("scholar_id", scholar?.id)
    .order("completed_at", { ascending: true });

  return (
    <ParentAnalytics
      scholar={scholar}
      results={results || []}
    />
  );
}