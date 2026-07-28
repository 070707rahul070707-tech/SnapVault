import { createClient } from "../../../lib/supabase/server";

import { redirect } from "next/navigation";

import AuthForm from "./AuthForm";

import StarBackground from "../../components/StarBackground";

import SplashScreen from "../../components/SplashScreen";



export const metadata = {

  title: "Login | SnapVault",

  description: "Sign in to your private photo gallery.",

};



export default async function LoginPage() {

  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();



  if (data?.user) {

    redirect("/dashboard");

  }



  return (

    <SplashScreen>

      <main className="relative min-h-screen flex items-center justify-center p-4 bg-[#0A0A0A] overflow-hidden">

        <StarBackground />

        <AuthForm />

      </main>

    </SplashScreen>

  );

}