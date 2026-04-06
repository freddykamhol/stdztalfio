import {
  PDFDocument,
  PageSizes,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

import {
  getBildNotizLabel,
  formatEintragsartenZusammenfassung,
  formatEuro,
  formatPause,
  formatStunden,
  getStundenEintragTitel,
  getStundenEintragUntertitel,
  getStundenEintragsartLabel,
  getStundenEintragZeitText,
  hatStundenZeiten,
  type StundenzettelEintrag,
  type StundenzettelMonat,
} from "./stundenzettel";

const [PAGE_WIDTH, PAGE_HEIGHT] = PageSizes.A4;
const MARGIN_X = 40;
const MARGIN_TOP = 46;
const MARGIN_BOTTOM = 32;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const COLORS = {
  accent: rgb(0.886, 0.024, 0.075),
  accentSoft: rgb(0.992, 0.933, 0.941),
  border: rgb(0.843, 0.855, 0.882),
  panel: rgb(0.976, 0.978, 0.983),
  panelAlt: rgb(1, 1, 1),
  text: rgb(0.11, 0.118, 0.161),
  muted: rgb(0.408, 0.443, 0.502),
  white: rgb(1, 1, 1),
};

type PdfFonts = {
  bold: PDFFont;
  regular: PDFFont;
};

const ENTRY_CARD_LAYOUT = {
  titelLineHeight: 14,
  titelStartOffset: 42,
  bottomPadding: 14,
  columnGap: 18,
  contentPaddingX: 16,
  dateOffset: 22,
  dividerGap: 12,
  metaLabelGap: 16,
  metaRowGap: 26,
  metaValueGap: 11,
};

function fitWord(word: string, maxWidth: number, font: PDFFont, size: number) {
  if (font.widthOfTextAtSize(word, size) <= maxWidth) {
    return word;
  }

  let gekuerzt = word;

  while (gekuerzt.length > 1 && font.widthOfTextAtSize(`${gekuerzt}…`, size) > maxWidth) {
    gekuerzt = gekuerzt.slice(0, -1);
  }

  return `${gekuerzt}…`;
}

function wrapText(
  text: string,
  maxWidth: number,
  font: PDFFont,
  size: number,
  maxLines = 3,
) {
  const woerter = text.split(/\s+/).filter(Boolean);
  const zeilen: string[] = [];
  let aktuelleZeile = "";

  for (let index = 0; index < woerter.length; index += 1) {
    const wort = fitWord(woerter[index], maxWidth, font, size);
    const testZeile = aktuelleZeile ? `${aktuelleZeile} ${wort}` : wort;

    if (font.widthOfTextAtSize(testZeile, size) <= maxWidth) {
      aktuelleZeile = testZeile;
      continue;
    }

    if (aktuelleZeile) {
      zeilen.push(aktuelleZeile);
      aktuelleZeile = wort;
    } else {
      zeilen.push(wort);
      aktuelleZeile = "";
    }

    if (zeilen.length === maxLines) {
      return zeilen;
    }
  }

  if (aktuelleZeile && zeilen.length < maxLines) {
    zeilen.push(aktuelleZeile);
  }

  if (zeilen.length === maxLines && woerter.join(" ") !== zeilen.join(" ")) {
    let letzteZeile = zeilen[zeilen.length - 1];

    while (
      letzteZeile.length > 1 &&
      font.widthOfTextAtSize(`${letzteZeile}…`, size) > maxWidth
    ) {
      letzteZeile = letzteZeile.slice(0, -1).trimEnd();
    }

    zeilen[zeilen.length - 1] = `${letzteZeile}…`;
  }

  return zeilen;
}

function drawPanel(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  backgroundColor = COLORS.panel,
  borderColor = COLORS.border,
) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: backgroundColor,
    borderColor,
    borderWidth: 1,
  });
}

function drawHeader(page: PDFPage, fonts: PdfFonts, monat: StundenzettelMonat) {
  const topY = PAGE_HEIGHT - MARGIN_TOP;

  page.drawText("ALFIO SCHMIDT", {
    color: COLORS.accent,
    font: fonts.bold,
    size: 10,
    x: MARGIN_X,
    y: topY,
  });

  page.drawText(`Stundenzettel ${monat.monatLabel} ${monat.jahr}`, {
    color: COLORS.text,
    font: fonts.bold,
    size: 22,
    x: MARGIN_X,
    y: topY - 26,
  });

  page.drawText("Monatsübersicht mit Summen und allen erfassten Tagesdaten.", {
    color: COLORS.muted,
    font: fonts.regular,
    size: 10,
    x: MARGIN_X,
    y: topY - 42,
  });

  page.drawLine({
    color: COLORS.border,
    end: { x: PAGE_WIDTH - MARGIN_X, y: topY - 54 },
    start: { x: MARGIN_X, y: topY - 54 },
    thickness: 1,
  });

  return topY - 74;
}

