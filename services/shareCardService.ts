interface ShareCardInput {
  title: string;
  subtitle: string;
  streak: number;
  xp: number;
  badge?: string;
}

const loadFont = async () => {
  if (!('fonts' in document)) {
    return;
  }
  const face = new FontFace(
    'Space Grotesk',
    'url(https://fonts.gstatic.com/s/spacegrotesk/v16/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.woff2)'
  );
  await face.load();
  (document as any).fonts.add(face);
};

export const generateShareCardDataUrl = async (input: ShareCardInput): Promise<string> => {
  await loadFont();

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context unavailable.');
  }

  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, '#052e16');
  gradient.addColorStop(0.5, '#0c4a6e');
  gradient.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  for (let i = 0; i < 24; i += 1) {
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 70 + 30, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#ecfeff';
  ctx.font = '700 58px "Space Grotesk", sans-serif';
  ctx.fillText('Pythonic Win', 68, 118);
  ctx.font = '700 50px "Space Grotesk", sans-serif';
  ctx.fillText(input.title, 68, 208);

  ctx.font = '500 30px "Space Grotesk", sans-serif';
  ctx.fillStyle = '#a5f3fc';
  ctx.fillText(input.subtitle, 68, 258);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 32px "Space Grotesk", sans-serif';
  ctx.fillText(`Streak: ${input.streak} days`, 68, 362);
  ctx.fillText(`Total XP: ${input.xp}`, 68, 414);
  if (input.badge) {
    ctx.fillText(`Badge: ${input.badge}`, 68, 466);
  }

  ctx.fillStyle = '#d1fae5';
  ctx.font = '600 26px "Space Grotesk", sans-serif';
  ctx.fillText('Built in Pythonic', 68, 560);

  return canvas.toDataURL('image/png');
};

export const downloadDataUrl = (dataUrl: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
};

