import { Sidebar } from "@/components/layout/sidebar";
import { TourGuide } from "@/components/tour/tour-guide";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 min-h-screen flex-1">{children}</main>
      <TourGuide />
    </div>
  );
}
