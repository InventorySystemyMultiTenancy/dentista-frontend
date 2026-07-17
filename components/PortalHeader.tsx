"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { href: "/portal", label: "Início" },
  { href: "/portal/agendamentos", label: "Meus agendamentos" },
  { href: "/portal/exames", label: "Meus exames" },
];

function initials(name: string | null | undefined) {
  if (!name) return "P";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function PortalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-linear-to-br from-teal-400 to-teal-600" />
          <p className="font-display text-lg font-semibold tracking-tight text-zinc-900">
            {process.env.NEXT_PUBLIC_CLINIC_NAME ?? "Clínica Odontológica"}
          </p>
        </div>

        <nav className="hidden items-center gap-1 rounded-full bg-zinc-100 p-1 sm:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 ${
                  active ? "bg-white text-teal-700 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight text-zinc-900">{user?.name ?? "Paciente"}</p>
            <p className="text-xs leading-tight text-zinc-500">{user?.email}</p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
            {initials(user?.name)}
          </div>
          <button
            onClick={handleLogout}
            aria-label="Sair"
            title="Sair"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-zinc-100 px-4 py-2 sm:hidden">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active ? "bg-teal-50 text-teal-700" : "text-zinc-600"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
