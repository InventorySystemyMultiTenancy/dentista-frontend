import { RequireRole } from "@/components/RequireRole";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={["ADMIN", "EMPLOYEE"]}>
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </RequireRole>
  );
}
