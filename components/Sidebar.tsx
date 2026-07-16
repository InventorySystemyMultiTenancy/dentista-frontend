"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Visão geral", module: null },
  { href: "/dashboard/pacientes", label: "Pacientes", module: "patients" },
  { href: "/dashboard/agenda", label: "Agenda", module: "agenda" },
  { href: "/dashboard/exames", label: "Exames", module: "exams" },
  { href: "/dashboard/financeiro", label: "Financeiro", module: "financial" },
  { href: "/dashboard/estoque", label: "Estoque", module: "inventory" },
  { href: "/dashboard/funcionarios", label: "Funcionários", module: "employees" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const canSee = (moduleKey: string | null) => {
    if (!moduleKey) return true;
    if (user?.role === "ADMIN") return true;
    return Boolean(user?.permissions?.[moduleKey as keyof NonNullable<typeof user.permissions>]?.view);
  };

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-5">
        <p className="text-sm font-semibold text-zinc-900">
          {process.env.NEXT_PUBLIC_CLINIC_NAME ?? "Clínica Odontológica"}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">{user?.name ?? user?.email}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.filter((item) => canSee(item.module)).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                active ? "bg-teal-50 text-teal-700" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 p-3">
        <button
          onClick={handleLogout}
          className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-600 transition-colors duration-150 hover:bg-zinc-100"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
