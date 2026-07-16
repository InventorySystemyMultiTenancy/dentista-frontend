"use client";

import { useEffect, useRef, useState } from "react";

const DESKTOP_SRC = "/video-horizontal.mp4";
const MOBILE_SRC = "/video-vertical.mp4";
const MOBILE_BREAKPOINT = 768;

// Seção hero com vídeo "preso" na tela enquanto a página rola — a posição do
// scroll controla diretamente o currentTime do vídeo (scroll-scrubbing).
// Só deve ser renderizado no cliente (ver uso com next/dynamic ssr:false):
// window precisa existir para escolher a fonte (mobile/desktop) e o GSAP
// mexe em window/document diretamente.
export function ScrollVideoHero({ children }: { children?: React.ReactNode }) {
  const [videoSrc] = useState(() =>
    window.innerWidth < MOBILE_BREAKPOINT ? MOBILE_SRC : DESKTOP_SRC,
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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
        scrub: true, // acompanha o scroll no mesmo frame — scrub numérico atrasa (efeito elástico)
        onUpdate: (self) => {
          pendingProgress = self.progress;
          if (durationReady && video.duration) {
            video.currentTime = Math.min(self.progress * video.duration, video.duration - 0.05);
          }
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
        {children && <div className="relative z-10 flex h-full flex-col">{children}</div>}
      </div>
    </div>
  );
}
