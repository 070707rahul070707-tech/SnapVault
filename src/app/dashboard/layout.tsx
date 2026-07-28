import ShootingStars from "../../components/ShootingStars";
import NavigationBar from "../../components/NavigationBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-transparent text-white overflow-hidden flex flex-col">
      
      {/* Your established Shooting Stars Background */}
      <ShootingStars />

      {/* Main Content Area - Padding bottom (pb-32) ensures content isn't hidden behind the floating bar */}
      <main className="flex-1 relative z-10 w-full h-screen overflow-y-auto pb-32">
        {children}
      </main>

      {/* Floating Pill Navigation */}
      <NavigationBar />
      
    </div>
  );
}