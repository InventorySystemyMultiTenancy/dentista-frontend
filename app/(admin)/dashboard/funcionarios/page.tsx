"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { RequireRole } from "@/components/RequireRole";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import type { ModulePermission, Permissions, Staff } from "@/lib/types";

const MODULES: { key: keyof Permissions; label: string }[] = [
  { key: "patients", label: "Pacientes" },
  { key: "agenda", label: "Agenda" },
  { key: "exams", label: "Exames" },
  { key: "financial", label: "Financeiro" },
  { key: "inventory", label: "Estoque" },
  { key: "employees", label: "Funcionários" },
];

function emptyPermissions(): Required<Permissions> {
  const perms = {} as Required<Permissions>;
  for (const { key } of MODULES) perms[key] = { view: false, edit: false };
  return perms;
}

export default function FuncionariosPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <FuncionariosContent />
    </RequireRole>
  );
}

function FuncionariosContent() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Staff[]>("/staff");
      setStaff(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial da lista de funcionários
    load();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Funcionários</h1>
        <Button onClick={() => setCreateOpen(true)}>Novo funcionário</Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && staff.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                  Nenhum funcionário cadastrado.
                </td>
              </tr>
            )}
            {staff.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-800">{s.name}</td>
                <td className="px-4 py-3 text-zinc-600">{s.position ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-600">{s.email}</td>
                <td className="px-4 py-3">
                  {s.active ? <Badge color="green">Ativo</Badge> : <Badge color="gray">Inativo</Badge>}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" onClick={() => setEditing(s)}>
                    Editar permissões
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewStaffModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); load(); }} />
      {editing && (
        <EditStaffModal
          staff={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function PermissionsEditor({
  permissions,
  onChange,
}: {
  permissions: Required<Permissions>;
  onChange: (perms: Required<Permissions>) => void;
}) {
  function toggle(moduleKey: keyof Permissions, field: keyof ModulePermission) {
    onChange({
      ...permissions,
      [moduleKey]: { ...permissions[moduleKey], [field]: !permissions[moduleKey][field] },
    });
  }

  return (
    <div className="rounded-md border border-zinc-200">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-3 py-2 text-left">Módulo</th>
            <th className="px-3 py-2">Ver</th>
            <th className="px-3 py-2">Editar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {MODULES.map(({ key, label }) => (
            <tr key={key}>
              <td className="px-3 py-2 text-zinc-700">{label}</td>
              <td className="px-3 py-2 text-center">
                <input type="checkbox" checked={permissions[key].view} onChange={() => toggle(key, "view")} />
              </td>
              <td className="px-3 py-2 text-center">
                <input type="checkbox" checked={permissions[key].edit} onChange={() => toggle(key, "edit")} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NewStaffModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", position: "", role: "EMPLOYEE" as "ADMIN" | "EMPLOYEE" });
  const [permissions, setPermissions] = useState(emptyPermissions());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/staff", { ...form, permissions });
      setForm({ name: "", email: "", password: "", phone: "", position: "", role: "EMPLOYEE" });
      setPermissions(emptyPermissions());
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao cadastrar funcionário");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo funcionário">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Nome">
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Email (login)">
          <Input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Senha provisória">
          <Input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <Field label="Cargo (opcional)">
          <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
        </Field>
        <Field label="Telefone (opcional)">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Papel">
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "EMPLOYEE" })}>
            <option value="EMPLOYEE">Funcionário</option>
            <option value="ADMIN">Administrador</option>
          </Select>
        </Field>

        {form.role === "EMPLOYEE" && (
          <div>
            <p className="mb-1 text-sm font-medium text-zinc-700">Permissões</p>
            <PermissionsEditor permissions={permissions} onChange={setPermissions} />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading ? "Cadastrando..." : "Cadastrar funcionário"}
        </Button>
      </form>
    </Modal>
  );
}

function EditStaffModal({
  staff,
  onClose,
  onSaved,
}: {
  staff: Staff;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [permissions, setPermissions] = useState<Required<Permissions>>({
    ...emptyPermissions(),
    ...staff.permissions,
  });
  const [active, setActive] = useState(staff.active);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.put(`/staff/${staff.id}`, { permissions, active });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar permissões");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Permissões — ${staff.name}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <PermissionsEditor permissions={permissions} onChange={setPermissions} />
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Conta ativa
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </form>
    </Modal>
  );
}
