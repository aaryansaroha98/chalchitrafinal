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
const EXPECTED_W = TICKET_WIDTH * CAPTURE_SCALE;
const EXPECTED_H = TICKET_HEIGHT * CAPTURE_SCALE;

// Some engines refuse document.write into a detached iframe, or report the
// body as zero-sized before first paint. Rather than hand back a wrong-sized
// capture, say so and let the caller fall back.
const isSound = (canvas) =>
  !!canvas && Math.abs(canvas.width - EXPECTED_W) <= 2 && Math.abs(canvas.height - EXPECTED_H) <= 2;

const captureInIframe = async (ticketHTML) => {
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

/* Last resort: the pre-iframe approach, kept only for engines where the
   iframe surface does not work. It is vulnerable to an ancestor zoom, so the
   element is measured and the factor divided back out of the scale. */
const captureInPage = async (ticketHTML) => {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = `position:fixed;top:0;left:-10000px;width:${TICKET_WIDTH}px;height:${TICKET_HEIGHT}px;`
    + 'margin:0;padding:0;background:#ffffff;overflow:hidden;zoom:1;transform:none;';
  host.innerHTML = ticketHTML;
  document.body.appendChild(host);
  try {
    await waitForImages(host);
    await new Promise((resolve) => setTimeout(resolve, 350));
    const measured = host.getBoundingClientRect().width / TICKET_WIDTH;
    const zoom = Number.isFinite(measured) && measured > 0.1 && measured < 10 ? measured : 1;
    return await html2canvas(host, {
      scale: CAPTURE_SCALE / zoom,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: TICKET_WIDTH * zoom,
      height: TICKET_HEIGHT * zoom,
      windowWidth: TICKET_WIDTH * zoom,
      windowHeight: TICKET_HEIGHT * zoom,
      scrollX: 0,
      scrollY: 0,
      imageTimeout: 10000,
      removeContainer: false,
      foreignObjectRendering: false,
    });
  } finally {
    if (host.parentNode) host.parentNode.removeChild(host);
  }
};

export const captureTicketCanvas = async (ticketHTML) => {
  let canvas = null;
  try {
    canvas = await captureInIframe(ticketHTML);
  } catch (err) {
    console.warn('Ticket iframe capture failed, falling back:', err && err.message);
  }
  if (isSound(canvas)) return canvas;

  console.warn(
    'Ticket capture was',
    canvas ? `${canvas.width}x${canvas.height}` : 'unavailable',
    `- expected ${EXPECTED_W}x${EXPECTED_H}; retrying in the page.`
  );
  const fallback = await captureInPage(ticketHTML);
  if (!isSound(fallback)) {
    console.warn('Ticket fallback capture is also off-size:', fallback.width + 'x' + fallback.height);
  }
  return fallback;
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