function drawContinuationHeader(
  page: PDFPage,
  fonts: PdfFonts,
  monat: StundenzettelMonat,
  seite: number,
) {
  const topY = PAGE_HEIGHT - MARGIN_TOP;

  page.drawText(`Stundenzettel ${monat.monatLabel} ${monat.jahr}`, {
    color: COLORS.text,
    font: fonts.bold,
    size: 16,
    x: MARGIN_X,
    y: topY,
  });

  page.drawText(`Fortsetzung, Seite ${seite}`, {
    color: COLORS.muted,
    font: fonts.regular,
    size: 10,
    x: PAGE_WIDTH - MARGIN_X - 92,
    y: topY + 2,
  });

  page.drawLine({
    color: COLORS.border,
    end: { x: PAGE_WIDTH - MARGIN_X, y: topY - 12 },
    start: { x: MARGIN_X, y: topY - 12 },
    thickness: 1,
  });

  return topY - 30;
}

function drawSummaryCard(
  page: PDFPage,
  fonts: PdfFonts,
  {
    x,
    y,
    width,
    height,
    hint,
    label,
    value,
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
    hint?: string;
    label: string;
    value: string;
  },
) {
  drawPanel(page, x, y, width, height);

  page.drawRectangle({
    x,
    y: y + height - 4,
    width,
    height: 4,
    color: COLORS.accent,
  });

  page.drawText(label.toUpperCase(), {
    color: COLORS.muted,
    font: fonts.bold,
    size: 8,
    x: x + 12,
    y: y + height - 18,
  });

  page.drawText(value, {
    color: COLORS.text,
    font: fonts.bold,
    size: 16,
    x: x + 12,
    y: y + height - 40,
  });

  if (hint) {
    page.drawText(hint, {
      color: COLORS.muted,
      font: fonts.regular,
      size: 9,
      x: x + 12,
      y: y + 10,
    });
  }
}

function drawSummary(page: PDFPage, fonts: PdfFonts, monat: StundenzettelMonat, yTop: number) {
  const gap = 12;
  const cardHeight = 66;
  const cardWidth = (CONTENT_WIDTH - gap) / 2;
  const cards = [
    {
      hint: `${monat.monatLabel} ${monat.jahr}`,
      label: "Einträge",
      value: `${monat.summen.eintraege}`,
    },
    {
      hint: formatEintragsartenZusammenfassung(monat.summen, "Keine Markierung"),
      label: "Gesamtstunden",
      value: formatStunden(monat.summen.stunden),
    },
    {
      hint: "Monatssumme",
      label: "Gesamtpause",
      value: formatPause(monat.summen.pauseMinuten),
    },
    {
      hint: "Monatssumme",
      label: "Tankkosten",
      value: formatEuro(monat.summen.tankKosten),
    },
    {
      hint: "Ganztägig",
      label: "Urlaubstage",
      value: `${monat.summen.urlaubstage}`,
    },
    {
      hint: "Ganztägig",
      label: "Kranktage",
      value: `${monat.summen.kranktage}`,
    },
  ];
  const zeilenAnzahl = Math.ceil(cards.length / 2);

  cards.forEach((card, index) => {
    const spalte = index % 2;
    const zeile = Math.floor(index / 2);
    const x = MARGIN_X + spalte * (cardWidth + gap);
    const y = yTop - zeile * (cardHeight + gap) - cardHeight;

    drawSummaryCard(page, fonts, {
      height: cardHeight,
      hint: card.hint,
      label: card.label,
      value: card.value,
      width: cardWidth,
      x,
      y,
    });
  });

  return yTop - (cardHeight * zeilenAnzahl + gap * Math.max(0, zeilenAnzahl - 1)) - 16;
}

function drawInfoStrip(page: PDFPage, fonts: PdfFonts, monat: StundenzettelMonat, yTop: number) {
  const height = 32;
  const y = yTop - height;
  const text =
    monat.summen.uebernachtungen > 0 ||
    monat.summen.urlaubstage > 0 ||
    monat.summen.kranktage > 0
      ? `Markierungen in diesem Monat: ${formatEintragsartenZusammenfassung(monat.summen)}.`
      : "Keine Markierungen in diesem Monat erfasst.";

  drawPanel(page, MARGIN_X, y, CONTENT_WIDTH, height, COLORS.accentSoft, COLORS.accent);

  page.drawText(text, {
    color: COLORS.accent,
    font: fonts.bold,
    size: 10,
    x: MARGIN_X + 12,
    y: y + 11,
  });

  return y - 16;
}

