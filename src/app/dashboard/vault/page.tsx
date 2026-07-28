import { createClient } from "../../../../lib/supabase/server";
import { redirect } from "next/navigation";
import VaultInterface from "../../../components/VaultInterface";

export default async function VaultPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  return <VaultInterface user={data.user} />;
}