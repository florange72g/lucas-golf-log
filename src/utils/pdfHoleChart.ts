import type { jsPDF } from 'jspdf';
import type { HoleEntry } from '../types';
import { parAsNumber } from './parInput';

const FAIRWAY = { r: 27, g: 67, b: 50 };
const TEXT = { r: 27, g: 53, b: 40 };
const MUTED = { r: 100, g: 120, b: 110 };
const BORDER = { r: 180, g: 190, b: 185 };
const PAR_LINE = { r: 140, g: 155, b: 145 };

export interface HoleChartResult {
  height: number;
}

export function drawHoleByHoleChart(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  holes: HoleEntry[],
): HoleChartResult {
  const titleH = 8;
  const chartH = 52;
  const legendH = 8;
  const totalH = titleH + chartH + legendH;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(TEXT.r, TEXT.g, TEXT.b);
  doc.text('Hole by Hole Score', x + width / 2, y + 5, { align: 'center' });

  const plotX = x + 10;
  const plotY = y + titleH + 4;
  const plotW = width - 16;
  const plotH = chartH - 12;

  const pars = holes.map((hole) => parAsNumber(hole.par));
  const scores = holes.map((hole) => hole.score);
  const holeCount = Math.max(holes.length, 1);

  const yMin = Math.min(...pars, ...scores, 2) - 1;
  const yMax = Math.max(...pars, ...scores, 6) + 1;
  const yRange = Math.max(yMax - yMin, 1);

  const toPlotX = (index: number) =>
    holeCount === 1 ? plotX + plotW / 2 : plotX + (index / (holeCount - 1)) * plotW;
  const toPlotY = (value: number) => plotY + plotH - ((value - yMin) / yRange) * plotH;

  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.setLineWidth(0.15);
  for (let tick = Math.ceil(yMin); tick <= Math.floor(yMax); tick += 1) {
    const gridY = toPlotY(tick);
    doc.line(plotX, gridY, plotX + plotW, gridY);
  }

  doc.setLineWidth(0.25);
  doc.line(plotX, plotY, plotX, plotY + plotH);
  doc.line(plotX, plotY + plotH, plotX + plotW, plotY + plotH);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  for (let tick = Math.ceil(yMin); tick <= Math.floor(yMax); tick += 1) {
    doc.text(String(tick), plotX - 2, toPlotY(tick) + 1, { align: 'right' });
  }

  doc.setFontSize(6);
  holes.forEach((hole, index) => {
    if (holeCount > 12 && index % 2 !== 0 && index !== holeCount - 1) return;
    doc.text(String(hole.hole), toPlotX(index), plotY + plotH + 4, { align: 'center' });
  });

  doc.setDrawColor(PAR_LINE.r, PAR_LINE.g, PAR_LINE.b);
  doc.setLineWidth(0.45);
  for (let i = 0; i < holeCount - 1; i += 1) {
    doc.line(toPlotX(i), toPlotY(pars[i]), toPlotX(i + 1), toPlotY(pars[i + 1]));
  }

  doc.setDrawColor(FAIRWAY.r, FAIRWAY.g, FAIRWAY.b);
  doc.setLineWidth(0.7);
  for (let i = 0; i < holeCount - 1; i += 1) {
    doc.line(toPlotX(i), toPlotY(scores[i]), toPlotX(i + 1), toPlotY(scores[i + 1]));
  }

  pars.forEach((par, index) => {
    doc.setFillColor(PAR_LINE.r, PAR_LINE.g, PAR_LINE.b);
    doc.circle(toPlotX(index), toPlotY(par), 0.8, 'F');
  });

  scores.forEach((score, index) => {
    doc.setFillColor(FAIRWAY.r, FAIRWAY.g, FAIRWAY.b);
    doc.circle(toPlotX(index), toPlotY(score), 1, 'F');
  });

  const legendY = y + titleH + chartH;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);

  const legendStartX = x + width / 2 - 28;
  doc.setFillColor(PAR_LINE.r, PAR_LINE.g, PAR_LINE.b);
  doc.circle(legendStartX, legendY, 1.2, 'F');
  doc.text('Par', legendStartX + 4, legendY + 1);

  doc.setFillColor(FAIRWAY.r, FAIRWAY.g, FAIRWAY.b);
  doc.circle(legendStartX + 22, legendY, 1.2, 'F');
  doc.text('Score', legendStartX + 26, legendY + 1);

  return { height: totalH };
}
