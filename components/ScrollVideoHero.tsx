"use client";

import { useEffect, useRef, useState } from "react";

const DESKTOP_SRC = "/video-horizontal.mp4";
const MOBILE_SRC = "/video-vertical.mp4";
const MOBILE_BREAKPOINT = 768;
const POSTER_SRC = "/dentist-patient.jpg";

// Distância (em fração de 0-1 do progresso do scroll) usada na transição
// entre um slide e o próximo — maior = transição mais gradual.
const FADE_MARGIN = 0.05;

// Acima deste valor de opacidade um slide é considerado "o visível": ganha
// pointer-events e sai de aria-hidden/inert. Abaixo, fica inacessível a
// clique, foco por Tab e leitores de tela — sem isso, botões/links de um
// slide com opacity 0 continuam navegáveis por teclado por baixo do visível.
const VISIBLE_THRESHOLD = 0.5;

export interface HeroSlide {
  id: string;
  /** Nome curto e descritivo — usado no aria-label do dot de navegação. */
  label: string;
  /** progresso (0-1) em que o slide chega a opacidade 1 */
  start: number;
  /** progresso (0-1) em que o slide começa a sumir (fica em opacidade 1 até aqui) */
  end: number;
  content: React.ReactNode;
}

// Transição SEQUENCIAL, não crossfade: um slide termina de sumir por completo
// exatamente no instante em que o próximo começa a aparecer (ambos em 0 nesse
// ponto), em vez dos dois ficarem parcialmente visíveis ao mesmo tempo. Um
// crossfade tradicional (opacidades somando 1) parece ótimo pra imagens, mas
// pra texto sobreposto no mesmo lugar da tela, "os dois em 50%" ainda lê como
// frases embaralhadas uma em cima da outra — por isso aqui não existe nenhum
// instante com dois slides simultaneamente visíveis.
//
// Cada slide fica 100% visível em [start + half, end - half] (o "hold"); nos
// últimos `half` antes do seu end ele desce a 0, e nos primeiros `half` depois
// do seu start ele sobe de 0 — como start de um slide == end do anterior, as
// duas janelas se encostam exatamente no ponto de troca, sem se sobrepor.
// O primeiro slide não tem fade-in (já entra em 1) e o último não tem
// fade-out (permanece em 1 até o fim do scroll).
function slideOpacity(progress: number, slide: HeroSlide, isFirst: boolean, isLast: boolean) {
  const half = FADE_MARGIN / 2;

  const fadeInFrom = isFirst ? -Infinity : slide.start;
  const fadeInTo = isFirst ? -Infinity : slide.start + half;
  const fadeOutFrom = isLast ? Infinity : slide.end - half;
  const fadeOutTo = isLast ? Infinity : slide.end;

  if (progress < fadeInFrom) return 0;
  if (progress < fadeInTo) return (progress - fadeInFrom) / half;
  if (progress < fadeOutFrom) return 1;
  if (progress < fadeOutTo) return 1 - (progress - fadeOutFrom) / half;
  return 0;
}

