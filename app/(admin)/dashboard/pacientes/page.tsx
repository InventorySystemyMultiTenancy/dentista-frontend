"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { Patient } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";

function whatsappInviteUrl(phone: string, inviteLink: string) {
  const digits = phone.replace(/\D/g, "");
  const message = `Olá! Sua conta no portal da clínica foi criada. Defina sua senha de acesso pelo link: ${inviteLink}`;
  return `https://wa.me/55${digits}?text=${encodeURIComponent(message)}`;
}

export default function PacientesPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<{ patient: Patient; link: string } | null>(null);

  async function load(searchTerm?: string) {
    setLoading(true);
    try {
      const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
      const data = await api.get<Patient[]>(`/patients${query}`);
      setPatients(data);
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial da lista de pacientes
    load();
  }, []);

  async function handleResendInvite(patient: Patient) {
    try {
      const { inviteLink } = await api.post<{ inviteLink: string }>(
        `/patients/${patient.id}/invite/resend`,
      );
      setInviteLink({ patient, link: inviteLink });
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao gerar convite");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Pacientes</h1>
        <Button onClick={() => setModalOpen(true)}>Novo paciente</Button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(search);
        }}
        className="flex gap-2"
      >
        <Input
          placeholder="Buscar por nome, telefone ou CPF"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Cadastro</th>
              <th className="px-4 py-3">Portal</th>
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
            {!loading && patients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                  Nenhum paciente encontrado.
                </td>
              </tr>
            )}
            {patients.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/pacientes/${p.id}`} className="font-medium text-teal-700 hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-600">{p.phone}</td>
                <td className="px-4 py-3 text-zinc-600">{formatDate(p.createdAt)}</td>
                <td className="px-4 py-3">
                  {p.portalActive ? <Badge color="green">Ativo</Badge> : <Badge color="amber">Convite pendente</Badge>}
                </td>
                <td className="px-4 py-3 text-right">
                  {!p.portalActive && (
                    <Button variant="ghost" onClick={() => handleResendInvite(p)}>
                      Gerar convite
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewPatientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(patient, link) => {
          setModalOpen(false);
          setInviteLink({ patient, link });
          load(search);
        }}
      />

      <Modal
        open={Boolean(inviteLink)}
        onClose={() => setInviteLink(null)}
        title="Convite gerado"
      >
        {inviteLink && (
          <div className="flex flex-col gap-3 text-sm">
            <p className="text-zinc-600">
              Envie o link abaixo para <strong>{inviteLink.patient.name}</strong> definir a senha de
              acesso ao portal.
            </p>
            <Input readOnly value={inviteLink.link} onFocus={(e) => e.currentTarget.select()} />
            <a
              href={whatsappInviteUrl(inviteLink.patient.phone, inviteLink.link)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full">Enviar convite via WhatsApp</Button>
            </a>
          </div>
        )}
      </Modal>
    </div>
  );
}

function NewPatientModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (patient: Patient, inviteLink: string) => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", cpf: "", birthDate: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { patient, inviteLink } = await api.post<{ patient: Patient; inviteLink: string }>(
        "/patients",
        { ...form, cpf: form.cpf || undefined, birthDate: form.birthDate || undefined },
      );
      setForm({ name: "", email: "", phone: "", cpf: "", birthDate: "" });
      onCreated(patient, inviteLink);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao cadastrar paciente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo paciente">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Nome completo">
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Email (será o login do paciente)">
          <Input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Telefone (com DDD, para WhatsApp)">
          <Input
            required
            placeholder="11999999999"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
        <Field label="CPF (opcional)">
          <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
        </Field>
        <Field label="Data de nascimento (opcional)">
          <Input
            type="date"
            value={form.birthDate}
            onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading ? "Cadastrando..." : "Cadastrar paciente"}
        </Button>
      </form>
    </Modal>
  );
}
