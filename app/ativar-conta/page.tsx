"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

function AtivarContaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }
    if (!token) {
      setError("Link de convite inválido");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/invite/accept", { token, password });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível ativar a conta");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-red-600">
        Link de convite inválido ou incompleto. Solicite um novo convite à clínica.
      </p>
    );
  }

  if (success) {
    return (
      <p className="text-sm text-emerald-700">
        Conta ativada com sucesso! Redirecionando para o login...
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Nova senha">
        <Input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Field label="Confirme a senha">
        <Input
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading} className="mt-2 w-full">
        {loading ? "Ativando..." : "Ativar conta"}
      </Button>
    </form>
  );
}

export default function AtivarContaPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-zinc-900">Ativar conta</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Defina uma senha para acessar seus agendamentos e resultados de exames.
        </p>
        <Suspense fallback={null}>
          <AtivarContaForm />
        </Suspense>
      </div>
    </div>
  );
}
