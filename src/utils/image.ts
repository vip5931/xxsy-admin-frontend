export interface ImagePreviewFile {
  file: File;
  url: string;
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas toBlob failed'));
          return;
        }
        resolve(blob);
      },
      type || 'image/png',
      0.92,
    );
  });
}

export async function splitImageIntoFive(file: File): Promise<File[]> {
  const img = await loadImage(file);
  const { width, height } = img;
  const chunkHeight = Math.floor(height / 5);
  const files: File[] = [];

  for (let i = 0; i < 5; i++) {
    const startY = i * chunkHeight;
    const currentHeight = i === 4 ? height - startY : chunkHeight;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = currentHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, startY, width, currentHeight, 0, 0, width, currentHeight);
    const blob = await canvasToBlob(canvas, file.type);
    const dotIdx = file.name.lastIndexOf('.');
    const base = dotIdx > 0 ? file.name.slice(0, dotIdx) : file.name;
    const ext = dotIdx > 0 ? file.name.slice(dotIdx) : '.png';
    files.push(
      new File([blob], `${base}_part_${i + 1}${ext}`, {
        type: blob.type || file.type || 'image/png',
      }),
    );
  }
  return files;
}
