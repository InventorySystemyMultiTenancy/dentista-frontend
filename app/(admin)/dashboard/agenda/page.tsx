"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import type { Appointment, Patient } from "@/lib/types";

interface StaffOption {
  id: string;
  name: string;
  position: string | null;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function whatsappReminderUrl(phone: string, patientName: string, date: string, time: string) {
  const digits = phone.replace(/\D/g, "");
  const clinic = process.env.NEXT_PUBLIC_CLINIC_NAME ?? "nossa clínica";
  const message = `Olá ${patientName}! Passando para confirmar seu horário na ${clinic} no dia ${formatDate(
    date,
  )} às ${time}. Contamos com sua presença!`;
  return `https://wa.me/55${digits}?text=${encodeURIComponent(message)}`;
}

type Slot = { time: string; appointment: Appointment | null };

export default function AgendaPage() {
  const [date, setDate] = useState(todayIso());
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [staffId, setStaffId] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allSlots, setAllSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [scheduleSlot, setScheduleSlot] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<StaffOption[]>("/staff/directory")
      .then((data) => {
        setStaffOptions(data);
        if (data.length > 0) setStaffId((current) => current || data[0].id);
      })
      .catch(() => setStaffOptions([]));
  }, []);

  async function loadDay() {
    if (!staffId) return;
    setLoading(true);
    try {
      const [appts, slotsRes] = await Promise.all([
        api.get<Appointment[]>(`/appointments?date=${date}&staffId=${staffId}`),
        api.get<{ slots: string[] }>(`/appointments/available-slots?date=${date}&staffId=${staffId}`),
      ]);
      setAppointments(appts);
      setAllSlots(slotsRes.slots);
    } catch {
      setAppointments([]);
      setAllSlots([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca dados ao trocar data/profissional
    loadDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, staffId]);

  const timeline: Slot[] = useMemo(() => {
    const occupied = new Map(
      appointments.filter((a) => a.status !== "CANCELLED").map((a) => [a.startTime, a]),
    );
    const times = new Set([...allSlots, ...occupied.keys()]);
    return Array.from(times)
      .sort()
      .map((time) => ({ time, appointment: occupied.get(time) ?? null }));
  }, [appointments, allSlots]);

  async function handleAction(appointmentId: string, action: "cancel" | "complete" | "no-show") {
    try {
      await api.patch(`/appointments/${appointmentId}/${action}`);
      loadDay();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Não foi possível atualizar o agendamento");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Agenda</h1>

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Data">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Profissional">
          <Select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="min-w-[200px]">
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.position ? ` — ${s.position}` : ""}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {loading ? (
          <p className="px-4 py-6 text-center text-sm text-zinc-400">Carregando agenda...</p>
        ) : timeline.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-zinc-400">
            Selecione um profissional para ver os horários.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {timeline.map(({ time, appointment }) => (
              <li key={time} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="w-14 font-medium text-zinc-700">{time}</span>
                {appointment ? (
                  <>
                    <span className="flex-1 text-zinc-700">
                      {appointment.patient.name}
                      {appointment.notes ? ` — ${appointment.notes}` : ""}
                    </span>
                    <StatusBadge status={appointment.status} />
                    <div className="flex gap-1">
                      <a
                        href={whatsappReminderUrl(appointment.patient.phone, appointment.patient.name, date, time)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="secondary">Avisar via WhatsApp</Button>
                      </a>
                      {appointment.status === "SCHEDULED" && (
                        <>
                          <Button variant="ghost" onClick={() => handleAction(appointment.id, "complete")}>
                            Concluir
                          </Button>
                          <Button variant="danger" onClick={() => handleAction(appointment.id, "cancel")}>
                            Desmarcar
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-zinc-400">Livre</span>
                    <Button variant="secondary" onClick={() => setScheduleSlot(time)}>
                      Agendar
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {scheduleSlot && staffId && (
        <ScheduleModal
          date={date}
          time={scheduleSlot}
          staffId={staffId}
          onClose={() => setScheduleSlot(null)}
          onScheduled={() => {
            setScheduleSlot(null);
            loadDay();
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const map = {
    SCHEDULED: <Badge color="blue">Agendado</Badge>,
    CANCELLED: <Badge color="red">Desmarcado</Badge>,
    COMPLETED: <Badge color="green">Concluído</Badge>,
    NO_SHOW: <Badge color="amber">Faltou</Badge>,
  } as const;
  return map[status];
}

function ScheduleModal({
  date,
  time,
  staffId,
  onClose,
  onScheduled,
}: {
  date: string;
  time: string;
  staffId: string;
  onClose: () => void;
  onScheduled: () => void;
}) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get<Patient[]>("/patients")
      .then((data) => {
        setPatients(data);
        if (data.length > 0) setPatientId(data[0].id);
      })
      .catch(() => setPatients([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/appointments", { patientId, staffId, date, startTime: time, notes: notes || undefined });
      onScheduled();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao agendar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Agendar às ${time} — ${formatDate(date)}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Paciente">
          <Select required value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Observações (opcional)">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading || !patientId} className="mt-2 w-full">
          {loading ? "Agendando..." : "Confirmar agendamento"}
        </Button>
      </form>
    </Modal>
  );
}
