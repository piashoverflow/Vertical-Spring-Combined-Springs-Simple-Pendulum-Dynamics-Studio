import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, ArrowDownUp, Crosshair, Eye, EyeOff } from 'lucide-react';
import { GRAVITY_PRESETS, Language } from '../types/physics';
import { TranslationSet } from '../i18n/translations';
import { EmeraldSlider } from '../components/EmeraldSlider';
import {
  drawForceArrow,
  drawHelicalSpring,
  drawRigidSupport,
  drawScientificGrid,
} from '../utils/physicsMath';

interface VerticalSpringLabProps {
  t: TranslationSet;
  language: Language;
  resetSignal: number;
}

interface LiveTelemetry {
  x: number;
  v: number;
  a: number;
  fGravity: number;
  fSpring: number;
  fNet: number;
  ke: number;
  pe: number;
  isDragging: boolean;
}

export const VerticalSpringLab: React.FC<VerticalSpringLabProps> = ({
  t,
  language,
  resetSignal,
}) => {
  // Physics Parameters
  const [k, setK] = useState<number>(50);
  const [mass, setMass] = useState<number>(2.0);
  const [g, setG] = useState<number>(9.8);
  const [amplitude, setAmplitude] = useState<number>(0.22);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);

  // Derived invariant quantities
  const e = (mass * g) / k;
  const omega = Math.sqrt(k / mass);
  const periodH = 2 * Math.PI * Math.sqrt(mass / k);
  const periodV = 2 * Math.PI * Math.sqrt(e / g);
  const frequency = 1 / periodH;
  const totalEnergy = 0.5 * k * amplitude * amplitude;

  // Live telemetry state (throttled to ~30Hz for React DOM while Canvas runs at 60+ FPS)
  const [telemetry, setTelemetry] = useState<LiveTelemetry>({
    x: amplitude,
    v: 0,
    a: -(k / mass) * amplitude,
    fGravity: mass * g,
    fSpring: k * (e + amplitude),
    fNet: -k * amplitude,
    ke: 0,
    pe: totalEnergy,
    isDragging: false,
  });

  // Reset handler
  useEffect(() => {
    if (resetSignal === 0) return;
    setK(50);
    setMass(2.0);
    setG(9.8);
    setAmplitude(0.22);
    setIsPlaying(true);
    setShowVectors(true);
    simRef.current.phase = 0;
    simRef.current.x = 0.22;
    simRef.current.history = [];
  }, [resetSignal]);

  // Mutable simulation ref for lock-free 60FPS loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef({
    phase: 0,
    x: 0.22,
    v: 0,
    isDragging: false,
    dragX: 0.22,
    history: [] as { t: number; x: number }[],
    elapsed: 0,
    lastUiSync: 0,
    // Hitbox geometry updated every frame
    blockRect: { x: 0, y: 0, w: 72, h: 52 },
    eqY: 300,
    pxPerMeter: 140,
  });

  const paramsRef = useRef({ k, mass, g, amplitude, isPlaying, showVectors, e, omega, t, language });
  paramsRef.current = { k, mass, g, amplitude, isPlaying, showVectors, e, omega, t, language };

  const handleEquilibrate = useCallback(() => {
    setAmplitude(0.05);
    setIsPlaying(false);
    simRef.current.phase = Math.PI / 2;
    simRef.current.x = 0;
    simRef.current.v = 0;
  }, []);

  const handlePluck = useCallback(() => {
    const amp = Math.max(0.15, paramsRef.current.amplitude);
    setAmplitude(amp);
    simRef.current.phase = 0;
    simRef.current.x = amp;
    setIsPlaying(true);
  }, []);

  // Pointer drag handlers on Canvas
  const getCanvasPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handlePointerDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(ev.clientX, ev.clientY);
    const { blockRect } = simRef.current;
    // Generous touch hitbox around the hanging mass
    const pad = 18;
    if (
      pt.x >= blockRect.x - pad &&
      pt.x <= blockRect.x + blockRect.w + pad &&
      pt.y >= blockRect.y - pad &&
      pt.y <= blockRect.y + blockRect.h + pad
    ) {
      ev.currentTarget.setPointerCapture(ev.pointerId);
      simRef.current.isDragging = true;
      const rawX = (pt.y - blockRect.h / 2 - simRef.current.eqY) / simRef.current.pxPerMeter;
      simRef.current.dragX = Math.max(-0.5, Math.min(0.5, rawX));
      simRef.current.x = simRef.current.dragX;
    }
  };

  const handlePointerMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const pt = getCanvasPoint(ev.clientX, ev.clientY);

    if (simRef.current.isDragging) {
      const { blockRect, eqY, pxPerMeter } = simRef.current;
      const rawX = (pt.y - blockRect.h / 2 - eqY) / pxPerMeter;
      const clampedX = Math.max(-0.5, Math.min(0.5, rawX));
      simRef.current.dragX = clampedX;
      simRef.current.x = clampedX;
      const newAmp = Math.max(0.05, Math.min(0.5, Math.abs(clampedX)));
      setAmplitude(Number(newAmp.toFixed(2)));
    } else if (canvas) {
      const { blockRect } = simRef.current;
      const pad = 14;
      const hover =
        pt.x >= blockRect.x - pad &&
        pt.x <= blockRect.x + blockRect.w + pad &&
        pt.y >= blockRect.y - pad &&
        pt.y <= blockRect.y + blockRect.h + pad;
      canvas.style.cursor = hover ? 'grab' : 'default';
    }
  };

  const handlePointerUp = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (!simRef.current.isDragging) return;
    try {
      ev.currentTarget.releasePointerCapture(ev.pointerId);
    } catch {
      // ignore if already released
    }
    simRef.current.isDragging = false;
    const xRelease = simRef.current.dragX;
    const newAmp = Math.max(0.05, Math.min(0.5, Math.abs(xRelease)));
    setAmplitude(Number(newAmp.toFixed(2)));
    simRef.current.phase = xRelease >= 0 ? 0 : Math.PI;
    setIsPlaying(true);
  };

  // High-DPI 60FPS Animation Loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.04, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const p = paramsRef.current;
      const s = simRef.current;

      // Advance Physics
      if (s.isDragging) {
        s.x = s.dragX;
        s.v = 0;
      } else if (p.isPlaying) {
        s.phase += p.omega * dt;
        s.elapsed += dt;
        s.x = p.amplitude * Math.cos(s.phase);
        s.v = -p.amplitude * p.omega * Math.sin(s.phase);
      } else {
        s.x = p.amplitude * Math.cos(s.phase);
        s.v = 0;
      }

      if (!s.isDragging && p.isPlaying) {
        s.history.push({ t: s.elapsed, x: s.x });
        const cutoff = s.elapsed - 6.0;
        while (s.history.length > 0 && s.history[0].t < cutoff) {
          s.history.shift();
        }
      }

      // Sync React telemetry at ~25Hz
      if (now - s.lastUiSync > 40) {
        s.lastUiSync = now;
        const fGravity = p.mass * p.g;
        const fSpring = p.k * (p.e + s.x);
        const fNet = -p.k * s.x;
        const a = fNet / p.mass;
        const ke = 0.5 * p.mass * s.v * s.v;
        const pe = 0.5 * p.k * s.x * s.x;
        setTelemetry({
          x: s.x,
          v: s.v,
          a,
          fGravity,
          fSpring,
          fNet,
          ke,
          pe,
          isDragging: s.isDragging,
        });
      }

      // Canvas Drawing
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const cssW = canvas.clientWidth;
        const cssH = canvas.clientHeight;
        if (cssW > 0 && cssH > 0) {
          if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
            canvas.width = Math.round(cssW * dpr);
            canvas.height = Math.round(cssH * dpr);
          }
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            drawScientificGrid(ctx, cssW, cssH);

            // Layout geometry
            const topY = 38;
            const mountH = 14;
            const ceilingY = topY + mountH;
            const waveformH = 104;
            const stageBottomY = cssH - waveformH - 18;
            const naturalLenPx = Math.min(115, Math.max(76, cssH * 0.17));
            const yNatural = ceilingY + naturalLenPx;

            // Adaptive pxPerMeter so any (m, k, g) stays cleanly visible on stage
            const availableExtensionPx = Math.max(120, stageBottomY - yNatural - 68);
            const maxRequiredM = Math.max(0.75, p.e + p.amplitude + 0.08);
            const pxPerMeter = Math.min(155, availableExtensionPx / maxRequiredM);
            s.pxPerMeter = pxPerMeter;

            const eqY = yNatural + p.e * pxPerMeter;
            s.eqY = eqY;
            const currentTipY = eqY + s.x * pxPerMeter;

            const leftRigX = cssW * 0.27;
            const rightRigX = cssW * 0.64;

            // Rigid Ceiling Support across both rigs
            drawRigidSupport(ctx, cssW * 0.12, topY, cssW * 0.76, mountH);

            // Column Titles
            ctx.save();
            ctx.font = '700 13px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
            ctx.fillStyle = '#0f172a';
            ctx.textAlign = 'center';
            ctx.fillText(p.t.module1.naturalLengthRef, leftRigX, 24);
            ctx.fillText(p.t.module1.activeLoadedRig, rightRigX, 24);
            ctx.restore();

            // 1. Natural Length Horizontal Reference Line (y0)
            ctx.save();
            ctx.setLineDash([6, 5]);
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(leftRigX - 50, yNatural);
            ctx.lineTo(rightRigX + 120, yNatural);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.font = '600 11px "JetBrains Mono", "Hind Siliguri", sans-serif';
            ctx.fillStyle = '#475569';
            ctx.textAlign = 'left';
            ctx.fillText(p.t.module1.naturalLineLabel, leftRigX - 50, yNatural - 8);
            ctx.restore();

            // 2. Left Rig: Unloaded Natural Spring (Ghosted reference)
            drawHelicalSpring(
              ctx,
              leftRigX,
              ceilingY,
              leftRigX,
              yNatural,
              12,
              15,
              '#64748b',
              2.2,
              0.72
            );
            // Small hook ring on natural tip
            ctx.save();
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(leftRigX, yNatural + 6, 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // 3. Static Equilibrium Line (y_eq)
            ctx.save();
            ctx.setLineDash([7, 5]);
            ctx.strokeStyle = '#059669';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(leftRigX + 20, eqY);
            ctx.lineTo(rightRigX + 135, eqY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.font = '700 11px "JetBrains Mono", "Hind Siliguri", sans-serif';
            ctx.fillStyle = '#047857';
            ctx.textAlign = 'right';
            ctx.fillText(p.t.module1.eqLineLabel, rightRigX - 56, eqY - 7);
            ctx.restore();

            // 4. Amplitude Envelope Markers (y_eq - A and y_eq + A)
            const ampPx = p.amplitude * pxPerMeter;
            ctx.save();
            ctx.strokeStyle = 'rgba(2, 132, 199, 0.35)';
            ctx.lineWidth = 1.2;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(rightRigX - 52, eqY - ampPx);
            ctx.lineTo(rightRigX + 52, eqY - ampPx);
            ctx.moveTo(rightRigX - 52, eqY + ampPx);
            ctx.lineTo(rightRigX + 52, eqY + ampPx);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.font = '600 10px "JetBrains Mono", sans-serif';
            ctx.fillStyle = '#0369a1';
            ctx.textAlign = 'right';
            ctx.fillText('-A', rightRigX - 56, eqY - ampPx + 3);
            ctx.fillText('+A', rightRigX - 56, eqY + ampPx + 3);
            ctx.restore();

            // 5. Static Extension Dimension Bracket (e = mg/k) between Left & Right rigs
            const bracketX = (leftRigX + rightRigX) * 0.5 - 12;
            if (eqY - yNatural > 8) {
              ctx.save();
              ctx.strokeStyle = '#0284c7';
              ctx.fillStyle = '#0284c7';
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.moveTo(bracketX - 6, yNatural);
              ctx.lineTo(bracketX + 6, yNatural);
              ctx.moveTo(bracketX, yNatural);
              ctx.lineTo(bracketX, eqY);
              ctx.moveTo(bracketX - 6, eqY);
              ctx.lineTo(bracketX + 6, eqY);
              ctx.stroke();

              // Label pill on bracket
              const midBracketY = (yNatural + eqY) * 0.5;
              const eText = `e = ${p.e.toFixed(3)} m`;
              ctx.font = '700 11.5px "JetBrains Mono", sans-serif';
              const tw = ctx.measureText(eText).width;
              ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
              ctx.strokeStyle = '#bae6fd';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(bracketX - tw / 2 - 8, midBracketY - 11, tw + 16, 22, 6);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#0369a1';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(eText, bracketX, midBracketY);
              ctx.restore();
            }

            // 6. Active Loaded Spring on Right Rig
            drawHelicalSpring(
              ctx,
              rightRigX,
              ceilingY,
              rightRigX,
              Math.max(ceilingY + 24, currentTipY),
              12,
              16,
              '#0f172a',
              2.6,
              1
            );

            // 7. Hanging Mass Block (Interactive Draggable)
            const blockW = 76;
            const blockH = 52;
            const blockX = rightRigX - blockW / 2;
            const blockY = Math.max(ceilingY + 24, currentTipY);
            s.blockRect = { x: blockX, y: blockY, w: blockW, h: blockH };

            ctx.save();
            // Block shadow
            ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
            ctx.beginPath();
            ctx.roundRect(blockX + 2, blockY + 4, blockW, blockH, 10);
            ctx.fill();

            // Block body
            const grad = ctx.createLinearGradient(blockX, blockY, blockX + blockW, blockY + blockH);
            grad.addColorStop(0, s.isDragging ? '#0ea5e9' : '#1e293b');
            grad.addColorStop(1, s.isDragging ? '#0284c7' : '#0f172a');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(blockX, blockY, blockW, blockH, 10);
            ctx.fill();

            ctx.strokeStyle = s.isDragging ? '#38bdf8' : '#334155';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Mass label inside block
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 13px "JetBrains Mono", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${p.mass.toFixed(1)} kg`, rightRigX, blockY + blockH / 2 - 5);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '500 10px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
            ctx.fillText(`x = ${s.x >= 0 ? '+' : ''}${s.x.toFixed(2)}m`, rightRigX, blockY + blockH / 2 + 12);
            ctx.restore();

            // 8. Real-Time Force Vector Arrows on the Mass
            if (p.showVectors) {
              const fGrav = p.mass * p.g;
              const fSpring = p.k * (p.e + s.x);
              const fNet = -p.k * s.x;

              // Scale forces nicely (N -> px)
              const maxForceRef = Math.max(30, fGrav * 1.4 + p.k * p.amplitude);
              const pxPerNewton = Math.min(2.6, 86 / maxForceRef);

              const centerY = blockY + blockH / 2;

              // Downward Gravity (mg) - Rose Red
              drawForceArrow(
                ctx,
                rightRigX - 18,
                centerY + blockH * 0.25,
                0,
                fGrav * pxPerNewton,
                '#e11d48',
                `${p.t.module1.gravityVector} (${fGrav.toFixed(1)}N)`,
                'left',
                3.2
              );

              // Upward Spring Tension k(e+x) - Emerald Green
              const springVecDy = -fSpring * pxPerNewton;
              drawForceArrow(
                ctx,
                rightRigX + 18,
                centerY - (springVecDy < 0 ? blockH * 0.25 : -blockH * 0.25),
                0,
                springVecDy,
                '#059669',
                `${p.t.module1.tensionVector} (${fSpring.toFixed(1)}N)`,
                'right',
                3.2
              );

              // Net Restoring Force (-kx) - Sky Blue
              if (Math.abs(fNet) > 0.2) {
                const netVecDy = -fNet * pxPerNewton * 1.25;
                // Note: positive x is downward, negative F_net points upward (negative dy in canvas!)
                // Wait: in canvas, y increases downward!
                // Gravity acts downward (+y). So F_grav_canvas = +mg.
                // Spring pulls upward (-y) when (e+x) > 0. So F_spring_canvas = -k(e+x).
                // Net force in downward-positive coordinate x is: F_net_x = mg - k(e+x) = -kx.
                // When x > 0 (mass pulled BELOW equilibrium), F_net_x < 0, meaning upward (-y in canvas)!
                // Therefore canvas dy for F_net has the SAME sign as fNet (-kx)!
                // Wait: let's double check! If x > 0 (below eq), fNet = -kx < 0. Canvas dy < 0 means UPWARD toward eq!
                // Yes!! Let's pass `fNet * pxPerNewton` directly!
                drawForceArrow(
                  ctx,
                  rightRigX + blockW / 2 + 26,
                  centerY,
                  0,
                  fNet * pxPerNewton,
                  '#0284c7',
                  `F_net = ${fNet.toFixed(1)}N`,
                  'right',
                  3.2
                );
              }
            }

            // 9. Bottom Live Displacement Waveform Strip x(t)
            const waveX = 18;
            const waveY = cssH - waveformH - 8;
            const waveW = cssW - 36;
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.strokeStyle = '#bae6fd';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(waveX, waveY, waveW, waveformH, 12);
            ctx.fill();
            ctx.stroke();

            // Zero line
            const waveMidY = waveY + waveformH * 0.56;
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(waveX + 12, waveMidY);
            ctx.lineTo(waveX + waveW - 12, waveMidY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.font = '700 11px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
            ctx.fillStyle = '#0f172a';
            ctx.textAlign = 'left';
            ctx.fillText(p.t.module1.waveformTitle, waveX + 14, waveY + 17);

            ctx.font = '600 10.5px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
            ctx.fillStyle = '#0369a1';
            ctx.textAlign = 'right';
            ctx.fillText(p.t.module1.canvasDragPrompt, waveX + waveW - 14, waveY + 17);

            // Plot x(t)
            if (s.history.length > 1) {
              const latestT = s.history[s.history.length - 1].t;
              const maxSpan = 6.0;
              const plotLeft = waveX + 14;
              const plotW = waveW - 28;
              const ampScaleY = (waveformH * 0.32) / Math.max(0.1, p.amplitude);

              ctx.strokeStyle = '#059669';
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              for (let i = 0; i < s.history.length; i++) {
                const pt = s.history[i];
                const px = plotLeft + ((pt.t - (latestT - maxSpan)) / maxSpan) * plotW;
                const py = waveMidY + pt.x * ampScaleY;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.stroke();
            }
            ctx.restore();
          }
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const fMax = Math.max(1, mass * g + k * amplitude);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)_330px] gap-4 items-stretch">
      {/* LEFT VERTICAL SIDEBAR (340px) */}
      <aside className="bg-white/95 backdrop-blur-sm border border-sky-200 rounded-2xl shadow-sm p-4 flex flex-col gap-4 studio-scroll lg:max-h-[calc(100vh-88px)] lg:overflow-y-auto">
        <div className="flex items-center justify-between border-b border-sky-100 pb-2.5">
          <h2 className="text-sm font-extrabold text-slate-950 tracking-tight">
            {t.common.controlsTitle}
          </h2>
          <span className="text-[11px] font-mono font-semibold text-emerald-700">
            {telemetry.isDragging
              ? t.common.dragging
              : isPlaying
                ? t.common.liveMotion
                : t.common.paused}
          </span>
        </div>

        {/* Playback Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? t.pause : t.play}</span>
          </button>

          <button
            type="button"
            onClick={handlePluck}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-slate-900 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            title={t.common.pluck}
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-sky-700" />
            <span className="truncate">{t.common.pluck}</span>
          </button>

          <button
            type="button"
            onClick={handleEquilibrate}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-sky-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            title={t.common.equilibrate}
          >
            <Crosshair className="w-3.5 h-3.5 text-slate-700" />
            <span className="truncate">x = 0</span>
          </button>
        </div>

        {/* Parameter Sliders */}
        <div className="space-y-4">
          <EmeraldSlider
            id="m1-k"
            label={t.module1.springConstant}
            value={k}
            min={10}
            max={200}
            step={1}
            decimals={0}
            unit={t.common.unitNm}
            onChange={setK}
          />

          <EmeraldSlider
            id="m1-mass"
            label={t.common.mass}
            value={mass}
            min={0.5}
            max={10.0}
            step={0.1}
            decimals={1}
            unit={t.common.unitKg}
            onChange={setMass}
          />

          <div className="space-y-2 pt-1">
            <EmeraldSlider
              id="m1-g"
              label={t.common.gravity}
              value={g}
              min={1.0}
              max={25.0}
              step={0.01}
              decimals={2}
              unit={t.common.unitMs2}
              onChange={setG}
            />
            <div className="grid grid-cols-2 gap-1.5">
              {GRAVITY_PRESETS.map((preset) => {
                const active = Math.abs(g - preset.g) < 0.05;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setG(preset.g)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer truncate ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-sky-50/70 hover:bg-sky-100 text-slate-800 border-sky-200'
                    }`}
                  >
                    {language === 'bn' ? preset.labelBn : preset.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          <EmeraldSlider
            id="m1-amp"
            label={t.common.amplitude}
            value={amplitude}
            min={0.05}
            max={0.5}
            step={0.01}
            decimals={2}
            unit={t.common.unitM}
            onChange={(val) => {
              setAmplitude(val);
              if (!isPlaying) {
                simRef.current.x = val * Math.cos(simRef.current.phase);
              }
            }}
          />
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          onClick={() => setShowVectors((v) => !v)}
          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
            showVectors
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-slate-50 border-sky-200 text-slate-700'
          }`}
        >
          <span>{t.common.showVectors}</span>
          {showVectors ? (
            <Eye className="w-4 h-4 text-emerald-700" />
          ) : (
            <EyeOff className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {/* Live Mathematical Derivation */}
        <div className="mt-auto bg-sky-50/80 border border-sky-200 rounded-xl p-3 space-y-1.5">
          <h3 className="text-xs font-extrabold text-slate-950">{t.common.derivationTitle}</h3>
          <div className="space-y-1 font-mono text-[11px] text-slate-800 leading-relaxed">
            {t.module1.derivationLines.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </div>
          <div className="pt-1.5 border-t border-sky-200 font-mono text-[11px] text-emerald-800 font-bold">
            e = ({mass.toFixed(1)} × {g.toFixed(2)}) / {k} = {e.toFixed(4)} m
          </div>
        </div>
      </aside>

      {/* CENTER CANVAS STAGE (Flexible) */}
      <section className="bg-white/95 backdrop-blur-sm border border-sky-200 rounded-2xl shadow-sm p-2.5 flex flex-col min-h-[560px] lg:h-[calc(100vh-88px)]">
        <div className="flex items-center justify-between px-2 pb-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-900">{t.tabs.vertical.full}</span>
          <span className="hidden sm:inline font-medium text-sky-800">{t.common.dragHint}</span>
        </div>
        <div className="relative flex-1 rounded-xl overflow-hidden border border-sky-200 bg-[#f8fcff]">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-full block touch-none"
          />
        </div>
      </section>

      {/* RIGHT TELEMETRY PANEL (330px) */}
      <aside className="bg-white/95 backdrop-blur-sm border border-sky-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3.5 studio-scroll lg:max-h-[calc(100vh-88px)] lg:overflow-y-auto">
        <div className="border-b border-sky-100 pb-2.5">
          <h2 className="text-sm font-extrabold text-slate-950 tracking-tight">
            {t.common.telemetryTitle}
          </h2>
        </div>

        {/* Primary Period & Frequency Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-2.5">
            <div className="text-[11px] font-semibold text-slate-600">{t.common.period}</div>
            <div className="font-mono text-lg font-extrabold text-slate-950 tabular-nums mt-0.5">
              {periodH.toFixed(3)} <span className="text-xs font-semibold text-slate-600">{t.common.unitS}</span>
            </div>
          </div>
          <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-2.5">
            <div className="text-[11px] font-semibold text-slate-600">{t.common.frequency}</div>
            <div className="font-mono text-lg font-extrabold text-slate-950 tabular-nums mt-0.5">
              {frequency.toFixed(3)} <span className="text-xs font-semibold text-slate-600">{t.common.unitHz}</span>
            </div>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5">
            <div className="text-[11px] font-semibold text-emerald-900">{t.module1.staticExtension}</div>
            <div className="font-mono text-base font-extrabold text-emerald-800 tabular-nums mt-0.5">
              {e.toFixed(4)} <span className="text-xs font-semibold">{t.common.unitM}</span>
            </div>
          </div>
          <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-2.5">
            <div className="text-[11px] font-semibold text-slate-600">{t.common.angularFreq}</div>
            <div className="font-mono text-base font-extrabold text-slate-950 tabular-nums mt-0.5">
              {omega.toFixed(2)} <span className="text-xs font-semibold text-slate-600">{t.common.unitRadS}</span>
            </div>
          </div>
        </div>

        {/* Gravity-Independence Proof Card */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 space-y-2">
          <div>
            <h3 className="text-xs font-extrabold text-emerald-950">
              {t.module1.gravityProofTitle}
            </h3>
            <p className="text-[11px] text-emerald-800 leading-snug mt-0.5">
              {t.module1.gravityProofSubtitle}
            </p>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-medium">{t.module1.horizontalPeriod}</span>
              <span className="font-mono font-bold text-slate-950 tabular-nums">
                {periodH.toFixed(4)} s
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700 font-medium">{t.module1.verticalPeriod}</span>
              <span className="font-mono font-bold text-slate-950 tabular-nums">
                {periodV.toFixed(4)} s
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-emerald-200">
              <span className="text-emerald-900 font-bold">{t.module1.difference}</span>
              <span className="font-mono font-extrabold text-emerald-700 tabular-nums">
                {Math.abs(periodH - periodV).toFixed(4)} s (0.00%)
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-700 leading-snug">{t.module1.proofConclusion}</p>
        </div>

        {/* Instantaneous Vector Balance Gauges */}
        <div className="bg-white border border-sky-200 rounded-xl p-3 space-y-2.5">
          <h3 className="text-xs font-extrabold text-slate-950">
            {t.module1.vectorBalanceTitle}
          </h3>

          <div className="space-y-2 text-[11.5px]">
            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-rose-700 font-semibold">{t.module1.gravityVector}</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {telemetry.fGravity.toFixed(2)} N
                </span>
              </div>
              <div className="h-2 bg-rose-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full"
                  style={{ width: `${Math.min(100, (telemetry.fGravity / fMax) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-emerald-700 font-semibold">{t.module1.tensionVector}</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {telemetry.fSpring.toFixed(2)} N
                </span>
              </div>
              <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: `${Math.min(100, (Math.abs(telemetry.fSpring) / fMax) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-sky-700 font-semibold">{t.module1.netForceVector}</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {telemetry.fNet >= 0 ? '+' : ''}
                  {telemetry.fNet.toFixed(2)} N
                </span>
              </div>
              <div className="h-2 bg-sky-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-600 rounded-full"
                  style={{
                    width: `${Math.min(100, (Math.abs(telemetry.fNet) / Math.max(1, k * amplitude)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-sky-100 text-center">
            <div>
              <div className="text-[10px] text-slate-500">x</div>
              <div className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                {telemetry.x >= 0 ? '+' : ''}
                {telemetry.x.toFixed(2)}m
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">v</div>
              <div className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                {telemetry.v >= 0 ? '+' : ''}
                {telemetry.v.toFixed(2)}m/s
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">a</div>
              <div className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                {telemetry.a >= 0 ? '+' : ''}
                {telemetry.a.toFixed(1)}m/s²
              </div>
            </div>
          </div>
        </div>

        {/* Energy Conservation Bars */}
        <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-950">{t.module1.energyTitle}</h3>
            <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
              E = {totalEnergy.toFixed(3)} J
            </span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-700">{t.module1.kineticEnergy}</span>
              <span className="font-mono font-semibold text-sky-700 tabular-nums">
                {telemetry.ke.toFixed(3)} J
              </span>
            </div>
            <div className="h-1.5 bg-sky-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-600 rounded-full"
                style={{ width: `${totalEnergy > 0 ? Math.min(100, (telemetry.ke / totalEnergy) * 100) : 0}%` }}
              />
            </div>

            <div className="flex justify-between pt-0.5">
              <span className="text-slate-700">{t.module1.potentialEnergy}</span>
              <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                {telemetry.pe.toFixed(3)} J
              </span>
            </div>
            <div className="h-1.5 bg-emerald-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${totalEnergy > 0 ? Math.min(100, (telemetry.pe / totalEnergy) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
