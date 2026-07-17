const CLINIC_NAME = process.env.NEXT_PUBLIC_CLINIC_NAME ?? "Clínica Odontológica";

export function PortalFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-linear-to-br from-teal-400 to-teal-600" />
            <p className="font-display text-lg font-semibold tracking-tight text-zinc-900">{CLINIC_NAME}</p>
          </div>
          <p className="mt-2 max-w-xs text-sm text-zinc-500">
            Cuidando do seu sorriso com atenção, tecnologia e transparência em cada etapa do
            tratamento.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Portal do paciente</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <li>
              <a href="/portal" className="text-zinc-600 transition-colors hover:text-teal-700">
                Início
              </a>
            </li>
            <li>
              <a href="/portal/agendamentos" className="text-zinc-600 transition-colors hover:text-teal-700">
                Meus agendamentos
              </a>
            </li>
            <li>
              <a href="/portal/exames" className="text-zinc-600 transition-colors hover:text-teal-700">
                Meus exames
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Precisa de ajuda?</p>
          <p className="mt-3 text-sm text-zinc-600">
            Fale com a recepção pelo WhatsApp para dúvidas sobre horários, exames ou tratamentos.
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-100 px-4 py-4 sm:px-6">
        <p className="mx-auto max-w-5xl text-xs text-zinc-400">
          © {year} {CLINIC_NAME}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
