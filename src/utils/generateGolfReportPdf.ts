import type { PlayerProfile, Round } from '../types';
import { normalizeMental } from '../types';
import { drawFullScorecard } from './pdfScorecard';
import {
  calcTotalScore,
  countFairways,
  countGIR,
  formatScoreToPar,
  scoreToPar,
  totalPutts,
} from './stats';

const FAIRWAY = { r: 27, g: 67, b: 50 };
const GOLD = { r: 212, g: 168, b: 83 };
const TEXT = { r: 27, g: 53, b: 40 };
const MUTED = { r: 100, g: 120, b: 110 };

function pdfRatingText(rating: number): string {
  const n = Math.min(5, Math.max(0, Math.round(rating)));
  return `${n}/5`;
}

function roundPdfFilename(playerName: string, dateIso: string): string {
  const first = (playerName.split(' ')[0] || 'Player').replace(/[^a-zA-Z0-9]/g, '');
  return `${first}_Golf_Report_${dateIso.slice(0, 10)}.pdf`;
}

function formatReportDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildPlayerNotes(round: Round): string {
  const lines = round.holes
    .filter((hole) => hole.notes.trim())
    .map((hole) => `Hole ${hole.hole}: ${hole.notes.trim()}`);

  return lines.join('\n\n') || '—';
}

export function buildGolfReportFilename(profile: PlayerProfile, round: Round): string {
  return roundPdfFilename(profile.name, round.date);
}

function openPdfInNewTab(doc: import('jspdf').jsPDF): void {
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const newTab = window.open(pdfUrl, '_blank', 'noopener,noreferrer');

  if (!newTab) {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
}

export async function generateRoundPdf(profile: PlayerProfile, round: Round): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = 0;

  const mental = normalizeMental(round.mental);
  const fw = countFairways(round.holes);
  const gir = countGIR(round.holes);
  const total = calcTotalScore(round.holes);
  const puttTotal = totalPutts(round.holes);
  const toPar = formatScoreToPar(scoreToPar(round.holes));
  const playerNotes = buildPlayerNotes(round);

  const ensureSpace = (needed: number) => {
    const pageH = doc.internal.pageSize.getHeight();
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const gap = (mm = 4) => {
    y += mm;
  };

  const drawInline = (label: string, value: string) => {
    ensureSpace(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(TEXT.r, TEXT.g, TEXT.b);
    doc.text(`${label}:`, margin, y);
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + labelWidth, y);
    y += 7;
  };

  const drawSection = (title: string) => {
    ensureSpace(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(FAIRWAY.r, FAIRWAY.g, FAIRWAY.b);
    doc.text(title.toUpperCase(), margin, y);
    y += 7;
  };

  const drawReflection = (label: string, text: string) => {
    if (!text.trim()) return;
    ensureSpace(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(TEXT.r, TEXT.g, TEXT.b);
    doc.text(`${label}:`, margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
    const lines = doc.splitTextToSize(text.trim(), contentW);
    ensureSpace(lines.length * 5 + 2);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  };

  doc.setFillColor(FAIRWAY.r, FAIRWAY.g, FAIRWAY.b);
  doc.rect(0, 0, pageW, 38, 'F');
  doc.setFillColor(GOLD.r, GOLD.g, GOLD.b);
  doc.rect(0, 38, pageW, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(round.courseName || 'Golf Scorecard', margin, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(GOLD.r, GOLD.g, GOLD.b);
  doc.text(formatReportDate(round.date), margin, 23);

  doc.setFontSize(9);
  doc.setTextColor(220, 230, 220);
  doc.text(`${profile.name} · Round Report`, margin, 30);

  y = 46;

  drawInline('Course Handicap', round.courseHandicap.trim() || '—');
  drawInline('Slope Rating', round.slopeRating.trim() || '—');

  gap(2);

  ensureSpace(14);
  doc.setFillColor(FAIRWAY.r, FAIRWAY.g, FAIRWAY.b);
  doc.roundedRect(margin, y, contentW, 13, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('Score:', margin + 5, y + 8.5);
  doc.setFontSize(15);
  doc.setTextColor(GOLD.r, GOLD.g, GOLD.b);
  doc.text(`${total} (${toPar})`, margin + 26, y + 8.5);
  y += 18;

  ensureSpace(95);
  const scorecardResult = drawFullScorecard(doc, margin, y, contentW, round.holes);
  y = scorecardResult.endY;

  gap(4);
  drawSection('Round Statistics');
  drawInline('Fairways', fw.total ? `${fw.hit}/${fw.total}` : '—');
  drawInline('GIR', gir.total ? `${gir.hit}/${gir.total}` : '—');
  drawInline('Putts', puttTotal ? String(puttTotal) : '—');

  gap(4);
  drawSection('Mental Review');
  drawInline('Focus', pdfRatingText(mental.focus));
  drawInline('Confidence', pdfRatingText(mental.confidence));
  drawInline('Emotional Control', pdfRatingText(mental.emotionalControl));
  drawInline('Course Management', pdfRatingText(mental.courseManagement));

  gap(2);
  drawReflection('Highlight of the Round', mental.highlightOfRound);
  drawReflection('Key Learning', mental.keyLearning);
  drawReflection('Practice Focus', mental.practiceFocus);

  gap(4);
  drawSection('Personal Notes');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  const noteLines = doc.splitTextToSize(playerNotes, contentW);
  ensureSpace(noteLines.length * 5 + 4);
  doc.text(noteLines, margin, y);
  y += noteLines.length * 5 + 6;

  ensureSpace(10);
  doc.setDrawColor(FAIRWAY.r, FAIRWAY.g, FAIRWAY.b);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageW - margin, y);

  openPdfInNewTab(doc);
}

export async function generateGolfReportPdf(profile: PlayerProfile, round: Round): Promise<void> {
  return generateRoundPdf(profile, round);
}

// Re-export PDF scorecard helpers for consumers and tests
export {
  calcTotalYards,
  drawCircle,
  drawDoubleCircle,
  drawDoubleSquare,
  drawFullScorecard,
  drawSquare,
  getScoreMarkerType,
} from './pdfScorecard';
export type { ScoreMarkerType } from './pdfScorecard';
