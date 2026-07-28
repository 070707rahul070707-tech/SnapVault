import { createClient } from "../../../../lib/supabase/server";
import { redirect } from "next/navigation";
import ChatInterface from "../../../components/ChatInterface";

export default async function ChatsPage() {
  // STRICT SECURITY CHECK
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  return <ChatInterface currentUser={data.user.user_metadata.username || "User"} />;
}