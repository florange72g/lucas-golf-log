import type { jsPDF } from 'jspdf';
import type { HoleEntry } from '../types';
import {
  calcTotalPar,
  calcTotalScore,
  formatScoreToPar,
  frontNine,
  backNine,
} from './stats';
import { getScoreMarkerType } from './scoreMarker';
import { parAsNumber } from './parInput';
import { yardsAsNumber } from './yardsInput';

export { getScoreMarkerType };
export type { ScoreMarkerType } from './scoreMarker';

const FAIRWAY = { r: 27, g: 67, b: 50 };
const CREAM = { r: 248, g: 246, b: 240 };
const TEXT = { r: 27, g: 53, b: 40 };
const MUTED = { r: 100, g: 120, b: 110 };
const BORDER = { r: 180, g: 190, b: 185 };

export function calcTotalYards(holes: HoleEntry[]): number {
  return holes.reduce((sum, h) => sum + yardsAsNumber(h.yards), 0);
}

export function drawCircle(doc: jsPDF, x: number, y: number, radius: number): void {
  doc.setDrawColor(FAIRWAY.r, FAIRWAY.g, FAIRWAY.b);
  doc.setLineWidth(0.25);
  doc.circle(x, y, radius, 'S');
}

export function drawDoubleCircle(
  doc: jsPDF,
  x: number,
  y: number,
  outerRadius: number,
  innerRadius: number,
): void {
  doc.setDrawColor(FAIRWAY.r, FAIRWAY.g, FAIRWAY.b);
  doc.setLineWidth(0.25);
  doc.circle(x, y, outerRadius, 'S');
  doc.circle(x, y, innerRadius, 'S');
}

export function drawSquare(doc: jsPDF, x: number, y: number, size: number): void {
  doc.setDrawColor(FAIRWAY.r, FAIRWAY.g, FAIRWAY.b);
  doc.setLineWidth(0.25);
  doc.rect(x - size / 2, y - size / 2, size, size, 'S');
}

export function drawDoubleSquare(
  doc: jsPDF,
  x: number,
  y: number,
  outerSize: number,
  innerSize: number,
): void {
  doc.setDrawColor(FAIRWAY.r, FAIRWAY.g, FAIRWAY.b);
  doc.setLineWidth(0.25);
  doc.rect(x - outerSize / 2, y - outerSize / 2, outerSize, outerSize, 'S');
  doc.rect(x - innerSize / 2, y - innerSize / 2, innerSize, innerSize, 'S');
}

function drawMarkedScore(doc: jsPDF, score: number, par: number, cx: number, cy: number): void {
  const marker = getScoreMarkerType(score, par);
  const text = String(score);

  switch (marker) {
    case 'eagle':
      drawDoubleCircle(doc, cx, cy, 3.1, 2.2);
      break;
    case 'birdie':
      drawCircle(doc, cx, cy, 2.7);
      break;
    case 'bogey':
      drawSquare(doc, cx, cy, 5);
      break;
    case 'doubleBogey':
      drawDoubleSquare(doc, cx, cy, 5.4, 3.6);
      break;
    default:
      break;
  }

  doc.setFont('helvetica', marker === 'par' ? 'normal' : 'bold');
  doc.setFontSize(9);
  doc.setTextColor(TEXT.r, TEXT.g, TEXT.b);
  doc.text(text, cx, cy + 1.1, { align: 'center' });
}

function centerText(
  doc: jsPDF,
  text: string,
  cx: number,
  cy: number,
  bold = false,
  fontSize = 8,
): void {
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(TEXT.r, TEXT.g, TEXT.b);
  doc.text(text, cx, cy + 1.1, { align: 'center' });
}

interface NineTableResult {
  height: number;
}

