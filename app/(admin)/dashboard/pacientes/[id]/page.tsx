"use client";

import { use, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import type { Appointment, Exam } from "@/lib/types";

interface PatientDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  cpf: string | null;
  birthDate: string | null;
  address: string | null;
  notes: string | null;
  portalActive: boolean;
  appointments: (Appointment & { staff: { name: string } })[];
  exams: (Exam & { staff: { name: string } })[];
}

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [examModalOpen, setExamModalOpen] = useState(false);

  async function load() {
    try {
      const data = await api.get<PatientDetail>(`/patients/${id}`);
      setPatient(data);
    } catch {
      setPatient(null);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca dados do paciente ao trocar de id
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!patient) {
    return <p className="text-sm text-zinc-500">Carregando...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{patient.name}</h1>
          <p className="text-sm text-zinc-500">
            {patient.phone} {patient.email ? `· ${patient.email}` : ""}
          </p>
        </div>
        {patient.portalActive ? <Badge color="green">Portal ativo</Badge> : <Badge color="amber">Convite pendente</Badge>}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Agendamentos</h2>
          </div>
          {patient.appointments.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum agendamento registrado.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 text-sm">
              {patient.appointments.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <span>
                    {formatDate(a.date)} {a.startTime} — {a.staff.name}
                  </span>
                  <span className="text-zinc-400">{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Exames e resultados</h2>
            <Button variant="ghost" onClick={() => setExamModalOpen(true)}>
              + Registrar exame
            </Button>
          </div>
          {patient.exams.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum exame registrado.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 text-sm">
              {patient.exams.map((exam) => (
                <li key={exam.id} className="py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-800">{exam.type}</span>
                    <span className="text-zinc-400">{formatDate(exam.date)}</span>
                  </div>
                  <p className="text-zinc-500">
                    Status: {exam.status}
                    {exam.value !== null ? ` · valor: ${exam.value}` : ""}
                  </p>
                  {exam.notes && <p className="text-zinc-500">{exam.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">Dados cadastrais</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-zinc-400">CPF</dt>
              <dd className="text-zinc-700">{patient.cpf ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-400">Nascimento</dt>
              <dd className="text-zinc-700">{patient.birthDate ? formatDate(patient.birthDate) : "—"}</dd>
            </div>
            <div>
              <dt className="text-zinc-400">Endereço</dt>
              <dd className="text-zinc-700">{patient.address ?? "—"}</dd>
            </div>
          </dl>
        </section>
      </div>

      <NewExamModal
        open={examModalOpen}
        onClose={() => setExamModalOpen(false)}
        patientId={patient.id}
        onCreated={() => {
          setExamModalOpen(false);
          load();
        }}
      />
    </div>
  );
}

function NewExamModal({
  open,
  onClose,
  patientId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  patientId: string;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ type: "", date: "", status: "", value: "", notes: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/exams", {
        patientId,
        type: form.type,
        date: form.date,
        status: form.status,
        value: form.value ? Number(form.value) : undefined,
        notes: form.notes || undefined,
      });
      setForm({ type: "", date: "", status: "", value: "", notes: "" });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao registrar exame");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar exame">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Tipo de exame">
          <Input required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
        </Field>
        <Field label="Data">
          <Input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </Field>
        <Field label="Status / resultado">
          <Input
            required
            placeholder="Ex.: Normal, Alterado, Em acompanhamento"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          />
        </Field>
        <Field label="Valor numérico (opcional)">
          <Input
            type="number"
            step="any"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
          />
        </Field>
        <Field label="Observações (opcional)">
          <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading ? "Salvando..." : "Salvar exame"}
        </Button>
      </form>
    </Modal>
  );
}
