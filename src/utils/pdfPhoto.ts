const PHOTO_SRC = '/lucas-golf-photo.png';
const RENDER_PX = 360;
const PX_TO_MM = 25.4 / 96;

export const PDF_PHOTO_SIZE_PX = 180;
export const PDF_PHOTO_TOP_PX = 24;
export const PDF_PHOTO_RIGHT_PX = 52;
export const PDF_PHOTO_SIZE_MM = PDF_PHOTO_SIZE_PX * PX_TO_MM;
export const PDF_PHOTO_TOP_MM = PDF_PHOTO_TOP_PX * PX_TO_MM;
export const PDF_PHOTO_RIGHT_MM = PDF_PHOTO_RIGHT_PX * PX_TO_MM;

/** Pan source image right inside the circle to reveal the subject's hands on the left. */
const PHOTO_PAN_X = 0.14;

function renderCircularPhotoDataUrl(img: HTMLImageElement, pixelSize: number): string | null {
  const canvas = document.createElement('canvas');
  canvas.width = pixelSize;
  canvas.height = pixelSize;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return null;

  const cx = pixelSize / 2;
  const cy = pixelSize / 2;
  const radius = pixelSize / 2 - 1;

  ctx.clearRect(0, 0, pixelSize, pixelSize);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const scale = Math.max(pixelSize / img.naturalWidth, pixelSize / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const panX = pixelSize * PHOTO_PAN_X;
  ctx.drawImage(img, (pixelSize - w) / 2 + panX, (pixelSize - h) / 2, w, h);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 1.5, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  return canvas.toDataURL('image/png');
}

export async function loadCircularPhoto(
  src: string = PHOTO_SRC,
  pixelSize: number = RENDER_PX,
): Promise<string | null> {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;';

  const img = document.createElement('img');
  img.className = 'pdf-player-photo';
  img.src = src;
  img.alt = '';
  wrapper.appendChild(img);
  document.body.appendChild(wrapper);

  try {
    await new Promise<void>((resolve, reject) => {
      if (img.complete && img.naturalWidth > 0) {
        resolve();
        return;
      }
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load photo: ${src}`));
    });

    return renderCircularPhotoDataUrl(img, pixelSize);
  } catch {
    return null;
  } finally {
    wrapper.remove();
  }
}

export function drawCircularPhoto(
  doc: import('jspdf').jsPDF,
  photoDataUrl: string,
  pageW: number,
  y: number = PDF_PHOTO_TOP_MM,
  sizeMm: number = PDF_PHOTO_SIZE_MM,
): void {
  const x = pageW - PDF_PHOTO_RIGHT_MM - sizeMm;
  doc.addImage(photoDataUrl, 'PNG', x, y, sizeMm, sizeMm);
}

export function drawPhotoOnAllPages(
  doc: import('jspdf').jsPDF,
  photoDataUrl: string,
  pageW: number,
): void {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawCircularPhoto(doc, photoDataUrl, pageW);
  }
}
