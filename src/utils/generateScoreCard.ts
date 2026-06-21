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
const HEIGHT = 1200;
const PANEL_W = 400;
const PHOTO_W = WIDTH - PANEL_W;
const CARD_RADIUS = 20;

const PANEL_BG = '#0c3b2e';
const WHITE = '#ffffff';
const TEXT_DARK = '#1b3528';
const SCORE_GREEN = '#2d6a4f';
const LINE = 'rgba(255,255,255,0.28)';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
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
  onWhite = false,
): void {
  const marker = getScoreMarkerType(score, par);
  const stroke = onWhite ? TEXT_DARK : WHITE;
  const fill = onWhite ? TEXT_DARK : WHITE;

  ctx.strokeStyle = stroke;
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

  ctx.fillStyle = fill;
  ctx.font = `${marker === 'par' ? '600' : '700'} 26px Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(score), cx, cy);
}

function drawHoleRows(
  ctx: CanvasRenderingContext2D,
  holes: { hole: number; score: number; par: number }[],
  startY: number,
  rowH: number,
  holeCenterX: number,
  scoreCenterX: number,
): number {
  let y = startY;
  holes.forEach((hole) => {
    const midY = y + rowH / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '600 22px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(hole.hole), holeCenterX, midY);
    drawScoreMarker(ctx, scoreCenterX, midY, hole.score, hole.par);
    y += rowH;
  });
  return y;
}

function openScoreCardImage(canvas: HTMLCanvasElement, filename: string): void {
  const dataUrl = canvas.toDataURL('image/png');
  const tab = window.open('', '_blank', 'noopener,noreferrer');
  if (tab) {
    tab.document.write(
      `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${filename}</title><style>body{margin:0;background:#111;display:flex;justify-content:center}img{max-width:100%;height:auto}</style></head><body><img src="${dataUrl}" alt="Score Card"/></body></html>`,
    );
    tab.document.close();
    return;
  }

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function scoreCardFilename(round: Round): string {
  const course = (round.courseName.trim() || 'Golf_Round').replace(/[^a-zA-Z0-9]+/g, '_');
  const date = round.date.slice(0, 10);
  return `Lucas_Score_Card_${course}_${date}.png`;
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

  const pad = 26;
  const innerX = PHOTO_W + pad;
  const innerW = PANEL_W - pad * 2;
  const holeColW = 54;
  const colGap = 10;
  const scoreColW = innerW - holeColW - colGap;
  const dividerX = innerX + holeColW + colGap / 2;
  const holeCenterX = innerX + holeColW / 2;
  const scoreCenterX = innerX + holeColW + colGap + scoreColW / 2;

  let y = 36;
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.font = '600 17px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HOLE', holeCenterX, y + 12);
  ctx.fillText('SCORE', scoreCenterX, y + 12);
  y += 40;

  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(dividerX, y - 10);
  ctx.lineTo(dividerX, HEIGHT - 148);
  ctx.stroke();

  const rowH = 42;
  y = drawHoleRows(ctx, front, y, rowH, holeCenterX, scoreCenterX);

  ctx.beginPath();
  ctx.moveTo(innerX, y + 8);
  ctx.lineTo(innerX + innerW, y + 8);
  ctx.stroke();
  y += 22;

  y = drawHoleRows(ctx, back, y, rowH, holeCenterX, scoreCenterX);

  ctx.beginPath();
  ctx.moveTo(innerX, y + 10);
  ctx.lineTo(innerX + innerW, y + 10);
  ctx.stroke();
  y += 34;

  const halfW = innerW / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '600 15px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FRONT', innerX + halfW / 2, y);
  ctx.fillText('BACK', innerX + halfW + halfW / 2, y);
  y += 34;
  ctx.fillStyle = WHITE;
  ctx.font = '700 38px Helvetica, Arial, sans-serif';
  ctx.fillText(String(frontTotal), innerX + halfW / 2, y);
  ctx.fillText(String(backTotal), innerX + halfW + halfW / 2, y);

  ctx.beginPath();
  ctx.moveTo(innerX + halfW, y - 40);
  ctx.lineTo(innerX + halfW, y + 14);
  ctx.stroke();

  y += 48;
  const totalBarH = 82;
  ctx.fillStyle = WHITE;
  ctx.fillRect(innerX, y, innerW, totalBarH);
  const totalBarMidY = y + totalBarH / 2;
  ctx.font = '700 56px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const totalX = innerX + 18;
  ctx.fillStyle = TEXT_DARK;
  ctx.fillText(String(total), totalX, totalBarMidY);
  const totalWidth = ctx.measureText(String(total)).width;
  ctx.fillStyle = SCORE_GREEN;
  ctx.font = '600 38px Helvetica, Arial, sans-serif';
  ctx.fillText(`(${toPar})`, totalX + totalWidth + 14, totalBarMidY);
  y += totalBarH + 28;

  ctx.textAlign = 'center';
  ctx.fillStyle = WHITE;
  ctx.font = '500 22px Helvetica, Arial, sans-serif';
  ctx.fillText(formatScoreCardDate(round.date), PHOTO_W + PANEL_W / 2, y);

  const courseName = round.courseName.trim() || 'Golf Round';
  ctx.font = '500 19px Helvetica, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(courseName, PHOTO_W + PANEL_W / 2, y + 34);

  if (round.location.trim()) {
    ctx.font = '500 17px Helvetica, Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.fillText(round.location.trim(), PHOTO_W + PANEL_W / 2, y + 62);
  }

  ctx.restore();

  openScoreCardImage(canvas, scoreCardFilename(round));
}
