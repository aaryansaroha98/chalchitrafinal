import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// The ticket artwork is a fixed 800x260 design drawn over /misc/ticc.png.
export const TICKET_WIDTH = 800;
export const TICKET_HEIGHT = 260;

/**
 * Capture the off-screen ticket element to a canvas.
 *
 * windowWidth/windowHeight are pinned deliberately. Left to default,
 * html2canvas lays its clone out in a viewport the size of the real browser
 * window, so a narrow or zoomed window can lay the 800px-wide ticket out in
 * less space and clip the right-hand column (date, time, venue) out of the
 * capture entirely.
 */
export const captureTicketCanvas = (ticketElement) =>
  html2canvas(ticketElement, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    // An html2canvas option, parsed by the library itself — never a CSS
    // custom property, which it has no stylesheet to resolve.
    backgroundColor: '#ffffff',
    logging: false,
    width: TICKET_WIDTH,
    height: TICKET_HEIGHT,
    windowWidth: TICKET_WIDTH,
    windowHeight: TICKET_HEIGHT,
    scrollX: 0,
    scrollY: 0,
    imageTimeout: 10000,
    removeContainer: false,
    foreignObjectRendering: false,
  });

/**
 * Put the captured ticket on a page that is exactly its own shape.
 *
 * Two things here are load-bearing:
 *  - the page height is derived from the canvas and never clamped. The old
 *    code clamped the page to A4 (297mm) while still drawing the image at its
 *    full height, so anything taller than the page was cut off the bottom.
 *  - the orientation is derived from the page shape. jsPDF silently swaps
 *    width and height when the orientation disagrees with the format, which
 *    lands the image on a page narrower than itself and crops the right edge.
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
