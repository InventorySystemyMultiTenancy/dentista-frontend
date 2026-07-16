"use client";

import { useEffect, useState } from "react";
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

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fecha a gaveta ao trocar de página no mobile.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reseta a gaveta quando a rota muda
    setMobileOpen(false);
  }, [pathname]);

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
    <>
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
        <p className="text-sm font-semibold text-zinc-900">
          {process.env.NEXT_PUBLIC_CLINIC_NAME ?? "Clínica Odontológica"}
        </p>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="rounded-md p-2 text-zinc-600 transition-colors hover:bg-zinc-100"
        >
          <MenuIcon />
        </button>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 md:static md:z-auto md:w-60 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-zinc-200 px-4 py-5">
          <p className="text-sm font-semibold text-zinc-900">
            {process.env.NEXT_PUBLIC_CLINIC_NAME ?? "Clínica Odontológica"}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">{user?.name ?? user?.email}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
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
    </>
  );
}
