import { PageTransition } from "@/components/PageTransition";

// template.tsx remonta a cada navegação (diferente de layout.tsx), então cada
// página entra com um fade + slide sutil — dá a sensação de transição em todo
// o site sem precisar duplicar isso em cada página.
export default function RootTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
