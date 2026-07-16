"use client";

import { useEffect, useRef, useState } from "react";

const DESKTOP_SRC = "/video-horizontal.mp4";
const MOBILE_SRC = "/video-vertical.mp4";
const MOBILE_BREAKPOINT = 768;

// Distância (em fração de 0-1 do progresso do scroll) usada para o crossfade
// entre um slide e o próximo — maior = transição mais gradual.
const FADE_MARGIN = 0.05;

export interface HeroSlide {
  id: string;
  /** progresso (0-1) em que o slide chega a opacidade 1 */
  start: number;
  /** progresso (0-1) em que o slide começa a sumir (fica em opacidade 1 até aqui) */
  end: number;
  content: React.ReactNode;
}

// Crossfade centrado exatamente no ponto de fronteira entre dois slides (start
// de um == end do outro): enquanto um sobe de 0→1, o vizinho desce de 1→0 na
// MESMA janela, então a soma das opacidades é sempre 1 — nunca os dois em
// opacidade alta ao mesmo tempo. O primeiro slide não tem fade-in (já entra
// em 1) e o último não tem fade-out (permanece em 1 até o fim do scroll).
function slideOpacity(progress: number, slide: HeroSlide, isFirst: boolean, isLast: boolean) {
  const half = FADE_MARGIN / 2;

  const fadeInFrom = isFirst ? -Infinity : slide.start - half;
  const fadeInTo = isFirst ? -Infinity : slide.start + half;
  const fadeOutFrom = isLast ? Infinity : slide.end - half;
  const fadeOutTo = isLast ? Infinity : slide.end + half;

  if (progress <= fadeInFrom) return 0;
  if (progress < fadeInTo) return (progress - fadeInFrom) / FADE_MARGIN;
  if (progress <= fadeOutFrom) return 1;
  if (progress < fadeOutTo) return 1 - (progress - fadeOutFrom) / FADE_MARGIN;
  return 0;
}

// Seção hero com vídeo "preso" na tela enquanto a página rola — a posição do
// scroll controla diretamente o currentTime do vídeo (scroll-scrubbing) e
// qual "slide" de texto (frases, navegação) aparece por cima, em crossfade.
// Só deve ser renderizado no cliente (ver uso com next/dynamic ssr:false):
// window precisa existir para escolher a fonte (mobile/desktop) e o GSAP
// mexe em window/document diretamente.
export function ScrollVideoHero({ slides }: { slides: HeroSlide[] }) {
  const [videoSrc] = useState(() =>
    window.innerWidth < MOBILE_BREAKPOINT ? MOBILE_SRC : DESKTOP_SRC,
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const slideElsRef = useRef<(HTMLDivElement | null)[]>([]);
  // slides muda de identidade a cada render do componente pai (array literal) —
  // guardamos a versão mais recente num ref pra não precisar recriar o
  // ScrollTrigger só porque o texto do slide de boas-vindas mudou (ex.: nome
  // do paciente carregou depois do mount).
  const slidesRef = useRef(slides);
  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  function applySlideOpacities(progress: number) {
    const slides = slidesRef.current;
    slides.forEach((slide, i) => {
      const el = slideElsRef.current[i];
      if (!el) return;
      const opacity = slideOpacity(progress, slide, i === 0, i === slides.length - 1);
      el.style.opacity = String(opacity);
      el.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
    });
  }

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    if (!wrapper || !video) return;

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

    video.addEventListener("loadedmetadata", markReady);
    if (video.readyState >= 1) markReady();

    // iOS/Safari não pintam nenhum frame de um <video> que nunca rodou, mesmo
    // depois de setar currentTime — "liga e desliga" bem rápido resolve, e só
    // funciona com o vídeo mudo (autoplay programático exige muted).
    const playPromise = video.play();
    if (playPromise) {
      playPromise.then(() => video.pause()).catch(() => {});
    }

    applySlideOpacities(0);

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
        // "aos pulos") sem introduzir atraso perceptível — 0 seria instantâneo e mais
        // sujeito a parecer picotado; valores bem maiores (>0.5) começam a parecer elástico.
        scrub: 0.2,
        onUpdate: (self) => {
          pendingProgress = self.progress;
          if (durationReady && video.duration) {
            video.currentTime = Math.min(self.progress * video.duration, video.duration - 0.05);
          }
          applySlideOpacities(self.progress);
        },
      });
    })();

    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", markReady);
      scrollTrigger?.kill();
    };
  }, [videoSrc]);

  return (
    <div ref={wrapperRef} className="relative h-[500vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <video
          key={videoSrc}
          ref={videoRef}
          src={videoSrc}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/40 to-black/70" />
        <div className="relative z-10 h-full">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              ref={(el) => {
                slideElsRef.current[i] = el;
              }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
              style={{ opacity: 0, pointerEvents: "none" }}
            >
              {slide.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
