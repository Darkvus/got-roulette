import { useEffect, useRef } from 'react';
import { pickWeighted } from '../data/weights';

const SIZE = 320;
const PALETTE = ['#8a1f11', '#c9a15a', '#3a3f47', '#6fa8c9', '#6fa84a', '#4a6a8a', '#d94a1f', '#8f9aa3'];

function textColorFor(hex) {
  if (!hex || hex[0] !== '#') return '#0a0c10';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#0a0c10' : '#f5eedd';
}

function truncate(text, maxChars) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(1, maxChars - 1))}…`;
}

function drawWheel(canvas, items, colorFor, showSigils) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = SIZE * dpr;
  canvas.height = SIZE * dpr;
  canvas.style.width = `${SIZE}px`;
  canvas.style.height = `${SIZE}px`;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, SIZE, SIZE);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const radius = SIZE / 2 - 4;

  const totalWeight = items.reduce((a, it) => a + it.weight, 0);
  let angle = -Math.PI / 2; // start at top

  for (let i = 0; i < items.length; i++) {
    const slice = (items[i].weight / totalWeight) * Math.PI * 2;
    const end = angle + slice;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle, end);
    ctx.closePath();
    ctx.fillStyle = colorFor(items[i], i);
    ctx.fill();
    ctx.strokeStyle = 'rgba(10, 8, 4, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const mid = angle + slice / 2;

    if (showSigils && items[i].sigil) {
      ctx.save();
      ctx.translate(cx + Math.cos(mid) * radius * 0.5, cy + Math.sin(mid) * radius * 0.5);
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(items[i].sigil, 0, 0);
      ctx.restore();
    }

    // name label, drawn radially so it reads outward from the hub
    const sliceDeg = (slice * 180) / Math.PI;
    const fontSize = items.length > 30 ? 8 : items.length > 15 ? 10 : 13;
    const maxChars = Math.max(4, Math.floor(sliceDeg / (fontSize * 0.55)));
    const label = truncate(items[i].name, maxChars);

    const flip = Math.cos(mid) < 0;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(flip ? mid + Math.PI : mid);
    ctx.textAlign = flip ? 'left' : 'right';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${fontSize}px Georgia, serif`;
    ctx.fillStyle = textColorFor(colorFor(items[i], i));
    ctx.fillText(label, flip ? -(radius - 8) : radius - 8, 0);
    ctx.restore();

    angle = end;
  }

  // hub
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0c10';
  ctx.fill();
  ctx.strokeStyle = '#c9a15a';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export default function Wheel({ items, spinToken, onSettle, showSigils = false }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const rotationRef = useRef(0);

  const colorFor = (item, i) => item.color || PALETTE[i % PALETTE.length];

  useEffect(() => {
    if (canvasRef.current && items.length) {
      drawWheel(canvasRef.current, items, colorFor, showSigils);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, showSigils]);

  useEffect(() => {
    if (spinToken === 0 || !items.length || !wrapRef.current) return;

    const totalWeight = items.reduce((a, it) => a + it.weight, 0);
    const { item: chosen, index: chosenIndex } = pickWeighted(items, (it) => it.weight);

    // compute the mid-angle (degrees, clockwise from top) of the chosen slice
    let cum = 0;
    for (let i = 0; i < chosenIndex; i++) cum += items[i].weight;
    const sliceStart = (cum / totalWeight) * 360;
    const sliceSize = (chosen.weight / totalWeight) * 360;
    const targetMid = sliceStart + sliceSize / 2;

    const extraTurns = 5 + Math.floor(Math.random() * 3);
    const current = rotationRef.current;
    // normalize current rotation to [0,360)
    const currentMod = ((current % 360) + 360) % 360;
    // we need finalMod such that finalMod + targetMid ≡ 0 (mod 360) → pointer (fixed at top) lands on chosen slice
    const finalMod = ((360 - targetMid) % 360 + 360) % 360;
    let delta = finalMod - currentMod;
    if (delta <= 0) delta += 360;
    const finalRotation = current + delta + extraTurns * 360;

    rotationRef.current = finalRotation;
    const el = wrapRef.current;
    el.style.transition = 'transform 3.6s cubic-bezier(0.10, 0.68, 0.12, 1)';
    el.style.transform = `rotate(${finalRotation}deg)`;

    const timeout = setTimeout(() => {
      onSettle(chosen);
    }, 3700);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinToken, items]);

  return (
    <div className="wheel-stage">
      <div className="wheel-pointer">▼</div>
      <div className="wheel-wrap" ref={wrapRef}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
