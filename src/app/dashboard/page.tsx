import { createClient } from "../../../lib/supabase/server";
import { redirect } from "next/navigation";
import Feed from "../../components/Feed";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  return <Feed currentUser={data.user.user_metadata.username || "User"} />;
}