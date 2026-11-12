import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, AlertTriangle, Eye, EyeOff, ZoomIn } from 'lucide-react';
import { GRAVITY_PRESETS, Language } from '../types/physics';
import { TranslationSet } from '../i18n/translations';
import { EmeraldSlider } from '../components/EmeraldSlider';
import {
  drawForceArrow,
  drawRigidSupport,
  drawScientificGrid,
  exactPendulumPeriod,
  stepPendulumRK4,
} from '../utils/physicsMath';

interface SimplePendulumLabProps {
  t: TranslationSet;
  language: Language;
  resetSignal: number;
}

interface PendulumTelemetry {
  thetaDeg: number;
  omega: number;
  tension: number;
  fTangential: number;
  fRadial: number;
  phaseDriftDeg: number;
  isDragging: boolean;
}

export const SimplePendulumLab: React.FC<SimplePendulumLabProps> = ({
  t,
  language,
  resetSignal,
}) => {
  const [length, setLength] = useState<number>(1.5);
  const [mass, setMass] = useState<number>(1.0);
  const [angleDeg, setAngleDeg] = useState<number>(4);
  const [g, setG] = useState<number>(9.8);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showGhost, setShowGhost] = useState<boolean>(true);
  const [showForces, setShowForces] = useState<boolean>(true);
  const [showMagnifier, setShowMagnifier] = useState<boolean>(true);

  const theta0Rad = (angleDeg * Math.PI) / 180;
  const sinTheta0 = Math.sin(theta0Rad);
  const approxErrorPct =
    sinTheta0 > 1e-8 ? ((theta0Rad - sinTheta0) / sinTheta0) * 100 : 0;

  const idealPeriod = 2 * Math.PI * Math.sqrt(length / g);
  const exactPeriod = exactPendulumPeriod(length, g, theta0Rad);
  const periodErrorPct = ((exactPeriod - idealPeriod) / idealPeriod) * 100;
  const isShmSafe = angleDeg <= 4;

  const [telemetry, setTelemetry] = useState<PendulumTelemetry>({
    thetaDeg: angleDeg,
    omega: 0,
    tension: mass * g * Math.cos(theta0Rad),
    fTangential: mass * g * Math.sin(theta0Rad),
    fRadial: mass * g * Math.cos(theta0Rad),
    phaseDriftDeg: 0,
    isDragging: false,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef({
    theta: (4 * Math.PI) / 180,
    omega: 0,
    elapsed: 0,
    sign: 1,
    isDragging: false,
    history: [] as { t: number; real: number; ideal: number }[],
    lastUiSync: 0,
    pivot: { x: 300, y: 58 },
    rodPx: 220,
    bobPos: { x: 300, y: 278 },
    bobRadius: 18,
  });

  const syncRestartFromAngle = useCallback((deg: number, sign = 1) => {
    const rad = (deg * Math.PI) / 180;
    simRef.current.theta = sign * rad;
    simRef.current.omega = 0;
    simRef.current.elapsed = 0;
    simRef.current.sign = sign;
    simRef.current.history = [];
  }, []);

  useEffect(() => {
    if (resetSignal === 0) return;
    setLength(1.5);
    setMass(1.0);
    setAngleDeg(4);
    setG(9.8);
    setIsPlaying(true);
    setShowGhost(true);
    setShowForces(true);
    setShowMagnifier(true);
    syncRestartFromAngle(4, 1);
  }, [resetSignal, syncRestartFromAngle]);

  const paramsRef = useRef({
    length,
    mass,
    angleDeg,
    theta0Rad,
    g,
    isPlaying,
    showGhost,
    showForces,
    showMagnifier,
    t,
  });
  paramsRef.current = {
    length,
    mass,
    angleDeg,
    theta0Rad,
    g,
    isPlaying,
    showGhost,
    showForces,
    showMagnifier,
    t,
  };

  // Pointer drag on Bob
  const getCanvasPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handlePointerDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(ev.clientX, ev.clientY);
    const { bobPos, bobRadius } = simRef.current;
    const dist = Math.hypot(pt.x - bobPos.x, pt.y - bobPos.y);
    if (dist <= bobRadius + 24) {
      ev.currentTarget.setPointerCapture(ev.pointerId);
      simRef.current.isDragging = true;
    }
  };

  const handlePointerMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const pt = getCanvasPoint(ev.clientX, ev.clientY);

    if (simRef.current.isDragging) {
      const { pivot } = simRef.current;
      const dx = pt.x - pivot.x;
      const dy = Math.max(10, pt.y - pivot.y);
      let rawRad = Math.atan2(dx, dy);
      const maxRad = (85 * Math.PI) / 180;
      const minRad = (1 * Math.PI) / 180;
      const sign = rawRad >= 0 ? 1 : -1;
      const absRad = Math.max(minRad, Math.min(maxRad, Math.abs(rawRad)));
      rawRad = sign * absRad;

      simRef.current.theta = rawRad;
      simRef.current.omega = 0;
      simRef.current.elapsed = 0;
      simRef.current.sign = sign;
      simRef.current.history = [];
      setAngleDeg(Math.round((absRad * 180) / Math.PI));
    } else if (canvas) {
      const { bobPos, bobRadius } = simRef.current;
      const dist = Math.hypot(pt.x - bobPos.x, pt.y - bobPos.y);
      canvas.style.cursor = dist <= bobRadius + 20 ? 'grab' : 'default';
    }
  };

  const handlePointerUp = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (!simRef.current.isDragging) return;
    try {
      ev.currentTarget.releasePointerCapture(ev.pointerId);
    } catch {
      // ignore
    }
    simRef.current.isDragging = false;
    simRef.current.omega = 0;
    simRef.current.elapsed = 0;
    simRef.current.history = [];
    setIsPlaying(true);
  };

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.035, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const p = paramsRef.current;
      const s = simRef.current;

      const omega0 = Math.sqrt(p.g / p.length);

      if (!s.isDragging && p.isPlaying) {
        // 8 RK4 sub-steps per frame for conservation-grade accuracy
        const subSteps = 8;
        const subDt = dt / subSteps;
        for (let i = 0; i < subSteps; i++) {
          const next = stepPendulumRK4(s.theta, s.omega, p.g, p.length, subDt);
          s.theta = next.theta;
          s.omega = next.omega;
        }
        s.elapsed += dt;
      }

      const idealTheta = s.sign * p.theta0Rad * Math.cos(omega0 * s.elapsed);

      if (!s.isDragging && p.isPlaying) {
        s.history.push({ t: s.elapsed, real: s.theta, ideal: idealTheta });
        const cutoff = s.elapsed - 8.0;
        while (s.history.length > 0 && s.history[0].t < cutoff) {
          s.history.shift();
        }
      }

      // Telemetry sync (~25Hz)
      if (now - s.lastUiSync > 40) {
        s.lastUiSync = now;
        const vSq = p.length * p.length * s.omega * s.omega;
        const fRadial = p.mass * p.g * Math.cos(s.theta);
        const tension = fRadial + (p.mass * vSq) / p.length;
        const fTangential = Math.abs(p.mass * p.g * Math.sin(s.theta));
        const driftDeg = ((s.theta - idealTheta) * 180) / Math.PI;
        setTelemetry({
          thetaDeg: (s.theta * 180) / Math.PI,
          omega: s.omega,
          tension,
          fTangential,
          fRadial,
          phaseDriftDeg: driftDeg,
          isDragging: s.isDragging,
        });
      }

      // Draw Canvas
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

            const waveH = 104;
            const pivotX = cssW * 0.5;
            const pivotY = 54;
            s.pivot = { x: pivotX, y: pivotY };

            // Rod length scaled cleanly from L in [0.5, 3.0]m
            const maxRodPx = Math.max(150, cssH - waveH - pivotY - 96);
            const minRodPx = maxRodPx * 0.36;
            const rodPx = minRodPx + ((p.length - 0.5) / 2.5) * (maxRodPx - minRodPx);
            s.rodPx = rodPx;

            // Rigid Ceiling Support
            drawRigidSupport(ctx, pivotX - 110, pivotY - 14, 220, 14);

            // 1. Protractor Grid & ±4° SHM Safe Zone Wedge
            const arcR = Math.min(rodPx * 0.72, 190);
            const fourDegRad = (4 * Math.PI) / 180;

            // Shaded ±4° Safe Zone Wedge
            ctx.save();
            ctx.fillStyle = 'rgba(5, 150, 105, 0.14)';
            ctx.beginPath();
            ctx.moveTo(pivotX, pivotY);
            ctx.arc(pivotX, pivotY, rodPx + 24, Math.PI / 2 - fourDegRad, Math.PI / 2 + fourDegRad);
            ctx.closePath();
            ctx.fill();

            // Safe zone boundary lines
            ctx.strokeStyle = 'rgba(5, 150, 105, 0.55)';
            ctx.lineWidth = 1.2;
            ctx.setLineDash([4, 4]);
            for (const ang of [-fourDegRad, fourDegRad]) {
              ctx.beginPath();
              ctx.moveTo(pivotX, pivotY);
              ctx.lineTo(pivotX + Math.sin(ang) * (rodPx + 24), pivotY + Math.cos(ang) * (rodPx + 24));
              ctx.stroke();
            }
            ctx.setLineDash([]);

            // Vertical 0° axis
            ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
            ctx.lineWidth = 1.2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(pivotX, pivotY);
            ctx.lineTo(pivotX, pivotY + rodPx + 34);
            ctx.stroke();
            ctx.setLineDash([]);

            // Protractor arc & degree ticks (-90° to +90°)
            ctx.strokeStyle = 'rgba(2, 132, 199, 0.28)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(pivotX, pivotY, arcR, 0, Math.PI);
            ctx.stroke();

            ctx.font = '600 10px "JetBrains Mono", sans-serif';
            ctx.fillStyle = '#475569';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (let deg = -85; deg <= 85; deg += 5) {
              const rad = (deg * Math.PI) / 180;
              const isMajor = deg % 15 === 0;
              const inner = arcR - (isMajor ? 9 : 4);
              const outer = arcR + (isMajor ? 4 : 0);
              const x1 = pivotX + Math.sin(rad) * inner;
              const y1 = pivotY + Math.cos(rad) * inner;
              const x2 = pivotX + Math.sin(rad) * outer;
              const y2 = pivotY + Math.cos(rad) * outer;
              ctx.strokeStyle = isMajor ? 'rgba(15, 23, 42, 0.45)' : 'rgba(2, 132, 199, 0.28)';
              ctx.lineWidth = isMajor ? 1.4 : 1;
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();

              if (isMajor && deg !== 0) {
                const lx = pivotX + Math.sin(rad) * (arcR + 16);
                const ly = pivotY + Math.cos(rad) * (arcR + 16);
                ctx.fillText(`${Math.abs(deg)}°`, lx, ly);
              }
            }

            // Label ±4° Safe Zone
            ctx.font = '700 10.5px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
            ctx.fillStyle = '#047857';
            ctx.fillText('±4° SHM', pivotX, pivotY + rodPx + 42);
            ctx.restore();

            // Bob radius scales subtly with mass
            const bobR = 14 + ((p.mass - 0.2) / 4.8) * 10;
            s.bobRadius = bobR;

            // 2. Ideal SHM Ghost Bob (if enabled)
            if (p.showGhost) {
              const gx = pivotX + Math.sin(idealTheta) * rodPx;
              const gy = pivotY + Math.cos(idealTheta) * rodPx;

              ctx.save();
              ctx.setLineDash([5, 5]);
              ctx.strokeStyle = 'rgba(2, 132, 199, 0.65)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(pivotX, pivotY);
              ctx.lineTo(gx, gy);
              ctx.stroke();
              ctx.setLineDash([]);

              ctx.fillStyle = 'rgba(14, 165, 233, 0.16)';
              ctx.strokeStyle = '#0284c7';
              ctx.lineWidth = 2;
              ctx.setLineDash([4, 3]);
              ctx.beginPath();
              ctx.arc(gx, gy, bobR, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.setLineDash([]);

              ctx.font = '700 10.5px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
              ctx.fillStyle = '#0369a1';
              ctx.textAlign = 'center';
              ctx.fillText(p.t.module3.ghostBobLabel, gx, gy - bobR - 10);
              ctx.restore();
            }

            // 3. Real Non-Linear Pendulum String & Bob
            const bx = pivotX + Math.sin(s.theta) * rodPx;
            const by = pivotY + Math.cos(s.theta) * rodPx;
            s.bobPos = { x: bx, y: by };

            // Swing path arc
            ctx.save();
            ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(
              pivotX,
              pivotY,
              rodPx,
              Math.PI / 2 - p.theta0Rad,
              Math.PI / 2 + p.theta0Rad
            );
            ctx.stroke();

            // String
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(pivotX, pivotY);
            ctx.lineTo(bx, by);
            ctx.stroke();

            // Pivot pin
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(pivotX, pivotY, 5.5, 0, Math.PI * 2);
            ctx.fill();

            // Real Bob sphere with crisp metallic gradient
            ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
            ctx.beginPath();
            ctx.arc(bx + 2, by + 4, bobR, 0, Math.PI * 2);
            ctx.fill();

            const bobGrad = ctx.createRadialGradient(
              bx - bobR * 0.3,
              by - bobR * 0.3,
              bobR * 0.15,
              bx,
              by,
              bobR
            );
            bobGrad.addColorStop(0, s.isDragging ? '#38bdf8' : '#334155');
            bobGrad.addColorStop(1, s.isDragging ? '#0284c7' : '#0f172a');
            ctx.fillStyle = bobGrad;
            ctx.beginPath();
            ctx.arc(bx, by, bobR, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = p.angleDeg <= 4 ? '#059669' : '#e11d48';
            ctx.lineWidth = 2.4;
            ctx.stroke();

            // Current angle badge near pivot
            ctx.font = '700 12px "JetBrains Mono", sans-serif';
            ctx.fillStyle = p.angleDeg <= 4 ? '#047857' : '#be123c';
            ctx.textAlign = 'left';
            ctx.fillText(
              `θ = ${((s.theta * 180) / Math.PI).toFixed(1)}°`,
              pivotX + 14,
              pivotY + 22
            );
            ctx.restore();

            // 4. Real-Time Force Vector Decomposition on the Bob
            if (p.showForces) {
              const weight = p.mass * p.g;
              const pxPerN = Math.min(4.8, 76 / Math.max(8, weight * 1.2));
              const wLen = weight * pxPerN;

              const uxRad = Math.sin(s.theta);
              const uyRad = Math.cos(s.theta);
              // Tangential unit vector pointing toward decreasing theta (restoring when theta > 0)
              const uxTan = -Math.cos(s.theta);
              const uyTan = Math.sin(s.theta);

              const radMag = weight * Math.cos(s.theta) * pxPerN;
              const tanMag = weight * Math.sin(s.theta) * pxPerN;

              const vSq = p.length * p.length * s.omega * s.omega;
              const tensionN = weight * Math.cos(s.theta) + (p.mass * vSq) / p.length;
              const tensionLen = tensionN * pxPerN;

              // Dashed decomposition right-angle rectangle from weight tip
              ctx.save();
              ctx.setLineDash([3, 3]);
              ctx.strokeStyle = 'rgba(71, 85, 105, 0.55)';
              ctx.lineWidth = 1.2;
              const wTipX = bx;
              const wTipY = by + wLen;
              const radTipX = bx + uxRad * radMag;
              const radTipY = by + uyRad * radMag;
              const tanTipX = bx + uxTan * tanMag;
              const tanTipY = by + uyTan * tanMag;
              ctx.beginPath();
              ctx.moveTo(wTipX, wTipY);
              ctx.lineTo(radTipX, radTipY);
              ctx.moveTo(wTipX, wTipY);
              ctx.lineTo(tanTipX, tanTipY);
              ctx.stroke();
              ctx.restore();

              // Radial component mg cos(theta)
              drawForceArrow(
                ctx,
                bx,
                by,
                uxRad * radMag,
                uyRad * radMag,
                '#475569',
                'mg cosθ',
                s.theta >= 0 ? 'right' : 'left',
                2.4
              );

              // String Tension T (along string toward pivot)
              drawForceArrow(
                ctx,
                bx,
                by,
                -uxRad * tensionLen,
                -uyRad * tensionLen,
                '#0f172a',
                `T (${tensionN.toFixed(1)}N)`,
                s.theta >= 0 ? 'left' : 'right',
                2.8
              );

              // Downward Weight mg
              drawForceArrow(
                ctx,
                bx,
                by,
                0,
                wLen,
                '#e11d48',
                `mg (${weight.toFixed(1)}N)`,
                s.theta >= 0 ? 'left' : 'right',
                3.0
              );

              // Tangential Restoring Force -mg sin(theta)
              if (Math.abs(tanMag) > 3) {
                drawForceArrow(
                  ctx,
                  bx,
                  by,
                  uxTan * tanMag,
                  uyTan * tanMag,
                  '#059669',
                  `mg sinθ`,
                  'center',
                  3.2
                );
              }
            }

            // 5. ±4° Precision Magnifier Inset (Top-Right of Canvas)
            if (p.showMagnifier) {
              const boxW = 166;
              const boxH = 148;
              const boxX = cssW - boxW - 14;
              const boxY = 14;
              ctx.save();
              ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
              ctx.strokeStyle = '#7dd3fc';
              ctx.lineWidth = 1.4;
              ctx.beginPath();
              ctx.roundRect(boxX, boxY, boxW, boxH, 12);
              ctx.fill();
              ctx.stroke();

              // Clip inside magnifier
              ctx.beginPath();
              ctx.roundRect(boxX + 1, boxY + 1, boxW - 2, boxH - 2, 11);
              ctx.clip();

              ctx.font = '700 10.5px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
              ctx.fillStyle = '#0f172a';
              ctx.textAlign = 'center';
              ctx.fillText(p.t.module3.magnifierTitle, boxX + boxW / 2, boxY + 16);

              const zoomPivotX = boxX + boxW / 2;
              const zoomPivotY = boxY + 26;
              const zoomR = boxH - 42;
              const zoomGain = 6; // 6x angular magnification!
              const safeAngZoom = fourDegRad * zoomGain;

              // Shaded ±4° wedge zoomed
              ctx.fillStyle = 'rgba(5, 150, 105, 0.16)';
              ctx.beginPath();
              ctx.moveTo(zoomPivotX, zoomPivotY);
              ctx.arc(
                zoomPivotX,
                zoomPivotY,
                zoomR + 10,
                Math.PI / 2 - safeAngZoom,
                Math.PI / 2 + safeAngZoom
              );
              ctx.closePath();
              ctx.fill();

              // 0° axis
              ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              ctx.moveTo(zoomPivotX, zoomPivotY);
              ctx.lineTo(zoomPivotX, zoomPivotY + zoomR + 6);
              ctx.stroke();
              ctx.setLineDash([]);

              const clampZoom = (ang: number) =>
                Math.max(-0.95, Math.min(0.95, ang * zoomGain));

              // Ghost in zoom
              if (p.showGhost) {
                const gz = clampZoom(idealTheta);
                const gzx = zoomPivotX + Math.sin(gz) * zoomR;
                const gzy = zoomPivotY + Math.cos(gz) * zoomR;
                ctx.strokeStyle = '#0284c7';
                ctx.lineWidth = 1.6;
                ctx.setLineDash([3, 2]);
                ctx.beginPath();
                ctx.moveTo(zoomPivotX, zoomPivotY);
                ctx.lineTo(gzx, gzy);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.arc(gzx, gzy, 7, 0, Math.PI * 2);
                ctx.stroke();
              }

              // Real bob in zoom
              const rz = clampZoom(s.theta);
              const rzx = zoomPivotX + Math.sin(rz) * zoomR;
              const rzy = zoomPivotY + Math.cos(rz) * zoomR;
              ctx.strokeStyle = '#0f172a';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(zoomPivotX, zoomPivotY);
              ctx.lineTo(rzx, rzy);
              ctx.stroke();
              ctx.fillStyle = Math.abs(s.theta) <= fourDegRad ? '#059669' : '#e11d48';
              ctx.beginPath();
              ctx.arc(rzx, rzy, 7, 0, Math.PI * 2);
              ctx.fill();

              ctx.font = '600 9.5px "JetBrains Mono", sans-serif';
              ctx.fillStyle = '#047857';
              ctx.fillText('-4°', zoomPivotX - Math.sin(safeAngZoom) * zoomR - 14, boxY + boxH - 8);
              ctx.fillText('+4°', zoomPivotX + Math.sin(safeAngZoom) * zoomR + 14, boxY + boxH - 8);
              ctx.restore();
            }

            // 6. Bottom Waveform Comparison Strip: Real (RK4) vs Ideal SHM
            const waveX = 18;
            const waveY = cssH - waveH - 8;
            const waveW = cssW - 36;
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
            ctx.strokeStyle = '#bae6fd';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(waveX, waveY, waveW, waveH, 12);
            ctx.fill();
            ctx.stroke();

            const waveMidY = waveY + waveH * 0.57;
            ctx.strokeStyle = '#cbd5e1';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(waveX + 12, waveMidY);
            ctx.lineTo(waveX + waveW - 12, waveMidY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Legend inside waveform strip
            ctx.font = '700 11px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#0f172a';
            ctx.fillText(`— ${p.t.module3.realBobLabel}`, waveX + 14, waveY + 17);
            ctx.fillStyle = '#0284c7';
            ctx.fillText(`- - ${p.t.module3.ghostBobLabel}`, waveX + 118, waveY + 17);

            ctx.textAlign = 'right';
            ctx.fillStyle = '#0369a1';
            ctx.font = '600 10.5px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
            ctx.fillText(p.t.module3.dragBobHint, waveX + waveW - 14, waveY + 17);

            if (s.history.length > 1) {
              const latestT = s.history[s.history.length - 1].t;
              const maxSpan = 8.0;
              const plotLeft = waveX + 14;
              const plotW = waveW - 28;
              const ampScaleY = (waveH * 0.32) / Math.max(0.03, p.theta0Rad);

              // Ideal SHM dashed curve
              if (p.showGhost) {
                ctx.strokeStyle = '#0284c7';
                ctx.lineWidth = 1.8;
                ctx.setLineDash([5, 4]);
                ctx.beginPath();
                for (let i = 0; i < s.history.length; i++) {
                  const pt = s.history[i];
                  const px = plotLeft + ((pt.t - (latestT - maxSpan)) / maxSpan) * plotW;
                  const py = waveMidY - pt.ideal * ampScaleY;
                  if (i === 0) ctx.moveTo(px, py);
                  else ctx.lineTo(px, py);
                }
                ctx.stroke();
                ctx.setLineDash([]);
              }

              // Real RK4 solid curve
              ctx.strokeStyle = '#059669';
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              for (let i = 0; i < s.history.length; i++) {
                const pt = s.history[i];
                const px = plotLeft + ((pt.t - (latestT - maxSpan)) / maxSpan) * plotW;
                const py = waveMidY - pt.real * ampScaleY;
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

  const quickAngles = [2, 4, 30, 60, 80];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)_330px] gap-4 items-stretch">
      {/* LEFT SIDEBAR */}
      <aside className="bg-white/95 backdrop-blur-sm border border-sky-200 rounded-2xl shadow-sm p-4 flex flex-col gap-4 studio-scroll lg:max-h-[calc(100vh-88px)] lg:overflow-y-auto">
        <div className="flex items-center justify-between border-b border-sky-100 pb-2.5">
          <h2 className="text-sm font-extrabold text-slate-950 tracking-tight">
            {t.common.controlsTitle}
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => syncRestartFromAngle(angleDeg, 1)}
              className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-slate-800 cursor-pointer"
              title="Sync t = 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isPlaying ? t.pause : t.play}</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <EmeraldSlider
            id="m3-L"
            label={t.module3.stringLength}
            value={length}
            min={0.5}
            max={3.0}
            step={0.05}
            decimals={2}
            unit={t.common.unitM}
            onChange={(val) => {
              setLength(val);
              syncRestartFromAngle(angleDeg, 1);
            }}
          />

          <EmeraldSlider
            id="m3-mass"
            label={t.module3.bobMass}
            value={mass}
            min={0.2}
            max={5.0}
            step={0.1}
            decimals={1}
            unit={t.common.unitKg}
            onChange={setMass}
          />

          <div className="space-y-2">
            <EmeraldSlider
              id="m3-angle"
              label={t.module3.initialAngle}
              value={angleDeg}
              min={1}
              max={85}
              step={1}
              decimals={0}
              unit={t.common.unitDeg}
              onChange={(val) => {
                setAngleDeg(val);
                syncRestartFromAngle(val, 1);
              }}
            />
            <div className="grid grid-cols-5 gap-1">
              {quickAngles.map((deg) => {
                const active = angleDeg === deg;
                const safe = deg <= 4;
                return (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => {
                      setAngleDeg(deg);
                      syncRestartFromAngle(deg, 1);
                      setIsPlaying(true);
                    }}
                    className={`py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                      active
                        ? safe
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-rose-600 text-white border-rose-600'
                        : 'bg-sky-50/70 hover:bg-sky-100 text-slate-800 border-sky-200'
                    }`}
                  >
                    {deg}°
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <EmeraldSlider
              id="m3-g"
              label={t.common.gravity}
              value={g}
              min={1.0}
              max={25.0}
              step={0.01}
              decimals={2}
              unit={t.common.unitMs2}
              onChange={(val) => {
                setG(val);
                syncRestartFromAngle(angleDeg, 1);
              }}
            />
            <div className="grid grid-cols-2 gap-1.5">
              {GRAVITY_PRESETS.map((preset) => {
                const active = Math.abs(g - preset.g) < 0.05;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setG(preset.g);
                      syncRestartFromAngle(angleDeg, 1);
                    }}
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
        </div>

        {/* Display Toggles */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setShowGhost((v) => !v)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              showGhost
                ? 'bg-sky-50 border-sky-300 text-sky-950'
                : 'bg-slate-50 border-sky-200 text-slate-600'
            }`}
          >
            <span>{t.module3.showGhostBob}</span>
            {showGhost ? <Eye className="w-4 h-4 text-sky-700" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setShowForces((v) => !v)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              showForces
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-slate-50 border-sky-200 text-slate-600'
            }`}
          >
            <span>{t.module3.showForceDecomp}</span>
            {showForces ? (
              <Eye className="w-4 h-4 text-emerald-700" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowMagnifier((v) => !v)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              showMagnifier
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-slate-50 border-sky-200 text-slate-600'
            }`}
          >
            <span>{t.module3.showMagnifier}</span>
            <ZoomIn className="w-4 h-4 text-emerald-700" />
          </button>
        </div>

        {/* Derivation */}
        <div className="mt-auto bg-sky-50/80 border border-sky-200 rounded-xl p-3 space-y-1.5">
          <h3 className="text-xs font-extrabold text-slate-950">{t.common.derivationTitle}</h3>
          <div className="space-y-1 font-mono text-[11px] text-slate-800 leading-relaxed">
            {t.module3.derivationLines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      </aside>

      {/* CENTER CANVAS STAGE */}
      <section className="bg-white/95 backdrop-blur-sm border border-sky-200 rounded-2xl shadow-sm p-2.5 flex flex-col min-h-[560px] lg:h-[calc(100vh-88px)]">
        <div className="flex items-center justify-between px-2 pb-2 text-xs">
          <span className="font-semibold text-slate-900">{t.tabs.pendulum.full}</span>
          <span
            className={`inline-flex items-center gap-1.5 font-bold ${
              isShmSafe ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {isShmSafe ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            <span>{isShmSafe ? t.module3.shmSafeZone : t.module3.outsideShmZone}</span>
          </span>
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

      {/* RIGHT TELEMETRY PANEL (Laws of Simple Pendulum Verifier) */}
      <aside className="bg-white/95 backdrop-blur-sm border border-sky-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3.5 studio-scroll lg:max-h-[calc(100vh-88px)] lg:overflow-y-auto">
        <div className="border-b border-sky-100 pb-2.5">
          <h2 className="text-sm font-extrabold text-slate-950 tracking-tight">
            {t.common.telemetryTitle}
          </h2>
        </div>

        {/* Period Comparison: Ideal vs Exact */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-2.5">
            <div className="text-[11px] font-semibold text-slate-600">{t.module3.idealPeriod}</div>
            <div className="font-mono text-lg font-extrabold text-slate-950 tabular-nums mt-0.5">
              {idealPeriod.toFixed(4)} <span className="text-xs font-semibold text-slate-600">s</span>
            </div>
          </div>
          <div
            className={`border rounded-xl p-2.5 ${
              isShmSafe
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-rose-50/70 border-rose-200'
            }`}
          >
            <div
              className={`text-[11px] font-semibold ${
                isShmSafe ? 'text-emerald-900' : 'text-rose-900'
              }`}
            >
              {t.module3.exactPeriod}
            </div>
            <div
              className={`font-mono text-lg font-extrabold tabular-nums mt-0.5 ${
                isShmSafe ? 'text-emerald-800' : 'text-rose-700'
              }`}
            >
              {exactPeriod.toFixed(4)} <span className="text-xs font-semibold">s</span>
            </div>
          </div>
        </div>

        {/* Live Small-Angle Approximation Error Gauge */}
        <div className="bg-white border border-sky-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-950">{t.module3.errorGaugeTitle}</h3>
            <span
              className={`font-mono text-xs font-extrabold tabular-nums ${
                isShmSafe ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {approxErrorPct.toFixed(3)}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-sky-50/60 border border-sky-100 rounded-lg p-2">
              <div className="text-[10.5px] text-slate-600">{t.module3.thetaRad}</div>
              <div className="font-mono font-bold text-slate-950 tabular-nums">
                {theta0Rad.toFixed(5)}
              </div>
            </div>
            <div className="bg-sky-50/60 border border-sky-100 rounded-lg p-2">
              <div className="text-[10.5px] text-slate-600">{t.module3.sinTheta}</div>
              <div className="font-mono font-bold text-slate-950 tabular-nums">
                {sinTheta0.toFixed(5)}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-600 font-medium">{t.module3.periodError}</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                +{periodErrorPct.toFixed(3)}% ({(exactPeriod - idealPeriod).toFixed(4)} s)
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isShmSafe ? 'bg-emerald-600' : 'bg-rose-600'}`}
                style={{ width: `${Math.min(100, Math.max(2, periodErrorPct * 6))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Live Instantaneous Forces on Bob */}
        <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-700 font-semibold">{t.module3.stringTension}</span>
            <span className="font-mono font-bold text-slate-950 tabular-nums">
              {telemetry.tension.toFixed(2)} N
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-800 font-semibold">{t.module3.tangentialForce}</span>
            <span className="font-mono font-bold text-emerald-800 tabular-nums">
              {telemetry.fTangential.toFixed(2)} N
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-700 font-semibold">{t.module3.radialWeight}</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {telemetry.fRadial.toFixed(2)} N
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-sky-200">
            <span className="text-sky-800 font-semibold">{t.module3.phaseDrift}</span>
            <span className="font-mono font-bold text-sky-800 tabular-nums">
              {telemetry.phaseDriftDeg >= 0 ? '+' : ''}
              {telemetry.phaseDriftDeg.toFixed(2)}°
            </span>
          </div>
        </div>

        {/* 4 Laws of Simple Pendulum Verifier */}
        <div className="bg-white border border-sky-200 rounded-xl p-3 space-y-2.5">
          <h3 className="text-xs font-extrabold text-slate-950">{t.module3.lawsTitle}</h3>

          <div className="space-y-2 text-[11px]">
            {/* Law 1 */}
            <div
              className={`p-2 rounded-lg border ${
                isShmSafe
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/70 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>{t.module3.law1Title}</span>
                {isShmSafe ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                )}
              </div>
              <div className="mt-0.5 leading-snug">
                {isShmSafe ? t.module3.law1Valid : t.module3.law1Deviating}
              </div>
            </div>

            {/* Law 2 */}
            <div className="p-2 rounded-lg bg-sky-50/60 border border-sky-200">
              <div className="flex justify-between font-bold text-slate-900">
                <span>{t.module3.law2Title}</span>
                <span className="font-mono text-sky-800 tabular-nums">
                  T₀/√L = {(idealPeriod / Math.sqrt(length)).toFixed(3)}
                </span>
              </div>
              <div className="text-slate-600 mt-0.5">{t.module3.law2Desc}</div>
            </div>

            {/* Law 3 */}
            <div className="p-2 rounded-lg bg-sky-50/60 border border-sky-200">
              <div className="flex justify-between font-bold text-slate-900">
                <span>{t.module3.law3Title}</span>
                <span className="font-mono text-sky-800 tabular-nums">
                  T₀√g = {(idealPeriod * Math.sqrt(g)).toFixed(3)}
                </span>
              </div>
              <div className="text-slate-600 mt-0.5">{t.module3.law3Desc}</div>
            </div>

            {/* Law 4 */}
            <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-200">
              <div className="flex justify-between font-bold text-slate-900">
                <span>{t.module3.law4Title}</span>
                <span className="font-mono text-emerald-700 tabular-nums">ΔT/Δm = 0</span>
              </div>
              <div className="text-slate-600 mt-0.5">{t.module3.law4Desc}</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