function drawNineScorecard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  holes: HoleEntry[],
  sectionTitle: string,
  totalHeader: string,
): NineTableResult {
  const labelColW = 18;
  const totalColW = 14;
  const holeCount = holes.length;
  const cellW = (width - labelColW - totalColW) / holeCount;
  const rowH = 7;
  const titleH = 6;
  const rows = [
    { key: 'hole', label: 'Hole' },
    { key: 'yards', label: 'Yardage' },
    { key: 'par', label: 'Par' },
    { key: 'score', label: 'Score' },
  ] as const;

  const totalYards = calcTotalYards(holes);
  const totalPar = calcTotalPar(holes);
  const totalScore = calcTotalScore(holes);

  doc.setFillColor(FAIRWAY.r, FAIRWAY.g, FAIRWAY.b);
  doc.rect(x, y, width, titleH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(sectionTitle, x + 3, y + 4.2);

  let tableY = y + titleH;
  const tableH = rowH * rows.length;

  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.setLineWidth(0.2);

  for (let r = 0; r <= rows.length; r++) {
    doc.line(x, tableY + r * rowH, x + width, tableY + r * rowH);
  }

  const colXs = [x, x + labelColW];
  for (let c = 1; c <= holeCount; c++) {
    colXs.push(x + labelColW + c * cellW);
  }
  colXs.push(x + width);

  for (const lineX of colXs) {
    doc.line(lineX, tableY, lineX, tableY + tableH);
  }

  rows.forEach((row, rowIndex) => {
    const cy = tableY + rowIndex * rowH + rowH / 2;
    const isScoreRow = row.key === 'score';

    doc.setFillColor(CREAM.r, CREAM.g, CREAM.b);
    doc.rect(x + 0.2, tableY + rowIndex * rowH + 0.2, labelColW - 0.4, rowH - 0.4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    doc.text(row.label, x + labelColW / 2, cy + 1.1, { align: 'center' });

    holes.forEach((hole, i) => {
      const cx = x + labelColW + i * cellW + cellW / 2;

      if (row.key === 'hole') {
        centerText(doc, String(hole.hole), cx, cy, true, 8);
      } else if (row.key === 'yards') {
        centerText(doc, yardsAsNumber(hole.yards) > 0 ? String(yardsAsNumber(hole.yards)) : '—', cx, cy, false, 7);
      } else if (row.key === 'par') {
        centerText(doc, String(parAsNumber(hole.par)), cx, cy, false, 8);
      } else if (isScoreRow) {
        drawMarkedScore(doc, hole.score, parAsNumber(hole.par), cx, cy);
      }
    });

    const totalCx = x + labelColW + holeCount * cellW + totalColW / 2;
    doc.setFillColor(CREAM.r, CREAM.g, CREAM.b);
    doc.rect(
      x + labelColW + holeCount * cellW + 0.2,
      tableY + rowIndex * rowH + 0.2,
      totalColW - 0.4,
      rowH - 0.4,
      'F',
    );

    if (row.key === 'hole') {
      centerText(doc, totalHeader, totalCx, cy, true, 7);
    } else if (row.key === 'yards') {
      centerText(doc, String(totalYards), totalCx, cy, true, 7);
    } else if (row.key === 'par') {
      centerText(doc, String(totalPar), totalCx, cy, true, 8);
    } else {
      centerText(doc, String(totalScore), totalCx, cy, true, 9);
    }
  });

  return { height: titleH + tableH };
}

function drawSummaryLine(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  yards: number,
  par: number,
  score: number,
  bold = false,
): void {
  const toPar = score - par;
  const line = `${label}: ${yards} yds | Par ${par} | Score ${score}${
    label === 'Total' ? ` (${formatScoreToPar(toPar)})` : ''
  }`;

  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(bold ? 10 : 9);
  doc.setTextColor(bold ? TEXT.r : MUTED.r, bold ? TEXT.g : MUTED.g, bold ? TEXT.b : MUTED.b);
  doc.text(line, x + width / 2, y, { align: 'center' });
}

export interface ScorecardDrawResult {
  endY: number;
}

export function drawFullScorecard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  holes: HoleEntry[],
): ScorecardDrawResult {
  let currentY = y;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(FAIRWAY.r, FAIRWAY.g, FAIRWAY.b);
  doc.text('SCORECARD', x + width / 2, currentY, { align: 'center' });
  currentY += 6;

  const front = frontNine(holes);
  const back = backNine(holes);

  const frontResult = drawNineScorecard(doc, x, currentY, width, front, 'Front Nine (Out)', 'OUT');
  currentY += frontResult.height + 5;

  const backResult = drawNineScorecard(doc, x, currentY, width, back, 'Back Nine (In)', 'IN');
  currentY += backResult.height + 6;

  doc.setDrawColor(FAIRWAY.r, FAIRWAY.g, FAIRWAY.b);
  doc.setLineWidth(0.3);
  doc.line(x, currentY, x + width, currentY);
  currentY += 5;

  drawSummaryLine(
    doc,
    x,
    currentY,
    width,
    'Out',
    calcTotalYards(front),
    calcTotalPar(front),
    calcTotalScore(front),
  );
  currentY += 5;

  drawSummaryLine(
    doc,
    x,
    currentY,
    width,
    'In',
    calcTotalYards(back),
    calcTotalPar(back),
    calcTotalScore(back),
  );
  currentY += 5;

  drawSummaryLine(
    doc,
    x,
    currentY,
    width,
    'Total',
    calcTotalYards(holes),
    calcTotalPar(holes),
    calcTotalScore(holes),
    true,
  );
  currentY += 8;

  return { endY: currentY };
}
