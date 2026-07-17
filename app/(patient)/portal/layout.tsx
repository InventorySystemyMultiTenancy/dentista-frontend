import { RequireRole } from "@/components/RequireRole";
import { PortalHeader } from "@/components/PortalHeader";
import { PortalFooter } from "@/components/PortalFooter";

// O hero com vídeo em scroll-scrubbing (ScrollVideoHero) fica só na página
// inicial do portal (app/(patient)/portal/page.tsx), para não recarregar os
// vídeos a cada navegação — por isso <main> não tem padding: cada página
// aplica o próprio espaçamento (a inicial precisa do vídeo full-bleed).
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={["PATIENT"]}>
      <div className="flex flex-1 flex-col bg-zinc-50">
        <PortalHeader />
        <main className="flex-1">{children}</main>
        <PortalFooter />
      </div>
    </RequireRole>
  );
}
