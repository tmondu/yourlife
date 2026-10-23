import imageCompression from 'browser-image-compression';
import { getPresignedUrl, uploadToR2, uploadDirect } from './api';

export const compressAndUpload = async (
  file: File,
  token: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // 1. Nén ảnh về max 200KB
  onProgress?.(10);
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    onProgress: (p) => onProgress?.(10 + p * 0.5),
  });

  // 2. Thử upload trực tiếp qua R2 presigned URL
  try {
    onProgress?.(60);
    const { presignedUrl, publicUrl } = await getPresignedUrl(token, compressed.type, file.name);

    onProgress?.(70);
    await uploadToR2(presignedUrl, compressed);
    onProgress?.(100);

    return publicUrl;
  } catch (err) {
    // Nếu upload presigned bị chặn bởi CORS trình duyệt, tự động fallback sang direct upload qua backend
    console.warn('Presigned upload failed (likely R2 CORS), falling back to direct upload via backend:', err);
    onProgress?.(75);
    const { publicUrl } = await uploadDirect(token, compressed, file.name);
    onProgress?.(100);
    return publicUrl;
  }
};

// Format date in Vietnamese
export const formatDateVi = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = days[date.getDay()];
  return `${dayName}, ${date.getDate()} tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
};

export const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return `${date.getDate()}/${date.getMonth() + 1}`;
};

export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getCurrentMonth = (): string => {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
};

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
