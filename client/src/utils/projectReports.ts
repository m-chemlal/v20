import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { Project, Indicator, IndicatorEntry } from '@/types/project';

interface GenerateProjectReportOptions {
  project: Project;
  indicators: Indicator[];
  entries: IndicatorEntry[];
}

export function generateProjectReportPdf({
  project,
  indicators,
  entries,
}: GenerateProjectReportOptions) {
  const ensureDate = (value: Date | string | null | undefined) => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  };

  const doc = new jsPDF();
  const margin = 14;
  let cursorY = 20;

  doc.setFontSize(18);
  doc.text(project.name, margin, cursorY);
  cursorY += 8;

  doc.setFontSize(12);
  doc.text(`Statut : ${project.status}`, margin, cursorY);
  cursorY += 6;
  const startDate = ensureDate(project.startDate);
  const endDate = project.endDate ? ensureDate(project.endDate) : null;

  doc.text(
    `Période : ${format(startDate, 'dd MMM yyyy')} - ${
      endDate ? format(endDate, 'dd MMM yyyy') : 'En cours'
    }`,
    margin,
    cursorY,
  );
  cursorY += 6;
  doc.text(
    `Budget : ${project.budget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
    margin,
    cursorY,
  );
  cursorY += 6;
  doc.text(
    `Dépenses : ${project.spent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`,
    margin,
    cursorY,
  );
  cursorY += 10;

  if (Array.isArray(project.donorAllocations) && project.donorAllocations.length > 0) {
    doc.text('Financement des donateurs :', margin, cursorY);
    cursorY += 6;

    project.donorAllocations.forEach((donor) => {
      if (cursorY > 270) {
        doc.addPage();
        cursorY = 20;
      }

      doc.text(
        `• Donateur #${donor.donorId} – ${donor.committedAmount.toLocaleString('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        })} engagés / ${donor.spentAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} dépensés`,
        margin,
        cursorY,
      );
      cursorY += 6;
    });

    cursorY += 4;
  }

  if (project.description) {
    const descriptionLines = doc.splitTextToSize(project.description, 180);
    doc.text('Description :', margin, cursorY);
    cursorY += 6;
    doc.text(descriptionLines, margin, cursorY);
    cursorY += descriptionLines.length * 6 + 4;
  }

  if (indicators.length > 0) {
    doc.setFontSize(14);
    doc.text('Indicateurs', margin, cursorY);
    cursorY += 6;
    doc.setFontSize(12);

    indicators.forEach((indicator) => {
      if (cursorY > 270) {
        doc.addPage();
        cursorY = 20;
      }

      doc.text(`• ${indicator.name}`, margin, cursorY);
      cursorY += 5;

      if (indicator.description) {
        const lines = doc.splitTextToSize(indicator.description, 170);
        doc.text(lines, margin + 4, cursorY);
        cursorY += lines.length * 5;
      }

      doc.text(
        `   Valeur : ${indicator.currentValue} ${indicator.unit} (cible ${indicator.targetValue})`,
        margin,
        cursorY,
      );
      cursorY += 5;

      const historyEntries = entries
        .filter((entry) => entry.indicatorId === indicator.id)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      if (historyEntries.length > 0) {
        historyEntries.forEach((entry) => {
          if (cursorY > 270) {
            doc.addPage();
            cursorY = 20;
          }

          doc.text(
            `      • ${format(entry.createdAt, 'dd MMM yyyy')} – ${entry.value} ${indicator.unit}`,
            margin,
            cursorY,
          );
          cursorY += 5;
        });
      }

      cursorY += 3;
    });
  }

  const safeName = project.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  doc.save(`rapport-${safeName || project.id}.pdf`);
}
