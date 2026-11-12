import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Scissors, RotateCcw } from 'lucide-react';
import { CombinedMode } from '../types/physics';
import { TranslationSet } from '../i18n/translations';
import { EmeraldSlider } from '../components/EmeraldSlider';
import {
  drawForceArrow,
  drawHelicalSpring,
  drawRigidSupport,
  drawScientificGrid,
} from '../utils/physicsMath';

interface CombinedSpringsLabProps {
  t: TranslationSet;
  resetSignal: number;
}

interface CombinedTelemetry {
  x: number;
  f1: number;
  f2: number;
  x1: number;
  x2: number;
  isDragging: boolean;
}

export const CombinedSpringsLab: React.FC<CombinedSpringsLabProps> = ({ t, resetSignal }) => {
  const [mode, setMode] = useState<CombinedMode>('series');
  const [k1, setK1] = useState<number>(40);
  const [k2, setK2] = useState<number>(80);
  const [mass, setMass] = useState<number>(2.0);
  const [amplitude, setAmplitude] = useState<number>(0.18);
  const [cutSegments, setCutSegments] = useState<number>(3);
  const [cutRatioMode, setCutRatioMode] = useState<'equal' | 'ratio'>('equal');
  const [selectedRatioPart, setSelectedRatioPart] = useState<'A' | 'B'>('A');
  const [isCutActive, setIsCutActive] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const g = 9.8;

  // Equivalent stiffness calculation
  let kEq = k1;
  let kPart = k1;
  let lengthFraction = 1;

  if (mode === 'series') {
    kEq = (k1 * k2) / (k1 + k2);
  } else if (mode === 'parallel' || mode === 'opposing') {
    kEq = k1 + k2;
  } else {
    // Cutter mode
    if (!isCutActive) {
      lengthFraction = 1;
      kPart = k1;
    } else if (cutRatioMode === 'equal') {
      lengthFraction = 1 / cutSegments;
      kPart = cutSegments * k1;
    } else {
      // 1 : 2 ratio => total 3 parts
      lengthFraction = selectedRatioPart === 'A' ? 1 / 3 : 2 / 3;
      kPart = k1 / lengthFraction;
    }
    kEq = kPart;
  }

  const omega = Math.sqrt(kEq / mass);
  const period = 2 * Math.PI * Math.sqrt(mass / kEq);
  const frequency = 1 / period;

  // Base uncut metrics for cutter comparison
  const omegaBase = Math.sqrt(k1 / mass);
  const periodBase = 2 * Math.PI * Math.sqrt(mass / k1);

  // Static equilibrium extensions
  const eTotal = mode === 'opposing' ? 0 : (mass * g) / kEq;
  const e1 =
    mode === 'series'
      ? (mass * g) / k1
      : mode === 'parallel'
        ? eTotal
        : 0;
  const e2 =
    mode === 'series'
      ? (mass * g) / k2
      : mode === 'parallel'
        ? eTotal
        : 0;

  const [telemetry, setTelemetry] = useState<CombinedTelemetry>({
    x: amplitude,
    f1: mode === 'series' ? kEq * (eTotal + amplitude) : k1 * (eTotal + amplitude),
    f2: mode === 'series' ? kEq * (eTotal + amplitude) : k2 * (eTotal + amplitude),
    x1: mode === 'series' ? (eTotal + amplitude) * (k2 / (k1 + k2)) : eTotal + amplitude,
    x2: mode === 'series' ? (eTotal + amplitude) * (k1 / (k1 + k2)) : eTotal + amplitude,
    isDragging: false,
  });

  useEffect(() => {
    if (resetSignal === 0) return;
    setMode('series');
    setK1(40);
    setK2(80);
    setMass(2.0);
    setAmplitude(0.18);
    setCutSegments(3);
    setCutRatioMode('equal');
    setSelectedRatioPart('A');
    setIsCutActive(true);
    setIsPlaying(true);
    simRef.current.phase = 0;
    simRef.current.phaseBase = 0;
    simRef.current.x = 0.18;
  }, [resetSignal]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef({
    phase: 0,
    phaseBase: 0,
    x: 0.18,
    xBase: 0.18,
    isDragging: false,
    dragX: 0.18,
    lastUiSync: 0,
    blockRect: { x: 0, y: 0, w: 76, h: 52 },
    eqAnchor: { x: 300, y: 300 },
    pxPerMeter: 130,
    cutFlash: 0,
  });

  const paramsRef = useRef({
    mode,
    k1,
    k2,
    kEq,
    kPart,
    lengthFraction,
    cutSegments,
    cutRatioMode,
    selectedRatioPart,
    isCutActive,
    mass,
    g,
    amplitude,
    omega,
    omegaBase,
    eTotal,
    isPlaying,
    t,
  });
  paramsRef.current = {
    mode,
    k1,
    k2,
    kEq,
    kPart,
    lengthFraction,
    cutSegments,
    cutRatioMode,
    selectedRatioPart,
    isCutActive,
    mass,
    g,
    amplitude,
    omega,
    omegaBase,
    eTotal,
    isPlaying,
    t,
  };

  const triggerCutAnimation = () => {
    setIsCutActive(true);
    simRef.current.cutFlash = 1.0;
    simRef.current.phase = 0;
    simRef.current.phaseBase = 0;
  };

  // Pointer interaction on Canvas
  const getCanvasPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handlePointerDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(ev.clientX, ev.clientY);
    const { blockRect } = simRef.current;
    const pad = 18;
    if (
      pt.x >= blockRect.x - pad &&
      pt.x <= blockRect.x + blockRect.w + pad &&
      pt.y >= blockRect.y - pad &&
      pt.y <= blockRect.y + blockRect.h + pad
    ) {
      ev.currentTarget.setPointerCapture(ev.pointerId);
      simRef.current.isDragging = true;
      const isHoriz = paramsRef.current.mode === 'opposing';
      const rawX = isHoriz
        ? (pt.x - simRef.current.eqAnchor.x) / simRef.current.pxPerMeter
        : (pt.y - blockRect.h / 2 - simRef.current.eqAnchor.y) / simRef.current.pxPerMeter;
      simRef.current.dragX = Math.max(-0.4, Math.min(0.4, rawX));
      simRef.current.x = simRef.current.dragX;
    }
  };

  const handlePointerMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const pt = getCanvasPoint(ev.clientX, ev.clientY);

    if (simRef.current.isDragging) {
      const { blockRect, eqAnchor, pxPerMeter } = simRef.current;
      const isHoriz = paramsRef.current.mode === 'opposing';
      const rawX = isHoriz
        ? (pt.x - eqAnchor.x) / pxPerMeter
        : (pt.y - blockRect.h / 2 - eqAnchor.y) / pxPerMeter;
      const clampedX = Math.max(-0.4, Math.min(0.4, rawX));
      simRef.current.dragX = clampedX;
      simRef.current.x = clampedX;
      setAmplitude(Number(Math.max(0.05, Math.min(0.4, Math.abs(clampedX))).toFixed(2)));
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
      // ignore
    }
    simRef.current.isDragging = false;
    const xRel = simRef.current.dragX;
    setAmplitude(Number(Math.max(0.05, Math.min(0.4, Math.abs(xRel))).toFixed(2)));
    simRef.current.phase = xRel >= 0 ? 0 : Math.PI;
    simRef.current.phaseBase = simRef.current.phase;
    setIsPlaying(true);
  };

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.04, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const p = paramsRef.current;
      const s = simRef.current;

      if (s.cutFlash > 0) {
        s.cutFlash = Math.max(0, s.cutFlash - dt * 2.2);
      }

      if (s.isDragging) {
        s.x = s.dragX;
        s.xBase = s.dragX;
      } else if (p.isPlaying) {
        s.phase += p.omega * dt;
        s.phaseBase += p.omegaBase * dt;
        s.x = p.amplitude * Math.cos(s.phase);
        s.xBase = p.amplitude * Math.cos(s.phaseBase);
      } else {
        s.x = p.amplitude * Math.cos(s.phase);
        s.xBase = p.amplitude * Math.cos(s.phaseBase);
      }

      // Sync React telemetry ~25Hz
      if (now - s.lastUiSync > 40) {
        s.lastUiSync = now;
        const totalStretch = p.eTotal + s.x;
        let f1 = 0;
        let f2 = 0;
        let x1 = 0;
        let x2 = 0;

        if (p.mode === 'series') {
          const fShared = p.kEq * totalStretch;
          f1 = fShared;
          f2 = fShared;
          x1 = fShared / p.k1;
          x2 = fShared / p.k2;
        } else if (p.mode === 'parallel') {
          x1 = totalStretch;
          x2 = totalStretch;
          f1 = p.k1 * x1;
          f2 = p.k2 * x2;
        } else if (p.mode === 'opposing') {
          x1 = s.x;
          x2 = -s.x;
          f1 = -p.k1 * s.x;
          f2 = -p.k2 * s.x;
        } else {
          f1 = p.k1 * ((p.mass * p.g) / p.k1 + s.xBase);
          f2 = p.kPart * totalStretch;
          x1 = (p.mass * p.g) / p.k1 + s.xBase;
          x2 = totalStretch;
        }

        setTelemetry({
          x: s.x,
          f1,
          f2,
          x1,
          x2,
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

            if (p.mode === 'series') {
              const cx = cssW * 0.5;
              const mountY = 36;
              const ceilingY = mountY + 14;
              drawRigidSupport(ctx, cx - 120, mountY, 240, 14);

              const natLen1 = Math.min(92, cssH * 0.16);
              const natLen2 = Math.min(92, cssH * 0.16);

              const availDrop = Math.max(120, cssH - (ceilingY + natLen1 + natLen2) - 115);
              const maxReq = Math.max(0.9, p.eTotal + p.amplitude + 0.1);
              const pxPerM = Math.min(130, availDrop / maxReq);
              s.pxPerMeter = pxPerM;

              const eqY = ceilingY + natLen1 + natLen2 + p.eTotal * pxPerM;
              s.eqAnchor = { x: cx, y: eqY };

              const totalStretch = p.eTotal + s.x;
              const ext1 = (totalStretch * p.k2) / (p.k1 + p.k2);
              const ext2 = (totalStretch * p.k1) / (p.k1 + p.k2);

              const ringY = Math.max(ceilingY + 26, ceilingY + natLen1 + ext1 * pxPerM);
              const bottomY = Math.max(ringY + 26, ringY + natLen2 + ext2 * pxPerM);

              // Equilibrium line
              ctx.save();
              ctx.setLineDash([6, 5]);
              ctx.strokeStyle = '#059669';
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.moveTo(cx - 130, eqY);
              ctx.lineTo(cx + 130, eqY);
              ctx.stroke();
              ctx.setLineDash([]);
              ctx.font = '700 11px "JetBrains Mono", sans-serif';
              ctx.fillStyle = '#047857';
              ctx.textAlign = 'right';
              ctx.fillText('y_eq', cx - 136, eqY + 4);
              ctx.restore();

              // Spring 1 (Top, Navy/Slate)
              drawHelicalSpring(ctx, cx, ceilingY, cx, ringY, 10, 16, '#0284c7', 2.6);
              // Spring 2 (Bottom, Emerald)
              drawHelicalSpring(ctx, cx, ringY, cx, bottomY, 10, 16, '#059669', 2.6);

              // Coupling ring
              ctx.save();
              ctx.fillStyle = '#ffffff';
              ctx.strokeStyle = '#0f172a';
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.arc(cx, ringY, 7, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.restore();

              // Dimension labels on left of springs
              const fShared = p.kEq * totalStretch;
              ctx.save();
              ctx.font = '600 11.5px "JetBrains Mono", "Hind Siliguri", sans-serif';
              ctx.textAlign = 'right';
              ctx.fillStyle = '#0369a1';
              ctx.fillText(
                `k₁=${p.k1} | x₁=${ext1.toFixed(2)}m`,
                cx - 32,
                (ceilingY + ringY) * 0.5
              );
              ctx.fillStyle = '#047857';
              ctx.fillText(
                `k₂=${p.k2} | x₂=${ext2.toFixed(2)}m`,
                cx - 32,
                (ringY + bottomY) * 0.5
              );

              // Shared Force badges on right
              ctx.textAlign = 'left';
              ctx.fillStyle = '#0f172a';
              ctx.fillText(`F₁ = ${fShared.toFixed(1)} N`, cx + 32, (ceilingY + ringY) * 0.5);
              ctx.fillText(`F₂ = ${fShared.toFixed(1)} N`, cx + 32, (ringY + bottomY) * 0.5);
              ctx.restore();

              // Mass block
              const bw = 78;
              const bh = 52;
              const bx = cx - bw / 2;
              const by = bottomY;
              s.blockRect = { x: bx, y: by, w: bw, h: bh };

              ctx.save();
              ctx.fillStyle = s.isDragging ? '#0284c7' : '#0f172a';
              ctx.beginPath();
              ctx.roundRect(bx, by, bw, bh, 10);
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.font = '700 13px "JetBrains Mono", sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`${p.mass.toFixed(1)} kg`, cx, by + bh / 2);
              ctx.restore();

              // Gravity arrow
              const pxPerN = Math.min(2.2, 70 / Math.max(20, p.mass * p.g * 1.4));
              drawForceArrow(
                ctx,
                cx,
                by + bh,
                0,
                p.mass * p.g * pxPerN,
                '#e11d48',
                `mg = ${(p.mass * p.g).toFixed(1)} N`,
                'right',
                3
              );
            } else if (p.mode === 'parallel') {
              const cx = cssW * 0.5;
              const mountY = 36;
              const ceilingY = mountY + 14;
              drawRigidSupport(ctx, cx - 150, mountY, 300, 14);

              const natLen = Math.min(130, cssH * 0.22);
              const availDrop = Math.max(120, cssH - (ceilingY + natLen) - 140);
              const maxReq = Math.max(0.75, p.eTotal + p.amplitude + 0.1);
              const pxPerM = Math.min(150, availDrop / maxReq);
              s.pxPerMeter = pxPerM;

              const eqY = ceilingY + natLen + p.eTotal * pxPerM;
              s.eqAnchor = { x: cx, y: eqY };

              const totalStretch = p.eTotal + s.x;
              const barY = Math.max(ceilingY + 35, eqY + s.x * pxPerM);

              const leftX = cx - 64;
              const rightX = cx + 64;

              // Equilibrium line
              ctx.save();
              ctx.setLineDash([6, 5]);
              ctx.strokeStyle = '#059669';
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.moveTo(cx - 145, eqY);
              ctx.lineTo(cx + 145, eqY);
              ctx.stroke();
              ctx.setLineDash([]);
              ctx.font = '700 11px "JetBrains Mono", sans-serif';
              ctx.fillStyle = '#047857';
              ctx.textAlign = 'right';
              ctx.fillText('y_eq', cx - 152, eqY + 4);
              ctx.restore();

              // Parallel springs
              drawHelicalSpring(ctx, leftX, ceilingY, leftX, barY, 12, 15, '#0284c7', 2.6);
              drawHelicalSpring(ctx, rightX, ceilingY, rightX, barY, 12, 15, '#059669', 2.6);

              // Rigid Crossbar
              ctx.save();
              ctx.fillStyle = '#334155';
              ctx.beginPath();
              ctx.roundRect(leftX - 24, barY, rightX - leftX + 48, 12, 6);
              ctx.fill();
              ctx.restore();

              // Individual spring force vectors (upward)
              const f1 = p.k1 * totalStretch;
              const f2 = p.k2 * totalStretch;
              const pxPerN = Math.min(2.2, 80 / Math.max(25, p.mass * p.g * 1.4));

              drawForceArrow(
                ctx,
                leftX - 28,
                barY,
                0,
                -f1 * pxPerN,
                '#0284c7',
                `F₁=${f1.toFixed(1)}N`,
                'left',
                2.8
              );
              drawForceArrow(
                ctx,
                rightX + 28,
                barY,
                0,
                -f2 * pxPerN,
                '#059669',
                `F₂=${f2.toFixed(1)}N`,
                'right',
                2.8
              );

              // Labels
              ctx.save();
              ctx.font = '600 11.5px "JetBrains Mono", sans-serif';
              ctx.textAlign = 'center';
              ctx.fillStyle = '#0369a1';
              ctx.fillText(`k₁ = ${p.k1}`, leftX, ceilingY - 22);
              ctx.fillStyle = '#047857';
              ctx.fillText(`k₂ = ${p.k2}`, rightX, ceilingY - 22);
              ctx.restore();

              // Connecting rod to mass
              ctx.save();
              ctx.strokeStyle = '#0f172a';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(cx, barY + 12);
              ctx.lineTo(cx, barY + 30);
              ctx.stroke();
              ctx.restore();

              // Mass block
              const bw = 78;
              const bh = 52;
              const bx = cx - bw / 2;
              const by = barY + 30;
              s.blockRect = { x: bx, y: by, w: bw, h: bh };

              ctx.save();
              ctx.fillStyle = s.isDragging ? '#0284c7' : '#0f172a';
              ctx.beginPath();
              ctx.roundRect(bx, by, bw, bh, 10);
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.font = '700 13px "JetBrains Mono", sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`${p.mass.toFixed(1)} kg`, cx, by + bh / 2);
              ctx.restore();

              drawForceArrow(
                ctx,
                cx,
                by + bh,
                0,
                p.mass * p.g * pxPerN,
                '#e11d48',
                `mg = ${(p.mass * p.g).toFixed(1)} N`,
                'right',
                3
              );
            } else if (p.mode === 'opposing') {
              // Horizontal opposing wall springs
              const cy = cssH * 0.48;
              const leftWallX = 56;
              const rightWallX = cssW - 56;
              const eqX = (leftWallX + rightWallX) * 0.5;
              const bw = 82;
              const bh = 62;

              const maxHorizPx = (rightWallX - leftWallX - bw) * 0.36;
              const pxPerM = Math.min(260, maxHorizPx / 0.42);
              s.pxPerMeter = pxPerM;
              s.eqAnchor = { x: eqX, y: cy };

              const blockCenterX = eqX + s.x * pxPerM;
              const bx = blockCenterX - bw / 2;
              const by = cy - bh / 2;
              s.blockRect = { x: bx, y: by, w: bw, h: bh };

              // Track floor
              const trackY = by + bh;
              ctx.save();
              ctx.fillStyle = '#e0f2fe';
              ctx.fillRect(leftWallX, trackY, rightWallX - leftWallX, 16);
              ctx.strokeStyle = '#0f172a';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(leftWallX, trackY);
              ctx.lineTo(rightWallX, trackY);
              ctx.stroke();

              // Left & Right rigid walls
              ctx.fillStyle = '#bae6fd';
              ctx.fillRect(leftWallX - 16, cy - 85, 16, 170);
              ctx.fillRect(rightWallX, cy - 85, 16, 170);
              ctx.beginPath();
              ctx.moveTo(leftWallX, cy - 85);
              ctx.lineTo(leftWallX, trackY + 16);
              ctx.moveTo(rightWallX, cy - 85);
              ctx.lineTo(rightWallX, trackY + 16);
              ctx.stroke();

              // Equilibrium marker
              ctx.setLineDash([6, 5]);
              ctx.strokeStyle = '#059669';
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.moveTo(eqX, cy - 95);
              ctx.lineTo(eqX, trackY + 35);
              ctx.stroke();
              ctx.setLineDash([]);
              ctx.font = '700 11px "JetBrains Mono", sans-serif';
              ctx.fillStyle = '#047857';
              ctx.textAlign = 'center';
              ctx.fillText('x = 0 (eq)', eqX, cy - 104);
              ctx.restore();

              // Left Spring (k1) & Right Spring (k2)
              drawHelicalSpring(ctx, leftWallX, cy, bx, cy, 12, 16, '#0284c7', 2.6);
              drawHelicalSpring(ctx, bx + bw, cy, rightWallX, cy, 12, 16, '#059669', 2.6);

              // Labels for springs
              ctx.save();
              ctx.font = '700 12px "JetBrains Mono", sans-serif';
              ctx.textAlign = 'center';
              ctx.fillStyle = '#0369a1';
              ctx.fillText(`k₁ = ${p.k1} N/m`, (leftWallX + bx) * 0.5, cy - 34);
              ctx.fillStyle = '#047857';
              ctx.fillText(`k₂ = ${p.k2} N/m`, (bx + bw + rightWallX) * 0.5, cy - 34);
              ctx.restore();

              // Block
              ctx.save();
              ctx.fillStyle = s.isDragging ? '#0284c7' : '#0f172a';
              ctx.beginPath();
              ctx.roundRect(bx, by, bw, bh, 10);
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.font = '700 13px "JetBrains Mono", sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`${p.mass.toFixed(1)} kg`, blockCenterX, cy - 6);
              ctx.font = '500 10.5px "JetBrains Mono", sans-serif';
              ctx.fillStyle = '#bae6fd';
              ctx.fillText(`x=${s.x >= 0 ? '+' : ''}${s.x.toFixed(2)}m`, blockCenterX, cy + 12);
              ctx.restore();

              // Force arrows from both springs acting on the block
              const f1 = -p.k1 * s.x;
              const f2 = -p.k2 * s.x;
              const pxPerN = Math.min(2.4, 95 / Math.max(20, (p.k1 + p.k2) * p.amplitude));
              if (Math.abs(s.x) > 0.005) {
                drawForceArrow(
                  ctx,
                  blockCenterX,
                  by - 20,
                  f1 * pxPerN,
                  0,
                  '#0284c7',
                  `F₁=${f1.toFixed(1)}N`,
                  'center',
                  2.8
                );
                drawForceArrow(
                  ctx,
                  blockCenterX,
                  by - 48,
                  f2 * pxPerN,
                  0,
                  '#059669',
                  `F₂=${f2.toFixed(1)}N`,
                  'center',
                  2.8
                );
              }
            } else {
              // VIRTUAL SPRING CUTTER MODE
              const leftX = cssW * 0.28;
              const rightX = cssW * 0.7;
              const mountY = 38;
              const ceilingY = mountY + 14;
              drawRigidSupport(ctx, cssW * 0.1, mountY, cssW * 0.8, 14);

              const fullNatLen = Math.min(185, cssH * 0.34);
              const cutNatLen = fullNatLen * p.lengthFraction;

              const eBase = (p.mass * p.g) / p.k1;
              const eCut = (p.mass * p.g) / p.kPart;

              const availDrop = Math.max(110, cssH - (ceilingY + fullNatLen) - 90);
              const pxPerM = Math.min(130, availDrop / Math.max(0.85, eBase + p.amplitude + 0.1));
              s.pxPerMeter = pxPerM;

              // Titles
              ctx.save();
              ctx.font = '700 13px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
              ctx.fillStyle = '#0f172a';
              ctx.textAlign = 'center';
              ctx.fillText(p.t.module2.originalLabel, leftX, 24);
              ctx.fillText(p.t.module2.slicedLabel, rightX, 24);
              ctx.restore();

              // Left Rig: Full Original Spring
              const baseBottomY = Math.max(
                ceilingY + 40,
                ceilingY + fullNatLen + (eBase + s.xBase) * pxPerM
              );
              drawHelicalSpring(ctx, leftX, ceilingY, leftX, baseBottomY, 18, 15, '#475569', 2.4, 0.85);

              // Draw Scissor Cut Lines across Original Spring
              if (p.isCutActive) {
                ctx.save();
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = '#e11d48';
                ctx.lineWidth = 1.6;
                const numLines = p.cutRatioMode === 'equal' ? p.cutSegments - 1 : 2;
                const totalCuts = p.cutRatioMode === 'equal' ? p.cutSegments : 3;
                for (let i = 1; i <= numLines; i++) {
                  const cutY = ceilingY + ((baseBottomY - ceilingY) * i) / totalCuts;
                  ctx.beginPath();
                  ctx.moveTo(leftX - 34, cutY);
                  ctx.lineTo(leftX + 34, cutY);
                  ctx.stroke();
                  if (i === 1) {
                    ctx.fillStyle = '#e11d48';
                    ctx.font = '700 12px sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText('✂', leftX - 38, cutY + 4);
                  }
                }
                ctx.restore();
              }

              // Left Mass Block (non-dragged reference)
              const bw = 68;
              const bh = 46;
              ctx.save();
              ctx.fillStyle = '#475569';
              ctx.beginPath();
              ctx.roundRect(leftX - bw / 2, baseBottomY, bw, bh, 9);
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.font = '700 12px "JetBrains Mono", sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`k=${p.k1}`, leftX, baseBottomY + bh / 2);
              ctx.restore();

              // Right Rig: Sliced Segment
              const eqCutY = ceilingY + cutNatLen + eCut * pxPerM;
              s.eqAnchor = { x: rightX, y: eqCutY };
              const cutBottomY = Math.max(ceilingY + 24, eqCutY + s.x * pxPerM);

              // Equilibrium line on cut rig
              ctx.save();
              ctx.setLineDash([6, 5]);
              ctx.strokeStyle = '#059669';
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.moveTo(rightX - 95, eqCutY);
              ctx.lineTo(rightX + 95, eqCutY);
              ctx.stroke();
              ctx.restore();

              // Proportional coils for cut spring
              const cutCoils = Math.max(4, Math.round(18 * p.lengthFraction));
              drawHelicalSpring(
                ctx,
                rightX,
                ceilingY,
                rightX,
                cutBottomY,
                cutCoils,
                16,
                '#059669',
                2.8
              );

              // Flash ring on fresh cut
              if (s.cutFlash > 0) {
                ctx.save();
                ctx.strokeStyle = `rgba(225, 29, 72, ${s.cutFlash})`;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(rightX, cutBottomY, 26 + (1 - s.cutFlash) * 28, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
              }

              // Right Interactive Mass Block
              const rbw = 78;
              const rbh = 52;
              const rbx = rightX - rbw / 2;
              const rby = cutBottomY;
              s.blockRect = { x: rbx, y: rby, w: rbw, h: rbh };

              ctx.save();
              ctx.fillStyle = s.isDragging ? '#0284c7' : '#0f172a';
              ctx.beginPath();
              ctx.roundRect(rbx, rby, rbw, rbh, 10);
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.font = '700 12.5px "JetBrains Mono", sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`k′=${p.kPart.toFixed(0)}`, rightX, rby + rbh / 2 - 6);
              ctx.fillStyle = '#a7f3d0';
              ctx.font = '600 10.5px "JetBrains Mono", sans-serif';
              ctx.fillText(`${p.mass.toFixed(1)} kg`, rightX, rby + rbh / 2 + 11);
              ctx.restore();
            }
          }
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const derivationLines =
    mode === 'series'
      ? t.module2.derivationSeries
      : mode === 'parallel'
        ? t.module2.derivationParallel
        : mode === 'opposing'
          ? t.module2.derivationOpposing
          : t.module2.derivationCutter;

  const ruleNote =
    mode === 'series'
      ? t.module2.seriesRuleNote
      : mode === 'parallel'
        ? t.module2.parallelRuleNote
        : mode === 'opposing'
          ? t.module2.opposingRuleNote
          : t.module2.cutterRuleNote;

  const maxForceBar = Math.max(1, Math.abs(telemetry.f1), Math.abs(telemetry.f2), mass * g * 1.3);
  const maxExtBar = Math.max(0.05, Math.abs(telemetry.x1) + Math.abs(telemetry.x2), 0.5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)_330px] gap-4 items-stretch">
      {/* LEFT SIDEBAR */}
      <aside className="bg-white/95 backdrop-blur-sm border border-sky-200 rounded-2xl shadow-sm p-4 flex flex-col gap-4 studio-scroll lg:max-h-[calc(100vh-88px)] lg:overflow-y-auto">
        <div className="flex items-center justify-between border-b border-sky-100 pb-2.5">
          <h2 className="text-sm font-extrabold text-slate-950 tracking-tight">
            {t.common.controlsTitle}
          </h2>
          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isPlaying ? t.pause : t.play}</span>
          </button>
        </div>

        {/* Mode Selector */}
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-slate-700">{t.module2.modeLabel}</div>
          <div className="grid grid-cols-2 gap-1.5">
            {(['series', 'parallel', 'opposing', 'cutter'] as CombinedMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  simRef.current.phase = 0;
                  simRef.current.phaseBase = 0;
                }}
                className={`px-2.5 py-2 rounded-xl text-[11.5px] font-bold border text-center transition-colors cursor-pointer leading-tight ${
                  mode === m
                    ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                    : 'bg-sky-50/70 hover:bg-sky-100 text-slate-800 border-sky-200'
                }`}
              >
                {t.module2.modes[m]}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          <EmeraldSlider
            id="m2-k1"
            label={mode === 'cutter' ? t.module2.baseSpringK : t.module2.spring1}
            value={k1}
            min={10}
            max={200}
            step={5}
            decimals={0}
            unit={t.common.unitNm}
            onChange={setK1}
          />

          {mode !== 'cutter' && (
            <EmeraldSlider
              id="m2-k2"
              label={t.module2.spring2}
              value={k2}
              min={10}
              max={200}
              step={5}
              decimals={0}
              unit={t.common.unitNm}
              onChange={setK2}
            />
          )}

          {mode === 'cutter' && (
            <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900">{t.module2.cutRatioMode}</span>
                <div className="flex items-center gap-1 p-0.5 bg-white border border-rose-200 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setCutRatioMode('equal')}
                    className={`px-2 py-1 rounded-md text-[10.5px] font-bold cursor-pointer ${
                      cutRatioMode === 'equal' ? 'bg-rose-600 text-white' : 'text-slate-700'
                    }`}
                  >
                    {t.module2.equalParts}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCutRatioMode('ratio')}
                    className={`px-2 py-1 rounded-md text-[10.5px] font-bold cursor-pointer ${
                      cutRatioMode === 'ratio' ? 'bg-rose-600 text-white' : 'text-slate-700'
                    }`}
                  >
                    {t.module2.customRatio}
                  </button>
                </div>
              </div>

              {cutRatioMode === 'equal' ? (
                <EmeraldSlider
                  id="m2-n"
                  label={t.module2.cutSegments}
                  value={cutSegments}
                  min={2}
                  max={10}
                  step={1}
                  decimals={0}
                  unit="×"
                  onChange={(val) => {
                    setCutSegments(val);
                    setIsCutActive(true);
                  }}
                />
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRatioPart('A');
                      setIsCutActive(true);
                    }}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                      selectedRatioPart === 'A'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-800 border-sky-200'
                    }`}
                  >
                    {t.module2.partA}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRatioPart('B');
                      setIsCutActive(true);
                    }}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                      selectedRatioPart === 'B'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-800 border-sky-200'
                    }`}
                  >
                    {t.module2.partB}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={triggerCutAnimation}
                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span className="truncate">{t.module2.cutAction}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCutActive(false)}
                  className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-sky-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="truncate">{t.module2.restoreWhole}</span>
                </button>
              </div>
            </div>
          )}

          <EmeraldSlider
            id="m2-mass"
            label={t.common.mass}
            value={mass}
            min={0.5}
            max={10.0}
            step={0.1}
            decimals={1}
            unit={t.common.unitKg}
            onChange={setMass}
          />

          <EmeraldSlider
            id="m2-amp"
            label={t.common.amplitude}
            value={amplitude}
            min={0.05}
            max={0.4}
            step={0.01}
            decimals={2}
            unit={t.common.unitM}
            onChange={setAmplitude}
          />
        </div>

        {/* Derivation */}
        <div className="mt-auto bg-sky-50/80 border border-sky-200 rounded-xl p-3 space-y-1.5">
          <h3 className="text-xs font-extrabold text-slate-950">{t.common.derivationTitle}</h3>
          <div className="space-y-1 font-mono text-[11px] text-slate-800 leading-relaxed">
            {derivationLines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      </aside>

      {/* CENTER CANVAS STAGE */}
      <section className="bg-white/95 backdrop-blur-sm border border-sky-200 rounded-2xl shadow-sm p-2.5 flex flex-col min-h-[560px] lg:h-[calc(100vh-88px)]">
        <div className="flex items-center justify-between px-2 pb-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-900">{t.module2.modes[mode]}</span>
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

      {/* RIGHT TELEMETRY PANEL */}
      <aside className="bg-white/95 backdrop-blur-sm border border-sky-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3.5 studio-scroll lg:max-h-[calc(100vh-88px)] lg:overflow-y-auto">
        <div className="border-b border-sky-100 pb-2.5">
          <h2 className="text-sm font-extrabold text-slate-950 tracking-tight">
            {t.common.telemetryTitle}
          </h2>
        </div>

        {/* Equivalent Stiffness & Period */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1.5">
          <div className="text-[11px] font-bold text-emerald-900">{t.module2.eqSpringConstant}</div>
          <div className="font-mono text-2xl font-extrabold text-emerald-800 tabular-nums">
            {kEq.toFixed(2)} <span className="text-sm font-semibold">{t.common.unitNm}</span>
          </div>
          <div className="font-mono text-[11px] text-slate-700">
            {mode === 'series'
              ? `1/k_s = 1/${k1} + 1/${k2}`
              : mode === 'parallel' || mode === 'opposing'
                ? `k_eq = ${k1} + ${k2}`
                : `k′ = k / ${lengthFraction.toFixed(2)}`}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-2.5">
            <div className="text-[11px] font-semibold text-slate-600">{t.common.period}</div>
            <div className="font-mono text-lg font-extrabold text-slate-950 tabular-nums mt-0.5">
              {period.toFixed(3)} <span className="text-xs font-semibold text-slate-600">{t.common.unitS}</span>
            </div>
          </div>
          <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-2.5">
            <div className="text-[11px] font-semibold text-slate-600">{t.common.frequency}</div>
            <div className="font-mono text-lg font-extrabold text-slate-950 tabular-nums mt-0.5">
              {frequency.toFixed(3)} <span className="text-xs font-semibold text-slate-600">{t.common.unitHz}</span>
            </div>
          </div>
        </div>

        {/* Rule Highlight */}
        <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 text-xs text-slate-800 leading-relaxed font-medium">
          {ruleNote}
        </div>

        {mode !== 'cutter' ? (
          <>
            {/* Force Distribution Bars */}
            <div className="bg-white border border-sky-200 rounded-xl p-3 space-y-2.5">
              <h3 className="text-xs font-extrabold text-slate-950">
                {t.module2.forceSharingTitle}
              </h3>

              <div className="space-y-2 text-[11.5px]">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sky-700 font-semibold">{t.module2.forceOnSpring1}</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {telemetry.f1.toFixed(2)} N
                    </span>
                  </div>
                  <div className="h-2 bg-sky-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-600 rounded-full"
                      style={{ width: `${Math.min(100, (Math.abs(telemetry.f1) / maxForceBar) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-emerald-700 font-semibold">{t.module2.forceOnSpring2}</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {telemetry.f2.toFixed(2)} N
                    </span>
                  </div>
                  <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${Math.min(100, (Math.abs(telemetry.f2) / maxForceBar) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Extension Distribution Bars */}
            <div className="bg-white border border-sky-200 rounded-xl p-3 space-y-2.5">
              <h3 className="text-xs font-extrabold text-slate-950">
                {t.module2.extensionSharingTitle}
              </h3>

              <div className="space-y-2 text-[11.5px]">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sky-700 font-semibold">{t.module2.extOfSpring1}</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {telemetry.x1.toFixed(3)} m
                    </span>
                  </div>
                  <div className="h-2 bg-sky-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-600 rounded-full"
                      style={{ width: `${Math.min(100, (Math.abs(telemetry.x1) / maxExtBar) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-emerald-700 font-semibold">{t.module2.extOfSpring2}</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {telemetry.x2.toFixed(3)} m
                    </span>
                  </div>
                  <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${Math.min(100, (Math.abs(telemetry.x2) / maxExtBar) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {mode !== 'opposing' && (
                <div className="pt-2 border-t border-sky-100 flex justify-between text-xs">
                  <span className="text-slate-600 font-semibold">{t.module2.totalStaticExt}</span>
                  <span className="font-mono font-bold text-slate-950 tabular-nums">
                    {(e1 + (mode === 'series' ? e2 : 0)).toFixed(3)} m
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Cutter Mode Comparison Telemetry */
          <div className="bg-white border border-sky-200 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-semibold">{t.module2.stiffnessMultiplier}</span>
              <span className="font-mono font-extrabold text-emerald-700 tabular-nums">
                {(1 / lengthFraction).toFixed(2)}×
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-semibold">{t.module2.periodRatio}</span>
              <span className="font-mono font-extrabold text-sky-700 tabular-nums">
                {Math.sqrt(lengthFraction).toFixed(3)}×
              </span>
            </div>
            <div className="pt-2 border-t border-sky-100 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                <div className="text-[10px] text-slate-500">{t.module2.originalLabel}</div>
                <div className="font-mono font-bold text-slate-900 mt-0.5">
                  T = {periodBase.toFixed(3)}s
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                <div className="text-[10px] text-emerald-800">{t.module2.slicedLabel}</div>
                <div className="font-mono font-bold text-emerald-800 mt-0.5">
                  T′ = {period.toFixed(3)}s
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
