import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// The ticket artwork is a fixed 800x260 design drawn over /misc/ticc.png.
export const TICKET_WIDTH = 800;
export const TICKET_HEIGHT = 260;

// Output canvas is TICKET_WIDTH * CAPTURE_SCALE wide.
const CAPTURE_SCALE = 2;

const waitForImages = (root) => {
  const images = Array.from(root.querySelectorAll('img'));
  return Promise.all(images.map((img) => new Promise((resolve) => {
    if (img.complete && img.naturalHeight !== 0) return resolve();
    img.onload = () => resolve();
    img.onerror = () => { img.style.display = 'none'; resolve(); };
    setTimeout(resolve, 8000);
  })));
};

/**
 * Render the ticket HTML into a canvas.
 *
 * The ticket is rendered inside its own iframe rather than in the page. When
 * it lived in the page it inherited that page's layout context, and a CSS
 * zoom or a transform anywhere in the ancestor chain scaled what was painted
 * without changing the element's declared 800x260. html2canvas captures a box
 * measured in root pixels, so the ticket could be painted larger than the box
 * being captured and lose its right-hand column — the date, time and venue —
 * along with its bottom edge. Nothing about the host page reaches inside an
 * iframe, so the capture is the same everywhere: any zoom level, any device
 * pixel ratio, any window size, skin on or off.
 */
export const captureTicketCanvas = async (ticketHTML) => {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('title', 'ticket render surface');
  frame.style.cssText = [
    'position:fixed', 'top:0', 'left:-10000px',
    `width:${TICKET_WIDTH}px`, `height:${TICKET_HEIGHT}px`,
    'border:0', 'margin:0', 'padding:0', 'opacity:0', 'pointer-events:none',
  ].join(';');
  document.body.appendChild(frame);

  try {
    const doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
    if (!doc) throw new Error('Could not open a render surface for the ticket');

    doc.open();
    doc.write(
      '<!doctype html><html><head><meta charset="utf-8"><style>'
      + 'html,body{margin:0;padding:0;border:0;'
      + `width:${TICKET_WIDTH}px;height:${TICKET_HEIGHT}px;`
      + 'overflow:hidden;background:#ffffff;'
      + '-webkit-text-size-adjust:100%;text-size-adjust:100%}'
      + '</style></head><body>' + ticketHTML + '</body></html>'
    );
    doc.close();

    await waitForImages(doc);
    // one frame for layout to settle before the capture
    await new Promise((resolve) => setTimeout(resolve, 350));

    return await html2canvas(doc.body, {
      scale: CAPTURE_SCALE,
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
  } finally {
    if (frame.parentNode) frame.parentNode.removeChild(frame);
  }
};

/**
 * Put the captured ticket on a page that is exactly its own shape.
 *
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
