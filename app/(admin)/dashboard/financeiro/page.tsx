"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, ApiError } from "@/lib/api";
import { CHART_CATEGORICAL, CHART_INK } from "@/lib/chart-colors";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { FinancialEntry, FinancialStatus, FinancialType } from "@/lib/types";

interface Summary {
  pendingTotal: number;
  paidTotal: number;
  overdueTotal: number;
  receivableTotal: number;
  payableTotal: number;
  balance: number;
  byMonth: { month: string; receivable: number; payable: number }[];
}

const STATUS_BADGE: Record<FinancialStatus, { label: string; color: "green" | "amber" | "red" }> = {
  PAID: { label: "Pago", color: "green" },
  PENDING: { label: "Pendente", color: "amber" },
  OVERDUE: { label: "Atrasado", color: "red" },
};

export default function FinanceiroPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    const query = filterStatus ? `?status=${filterStatus}` : "";
    const [summaryData, entriesData] = await Promise.all([
      api.get<Summary>("/financial/summary"),
      api.get<FinancialEntry[]>(`/financial/entries${query}`),
    ]);
    setSummary(summaryData);
    setEntries(entriesData);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca dados ao trocar o filtro
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  async function handleMarkPaid(id: string) {
    try {
      await api.patch(`/financial/entries/${id}/pay`);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao marcar como pago");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Financeiro</h1>
        <Button onClick={() => setModalOpen(true)}>Novo lançamento</Button>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="A receber (pendente)" value={formatCurrency(summary.receivableTotal)} />
            <StatCard label="A pagar (pendente)" value={formatCurrency(summary.payableTotal)} />
            <StatCard label="Atrasado" value={formatCurrency(summary.overdueTotal)} />
            <StatCard label="Saldo previsto" value={formatCurrency(summary.balance)} />
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Fluxo mensal — a receber x a pagar</h2>
            {summary.byMonth.length === 0 ? (
              <p className="text-sm text-zinc-500">Sem lançamentos ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={summary.byMonth} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
                  <XAxis dataKey="month" stroke={CHART_INK.muted} fontSize={12} />
                  <YAxis
                    stroke={CHART_INK.muted}
                    fontSize={12}
                    tickFormatter={(v: number) => formatCurrency(v)}
                    width={90}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: 8, borderColor: CHART_INK.axis, fontSize: 13 }}
                  />
                  <Legend />
                  <Bar dataKey="receivable" name="A receber" fill={CHART_CATEGORICAL[0]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="payable" name="A pagar" fill={CHART_CATEGORICAL[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}

      <Field label="Filtrar por status">
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="max-w-[200px]">
          <option value="">Todos</option>
          <option value="PENDING">Pendente</option>
          <option value="PAID">Pago</option>
          <option value="OVERDUE">Atrasado</option>
        </Select>
      </Field>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {entries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-400">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 text-zinc-700">{entry.description}</td>
                <td className="px-4 py-3 text-zinc-600">{entry.category}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {entry.type === "RECEIVABLE" ? "A receber" : "A pagar"}
                </td>
                <td className="px-4 py-3 text-zinc-600">{formatDate(entry.dueDate)}</td>
                <td className="px-4 py-3 text-zinc-700">{formatCurrency(entry.amount)}</td>
                <td className="px-4 py-3">
                  <Badge color={STATUS_BADGE[entry.status].color}>{STATUS_BADGE[entry.status].label}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {entry.status !== "PAID" && (
                    <Button variant="ghost" onClick={() => handleMarkPaid(entry.id)}>
                      Marcar como pago
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewEntryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          load();
        }}
      />
    </div>
  );
}

function NewEntryModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    type: "PAYABLE" as FinancialType,
    description: "",
    category: "",
    amount: "",
    dueDate: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/financial/entries", { ...form, amount: Number(form.amount) });
      setForm({ type: "PAYABLE", description: "", category: "", amount: "", dueDate: "" });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar lançamento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo lançamento">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Tipo">
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FinancialType })}>
            <option value="PAYABLE">A pagar (fornecedor, insumo, salário...)</option>
            <option value="RECEIVABLE">A receber (consulta, procedimento...)</option>
          </Select>
        </Field>
        <Field label="Descrição">
          <Input
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="Categoria">
          <Input
            required
            placeholder="Ex.: Fornecedores, Salários, Consultas"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </Field>
        <Field label="Valor (R$)">
          <Input
            type="number"
            step="0.01"
            min="0"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </Field>
        <Field label="Vencimento">
          <Input
            type="date"
            required
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading ? "Salvando..." : "Salvar lançamento"}
        </Button>
      </form>
    </Modal>
  );
}