// Seção hero com vídeo "preso" na tela enquanto a página rola — a posição do
// scroll controla diretamente o currentTime do vídeo (scroll-scrubbing) e
// qual "slide" de texto (frases, navegação) aparece por cima, em crossfade.
//
// Renderizado normalmente (SEM next/dynamic ssr:false): a escolha do vídeo
// mobile/desktop usa <source media="..."> nativo do HTML (não depende de
// window no servidor), e o primeiro slide já nasce com opacity:1 no HTML —
// então o título e a chamada principal existem no HTML inicial (indexável,
// sem tela em branco antes do JS carregar). Só o scroll-scrubbing em si
// (GSAP) é client-only, dentro de um useEffect.
export function ScrollVideoHero({ slides }: { slides: HeroSlide[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const slideElsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [videoFailed, setVideoFailed] = useState(false);

  // slides muda de identidade a cada render do componente pai (array literal) —
  // guardamos a versão mais recente num ref pra não precisar recriar o
  // ScrollTrigger só porque o texto do slide de boas-vindas mudou (ex.: nome
  // do paciente carregou depois do mount).
  const slidesRef = useRef(slides);
  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  // Sanity check só em dev: um slide mais curto que a margem de crossfade
  // pode fazer o "hold" em opacidade 1 nunca acontecer e reintroduzir a
  // sobreposição de frases que já corrigimos uma vez.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    for (const slide of slides) {
      if (slide.end - slide.start < FADE_MARGIN) {
        console.warn(
          `[ScrollVideoHero] slide "${slide.id}" tem (end - start) = ${(slide.end - slide.start).toFixed(3)}, ` +
            `menor que FADE_MARGIN (${FADE_MARGIN}). Aumente o intervalo do slide para evitar sobreposição no crossfade.`,
        );
      }
    }
  }, [slides]);

  function applySlideOpacities(progress: number) {
    const currentSlides = slidesRef.current;
    currentSlides.forEach((slide, i) => {
      const el = slideElsRef.current[i];
      if (!el) return;
      const opacity = slideOpacity(progress, slide, i === 0, i === currentSlides.length - 1);
      const visible = opacity > VISIBLE_THRESHOLD;
      el.style.opacity = String(opacity);
      el.style.pointerEvents = visible ? "auto" : "none";
      // inert remove o slide invisível da navegação por Tab e de leitores de
      // tela; sem isso, opacity/pointer-events sozinhos não bloqueiam foco.
      el.toggleAttribute("inert", !visible);
      if (visible) el.removeAttribute("aria-hidden");
      else el.setAttribute("aria-hidden", "true");
    });
  }

  // Navegação por "dots" — alternativa ao scroll físico para quem usa teclado
  // ou não quer/consegue rolar 500vh fisicamente. Rola a janela até o ponto
  // exato do progresso onde aquele slide fica 100% visível.
  function scrollToProgress(progress: number) {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
    const scrollableHeight = wrapper.offsetHeight - window.innerHeight;
    window.scrollTo({ top: wrapperTop + progress * scrollableHeight, behavior: "smooth" });
  }

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    if (!wrapper || !video) return;

    applySlideOpacities(0);

    // Quem prefere menos movimento vê o fallback estático (ver motion-reduce:
    // no JSX) — nem inicia o scrubbing nem força o play/pause do vídeo.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let durationReady = false;
    let pendingProgress = 0;
    let scrollTrigger: { kill: () => void } | undefined;
    let cancelled = false;

    function markReady() {
      if (durationReady) return;
      durationReady = Number.isFinite(video!.duration) && video!.duration > 0;
      if (!durationReady) return;
      video!.currentTime = pendingProgress * video!.duration;
    }

    function handleVideoError() {
      setVideoFailed(true);
    }

    video.addEventListener("loadedmetadata", markReady);
    video.addEventListener("error", handleVideoError);
    if (video.readyState >= 1) markReady();

    // iOS/Safari não pintam nenhum frame de um <video> que nunca rodou, mesmo
    // depois de setar currentTime — "liga e desliga" bem rápido resolve, e só
    // funciona com o vídeo mudo (autoplay programático exige muted).
    const playPromise = video.play();
    if (playPromise) {
      playPromise.then(() => video.pause()).catch(() => {});
    }

    // Evita re-seekar pra um instante quase idêntico ao atual (menos de ~1
    // frame a 30fps) — cada seek força o navegador a decodificar de novo, e
    // isso some de graça em scroll rápido/contínuo, que é quando mais trava.
    const MIN_SEEK_DELTA = 1 / 30;

    function seekVideo(time: number) {
      if (Math.abs(video!.currentTime - time) < MIN_SEEK_DELTA) return;
      // fastSeek (Safari/WebKit) prioriza latência sobre precisão de frame —
      // ideal pra scrubbing. Sem suporte (Chrome/Firefox), cai pro padrão.
      if (typeof video!.fastSeek === "function") {
        video!.fastSeek(time);
      } else {
        video!.currentTime = time;
      }
    }

    (async () => {
      const gsapModule = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      const gsap = gsapModule.default;
      gsap.registerPlugin(ScrollTrigger);

      if (cancelled) return;

      scrollTrigger = ScrollTrigger.create({
        trigger: wrapper,
        start: "top top",
        end: "bottom bottom",
        // Um scrub numérico pequeno suaviza saltos de scroll (roda do mouse, trackpad
        // "aos pulos") sem introduzir atraso perceptível. NÃO troque para `true` (zero
        // suavização, pode parecer picotado) nem para um valor > 0.5 (começa a parecer
        // elástico/atrasado) sem reler o motivo desta escolha.
        scrub: 0.2,
        onUpdate: (self) => {
          pendingProgress = self.progress;
          if (durationReady && video.duration) {
            seekVideo(Math.min(self.progress * video.duration, video.duration - 0.05));
          }
          applySlideOpacities(self.progress);
        },
      });
    })();

    // O <source media="..."> só é avaliado pelo navegador quando o vídeo
    // carrega — se o viewport cruzar o breakpoint depois disso (rotacionar o
    // celular, redimensionar a janela), forçamos um reload pra reavaliar qual
    // fonte usar. markReady (já registrado acima) restaura a posição via
    // pendingProgress assim que o novo "loadedmetadata" disparar.
    const breakpointQuery = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`);
    function handleBreakpointChange() {
      durationReady = false;
      video!.load();
    }
    breakpointQuery.addEventListener("change", handleBreakpointChange);

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", markReady);
      video.removeEventListener("error", handleVideoError);
      breakpointQuery.removeEventListener("change", handleBreakpointChange);
      scrollTrigger?.kill();
    };
  }, []);

  return (
    <>
      {/* Fallback estático para quem tem prefers-reduced-motion ativado: sem
          scroll-jacking, sem vídeo rodando, só a imagem e o texto direto. */}
      <div className="hidden motion-reduce:block">
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- imagem estática decorativa, não precisa de otimização do next/image */}
          <img src={POSTER_SRC} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/50 to-black/70" />
          <div className="relative z-10 flex flex-col items-center gap-10">
            {slides.map((slide) => (
              <div key={slide.id} className="flex flex-col items-center">
                {slide.content}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero com scroll-scrubbing — escondido via CSS para quem prefere menos movimento. */}
      <div ref={wrapperRef} className="relative h-[500vh] motion-reduce:hidden">
        <div className="sticky top-0 h-screen overflow-hidden">
          {videoFailed ? (
            // eslint-disable-next-line @next/next/no-img-element -- fallback de erro, não precisa de otimização do next/image
            <img src={POSTER_SRC} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              muted
              playsInline
              preload="auto"
              poster={POSTER_SRC}
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src={DESKTOP_SRC} media={`(min-width: ${MOBILE_BREAKPOINT}px)`} />
              <source src={MOBILE_SRC} />
            </video>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/40 to-black/70" />
          <div className="relative z-10 h-full">
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                ref={(el) => {
                  slideElsRef.current[i] = el;
                }}
                className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
                style={{ opacity: i === 0 ? 1 : 0, pointerEvents: i === 0 ? "auto" : "none" }}
                aria-hidden={i === 0 ? undefined : true}
                inert={i === 0 ? undefined : true}
              >
                {slide.content}
              </div>
            ))}
          </div>

          <div className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Ir para: ${slide.label}`}
                onClick={() => scrollToProgress(i === 0 ? 0 : slide.start)}
                className="h-2.5 w-2.5 rounded-full border border-white/70 bg-white/30 transition-colors hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
