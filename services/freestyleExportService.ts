export const outputToImage = async (title: string, output: string): Promise<string> => {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context unavailable.');
  }

  const gradient = ctx.createLinearGradient(0, 0, 1000, 720);
  gradient.addColorStop(0, '#172554');
  gradient.addColorStop(1, '#14532d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#bbf7d0';
  ctx.font = '700 42px "Courier New", monospace';
  ctx.fillText(title, 40, 70);

  ctx.fillStyle = '#dcfce7';
  ctx.font = '500 24px "Courier New", monospace';
  const lines = output.split('\n').slice(0, 24);
  lines.forEach((line, i) => ctx.fillText(line, 40, 130 + i * 24));

  return canvas.toDataURL('image/png');
};

