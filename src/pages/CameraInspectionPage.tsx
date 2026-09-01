import React, { useState, useEffect, useRef } from 'react';
import { CameraInspectionEngine, FrameAnalysisResult } from '../services/cameraService';
import { OCRService } from '../services/ocrService';
import { DeclarationParserService } from '../services/declarationService';
import { LegalRuleEngine } from '../services/ruleEngine';
import { db } from '../db/database';
import { DEFAULT_INSPECTOR } from '../services/seedData';
import { CapturedEvidenceImage, InspectionRecord, ExtractedDeclaration } from '../types';
import { Camera, CheckCircle2, RotateCw, ShieldCheck, RefreshCw, Sparkles, Play, Upload, FileImage, Trash2, Layers } from 'lucide-react';

interface CameraInspectionPageProps {
  onCompleteInspection: (inspection: InspectionRecord) => void;
  onCancel: () => void;
}

type InspectionInputMode = 'DATASET_UPLOAD' | 'LIVE_CAMERA';
type StepState = 'IDLE' | 'SCANNING_FRONT' | 'GUIDE_ROTATE' | 'SCANNING_BACK' | 'EVIDENCE_SUFFICIENT' | 'PROCESSING_OCR';

export const CameraInspectionPage: React.FC<CameraInspectionPageProps> = ({
  onCompleteInspection,
  onCancel
}) => {
  const [inputMode, setInputMode] = useState<InspectionInputMode>('DATASET_UPLOAD');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [testMode, setTestMode] = useState(false);

  const [step, setStep] = useState<StepState>('IDLE');
  const [analysis, setAnalysis] = useState<FrameAnalysisResult>({
    productDetected: false,
    stabilityScore: 0,
    sharpness: 0,
    brightness: 0,
    contrast: 0,
    glareDetected: false,
    guidanceMessage: 'Ready to process dataset or live camera...',
    readyForCapture: false
  });

  const [capturedImages, setCapturedImages] = useState<CapturedEvidenceImage[]>([]);
  const [ocrProgressText, setOcrProgressText] = useState('');
  const [stableCount, setStableCount] = useState(0);

  // Initialize Live Camera if in Camera mode
  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;

    if (inputMode === 'LIVE_CAMERA') {
      async function setupCamera() {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
          });
          if (active && videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            setStreamActive(true);
            setStep('SCANNING_FRONT');
          }
        } catch (err: any) {
          console.warn('Camera access error:', err);
          setTestMode(true);
          setStep('SCANNING_FRONT');
        }
      }
      setupCamera();
    } else {
      setStreamActive(false);
    }

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [inputMode]);

  // Frame Analysis Loop for Camera Mode
  useEffect(() => {
    if (inputMode !== 'LIVE_CAMERA') return;

    let animationFrameId: number;
    const tick = () => {
      if (videoRef.current && canvasRef.current && (streamActive || testMode)) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const result = CameraInspectionEngine.analyzeFrame(canvas);
          setAnalysis(result);

          if (result.readyForCapture && (step === 'SCANNING_FRONT' || step === 'SCANNING_BACK')) {
            setStableCount(prev => {
              const next = prev + 1;
              if (next >= 5) {
                performAutoCapture(canvas, step === 'SCANNING_FRONT' ? 'FRONT' : 'BACK');
                return 0;
              }
              return next;
            });
          } else {
            setStableCount(0);
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [streamActive, testMode, step, inputMode]);

  const performAutoCapture = async (canvas: HTMLCanvasElement, viewName: 'FRONT' | 'BACK') => {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const hash = await CameraInspectionEngine.calculateImageHash(dataUrl);

    const newImg: CapturedEvidenceImage = {
      id: `img-${Date.now()}-${viewName}`,
      inspectionId: 'temp',
      viewName,
      dataUrl,
      timestamp: new Date().toISOString(),
      quality: {
        sharpness: analysis.sharpness,
        brightness: analysis.brightness,
        contrast: analysis.contrast,
        glareDetected: analysis.glareDetected,
        stabilityScore: analysis.stabilityScore,
        acceptable: true
      },
      hash
    };

    setCapturedImages(prev => [...prev, newImg]);

    if (viewName === 'FRONT') {
      setStep('GUIDE_ROTATE');
    } else {
      setStep('EVIDENCE_SUFFICIENT');
    }
  };

  // Dataset Image File Upload Handler
  const handleDatasetFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newUploaded: CapturedEvidenceImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const dataUrl = await readFileAsDataURL(file);
      const hash = await CameraInspectionEngine.calculateImageHash(dataUrl);

      const viewName: 'FRONT' | 'BACK' | 'SIDE_LEFT' | 'LABEL_ZOOM' =
        i === 0 ? 'FRONT' : i === 1 ? 'BACK' : i === 2 ? 'SIDE_LEFT' : 'LABEL_ZOOM';

      newUploaded.push({
        id: `img-dataset-${Date.now()}-${i}`,
        inspectionId: 'temp',
        viewName,
        dataUrl,
        timestamp: new Date().toISOString(),
        quality: { sharpness: 92, brightness: 88, contrast: 90, glareDetected: false, stabilityScore: 100, acceptable: true },
        hash
      });
    }

    setCapturedImages(prev => [...prev, ...newUploaded]);
    setStep('EVIDENCE_SUFFICIENT');
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: string) => {
    setCapturedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleTestModeSample = async (sampleType: 'CHIPS' | 'OIL') => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 800, 600);

    if (sampleType === 'CHIPS') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(100, 50, 600, 500);
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 36px Inter';
      ctx.fillText('CRISPY POTATO CHIPS', 140, 120);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px Inter';
      ctx.fillText('Net Wt: 100 g', 140, 200);
      ctx.fillText('MRP ₹35.00 (Incl. of all taxes)', 140, 260);
      ctx.font = '20px Inter';
      ctx.fillText('Mfg Date: 02/2026', 140, 320);
      ctx.fillText('Mfr: Crispy Foods Pvt Ltd, Baddi H.P.', 140, 380);
      ctx.fillText('Consumer Care: 1800-111-222 | care@crispy.in', 140, 440);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(100, 50, 600, 500);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 36px Inter';
      ctx.fillText('PURE SUNFLOWER OIL', 140, 120);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px Inter';
      ctx.fillText('Net Vol: 1 L', 140, 200);
      ctx.fillText('MRP ₹165.00 (Incl. of all taxes)', 140, 260);
      ctx.font = '20px Inter';
      ctx.fillText('Mfg Date: 01/2026', 140, 320);
      ctx.fillText('Mfr: Pure Oils Ltd, Kandla Port, Gujarat', 140, 380);
      ctx.fillText('Consumer Care: care@pureoils.com', 140, 440);
    }

    const dataUrl = canvas.toDataURL('image/jpeg');
    const hash = await CameraInspectionEngine.calculateImageHash(dataUrl);

    const captured: CapturedEvidenceImage = {
      id: `img-${Date.now()}-TEST`,
      inspectionId: 'temp',
      viewName: capturedImages.length === 0 ? 'FRONT' : 'BACK',
      dataUrl,
      timestamp: new Date().toISOString(),
      quality: { sharpness: 95, brightness: 85, contrast: 90, glareDetected: false, stabilityScore: 100, acceptable: true },
      hash
    };

    setCapturedImages(prev => [...prev, captured]);
    if (capturedImages.length === 0) setStep('GUIDE_ROTATE');
    else setStep('EVIDENCE_SUFFICIENT');
  };

  const startAnalysisPipeline = async () => {
    if (capturedImages.length === 0) return;
    setStep('PROCESSING_OCR');
    setOcrProgressText('Initializing Tesseract OCR worker engine...');

    try {
      const allDeclarations: ExtractedDeclaration[] = [];

      for (let i = 0; i < capturedImages.length; i++) {
        const img = capturedImages[i];
        setOcrProgressText(`Performing OCR on Image View #${i + 1} (${img.viewName})...`);

        const ocrResult = await OCRService.recognizeImage(img.dataUrl);
        const parsed = DeclarationParserService.parseDeclarations(ocrResult, img.id);

        parsed.forEach((p) => {
          if (!allDeclarations.some(existing => existing.type === p.type && existing.status === 'DETECTED')) {
            allDeclarations.push(p);
          }
        });
      }

      setOcrProgressText('Executing Legal Metrology Rule Engine 2026.1...');
      const evaluations = LegalRuleEngine.evaluateDeclarations(allDeclarations);

      const hasFail = evaluations.some(e => e.result === 'FAIL');
      const hasReview = evaluations.some(e => e.result === 'REVIEW');
      const overallStatus = hasFail ? 'NON_COMPLIANT' : hasReview ? 'REVIEW_REQUIRED' : 'COMPLIANT';

      const inspNumber = `LMX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const newRecord: InspectionRecord = {
        id: `insp-${Date.now()}`,
        inspectionNumber: inspNumber,
        timestamp: new Date().toISOString(),
        inspectorId: DEFAULT_INSPECTOR.id,
        inspectorName: DEFAULT_INSPECTOR.name,
        location: 'Dataset Upload / Inspection Unit',
        productName: allDeclarations.find(d => d.type === 'PRODUCT_NAME')?.rawValue || 'Uploaded Commodity Dataset Item',
        brand: 'Uploaded Brand',
        manufacturer: allDeclarations.find(d => d.type === 'MANUFACTURER_NAME')?.rawValue || 'Manufacturer details detected on label',
        category: 'General Commodity',
        status: overallStatus,
        overallScore: Math.round((evaluations.filter(e => e.result === 'PASS').length / evaluations.length) * 100),
        images: capturedImages,
        declarations: allDeclarations,
        evaluations,
        decisions: [],
        evidenceIntegrityHash: capturedImages[0]?.hash || 'hash-val',
        digitalMarketplaceMismatch: {
          flagged: false
        }
      };

      await db.inspections.put(newRecord);
      onCompleteInspection(newRecord);
    } catch (err) {
      console.error('Pipeline error:', err);
      setOcrProgressText('Error during processing. Please try again.');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Controls & Input Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Package Inspection & Compliance Analysis</h2>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              LegalMetriX AI Engine
            </span>
          </div>
          <p className="text-xs text-slate-500">Upload package dataset images or stream live camera feed for automated OCR and rule checks.</p>
        </div>

        {/* Input Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setInputMode('DATASET_UPLOAD')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              inputMode === 'DATASET_UPLOAD' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Dataset File Upload</span>
          </button>

          <button
            onClick={() => setInputMode('LIVE_CAMERA')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              inputMode === 'LIVE_CAMERA' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera Scan</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Work Area: Dataset Upload OR Live Camera */}
        <div className="lg:col-span-8 space-y-4">
          {inputMode === 'DATASET_UPLOAD' ? (
            <div className="space-y-4">
              {/* Drag & Drop Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-white border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-10 text-center space-y-3 cursor-pointer transition shadow-sm hover:shadow-md"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleDatasetFileUpload(e.target.files)}
                  className="hidden"
                />
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Upload Package Image Dataset</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Select product package photos (Front, Back, Label Zoom, Side view). PNG, JPG, WEBP supported.
                  </p>
                </div>
                <button type="button" className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl">
                  <FileImage className="w-4 h-4" />
                  <span>Choose Dataset Image Files</span>
                </button>
              </div>

              {/* Sample Dataset Buttons */}
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-bold text-slate-700">Or use pre-configured test dataset:</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTestModeSample('CHIPS')}
                    className="bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 transition"
                  >
                    Sample 1: Snack Packet
                  </button>
                  <button
                    onClick={() => handleTestModeSample('OIL')}
                    className="bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 transition"
                  >
                    Sample 2: Edible Oil Container
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Live Camera Viewport */
            <div className="bg-slate-950 rounded-2xl overflow-hidden relative shadow-2xl flex flex-col justify-between aspect-video border border-slate-800">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${testMode ? 'hidden' : 'block'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {testMode && (
                <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <Camera className="w-12 h-12 text-slate-500 animate-pulse" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Camera Fallback / Test Mode</h3>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      Click a sample package below to simulate live camera view detection & OCR analysis.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={() => handleTestModeSample('CHIPS')}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
                    >
                      Sample 1: Chips
                    </button>
                    <button
                      onClick={() => handleTestModeSample('OIL')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
                    >
                      Sample 2: Oil Bottle
                    </button>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 p-4 pointer-events-none flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="bg-slate-900/80 backdrop-blur border border-slate-700/80 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${analysis.productDetected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span>{analysis.productDetected ? 'PRODUCT DETECTED ✓' : 'SEARCHING FOR PRODUCT...'}</span>
                  </div>
                  <div className="bg-slate-900/80 backdrop-blur border border-slate-700/80 text-xs text-slate-300 px-3 py-1.5 rounded-full font-mono">
                    Sharpness: {analysis.sharpness}% | Stability: {analysis.stabilityScore}%
                  </div>
                </div>

                <div className="self-center w-64 h-44 border-2 border-dashed border-blue-400/70 rounded-xl flex items-center justify-center relative">
                  <div className="absolute -top-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Target Packaging Alignment
                  </div>
                  {analysis.readyForCapture && (
                    <div className="text-emerald-400 font-bold text-xs bg-slate-900/90 px-3 py-1 rounded-full border border-emerald-500/50">
                      STABLE — CAPTURING
                    </div>
                  )}
                </div>

                <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-xl flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-blue-400 animate-spin" />
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Guidance Engine</div>
                      <div className="text-xs font-bold text-blue-200">{analysis.guidanceMessage}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Uploaded Dataset Queue & OCR Trigger */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Dataset Processing Status</span>
            </h3>

            {capturedImages.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 text-slate-600 text-center">
                <Layers className="w-6 h-6 text-slate-400 mx-auto" />
                <div className="font-bold text-slate-700">No Dataset Images Added</div>
                <p>Upload package photos above to start legal compliance analysis.</p>
              </div>
            ) : step === 'PROCESSING_OCR' ? (
              <div className="p-4 bg-slate-900 text-white rounded-lg text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-blue-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing OCR & Legal Engine</span>
                </div>
                <p className="text-slate-300 font-mono text-[11px] leading-relaxed">{ocrProgressText}</p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-3 text-emerald-900">
                <div className="font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{capturedImages.length} Dataset Images Ready</span>
                </div>
                <p>Click below to execute Tesseract OCR text extraction and Legal Metrology Rule evaluation.</p>
                <button
                  onClick={startAnalysisPipeline}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition shadow flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>START COMPLIANCE ANALYSIS</span>
                </button>
              </div>
            )}
          </div>

          {/* Dataset Images Queue */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                Loaded Dataset ({capturedImages.length})
              </h4>
              {capturedImages.length > 0 && (
                <button
                  onClick={() => setCapturedImages([])}
                  className="text-[10px] text-rose-600 hover:underline font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>

            {capturedImages.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-lg">
                Empty queue
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {capturedImages.map((img, idx) => (
                  <div key={img.id} className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
                    <img src={img.dataUrl} alt={img.viewName} className="w-full h-24 object-cover" />
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute top-1 right-1 bg-slate-900/80 text-white p-1 rounded hover:bg-rose-600 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 flex items-center justify-between">
                      <span>#{idx + 1} {img.viewName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
