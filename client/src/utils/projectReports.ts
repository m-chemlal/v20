import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { Project, Indicator, IndicatorEntry } from '@/types/project';

interface GenerateProjectReportOptions {
  project: Project;
  indicators: Indicator[];
  entries: IndicatorEntry[];
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const ACCENT_COLOR: RgbColor = { r: 79, g: 70, b: 229 };
const ACCENT_LIGHT: RgbColor = { r: 99, g: 102, b: 241 };
const TEXT_PRIMARY: RgbColor = { r: 17, g: 24, b: 39 };
const TEXT_MUTED: RgbColor = { r: 107, g: 114, b: 128 };
const CARD_BG: RgbColor = { r: 248, g: 250, b: 252 };
const BORDER_COLOR: RgbColor = { r: 226, g: 232, b: 240 };

const setFillColor = (doc: jsPDF, color: RgbColor) => {
  doc.setFillColor(color.r, color.g, color.b);
};

const setTextColor = (doc: jsPDF, color: RgbColor) => {
  doc.setTextColor(color.r, color.g, color.b);
};

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

const resolveEvidenceLabel = (evidence?: string) => {
  if (!evidence) {
    return 'pièce jointe';
  }

  const fallbackLabel = 'pièce jointe';

  try {
    const url = new URL(evidence);
    const lastSegment = url.pathname.split('/').pop();
    return decodeURIComponent(lastSegment || fallbackLabel);
  } catch (error) {
    const lastSegment = evidence.split('/').pop();
    return decodeURIComponent(lastSegment || fallbackLabel);
  }
};

export function generateProjectReportPdf({
  project,
  indicators,
  entries,
}: GenerateProjectReportOptions) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const lineHeight = 6;
  const headerHeight = 42;

  const addNewPage = () => {
    doc.addPage();
    setFillColor(doc, ACCENT_COLOR);
    doc.rect(0, 0, pageWidth, 28, 'F');
    setTextColor(doc, { r: 255, g: 255, b: 255 });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(project.name, margin, 18);
    doc.setFont('helvetica', 'normal');
    setTextColor(doc, TEXT_PRIMARY);
    doc.setFontSize(11);
    cursorY = 36;
  };

  let cursorY = headerHeight;

  setFillColor(doc, ACCENT_COLOR);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  setTextColor(doc, { r: 255, g: 255, b: 255 });
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(project.name, margin, 24);

  const statusLabel = project.status;
  const statusWidth = doc.getTextWidth(statusLabel) + 16;
  setFillColor(doc, ACCENT_LIGHT);
  doc.roundedRect(pageWidth - margin - statusWidth, 12, statusWidth, 14, 6, 6, 'F');
  doc.setFontSize(11);
  doc.text(
    statusLabel,
    pageWidth - margin - statusWidth / 2,
    22,
    { align: 'center' },
  );

  const startDate = ensureDate(project.startDate);
  const endDate = project.endDate ? ensureDate(project.endDate) : null;
  const periodLabel = `Période : ${format(startDate, 'dd MMM yyyy')} - ${
    endDate ? format(endDate, 'dd MMM yyyy') : 'En cours'
  }`;
  const updatedLabel = `Dernière mise à jour : ${format(
    ensureDate(project.updatedAt),
    'dd MMM yyyy',
  )}`;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(periodLabel, margin, 32);
  doc.text(updatedLabel, margin, 38);

  setTextColor(doc, TEXT_PRIMARY);
  cursorY += 10;

  const ensureSpace = (height: number) => {
    if (cursorY + height > pageHeight - margin) {
      addNewPage();
    }
  };

