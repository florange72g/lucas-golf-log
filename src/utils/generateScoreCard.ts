import type { Round } from '../types';
import { parAsNumber } from './parInput';
import { getScoreMarkerType } from './scoreMarker';
import {
  backNine,
  calcTotalScore,
  formatScoreToPar,
  frontNine,
  nineScore,
  scoreToPar,
} from './stats';

const BG_SRC = '/lucas-scorecard-bg.png';
const WIDTH = 1000;
const HEIGHT = 1150;
const PANEL_W = 400;
const PHOTO_W = WIDTH - PANEL_W;
const CARD_RADIUS = 20;

const PANEL_BG = '#0c3b2e';
const WHITE = '#ffffff';
const SCORE_GREEN = '#6ee7a0';
const LINE = 'rgba(255,255,255,0.28)';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function formatScoreCardDate(dateIso: string): string {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return dateIso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

function clipRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.clip();
}

function drawPhotoCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawScoreCardTitle(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = WHITE;
  ctx.font = 'italic 700 54px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('SCORE', 34, 42);
  ctx.fillText('CARD', 34, 102);
  ctx.restore();
}

function drawScoreMarker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  score: number,
  par: number,
): void {
  const marker = getScoreMarkerType(score, par);

  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 1.5;

  switch (marker) {
    case 'eagle':
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'birdie':
      ctx.beginPath();
      ctx.arc(cx, cy, 13, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'bogey':
      ctx.strokeRect(cx - 11, cy - 11, 22, 22);
      break;
    case 'doubleBogey':
      ctx.strokeRect(cx - 13, cy - 13, 26, 26);
      ctx.strokeRect(cx - 9, cy - 9, 18, 18);
      break;
    default:
      break;
  }

  ctx.fillStyle = WHITE;
  ctx.font = `${marker === 'par' ? '600' : '700'} 26px Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(score), cx, cy);
}

function drawScoreBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  score: number | null,
  par: number,
): void {
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  if (score === null) return;
  drawScoreMarker(ctx, x + w / 2, y + h / 2, score, par);
}

function drawHoleRows(
  ctx: CanvasRenderingContext2D,
  holes: { hole: number; score: number; par: number }[],
  startY: number,
  rowH: number,
  innerX: number,
  holeColW: number,
  scoreBoxW: number,
  scoreBoxH: number,
  scoreX: number,
): number {
  let y = startY;
  holes.forEach((hole) => {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '600 22px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(hole.hole), innerX + holeColW / 2, y + rowH / 2);
    drawScoreBox(ctx, scoreX, y + (rowH - scoreBoxH) / 2, scoreBoxW, scoreBoxH, hole.score, hole.par);
    y += rowH;
  });
  return y;
}

function openImageInNewTab(canvas: HTMLCanvasElement): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const tab = window.open(url, '_blank', 'noopener,noreferrer');
    if (!tab) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, 'image/png');
}

export async function generateScoreCard(round: Round): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const front = frontNine(round.holes).map((h) => ({
    hole: h.hole,
    score: h.score,
    par: parAsNumber(h.par),
  }));
  const back = backNine(round.holes).map((h) => ({
    hole: h.hole,
    score: h.score,
    par: parAsNumber(h.par),
  }));
  const frontTotal = nineScore(frontNine(round.holes));
  const backTotal = nineScore(backNine(round.holes));
  const total = calcTotalScore(round.holes);
  const toPar = formatScoreToPar(scoreToPar(round.holes));

  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  clipRoundedRect(ctx, 0, 0, WIDTH, HEIGHT, CARD_RADIUS);

  const photo = await loadImage(BG_SRC);
  drawPhotoCover(ctx, photo, 0, 0, PHOTO_W, HEIGHT);
  drawScoreCardTitle(ctx);

  ctx.fillStyle = PANEL_BG;
  ctx.fillRect(PHOTO_W, 0, PANEL_W, HEIGHT);

  const pad = 20;
  const innerX = PHOTO_W + pad;
  const innerW = PANEL_W - pad * 2;
  const holeColW = 78;
  const dividerX = innerX + holeColW;
  const scoreColW = innerW - holeColW;
  const scoreBoxW = 56;
  const scoreBoxH = 34;
  const scoreX = dividerX + scoreColW - scoreBoxW - 4;

  let y = 28;
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.font = '600 17px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HOLE', innerX + holeColW / 2, y + 14);
  ctx.fillText('SCORE', dividerX + scoreColW / 2, y + 14);
  y += 36;

  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(dividerX, y - 8);
  ctx.lineTo(dividerX, HEIGHT - 130);
  ctx.stroke();

  const rowH = 38;
  y = drawHoleRows(ctx, front, y, rowH, innerX, holeColW, scoreBoxW, scoreBoxH, scoreX);

  ctx.beginPath();
  ctx.moveTo(innerX, y + 4);
  ctx.lineTo(innerX + innerW, y + 4);
  ctx.stroke();
  y += 14;

  y = drawHoleRows(ctx, back, y, rowH, innerX, holeColW, scoreBoxW, scoreBoxH, scoreX);

  ctx.beginPath();
  ctx.moveTo(innerX, y + 6);
  ctx.lineTo(innerX + innerW, y + 6);
  ctx.stroke();
  y += 28;

  const halfW = innerW / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '600 15px Helvetica, Arial, sans-serif';
  ctx.fillText('FRONT', innerX + halfW / 2, y);
  ctx.fillText('BACK', innerX + halfW + halfW / 2, y);
  y += 28;
  ctx.fillStyle = WHITE;
  ctx.font = '700 38px Helvetica, Arial, sans-serif';
  ctx.fillText(String(frontTotal), innerX + halfW / 2, y);
  ctx.fillText(String(backTotal), innerX + halfW + halfW / 2, y);

  ctx.beginPath();
  ctx.moveTo(innerX + halfW, y - 36);
  ctx.lineTo(innerX + halfW, y + 12);
  ctx.stroke();

  y += 36;
  ctx.font = '700 58px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const totalX = innerX + 8;
  ctx.fillStyle = WHITE;
  ctx.fillText(String(total), totalX, y);
  const totalWidth = ctx.measureText(String(total)).width;
  ctx.fillStyle = SCORE_GREEN;
  ctx.font = '600 36px Helvetica, Arial, sans-serif';
  ctx.fillText(`(${toPar})`, totalX + totalWidth + 12, y);

  const footerY = HEIGHT - 96;
  ctx.textAlign = 'center';
  ctx.fillStyle = WHITE;
  ctx.font = '500 22px Helvetica, Arial, sans-serif';
  ctx.fillText(formatScoreCardDate(round.date), PHOTO_W + PANEL_W / 2, footerY);

  const courseName = round.courseName.trim() || 'Golf Round';
  ctx.font = '500 19px Helvetica, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(courseName, PHOTO_W + PANEL_W / 2, footerY + 32);

  if (round.location.trim()) {
    ctx.font = '500 17px Helvetica, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.fillText(round.location.trim(), PHOTO_W + PANEL_W / 2, footerY + 58);
  }

  ctx.restore();

  openImageInNewTab(canvas);
}
