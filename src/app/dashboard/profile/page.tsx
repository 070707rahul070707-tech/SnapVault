import { createClient } from "../../../../lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileInterface from "../../../components/ProfileInterface";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  return <ProfileInterface user={data.user} />;
}