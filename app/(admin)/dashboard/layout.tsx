import { RequireRole } from "@/components/RequireRole";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={["ADMIN", "EMPLOYEE"]}>
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar />
        <main className="relative flex-1 overflow-y-auto">
          <div
            className="fixed inset-0 -z-10 scale-105 bg-cover bg-center blur-[2px]"
            style={{ backgroundImage: "url(/dentist-patient.jpg)" }}
          />
          <div className="fixed inset-0 -z-10 bg-gradient-to-b from-white/55 via-white/40 to-white/55" />
          <div className="relative p-4 md:p-6">{children}</div>
        </main>
      </div>
    </RequireRole>
  );
}
