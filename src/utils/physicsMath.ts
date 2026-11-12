/**
 * Pure computational mechanics helpers & crisp Canvas 2D vector/spring primitives.
 */

/**
 * Computes the complete elliptic integral of the first kind K(m) where m = k^2 = sin^2(theta0/2)
 * using the Arithmetic-Geometric Mean (AGM) method to ~1e-15 precision.
 */
export function ellipticK(k: number): number {
  let a = 1;
  let b = Math.sqrt(Math.max(1e-15, 1 - k * k));
  for (let i = 0; i < 12; i++) {
    const nextA = 0.5 * (a + b);
    const nextB = Math.sqrt(a * b);
    if (Math.abs(nextA - nextB) < 1e-14) {
      a = nextA;
      break;
    }
    a = nextA;
    b = nextB;
  }
  return Math.PI / (2 * a);
}

/**
 * Exact non-linear pendulum period T_exact = T0 * (2/pi) * K(sin(theta0/2))
 */
export function exactPendulumPeriod(L: number, g: number, theta0Rad: number): number {
  const T0 = 2 * Math.PI * Math.sqrt(L / g);
  const absTheta = Math.min(Math.abs(theta0Rad), Math.PI - 0.001);
  if (absTheta < 1e-5) return T0;
  const k = Math.sin(absTheta / 2);
  return T0 * ((2 / Math.PI) * ellipticK(k));
}

/**
 * 4th-order Runge-Kutta step for simple pendulum: d^2(theta)/dt^2 = -(g/L) * sin(theta)
 */
export function stepPendulumRK4(
  theta: number,
  omega: number,
  g: number,
  L: number,
  dt: number
): { theta: number; omega: number } {
  const accel = (th: number) => -(g / L) * Math.sin(th);

  const k1Theta = omega;
  const k1Omega = accel(theta);

  const k2Theta = omega + 0.5 * dt * k1Omega;
  const k2Omega = accel(theta + 0.5 * dt * k1Theta);

  const k3Theta = omega + 0.5 * dt * k2Omega;
  const k3Omega = accel(theta + 0.5 * dt * k2Theta);

  const k4Theta = omega + dt * k3Omega;
  const k4Omega = accel(theta + dt * k3Theta);

  return {
    theta: theta + (dt / 6) * (k1Theta + 2 * k2Theta + 2 * k3Theta + k4Theta),
    omega: omega + (dt / 6) * (k1Omega + 2 * k2Omega + 2 * k3Omega + k4Omega),
  };
}

/**
 * Draws a crisp metallic helical spring between two points (x1, y1) -> (x2, y2).
 */
export function drawHelicalSpring(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  coils: number,
  radius: number,
  color = '#0f172a',
  lineWidth = 2.4,
  alpha = 1,
  leadLength = 14
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const totalLen = Math.hypot(dx, dy);
  if (totalLen < 8) return;

  const ux = dx / totalLen;
  const uy = dy / totalLen;
  // Perpendicular unit vector
  const px = -uy;
  const py = ux;

  const actualLead = Math.min(leadLength, totalLen * 0.16);
  const bodyLen = Math.max(4, totalLen - 2 * actualLead);
  const startX = x1 + ux * actualLead;
  const startY = y1 + uy * actualLead;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw subtle inner highlight for metallic depth
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(startX, startY);

  const halfCoils = Math.max(2, Math.round(coils * 2));
  for (let i = 1; i <= halfCoils; i++) {
    const t = i / halfCoils;
    const along = t * bodyLen;
    // Triangle/sine hybrid coil vertices for sharp technical drawing
    const side = i === halfCoils ? 0 : i % 2 === 1 ? 1 : -1;
    const cx = startX + ux * along + px * radius * side;
    const cy = startY + uy * along + py * radius * side;
    ctx.lineTo(cx, cy);
  }

  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws a precision physics force vector arrow with clean label halo.
 */
export function drawForceArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: string,
  label?: string,
  labelAlign: 'left' | 'right' | 'center' = 'right',
  lineWidth = 3
) {
  const mag = Math.hypot(dx, dy);
  if (mag < 3) return;

  const ux = dx / mag;
  const uy = dy / mag;
  const headLen = Math.min(12, Math.max(7, mag * 0.25));
  const headWidth = headLen * 0.55;

  const endX = x + dx;
  const endY = y + dy;
  const shaftEndX = endX - ux * (headLen * 0.75);
  const shaftEndY = endY - uy * (headLen * 0.75);

  ctx.save();
  // Subtle white halo for contrast over grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = lineWidth + 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(shaftEndX, shaftEndY);
  ctx.stroke();

  // Main shaft
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(shaftEndX, shaftEndY);
  ctx.stroke();

  // Arrowhead
  const px = -uy;
  const py = ux;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - ux * headLen + px * headWidth, endY - uy * headLen + py * headWidth);
  ctx.lineTo(endX - ux * headLen - px * headWidth, endY - uy * headLen - py * headWidth);
  ctx.closePath();
  ctx.fill();

  if (label) {
    ctx.font = '600 12px "Plus Jakarta Sans", "Hind Siliguri", sans-serif';
    ctx.textBaseline = 'middle';
    const offset = labelAlign === 'left' ? -8 : labelAlign === 'right' ? 8 : 0;
    const lx = x + dx * 0.58 + offset;
    const ly = y + dy * 0.58;
    ctx.textAlign = labelAlign === 'left' ? 'right' : labelAlign === 'right' ? 'left' : 'center';

    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.strokeText(label, lx, ly);
    ctx.fillStyle = color;
    ctx.fillText(label, lx, ly);
  }

  ctx.restore();
}

/**
 * Draws a crisp light-blue scientific millimeter grid background on the Canvas.
 */
export function drawScientificGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.fillStyle = '#f8fcff';
  ctx.fillRect(0, 0, width, height);

  const minorStep = 24;
  const majorStep = 120;

  ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= width; x += minorStep) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
  }
  for (let y = 0; y <= height; y += minorStep) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
  }
  ctx.stroke();

  ctx.strokeStyle = 'rgba(14, 165, 233, 0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= width; x += majorStep) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
  }
  for (let y = 0; y <= height; y += majorStep) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws a hatched structural ceiling / rigid mount bar.
 */
export function drawRigidSupport(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height = 14
) {
  ctx.save();
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(x, y, width, height);

  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let hx = x - height; hx < x + width; hx += 10) {
    ctx.moveTo(Math.max(x, hx), y + height);
    ctx.lineTo(Math.min(x + width, hx + height), y);
  }
  ctx.stroke();

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y + height);
  ctx.lineTo(x + width, y + height);
  ctx.stroke();
  ctx.restore();
}
