import { createWorker } from 'tesseract.js';
import { BoundingBox } from '../types';

export interface OCRLineResult {
  text: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface OCRRawOutput {
  fullText: string;
  confidence: number;
  lines: OCRLineResult[];
}

export class OCRService {
  private static workerPromise: Promise<any> | null = null;

  public static async getWorker() {
    if (!this.workerPromise) {
      this.workerPromise = (async () => {
        const worker = await createWorker('eng');
        return worker;
      })();
    }
    return this.workerPromise;
  }

  /**
   * Preprocess canvas to improve contrast and readability for OCR
   */
  public static preprocessImage(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Apply contrast boost and simple grayscale
        const contrast = 1.2; // 20% contrast boost
        const intercept = 128 * (1 - contrast);

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;
          gray = contrast * gray + intercept;
          gray = Math.max(0, Math.min(255, gray));

          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  public static async recognizeImage(dataUrl: string): Promise<OCRRawOutput> {
    try {
      const processedUrl = await this.preprocessImage(dataUrl);
      const worker = await this.getWorker();
      const ret = await worker.recognize(processedUrl);

      const imgWidth = ret.data.image_width || 1000;
      const imgHeight = ret.data.image_height || 1000;

      const lines: OCRLineResult[] = (ret.data.lines || []).map((line: any) => {
        const bbox = line.bbox || { x0: 0, y0: 0, x1: 100, y1: 100 };
        return {
          text: line.text.trim(),
          confidence: line.confidence || 80,
          bbox: {
            x: Math.round((bbox.x0 / imgWidth) * 100),
            y: Math.round((bbox.y0 / imgHeight) * 100),
            w: Math.round(((bbox.x1 - bbox.x0) / imgWidth) * 100),
            h: Math.round(((bbox.y1 - bbox.y0) / imgHeight) * 100)
          }
        };
      }).filter((l: OCRLineResult) => l.text.length > 0);

      return {
        fullText: ret.data.text || '',
        confidence: ret.data.confidence || 75,
        lines
      };
    } catch (err) {
      console.warn('OCR error, returning structured fallback recognition:', err);
      return {
        fullText: '',
        confidence: 0,
        lines: []
      };
    }
  }
}
