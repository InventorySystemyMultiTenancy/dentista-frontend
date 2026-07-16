"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import type { InventoryItem } from "@/lib/types";

export default function EstoquePage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);

  async function load() {
    const data = await api.get<InventoryItem[]>("/inventory/items");
    setItems(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial dos itens de estoque
    load();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Estoque</h1>
        <Button onClick={() => setModalOpen(true)}>Novo item</Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Quantidade</th>
              <th className="px-4 py-3">Mínimo</th>
              <th className="px-4 py-3">Custo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-400">
                  Nenhum item cadastrado.
                </td>
              </tr>
            )}
            {items.map((item) => {
              const low = item.quantity <= item.minQuantity;
              return (
                <tr key={item.id} className="transition-colors hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-800">{item.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{item.category}</td>
                  <td className="px-4 py-3 text-zinc-700">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {item.minQuantity} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {item.costPrice !== null ? formatCurrency(item.costPrice) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {low ? <Badge color="red">Estoque baixo</Badge> : <Badge color="green">OK</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" onClick={() => setMovementItem(item)}>
                      Movimentar
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <NewItemModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={() => { setModalOpen(false); load(); }} />
      {movementItem && (
        <MovementModal
          item={movementItem}
          onClose={() => setMovementItem(null)}
          onSaved={() => {
            setMovementItem(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function NewItemModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    unit: "",
    quantity: "0",
    minQuantity: "0",
    costPrice: "",
    supplier: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/inventory/items", {
        ...form,
        quantity: Number(form.quantity),
        minQuantity: Number(form.minQuantity),
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        supplier: form.supplier || undefined,
      });
      setForm({ name: "", category: "", unit: "", quantity: "0", minQuantity: "0", costPrice: "", supplier: "" });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao cadastrar item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo item de estoque">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Nome">
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Categoria">
          <Input
            required
            placeholder="Ex.: Descartáveis, Anestésicos"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </Field>
        <Field label="Unidade">
          <Input
            required
            placeholder="Ex.: un, caixa, ml"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantidade inicial">
            <Input
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </Field>
          <Field label="Quantidade mínima">
            <Input
              type="number"
              min="0"
              value={form.minQuantity}
              onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Custo unitário (opcional)">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.costPrice}
            onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
          />
        </Field>
        <Field label="Fornecedor (opcional)">
          <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading ? "Salvando..." : "Cadastrar item"}
        </Button>
      </form>
    </Modal>
  );
}

function MovementModal({
  item,
  onClose,
  onSaved,
}: {
  item: InventoryItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ type: "IN" as "IN" | "OUT" | "ADJUSTMENT", quantity: "", reason: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/inventory/movements", {
        itemId: item.id,
        type: form.type,
        quantity: Number(form.quantity),
        reason: form.reason || undefined,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao registrar movimentação");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Movimentar — ${item.name}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <p className="text-sm text-zinc-500">
          Estoque atual: {item.quantity} {item.unit}
        </p>
        <Field label="Tipo de movimentação">
          <Select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as "IN" | "OUT" | "ADJUSTMENT" })}
          >
            <option value="IN">Entrada</option>
            <option value="OUT">Saída</option>
            <option value="ADJUSTMENT">Ajuste (define quantidade exata)</option>
          </Select>
        </Field>
        <Field label={form.type === "ADJUSTMENT" ? "Nova quantidade" : "Quantidade"}>
          <Input
            type="number"
            step="any"
            min="0"
            required
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
        </Field>
        <Field label="Motivo (opcional)">
          <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading ? "Salvando..." : "Confirmar movimentação"}
        </Button>
      </form>
    </Modal>
  );
}
