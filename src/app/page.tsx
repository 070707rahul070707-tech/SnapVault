import { createClient } from "../../lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // If the user is already logged in, send them straight to the dashboard
  if (data?.user) {
    redirect("/dashboard");
  }

  // Otherwise, send them to the login/splash screen
  redirect("/login");
}