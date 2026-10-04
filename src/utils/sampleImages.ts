import { UploadedImage } from '../types';

/**
 * Creates high resolution canvas-based realistic demo images for instant one-click testing
 */
export function createSampleImages(): UploadedImage[] {
  const samples: UploadedImage[] = [];

  // Sample 1: Arquitectura Moderna (Minimalist Building)
  const c1 = document.createElement('canvas');
  c1.width = 1200;
  c1.height = 900;
  const ctx1 = c1.getContext('2d')!;
  
  // Sky gradient
  const grad1 = ctx1.createLinearGradient(0, 0, 0, 900);
  grad1.addColorStop(0, '#38BDF8');
  grad1.addColorStop(0.6, '#BAE6FD');
  grad1.addColorStop(1, '#F0F9FF');
  ctx1.fillStyle = grad1;
  ctx1.fillRect(0, 0, 1200, 900);

  // Geometric architecture building
  ctx1.fillStyle = '#0F172A';
  ctx1.beginPath();
  ctx1.moveTo(250, 900);
  ctx1.lineTo(250, 280);
  ctx1.lineTo(650, 140);
  ctx1.lineTo(950, 320);
  ctx1.lineTo(950, 900);
  ctx1.closePath();
  ctx1.fill();

  // Glass facade panels
  ctx1.fillStyle = '#38BDF8';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 6; c++) {
      const x = 320 + c * 90;
      const y = 320 + r * 65;
      if (x < 880 && y < 850) {
        ctx1.fillStyle = (r + c) % 2 === 0 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.25)';
        ctx1.fillRect(x, y, 70, 48);
      }
    }
  }

  // Label banner on image
  ctx1.fillStyle = '#FFFFFF';
  ctx1.font = 'bold 36px sans-serif';
  ctx1.fillText('CENTRO CULTURAL METROPOLIS', 320, 840);
  const dataUrl1 = c1.toDataURL('image/jpeg', 0.95);

  samples.push({
    id: 'sample_arch_1',
    name: 'fachada_metropolis.jpg',
    type: 'image/jpeg',
    size: 245000,
    originalUrl: dataUrl1,
    previewUrl: dataUrl1,
    width: 1200,
    height: 900,
    rotation: 0,
    flipH: false,
    flipV: false,
    fit: 'contain',
    filter: 'none',
    brightness: 0,
    contrast: 0,
    saturation: 100,
    title: 'Edificio Metrópolis · Vista Principal',
    caption: 'Fachada acristalada con estructura de celosía geométrica y orientación solar norte.',
  });

  // Sample 2: Documento / Factura Escaneada
  const c2 = document.createElement('canvas');
  c2.width = 900;
  c2.height = 1200;
  const ctx2 = c2.getContext('2d')!;

  // Paper texture
  ctx2.fillStyle = '#F8FAFC';
  ctx2.fillRect(0, 0, 900, 1200);

  // Invoice header
  ctx2.fillStyle = '#1E293B';
  ctx2.font = 'bold 34px sans-serif';
  ctx2.fillText('FACTURA COMERCIAL #2026-084', 70, 120);

  ctx2.fillStyle = '#64748B';
  ctx2.font = '18px sans-serif';
  ctx2.fillText('EMISIÓN: 12 de Marzo de 2026 · VENCIMIENTO: 12 de Abril de 2026', 70, 160);

  // Line
  ctx2.strokeStyle = '#CBD5E1';
  ctx2.lineWidth = 2;
  ctx2.beginPath();
  ctx2.moveTo(70, 190);
  ctx2.lineTo(830, 190);
  ctx2.stroke();

  // Table header
  ctx2.fillStyle = '#0F172A';
  ctx2.fillRect(70, 220, 760, 48);
  ctx2.fillStyle = '#FFFFFF';
  ctx2.font = 'bold 16px sans-serif';
  ctx2.fillText('CONCEPTO / DESCRIPCIÓN', 90, 250);
  ctx2.fillText('CANTIDAD', 540, 250);
  ctx2.fillText('IMPORTE', 720, 250);

  // Rows
  const rows = [
    { desc: 'Auditoría técnica de sistemas y nube', qty: '1', price: '$1,850.00' },
    { desc: 'Desarrollo de módulos de exportación PDF', qty: '32h', price: '$2,400.00' },
    { desc: 'Certificación de seguridad y cifrado', qty: '1', price: '$650.00' },
    { desc: 'Soporte y mantenimiento preventivo', qty: '3m', price: '$900.00' },
  ];

  ctx2.fillStyle = '#1E293B';
  ctx2.font = '16px sans-serif';
  rows.forEach((r, idx) => {
    const y = 310 + idx * 55;
    ctx2.fillText(r.desc, 90, y);
    ctx2.fillText(r.qty, 560, y);
    ctx2.fillText(r.price, 720, y);

    ctx2.strokeStyle = '#E2E8F0';
    ctx2.lineWidth = 1;
    ctx2.beginPath();
    ctx2.moveTo(70, y + 20);
    ctx2.lineTo(830, y + 20);
    ctx2.stroke();
  });

  // Total
  ctx2.fillStyle = '#0F172A';
  ctx2.font = 'bold 22px sans-serif';
  ctx2.fillText('TOTAL FACTURA: $5,800.00 USD', 480, 580);

  // Stamp badge
  ctx2.save();
  ctx2.translate(650, 750);
  ctx2.rotate(-0.15);
  ctx2.strokeStyle = '#16A34A';
  ctx2.lineWidth = 4;
  ctx2.strokeRect(-120, -40, 240, 80);
  ctx2.fillStyle = '#16A34A';
  ctx2.font = 'bold 24px sans-serif';
  ctx2.textAlign = 'center';
  ctx2.fillText('PAGADO / APROBADO', 0, 10);
  ctx2.restore();

  const dataUrl2 = c2.toDataURL('image/jpeg', 0.95);

  samples.push({
    id: 'sample_doc_2',
    name: 'comprobante_factura_84.png',
    type: 'image/png',
    size: 310000,
    originalUrl: dataUrl2,
    previewUrl: dataUrl2,
    width: 900,
    height: 1200,
    rotation: 0,
    flipH: false,
    flipV: false,
    fit: 'contain',
    filter: 'none',
    brightness: 0,
    contrast: 0,
    saturation: 100,
    title: 'Comprobante de Pago y Facturación',
    caption: 'Copia oficial timbrada y liquidada correspondiente al primer trimestre.',
  });

  // Sample 3: Paisaje Natural / Fotografía Artística
  const c3 = document.createElement('canvas');
  c3.width = 1200;
  c3.height = 800;
  const ctx3 = c3.getContext('2d')!;

  // Sunset gradient
  const grad3 = ctx3.createLinearGradient(0, 0, 0, 800);
  grad3.addColorStop(0, '#1E1B4B');
  grad3.addColorStop(0.35, '#831843');
  grad3.addColorStop(0.65, '#EA580C');
  grad3.addColorStop(0.9, '#FDE047');
  grad3.addColorStop(1, '#FEF08A');
  ctx3.fillStyle = grad3;
  ctx3.fillRect(0, 0, 1200, 800);

  // Sun
  ctx3.fillStyle = '#FFFBEB';
  ctx3.beginPath();
  ctx3.arc(600, 480, 75, 0, Math.PI * 2);
  ctx3.fill();

  // Mountain silhouettes
  ctx3.fillStyle = '#31102A';
  ctx3.beginPath();
  ctx3.moveTo(0, 800);
  ctx3.lineTo(0, 550);
  ctx3.lineTo(350, 360);
  ctx3.lineTo(680, 520);
  ctx3.lineTo(980, 340);
  ctx3.lineTo(1200, 480);
  ctx3.lineTo(1200, 800);
  ctx3.closePath();
  ctx3.fill();

  // Foreground hills
  ctx3.fillStyle = '#0F051D';
  ctx3.beginPath();
  ctx3.moveTo(0, 800);
  ctx3.lineTo(0, 680);
  ctx3.bezierCurveTo(300, 580, 500, 720, 800, 630);
  ctx3.bezierCurveTo(950, 580, 1100, 690, 1200, 650);
  ctx3.lineTo(1200, 800);
  ctx3.closePath();
  ctx3.fill();

  const dataUrl3 = c3.toDataURL('image/jpeg', 0.95);

  samples.push({
    id: 'sample_nature_3',
    name: 'atardecer_cordillera.webp',
    type: 'image/webp',
    size: 215000,
    originalUrl: dataUrl3,
    previewUrl: dataUrl3,
    width: 1200,
    height: 800,
    rotation: 0,
    flipH: false,
    flipV: false,
    fit: 'contain',
    filter: 'none',
    brightness: 0,
    contrast: 0,
    saturation: 100,
    title: 'Cordillera de los Andes al Atardecer',
    caption: 'Fotografía panorámica capturada durante la hora dorada en alta montaña.',
  });

  return samples;
}