function drawMetaCell(
  page: PDFPage,
  fonts: PdfFonts,
  {
    label,
    value,
    x,
    y,
  }: {
    label: string;
    value: string;
    x: number;
    y: number;
  },
) {
  page.drawText(label.toUpperCase(), {
    color: COLORS.muted,
    font: fonts.bold,
    size: 7,
    x,
    y,
  });

  page.drawText(value, {
    color: COLORS.text,
    font: fonts.regular,
    size: 10,
    x,
    y: y - 11,
  });
}

function getEintragTextFuerPdf(eintrag: StundenzettelEintrag) {
  const titel = getStundenEintragTitel(eintrag.eintragsart, eintrag.bemerkung);
  const untertitel = getStundenEintragUntertitel(eintrag.eintragsart, eintrag.bemerkung);

  return untertitel ? `${titel} · ${untertitel}` : titel;
}

function getEntryCardHeight(eintrag: StundenzettelEintrag, fonts: PdfFonts) {
  const titelZeilen = wrapText(
    getEintragTextFuerPdf(eintrag),
    CONTENT_WIDTH - ENTRY_CARD_LAYOUT.contentPaddingX * 2,
    fonts.bold,
    12,
    3,
  );
  const letzteTitelZeileOffset =
    ENTRY_CARD_LAYOUT.titelStartOffset +
    Math.max(0, titelZeilen.length - 1) * ENTRY_CARD_LAYOUT.titelLineHeight;
  const metaZeilen = hatStundenZeiten(eintrag.eintragsart) ? 2 : 1;
  const letzteMetaValueOffset =
    letzteTitelZeileOffset +
    ENTRY_CARD_LAYOUT.dividerGap +
    ENTRY_CARD_LAYOUT.metaLabelGap +
    Math.max(0, metaZeilen - 1) * ENTRY_CARD_LAYOUT.metaRowGap +
    ENTRY_CARD_LAYOUT.metaValueGap;

  return letzteMetaValueOffset + ENTRY_CARD_LAYOUT.bottomPadding;
}

