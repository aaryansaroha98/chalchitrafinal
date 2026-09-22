import jsPDF from 'jspdf';

// The ticket artwork is a fixed 800x260 design. Every label — CHALCHITRA,
// BOOKING ID, DATE, the borders — is part of the background image; only the
// values below and the QR are drawn over it.
export const TICKET_WIDTH = 800;
export const TICKET_HEIGHT = 260;
const CAPTURE_SCALE = 2;

const INK = '#000000';
const ACCENT = '#1a5f7a';
const FONT = 'Arial, Helvetica, sans-serif';

// Canvas textBaseline 'top' aligns the font's em box, which sits higher than
// where CSS put the same glyphs inside a line box. Measured against the
// previous DOM-captured ticket, the glyphs land 2.6px high; this puts them
// back so the values sit on the printed labels exactly as before.
const TEXT_TOP_NUDGE = 2.6;

// Positions copied from the markup this replaces. The three right-hand boxes
// were laid out with `right: -25px` / `-30px` against the 800px ticket, so
// their left edge is 800 - 180 + inset.
const LEFT_COL_X = 227;
const RIGHT_COL_X = TICKET_WIDTH - 180 + 25;   // 645
const VENUE_X = TICKET_WIDTH - 180 + 30;       // 650

const FIELDS = [
  { key: 'bookingCode', x: LEFT_COL_X,  y: 117.5, size: 12, maxWidth: 230 },
  { key: 'title',       x: LEFT_COL_X,  y: 141.5, size: 12, maxWidth: 230 },
  { key: 'persons',     x: LEFT_COL_X,  y: 165,   size: 12, maxWidth: 230 },
  { key: 'seats',       x: LEFT_COL_X,  y: 189,   size: 12, maxWidth: 260 },
  { key: 'weekday',     x: RIGHT_COL_X, y: 67,    size: 13, maxWidth: 180 },
  { key: 'dateText',    x: RIGHT_COL_X, y: 82.6,  size: 13, maxWidth: 180 },
  { key: 'time',        x: RIGHT_COL_X, y: 118,   size: 13, maxWidth: 180 },
  { key: 'venue',       x: VENUE_X,     y: 171,   size: 13, maxWidth: 180 },
];

const COLONS = [
  { x: 635, y: 62.5 },
  { x: 635, y: 113.5 },
  { x: 641, y: 165.5 },
];

const QR_BOX = { x: 472, y: 98, size: 98 };

const loadImage = (src) => new Promise((resolve) => {
  if (!src) return resolve(null);
  const img = new Image();
  // ticc.png is served from this origin; keeping the request anonymous means
  // the canvas stays untainted and toDataURL still works.
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  setTimeout(() => resolve(img.complete && img.naturalHeight ? img : null), 10000);
  img.src = src;
});

// Match how the browser wrapped these values inside their fixed-width boxes.
const wrapLines = (ctx, text, maxWidth) => {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let line = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const next = `${line} ${words[i]}`;
    if (ctx.measureText(next).width <= maxWidth) line = next;
    else { lines.push(line); line = words[i]; }
  }
  lines.push(line);
  return lines.slice(0, 2);
};

/**
 * Draw the ticket onto a canvas, deterministically.
 *
 * This used to capture a DOM element with html2canvas, which meant the output
 * depended on the page the element happened to be sitting in: a zoom or a
 * transform on any ancestor scaled what was painted without changing the
 * element's declared 800x260, and the capture — a box measured in root pixels
 * — kept only part of it, losing the date/time/venue column and the bottom
 * edge. Canvas drawing has no layout, no ancestors and no viewport, so the
 * result is identical on every browser, zoom level and device.
 */
export const renderTicketCanvas = async (model) => {
  const [background, qr] = await Promise.all([
    loadImage(model.backgroundUrl),
    loadImage(model.qrDataUrl),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = TICKET_WIDTH * CAPTURE_SCALE;
  canvas.height = TICKET_HEIGHT * CAPTURE_SCALE;
  const ctx = canvas.getContext('2d');

  ctx.scale(CAPTURE_SCALE, CAPTURE_SCALE);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, TICKET_WIDTH, TICKET_HEIGHT);
  if (background) ctx.drawImage(background, 0, 0, TICKET_WIDTH, TICKET_HEIGHT);

  ctx.textBaseline = 'top';
  try { ctx.letterSpacing = '0.2px'; } catch (_err) { /* older engines */ }

  ctx.fillStyle = ACCENT;
  ctx.font = `bold 15px ${FONT}`;
  COLONS.forEach(({ x, y }) => ctx.fillText(':', x, y + TEXT_TOP_NUDGE));

  ctx.fillStyle = INK;
  FIELDS.forEach(({ key, x, y, size, maxWidth }) => {
    const value = model[key];
    if (value === undefined || value === null || value === '') return;
    ctx.font = `400 ${size}px ${FONT}`;
    wrapLines(ctx, value, maxWidth).forEach((line, i) => {
      ctx.fillText(line, x, y + TEXT_TOP_NUDGE + i * size * 1.2);
    });
  });

  if (qr) ctx.drawImage(qr, QR_BOX.x, QR_BOX.y, QR_BOX.size, QR_BOX.size);

  return canvas;
};

/** The eight values the ticket shows, from a booking row. */
export const buildTicketModel = ({ bookingCode, title, persons, seats, date, venue, qrDataUrl, backgroundUrl }) => {
  const when = date ? new Date(date) : null;
  const valid = when && !Number.isNaN(when.getTime());
  let seatText = 'N/A';
  try {
    const parsed = typeof seats === 'string' ? JSON.parse(seats) : seats;
    if (Array.isArray(parsed) && parsed.length) seatText = parsed.map(String).join(', ');
  } catch (_err) { /* leave as N/A */ }

  return {
    bookingCode: String(bookingCode ?? ''),
    title: String(title ?? ''),
    persons: String(persons ?? 1),
    seats: seatText,
    weekday: valid ? when.toLocaleDateString('en-IN', { weekday: 'long' }).toUpperCase() : 'N/A',
    dateText: valid ? when.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '',
    time: valid ? when.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
    venue: String(venue || 'N/A'),
    qrDataUrl,
    backgroundUrl,
  };
};

/**
 * Put the ticket on a page that is exactly its own shape.
 *
 *  - the page height comes from the canvas and is never clamped. It used to be
 *    clamped to A4 while the image was still drawn at full height, cutting off
 *    anything taller than the page.
 *  - the orientation comes from the page shape. jsPDF swaps width and height
 *    when the orientation disagrees with the format, which puts the image on a
 *    page narrower than itself and crops the right edge.
 */
export const ticketCanvasToPdf = (canvas) => {
  const pageWidth = 210; // mm, A4 width
  const pageHeight = (canvas.height * pageWidth) / canvas.width;

  const pdf = new jsPDF({
    orientation: pageWidth >= pageHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageWidth, pageHeight],
  });

  pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
  return pdf;
};
