import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// The ticket artwork is a fixed 800x260 design drawn over /misc/ticc.png.
export const TICKET_WIDTH = 800;
export const TICKET_HEIGHT = 260;

// Output canvas is TICKET_WIDTH * CAPTURE_SCALE wide, whatever the page zoom.
const CAPTURE_SCALE = 2;

/**
 * Capture the off-screen ticket element to a canvas.
 *
 * windowWidth/windowHeight are pinned deliberately. Left to default,
 * html2canvas lays its clone out in a viewport the size of the real browser
 * window, so a narrow or zoomed window can lay the 800px-wide ticket out in
 * less space and clip the right-hand column (date, time, venue) out of the
 * capture entirely.
 */
export const captureTicketCanvas = (ticketElement) => {
  // How large is the ticket ACTUALLY drawn? A CSS zoom or a transform on any
  // ancestor scales it without changing its declared 800x260, so the element
  // can occupy 1000 root pixels while still measuring 800 in its own layout.
  // html2canvas captures a box in root pixels, so telling it 800 there grabs
  // the left 80% and silently drops the date/time/venue column.
  const rect = ticketElement.getBoundingClientRect();
  const measured = rect.width / TICKET_WIDTH;
  const zoom = Number.isFinite(measured) && measured > 0.1 && measured < 10 ? measured : 1;

  return html2canvas(ticketElement, {
    // Cancel the zoom in the scale so the canvas is the same 1600x520
    // whatever the page is doing.
    scale: CAPTURE_SCALE / zoom,
    useCORS: true,
    allowTaint: true,
    // An html2canvas option, parsed by the library itself — never a CSS
    // custom property, which it has no stylesheet to resolve.
    backgroundColor: '#ffffff',
    logging: false,
    width: TICKET_WIDTH * zoom,
    height: TICKET_HEIGHT * zoom,
    // Pin the layout viewport to the ticket. Left to default, html2canvas
    // lays its clone out in a viewport the size of the real browser window,
    // so a narrow window can lay the ticket out smaller and clip it.
    windowWidth: TICKET_WIDTH * zoom,
    windowHeight: TICKET_HEIGHT * zoom,
    scrollX: 0,
    scrollY: 0,
    imageTimeout: 10000,
    removeContainer: false,
    foreignObjectRendering: false,
  });
};

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
