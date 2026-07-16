"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { href: "/portal", label: "Início" },
  { href: "/portal/agendamentos", label: "Meus agendamentos" },
  { href: "/portal/exames", label: "Meus exames" },
];

export function PortalHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="border-b border-zinc-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {process.env.NEXT_PUBLIC_CLINIC_NAME ?? "Clínica Odontológica"}
          </p>
          <p className="text-xs text-zinc-500">{user?.name ?? user?.email}</p>
        </div>
        <button onClick={handleLogout} className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          Sair
        </button>
      </div>
      <nav className="mt-3 flex gap-4 text-sm">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? "font-medium text-teal-700" : "text-zinc-600 hover:text-teal-700"}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