function drawEntryCard(
  page: PDFPage,
  fonts: PdfFonts,
  eintrag: StundenzettelEintrag,
  yTop: number,
  index: number,
) {
  const titelZeilen = wrapText(
    getEintragTextFuerPdf(eintrag),
    CONTENT_WIDTH - ENTRY_CARD_LAYOUT.contentPaddingX * 2,
    fonts.bold,
    12,
    3,
  );
  const cardHeight = getEntryCardHeight(eintrag, fonts);
  const cardBottom = yTop - cardHeight;
  const contentX = MARGIN_X + ENTRY_CARD_LAYOUT.contentPaddingX;
  const innerWidth = CONTENT_WIDTH - ENTRY_CARD_LAYOUT.contentPaddingX * 2;

  drawPanel(
    page,
    MARGIN_X,
    cardBottom,
    CONTENT_WIDTH,
    cardHeight,
    index % 2 === 0 ? COLORS.panelAlt : COLORS.panel,
  );

  page.drawRectangle({
    x: MARGIN_X,
    y: cardBottom,
    width: 4,
    height: cardHeight,
    color: COLORS.accent,
  });

  page.drawText(eintrag.datumText, {
    color: COLORS.text,
    font: fonts.bold,
    size: 12,
    x: contentX,
    y: yTop - ENTRY_CARD_LAYOUT.dateOffset,
  });

  if (eintrag.eintragsart !== "TAGESEINSATZ") {
    const badgeText = getStundenEintragsartLabel(eintrag.eintragsart);
    const badgeWidth = fonts.bold.widthOfTextAtSize(badgeText, 8) + 16;
    const badgeX = MARGIN_X + CONTENT_WIDTH - ENTRY_CARD_LAYOUT.contentPaddingX - badgeWidth;

    drawPanel(page, badgeX, yTop - 26, badgeWidth, 18, COLORS.accentSoft, COLORS.accent);

    page.drawText(badgeText, {
      color: COLORS.accent,
      font: fonts.bold,
      size: 8,
      x: badgeX + 8,
      y: yTop - 19,
    });
  }

  titelZeilen.forEach((zeile, zeilenIndex) => {
    page.drawText(zeile, {
      color: COLORS.text,
      font: fonts.bold,
      size: 12,
      x: contentX,
      y:
        yTop -
        ENTRY_CARD_LAYOUT.titelStartOffset -
        zeilenIndex * ENTRY_CARD_LAYOUT.titelLineHeight,
    });
  });

  const dividerY =
    yTop -
    (ENTRY_CARD_LAYOUT.titelStartOffset +
      Math.max(0, titelZeilen.length - 1) * ENTRY_CARD_LAYOUT.titelLineHeight +
      ENTRY_CARD_LAYOUT.dividerGap);

  page.drawLine({
    color: COLORS.border,
    end: { x: MARGIN_X + CONTENT_WIDTH - ENTRY_CARD_LAYOUT.contentPaddingX, y: dividerY },
    start: { x: contentX, y: dividerY },
    thickness: 1,
  });

  const columnWidth = (innerWidth - ENTRY_CARD_LAYOUT.columnGap) / 2;
  const leftX = contentX;
  const rightX = contentX + columnWidth + ENTRY_CARD_LAYOUT.columnGap;

  if (hatStundenZeiten(eintrag.eintragsart)) {
    drawMetaCell(page, fonts, {
      label: "Zeit",
      value: getStundenEintragZeitText(eintrag.eintragsart, eintrag.beginnText, eintrag.endeText),
      x: leftX,
      y: dividerY - ENTRY_CARD_LAYOUT.metaLabelGap,
    });

    drawMetaCell(page, fonts, {
      label: "Stunden",
      value: formatStunden(eintrag.stunden),
      x: rightX,
      y: dividerY - ENTRY_CARD_LAYOUT.metaLabelGap,
    });

    drawMetaCell(page, fonts, {
      label: "Pause",
      value: formatPause(eintrag.pauseMinuten),
      x: leftX,
      y: dividerY - ENTRY_CARD_LAYOUT.metaLabelGap - ENTRY_CARD_LAYOUT.metaRowGap,
    });

    drawMetaCell(page, fonts, {
      label: "Tankkosten",
      value: formatEuro(eintrag.tankKosten),
      x: rightX,
      y: dividerY - ENTRY_CARD_LAYOUT.metaLabelGap - ENTRY_CARD_LAYOUT.metaRowGap,
    });
  } else {
    drawMetaCell(page, fonts, {
      label: "Zeit",
      value: "Ganztägig",
      x: leftX,
      y: dividerY - ENTRY_CARD_LAYOUT.metaLabelGap,
    });

    drawMetaCell(page, fonts, {
      label: "Bilder",
      value:
        eintrag.bildNotizen.length > 0 ? getBildNotizLabel(eintrag.bildNotizen.length) : "Keine",
      x: rightX,
      y: dividerY - ENTRY_CARD_LAYOUT.metaLabelGap,
    });
  }

  return cardBottom - 10;
}

function drawFooter(page: PDFPage, fonts: PdfFonts, seite: number) {
  page.drawLine({
    color: COLORS.border,
    end: { x: PAGE_WIDTH - MARGIN_X, y: 26 },
    start: { x: MARGIN_X, y: 26 },
    thickness: 1,
  });

  page.drawText(`Seite ${seite}`, {
    color: COLORS.muted,
    font: fonts.regular,
    size: 9,
    x: MARGIN_X,
    y: 12,
  });

  page.drawText("Stundenalfio", {
    color: COLORS.muted,
    font: fonts.regular,
    size: 9,
    x: PAGE_WIDTH - MARGIN_X - 46,
    y: 12,
  });
}

export async function createStundenzettelPdf(monat: StundenzettelMonat) {
  const doc = await PDFDocument.create();
  const fonts: PdfFonts = {
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    regular: await doc.embedFont(StandardFonts.Helvetica),
  };

  let seite = 1;
  let page = doc.addPage(PageSizes.A4);
  let y = drawHeader(page, fonts, monat);
  y = drawSummary(page, fonts, monat, y);
  y = drawInfoStrip(page, fonts, monat, y);

  for (let index = 0; index < monat.eintraege.length; index += 1) {
    const eintrag = monat.eintraege[index];
    const cardHeight = getEntryCardHeight(eintrag, fonts);

    if (y - cardHeight < MARGIN_BOTTOM) {
      drawFooter(page, fonts, seite);
      seite += 1;
      page = doc.addPage(PageSizes.A4);
      y = drawContinuationHeader(page, fonts, monat, seite);
    }

    y = drawEntryCard(page, fonts, eintrag, y, index);
  }

  drawFooter(page, fonts, seite);
  return doc.save();
}
