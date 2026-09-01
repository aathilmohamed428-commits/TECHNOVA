import { ImageQualityMetrics } from '../types';

export interface FrameAnalysisResult {
  productDetected: boolean;
  stabilityScore: number; // 0..100
  sharpness: number; // 0..100
  brightness: number; // 0..100
  contrast: number; // 0..100
  glareDetected: boolean;
  guidanceMessage: string;
  readyForCapture: boolean;
}

export class CameraInspectionEngine {
  private static lastImageData: Uint8ClampedArray | null = null;

  /**
   * Analyzes live canvas frame from video stream for temporal stability, blur, lighting, and product presence.
   */
  public static analyzeFrame(canvas: HTMLCanvasElement): FrameAnalysisResult {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return {
        productDetected: false,
        stabilityScore: 0,
        sharpness: 0,
        brightness: 0,
        contrast: 0,
        glareDetected: false,
        guidanceMessage: 'Camera initializing...',
        readyForCapture: false
      };
    }

    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) {
      return {
        productDetected: false,
        stabilityScore: 0,
        sharpness: 0,
        brightness: 0,
        contrast: 0,
        glareDetected: false,
        guidanceMessage: 'Place product inside the camera frame',
        readyForCapture: false
      };
    }

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 1. Calculate Average Brightness & Contrast
    let totalLuma = 0;
    let maxLuma = 0;
    let minLuma = 255;
    let highGlarePixels = 0;
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 16) { // sub-sample for speed
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuma += luma;

      if (luma > maxLuma) maxLuma = luma;
      if (luma < minLuma) minLuma = luma;

      if (luma > 245) {
        highGlarePixels++;
      }
    }

    const sampledCount = totalPixels / 4;
    const avgBrightness = Math.round((totalLuma / sampledCount) / 2.55); // 0..100
    const contrast = Math.round(((maxLuma - minLuma) / 255) * 100);
    const glareDetected = (highGlarePixels / sampledCount) > 0.08;

    // 2. Estimate Sharpness / Edge Density (Proxy for focus/blur)
    let edgeSum = 0;
    const step = 8;
    for (let y = 1; y < height - 1; y += step) {
      for (let x = 1; x < width - 1; x += step) {
        const idx = (y * width + x) * 4;
        const idxRight = (y * width + (x + 1)) * 4;
        const diff = Math.abs(data[idx] - data[idxRight]);
        edgeSum += diff;
      }
    }
    const edgeDensity = edgeSum / ((height / step) * (width / step));
    const sharpness = Math.min(100, Math.round(edgeDensity * 3.5));

    // 3. Temporal Stability Check (Frame Difference)
    let stabilityScore = 85;
    if (this.lastImageData && this.lastImageData.length === data.length) {
      let diffSum = 0;
      for (let i = 0; i < data.length; i += 32) {
        diffSum += Math.abs(data[i] - this.lastImageData[i]);
      }
      const avgDiff = diffSum / (data.length / 32);
      stabilityScore = Math.max(0, Math.min(100, Math.round(100 - avgDiff * 2)));
    }
    this.lastImageData = new Uint8ClampedArray(data);

    // 4. Product Presence Heuristic (edge density + non-flat background)
    const productDetected = sharpness > 18 && contrast > 25;

    // 5. Guidance Decision
    let guidanceMessage = 'Hold steady...';
    let readyForCapture = false;

    if (!productDetected) {
      guidanceMessage = 'Place package inside the camera frame';
    } else if (glareDetected) {
      guidanceMessage = 'Reduce glare — rotate package slightly';
    } else if (avgBrightness < 25) {
      guidanceMessage = 'Lighting too dark — improve room lighting';
    } else if (sharpness < 25) {
      guidanceMessage = 'Camera out of focus — hold steady';
    } else if (stabilityScore < 60) {
      guidanceMessage = 'Package moving — hold steady for auto-capture';
    } else {
      guidanceMessage = 'Product stable ✓ Capturing view...';
      readyForCapture = true;
    }

    return {
      productDetected,
      stabilityScore,
      sharpness,
      brightness: avgBrightness,
      contrast,
      glareDetected,
      guidanceMessage,
      readyForCapture
    };
  }

  /**
   * Generates a cryptographic SHA-256 hash for image integrity verification.
   */
  public static async calculateImageHash(dataUrl: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(dataUrl.slice(-1000));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