  const summaryItems = [
    {
      label: 'Budget engagé',
      value: project.budget.toLocaleString('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }),
    },
    {
      label: 'Montant dépensé',
      value: project.spent.toLocaleString('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }),
    },
    {
      label: 'Progression moyenne',
      value:
        indicators.length > 0
          ? `${Math.round(
              indicators.reduce(
                (acc, indicator) =>
                  acc + (indicator.currentValue / indicator.targetValue) * 100,
                0,
              ) / indicators.length,
            )}%`
          : 'N/A',
    },
    {
      label: "Chef de projet",
      value: project.chefProjectId ? `ID ${project.chefProjectId}` : 'Non défini',
    },
  ];

  const summaryColumns = 2;
  const summaryGap = 10;
  const summaryBoxWidth =
    (pageWidth - margin * 2 - summaryGap * (summaryColumns - 1)) / summaryColumns;
  const summaryBoxHeight = 28;
  const summaryRowSpacing = 12;
  const totalSummaryRows = Math.ceil(summaryItems.length / summaryColumns);
  const summarySectionHeight =
    totalSummaryRows * summaryBoxHeight + (totalSummaryRows - 1) * summaryRowSpacing;

  ensureSpace(summarySectionHeight + 6);
  doc.setFontSize(11);

  const summaryStartY = cursorY;

  summaryItems.forEach((item, index) => {
    const columnIndex = index % summaryColumns;
    const rowIndex = Math.floor(index / summaryColumns);
    const boxX = margin + columnIndex * (summaryBoxWidth + summaryGap);
    const boxY = summaryStartY + rowIndex * (summaryBoxHeight + summaryRowSpacing);

    setFillColor(doc, CARD_BG);
    doc.roundedRect(boxX, boxY, summaryBoxWidth, summaryBoxHeight, 4, 4, 'F');
    doc.setDrawColor(BORDER_COLOR.r, BORDER_COLOR.g, BORDER_COLOR.b);
    doc.roundedRect(boxX, boxY, summaryBoxWidth, summaryBoxHeight, 4, 4, 'S');

    setTextColor(doc, TEXT_MUTED);
    doc.setFont('helvetica', 'bold');
    doc.text(item.label, boxX + 6, boxY + 10);
    setTextColor(doc, TEXT_PRIMARY);
    doc.setFont('helvetica', 'normal');
    const valueLines = doc.splitTextToSize(item.value, summaryBoxWidth - 12);
    doc.text(valueLines, boxX + 6, boxY + 18);
  });

  cursorY = summaryStartY + summarySectionHeight + 14;

  const drawSectionTitle = (title: string) => {
    ensureSpace(20);
    setFillColor(doc, ACCENT_COLOR);
    doc.rect(margin, cursorY, 4, 14, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 10, cursorY + 10);
    cursorY += 20;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
  };

  if (project.description) {
    drawSectionTitle('Présentation du projet');
    const descriptionLines = doc.splitTextToSize(
      project.description,
      pageWidth - margin * 2,
    );
    ensureSpace(descriptionLines.length * lineHeight + 6);
    setTextColor(doc, TEXT_PRIMARY);
    doc.text(descriptionLines, margin, cursorY);
    cursorY += descriptionLines.length * lineHeight + 10;
  }

  if (Array.isArray(project.donorAllocations) && project.donorAllocations.length > 0) {
    drawSectionTitle('Financement des donateurs');
    const tableX = margin;
    const tableWidth = pageWidth - margin * 2;
    const headerRowHeight = 9;
    const rowHeight = 9;

    ensureSpace(headerRowHeight + rowHeight * project.donorAllocations.length + 10);

    setFillColor(doc, ACCENT_COLOR);
    doc.roundedRect(tableX, cursorY, tableWidth, headerRowHeight, 3, 3, 'F');
    setTextColor(doc, { r: 255, g: 255, b: 255 });
    doc.setFont('helvetica', 'bold');
    doc.text('Donateur', tableX + 4, cursorY + 6);
    doc.text('Engagé', tableX + tableWidth / 2 - 20, cursorY + 6);
    doc.text('Dépensé', tableX + tableWidth - 28, cursorY + 6);

    cursorY += headerRowHeight;
    doc.setFont('helvetica', 'normal');

    project.donorAllocations.forEach((donor, index) => {
      ensureSpace(rowHeight + 2);
      const rowY = cursorY;

      if (index % 2 === 0) {
        setFillColor(doc, CARD_BG);
        doc.rect(tableX, rowY, tableWidth, rowHeight, 'F');
      }

      setTextColor(doc, TEXT_PRIMARY);
      doc.text(`#${donor.donorId}`, tableX + 4, rowY + 6);
      doc.text(
        donor.committedAmount.toLocaleString('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }),
        tableX + tableWidth / 2 - 20,
        rowY + 6,
      );
      doc.text(
        donor.spentAmount.toLocaleString('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }),
        tableX + tableWidth - 28,
        rowY + 6,
      );
      cursorY += rowHeight;
    });

    cursorY += 12;
  }

  if (indicators.length > 0) {
    drawSectionTitle('Indicateurs & progression');

    indicators.forEach((indicator) => {
      const historyEntries = entries
        .filter((entry) => entry.indicatorId === indicator.id)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const attachments = historyEntries.filter((entry) => Boolean(entry.evidence));
      const descriptionLines = indicator.description
        ? doc.splitTextToSize(indicator.description, pageWidth - margin * 2 - 16)
        : [];

      const cardPadding = 8;
      let estimatedHeight = cardPadding * 2 + lineHeight * 2;

      if (descriptionLines.length > 0) {
        estimatedHeight += descriptionLines.length * lineHeight + 2;
      }

      if (historyEntries.length > 0) {
        estimatedHeight += lineHeight; // header spacing
        historyEntries.forEach((entry) => {
          const historyText = `${format(entry.createdAt, 'dd MMM yyyy')} : ${entry.value} ${
            indicator.unit
          }${entry.createdByName ? ` • ${entry.createdByName}` : ''}${
            entry.notes ? ` – ${entry.notes}` : ''
          }`;
          const historyLines = doc.splitTextToSize(
            historyText,
            pageWidth - margin * 2 - cardPadding * 2,
          );
          estimatedHeight += historyLines.length * lineHeight;
        });
        estimatedHeight += 4;
      }

      if (attachments.length > 0) {
        estimatedHeight += lineHeight; // header spacing
        attachments.forEach((entry) => {
          const attachmentLabel = `${format(entry.createdAt, 'dd MMM yyyy')} • ${resolveEvidenceLabel(
            entry.evidence,
          )}`;
          const attachmentLines = doc.splitTextToSize(
            attachmentLabel,
            pageWidth - margin * 2 - cardPadding * 2,
          );
          estimatedHeight += attachmentLines.length * lineHeight;
        });
        estimatedHeight += 4;
      }

      ensureSpace(estimatedHeight + 6);

      const cardX = margin;
      const cardY = cursorY;
      const cardWidth = pageWidth - margin * 2;

      setFillColor(doc, CARD_BG);
      doc.setDrawColor(BORDER_COLOR.r, BORDER_COLOR.g, BORDER_COLOR.b);
      doc.roundedRect(cardX, cardY, cardWidth, estimatedHeight, 4, 4, 'FD');

      let cardCursorY = cardY + cardPadding + 2;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      setTextColor(doc, ACCENT_COLOR);
      doc.text(indicator.name, cardX + cardPadding, cardCursorY);

      cardCursorY += lineHeight;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      setTextColor(doc, TEXT_PRIMARY);
      doc.text(
        `Valeur actuelle : ${indicator.currentValue} ${indicator.unit}  |  Cible : ${
          indicator.targetValue
        } ${indicator.unit}`,
        cardX + cardPadding,
        cardCursorY,
      );

      cardCursorY += lineHeight;

      if (descriptionLines.length > 0) {
        setTextColor(doc, TEXT_MUTED);
        doc.text(descriptionLines, cardX + cardPadding, cardCursorY);
        cardCursorY += descriptionLines.length * lineHeight + 2;
        setTextColor(doc, TEXT_PRIMARY);
      }

      if (historyEntries.length > 0) {
        setTextColor(doc, TEXT_MUTED);
        doc.text('Historique des mises à jour', cardX + cardPadding, cardCursorY);
        cardCursorY += lineHeight;
        setTextColor(doc, TEXT_PRIMARY);

        historyEntries.forEach((entry) => {
          const historyText = `${format(entry.createdAt, 'dd MMM yyyy')} : ${entry.value} ${
            indicator.unit
          }${entry.createdByName ? ` • ${entry.createdByName}` : ''}${
            entry.notes ? ` – ${entry.notes}` : ''
          }`;
          const historyLines = doc.splitTextToSize(
            historyText,
            cardWidth - cardPadding * 2,
          );
          doc.text(historyLines, cardX + cardPadding, cardCursorY);
          cardCursorY += historyLines.length * lineHeight;
        });
        cardCursorY += 2;
      }

      if (attachments.length > 0) {
        setTextColor(doc, TEXT_MUTED);
        doc.text('Documents partagés', cardX + cardPadding, cardCursorY);
        cardCursorY += lineHeight;
        setTextColor(doc, TEXT_PRIMARY);

        attachments.forEach((entry) => {
          const attachmentLabel = `${format(entry.createdAt, 'dd MMM yyyy')} • ${resolveEvidenceLabel(
            entry.evidence,
          )}`;
          const attachmentLines = doc.splitTextToSize(
            attachmentLabel,
            cardWidth - cardPadding * 2,
          );
          doc.text(attachmentLines, cardX + cardPadding, cardCursorY);
          cardCursorY += attachmentLines.length * lineHeight;
        });
      }

      cursorY += estimatedHeight + 8;
    });
  }

  const safeName = project.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  doc.save(`rapport-${safeName || project.id}.pdf`);
}
