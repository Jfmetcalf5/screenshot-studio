import { useState, useRef, useEffect } from 'react';
import { Download, Plus, Trash2, Upload, Settings2, X, ArrowUpRight, Circle, Square, Minus, Paintbrush } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

type AnnotationType = 'arrow' | 'line' | 'circle' | 'rectangle' | 'highlight';

interface Annotation {
  id: string;
  type: AnnotationType;
  enabled: boolean;
  color: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  strokeWidth?: number;
}

interface Screenshot {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  titleColor: string;
  subtitleColor: string;
  bgColor1: string;
  bgColor2: string;
  bgColor3: string;
  gradientHeight?: number;
  phoneTopOffset?: number;
  textTopOffset?: number;
  annotations: Annotation[];
}

export default function App() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);

  const addScreenshot = () => {
    const newScreenshot: Screenshot = {
      id: Date.now().toString(),
      image: '',
      title: 'New Feature Title',
      subtitle: 'Feature description goes here',
      titleColor: '#78350f',
      subtitleColor: '#92400e',
      bgColor1: '#fef3c7',
      bgColor2: '#fefce8',
      bgColor3: '#fed7aa',
      gradientHeight: 400,
      phoneTopOffset: 0,
      textTopOffset: 0,
      annotations: [],
    };
    setScreenshots([...screenshots, newScreenshot]);
  };

  const removeScreenshot = (id: string) => {
    setScreenshots(screenshots.filter((s) => s.id !== id));
  };

  const updateScreenshot = (id: string, updates: Partial<Screenshot>) => {
    setScreenshots(screenshots.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const downloadScreenshot = async (screenshotRef: HTMLDivElement | null, title: string) => {
    if (!screenshotRef) return;

    try {
      const dataUrl = await htmlToImage.toPng(screenshotRef, {
        quality: 1,
        pixelRatio: 1,
        width: 1290,
        height: 2796,
      });

      const link = document.createElement('a');
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating screenshot:', err);
    }
  };

  const downloadAll = async () => {
    for (let i = 0; i < screenshots.length; i++) {
      const screenshot = screenshots[i];
      const element = document.getElementById(`screenshot-${screenshot.id}`);
      if (element) {
        await new Promise(resolve => setTimeout(resolve, 500));
        await downloadScreenshot(element as HTMLDivElement, `${i + 1}-${screenshot.title}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 py-8 px-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-12 flex items-start justify-between">
          <div>
            <h1 className="text-amber-50 mb-3 tracking-tight" style={{ fontSize: '42px', fontFamily: 'Georgia, serif' }}>
              Screenshot Studio
            </h1>
            <p className="text-amber-100/60 text-lg" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Craft professional App Store screenshots with precision
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadAll}
              className="px-6 py-3 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/30 text-amber-200 rounded-lg transition-all duration-200 flex items-center gap-2"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              <Download className="w-5 h-5" />
              Download All
            </button>
            <button
              onClick={addScreenshot}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-amber-950 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              <Plus className="w-5 h-5" />
              Add Screenshot
            </button>
          </div>
        </div>

        {/* Screenshots Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {screenshots.map((screenshot, index) => (
            <ScreenshotCard
              key={screenshot.id}
              screenshot={screenshot}
              index={index}
              onDownload={downloadScreenshot}
              onRemove={removeScreenshot}
              onUpdate={updateScreenshot}
            />
          ))}
        </div>

        {screenshots.length === 0 && (
          <div className="text-center py-32">
            <div className="text-amber-100/30 text-xl mb-4">No screenshots yet</div>
            <button
              onClick={addScreenshot}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-amber-950 rounded-lg transition-all duration-200 inline-flex items-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Your First Screenshot
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ScreenshotCardProps {
  screenshot: Screenshot;
  index: number;
  onDownload: (ref: HTMLDivElement | null, title: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Screenshot>) => void;
}

function ScreenshotCard({ screenshot, index, onDownload, onRemove, onUpdate }: ScreenshotCardProps) {
  const screenshotRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const addAnnotation = (type: AnnotationType) => {
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type,
      enabled: true,
      color: '#fb923c',
      x: type === 'arrow' ? -110 : 500,
      y: type === 'arrow' ? 280 : 600,
      width: type === 'arrow' ? 900 : type === 'line' ? 400 : 200,
      height: type === 'arrow' ? 300 : type === 'line' ? 4 : 200,
      rotation: 0,
      strokeWidth: type === 'highlight' ? 0 : 16,
    };
    onUpdate(screenshot.id, { annotations: [...screenshot.annotations, newAnnotation] });
    setSelectedAnnotation(newAnnotation.id);
  };

  const updateAnnotation = (annotationId: string, updates: Partial<Annotation>) => {
    const updatedAnnotations = screenshot.annotations.map((a) =>
      a.id === annotationId ? { ...a, ...updates } : a
    );
    onUpdate(screenshot.id, { annotations: updatedAnnotations });
  };

  const removeAnnotation = (annotationId: string) => {
    onUpdate(screenshot.id, { annotations: screenshot.annotations.filter((a) => a.id !== annotationId) });
    if (selectedAnnotation === annotationId) {
      setSelectedAnnotation(null);
    }
  };

  const handleAnnotationMouseDown = (e: React.MouseEvent, annotationId: string, action: 'move' | 'resize' | 'rotate') => {
    e.stopPropagation();
    setSelectedAnnotation(annotationId);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragStart({ x: e.clientX, y: e.clientY });

    if (action === 'move') {
      setIsDragging(true);
    } else if (action === 'resize') {
      setIsResizing(true);
    } else if (action === 'rotate') {
      setIsRotating(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectedAnnotation) return;

    const annotation = screenshot.annotations.find((a) => a.id === selectedAnnotation);
    if (!annotation) return;

    if (isDragging) {
      const deltaX = (e.clientX - dragStart.x) * 4; // Scale factor for preview
      const deltaY = (e.clientY - dragStart.y) * 4;
      updateAnnotation(selectedAnnotation, {
        x: annotation.x + deltaX,
        y: annotation.y + deltaY,
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isResizing) {
      const deltaX = (e.clientX - dragStart.x) * 4;
      const deltaY = (e.clientY - dragStart.y) * 4;
      updateAnnotation(selectedAnnotation, {
        width: Math.max(50, annotation.width! + deltaX),
        height: Math.max(20, annotation.height! + deltaY),
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isRotating) {
      // Get the preview container to calculate relative position
      const previewRect = e.currentTarget.getBoundingClientRect();
      const mouseX = (e.clientX - previewRect.left) * 4; // Scale to actual size
      const mouseY = (e.clientY - previewRect.top) * 4;

      const centerX = annotation.x + (annotation.width || 0) / 2;
      const centerY = annotation.y + (annotation.height || 0) / 2;

      const angle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);
      updateAnnotation(selectedAnnotation, {
        rotation: Math.round(angle + 90), // +90 to make top handle point up when at 0°
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedAnnotation && (e.key === 'Delete' || e.key === 'Backspace')) {
        // Only delete if not focused on an input
        if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          removeAnnotation(selectedAnnotation);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAnnotation]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate(screenshot.id, { image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate(screenshot.id, { image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-neutral-900 rounded-xl border border-amber-600/10 overflow-hidden">
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-amber-600/10 flex items-center justify-between bg-neutral-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-600/20 text-amber-400 flex items-center justify-center text-sm font-medium">
            {index + 1}
          </div>
          <h3 className="text-amber-50 font-medium" style={{ fontFamily: 'system-ui, sans-serif' }}>
            {screenshot.title || 'Untitled Screenshot'}
          </h3>
        </div>
        <button
          onClick={() => onRemove(screenshot.id)}
          className="p-2 hover:bg-red-500/10 text-red-400/70 hover:text-red-400 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-[auto_1fr] gap-6">
          {/* Preview */}
          <div>
            <div
              className="mb-3 border border-amber-600/20 rounded-lg bg-neutral-950 relative"
              style={{ width: '322px', height: '699px', overflow: 'hidden' }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                style={{ transform: 'scale(0.25)', transformOrigin: 'top left', width: '1290px', height: '2796px' }}
                onClick={() => setSelectedAnnotation(null)}
              >
                <div
                  id={`screenshot-${screenshot.id}`}
                  ref={screenshotRef}
                  className="relative p-12"
                  style={{
                    width: '1290px',
                    height: '2796px',
                    background: `linear-gradient(135deg, ${screenshot.bgColor1} 0%, ${screenshot.bgColor2} 50%, ${screenshot.bgColor3} 100%)`,
                  }}
                >
                  {/* Top Gradient Overlay */}
                  <div
                    className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
                    style={{
                      height: `${(screenshot.gradientHeight || 400) + 200}px`,
                      background: `linear-gradient(to bottom, ${screenshot.bgColor1} 0%, ${screenshot.bgColor1} ${((screenshot.gradientHeight || 400) / ((screenshot.gradientHeight || 400) + 200)) * 100}%, transparent 100%)`,
                    }}
                  />

                  {/* Marketing Text */}
                  <div
                    className="text-center mb-16 relative z-30"
                    style={{ marginTop: `${screenshot.textTopOffset || 0}px` }}
                  >
                    <h2
                      className="text-8xl mb-4 font-bold leading-tight px-8 whitespace-pre-line"
                      style={{ color: screenshot.titleColor }}
                    >
                      {screenshot.title.split('\\n').map((line, i, arr) => (
                        <span key={i}>
                          {line}
                          {i < arr.length - 1 && <br />}
                        </span>
                      ))}
                    </h2>
                    <p
                      className="text-6xl leading-relaxed px-8 whitespace-pre-line"
                      style={{ color: screenshot.subtitleColor }}
                    >
                      {screenshot.subtitle.split('\\n').map((line, i, arr) => (
                        <span key={i}>
                          {line}
                          {i < arr.length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  </div>

                  {/* iPhone Mockup */}
                  <div
                    className="relative mx-auto z-10"
                    style={{
                      width: '1100px',
                      top: `${screenshot.phoneTopOffset || 0}px`,
                    }}
                  >
                    <div
                      className="relative rounded-[55px] shadow-2xl"
                      style={{
                        background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
                        padding: '8px',
                      }}
                    >
                      <div
                        className="relative rounded-[48px] overflow-hidden"
                        style={{
                          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 10px 40px rgba(0,0,0,0.3)',
                        }}
                      >
                        <div className="relative bg-white" style={{ height: '2400px' }}>
                          {screenshot.image ? (
                            <img
                              src={screenshot.image}
                              alt={screenshot.title}
                              className="w-full block"
                              style={{ height: 'auto', minHeight: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                              <div className="text-center text-neutral-400">
                                <Upload className="w-24 h-24 mx-auto mb-4 opacity-30" />
                                <div className="text-2xl">No image uploaded</div>
                              </div>
                            </div>
                          )}

                          {/* Annotations - Interactive Layer */}
                          {screenshot.annotations.map((annotation) => {
                            if (!annotation.enabled) return null;

                            const isSelected = selectedAnnotation === annotation.id;

                            return (
                              <div
                                key={annotation.id}
                                className="absolute"
                                style={{
                                  top: `${annotation.y}px`,
                                  left: `${annotation.x}px`,
                                  width: `${annotation.width}px`,
                                  height: `${annotation.height}px`,
                                  transform: `rotate(${annotation.rotation || 0}deg)`,
                                  transformOrigin: 'center',
                                  cursor: isSelected ? 'move' : 'pointer',
                                  pointerEvents: 'auto',
                                }}
                                onMouseDown={(e) => handleAnnotationMouseDown(e, annotation.id, 'move')}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAnnotation(annotation.id);
                                }}
                              >
                                {/* Selection Outline */}
                                {isSelected && (
                                  <div
                                    className="absolute inset-0 border-4 border-dashed pointer-events-none"
                                    style={{
                                      borderColor: '#3b82f6',
                                      margin: '-20px',
                                      padding: '20px',
                                    }}
                                  />
                                )}

                                {/* Annotation Content */}
                                {annotation.type === 'arrow' && (
                                  <svg
                                    className="w-full h-full"
                                    viewBox="0 0 900 300"
                                    style={{ overflow: 'visible' }}
                                  >
                                    <path
                                      d="M 450 250 L 650 250 Q 850 230, 850 50"
                                      fill="none"
                                      stroke={annotation.color}
                                      strokeWidth={annotation.strokeWidth}
                                      strokeLinecap="round"
                                    />
                                    <path
                                      d="M 850 50 L 800 90"
                                      fill="none"
                                      stroke={annotation.color}
                                      strokeWidth={annotation.strokeWidth}
                                      strokeLinecap="round"
                                    />
                                    <path
                                      d="M 850 50 L 890 100"
                                      fill="none"
                                      stroke={annotation.color}
                                      strokeWidth={annotation.strokeWidth}
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                )}

                                {annotation.type === 'line' && (
                                  <div
                                    className="w-full h-full"
                                    style={{
                                      backgroundColor: annotation.color,
                                    }}
                                  />
                                )}

                                {annotation.type === 'circle' && (
                                  <div
                                    className="w-full h-full rounded-full"
                                    style={{
                                      border: `${annotation.strokeWidth}px solid ${annotation.color}`,
                                    }}
                                  />
                                )}

                                {annotation.type === 'rectangle' && (
                                  <div
                                    className="w-full h-full"
                                    style={{
                                      border: `${annotation.strokeWidth}px solid ${annotation.color}`,
                                      borderRadius: '8px',
                                    }}
                                  />
                                )}

                                {annotation.type === 'highlight' && (
                                  <div
                                    className="w-full h-full"
                                    style={{
                                      backgroundColor: annotation.color,
                                      opacity: 0.3,
                                      borderRadius: '4px',
                                    }}
                                  />
                                )}

                                {/* Interactive Handles - Only show when selected */}
                                {isSelected && (
                                  <>
                                    {/* Resize Handle - Bottom Right Corner */}
                                    <div
                                      className="absolute bg-blue-500 rounded-full cursor-nwse-resize"
                                      style={{
                                        width: '24px',
                                        height: '24px',
                                        bottom: '-12px',
                                        right: '-12px',
                                        border: '3px solid white',
                                      }}
                                      onMouseDown={(e) => handleAnnotationMouseDown(e, annotation.id, 'resize')}
                                    />

                                    {/* Rotation Handle - Top Center */}
                                    <div
                                      className="absolute bg-green-500 rounded-full cursor-grab"
                                      style={{
                                        width: '24px',
                                        height: '24px',
                                        top: '-40px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        border: '3px solid white',
                                      }}
                                      onMouseDown={(e) => handleAnnotationMouseDown(e, annotation.id, 'rotate')}
                                    />
                                    {/* Connection line to rotation handle */}
                                    <div
                                      className="absolute bg-green-500"
                                      style={{
                                        width: '2px',
                                        height: '20px',
                                        top: '-20px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                      }}
                                    />
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onDownload(screenshotRef.current, screenshot.title)}
              className="w-full bg-amber-600 hover:bg-amber-500 text-amber-950 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 font-medium"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>

          {/* Editor Panel */}
          <div className="flex flex-col gap-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm mb-2 text-amber-200/80" style={{ fontFamily: 'system-ui, sans-serif' }}>
                Screenshot Image
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-amber-600/30 rounded-lg p-6 hover:border-amber-600/50 hover:bg-amber-600/5 transition-all cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-amber-400/60" />
                  <div className="text-amber-200/60 text-sm mb-1">
                    {screenshot.image ? 'Change image' : 'Click or drag image here'}
                  </div>
                  <div className="text-amber-200/40 text-xs">iPhone 15 Pro Max: 1290 × 2796px</div>
                </div>
              </div>
            </div>

            {/* Text Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-amber-200/80" style={{ fontFamily: 'system-ui, sans-serif' }}>
                  Title
                </label>
                <textarea
                  value={screenshot.title}
                  onChange={(e) => onUpdate(screenshot.id, { title: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-neutral-950 border border-amber-600/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/40 text-amber-50 placeholder-amber-200/20 resize-none"
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                  placeholder="Feature title"
                />
                <div className="text-xs text-amber-200/40 mt-1">Use \n for line breaks</div>
              </div>
              <div>
                <label className="block text-sm mb-2 text-amber-200/80" style={{ fontFamily: 'system-ui, sans-serif' }}>
                  Subtitle
                </label>
                <textarea
                  value={screenshot.subtitle}
                  onChange={(e) => onUpdate(screenshot.id, { subtitle: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-neutral-950 border border-amber-600/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600/40 text-amber-50 placeholder-amber-200/20 resize-none"
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                  placeholder="Feature description"
                />
              </div>
            </div>

            {/* Colors */}
            <div>
              <button
                onClick={() => setShowColors(!showColors)}
                className="flex items-center gap-2 text-amber-200/70 hover:text-amber-200 transition-colors mb-3"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                <Paintbrush className="w-4 h-4" />
                <span className="text-sm">Colors & Theme</span>
                <span className="text-xs">{showColors ? '−' : '+'}</span>
              </button>

              {showColors && (
                <div className="space-y-4 pl-6 border-l-2 border-amber-600/20">
                  <div>
                    <label className="block text-sm mb-2 text-amber-200/80" style={{ fontFamily: 'system-ui, sans-serif' }}>
                      Title Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={screenshot.titleColor}
                        onChange={(e) => onUpdate(screenshot.id, { titleColor: e.target.value })}
                        className="w-12 h-10 rounded cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={screenshot.titleColor}
                        onChange={(e) => onUpdate(screenshot.id, { titleColor: e.target.value })}
                        className="flex-1 px-3 py-2 bg-neutral-950 border border-amber-600/20 rounded-lg text-amber-50 text-sm"
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-amber-200/80" style={{ fontFamily: 'system-ui, sans-serif' }}>
                      Subtitle Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={screenshot.subtitleColor}
                        onChange={(e) => onUpdate(screenshot.id, { subtitleColor: e.target.value })}
                        className="w-12 h-10 rounded cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={screenshot.subtitleColor}
                        onChange={(e) => onUpdate(screenshot.id, { subtitleColor: e.target.value })}
                        className="flex-1 px-3 py-2 bg-neutral-950 border border-amber-600/20 rounded-lg text-amber-50 text-sm"
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-amber-200/80" style={{ fontFamily: 'system-ui, sans-serif' }}>
                      Background Gradient
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={screenshot.bgColor1}
                          onChange={(e) => onUpdate(screenshot.id, { bgColor1: e.target.value })}
                          className="w-12 h-10 rounded cursor-pointer bg-transparent"
                        />
                        <span className="text-xs text-amber-200/60">Start</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={screenshot.bgColor2}
                          onChange={(e) => onUpdate(screenshot.id, { bgColor2: e.target.value })}
                          className="w-12 h-10 rounded cursor-pointer bg-transparent"
                        />
                        <span className="text-xs text-amber-200/60">Middle</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={screenshot.bgColor3}
                          onChange={(e) => onUpdate(screenshot.id, { bgColor3: e.target.value })}
                          className="w-12 h-10 rounded cursor-pointer bg-transparent"
                        />
                        <span className="text-xs text-amber-200/60">End</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Annotations */}
            <div>
              <button
                onClick={() => setShowAnnotations(!showAnnotations)}
                className="flex items-center gap-2 text-amber-200/70 hover:text-amber-200 transition-colors mb-3"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-sm">Annotations ({screenshot.annotations.length})</span>
                <span className="text-xs">{showAnnotations ? '−' : '+'}</span>
              </button>

              {showAnnotations && (
                <div className="space-y-4 pl-6 border-l-2 border-amber-600/20">
                  {/* Instructions */}
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                    <div className="text-xs text-blue-300/90 leading-relaxed">
                      <strong>How to use:</strong> Click an annotation to select it, then drag to move.
                      Use the <span className="text-blue-400">blue handle</span> to resize and the <span className="text-green-400">green handle</span> to rotate.
                      Press <kbd className="px-1 py-0.5 bg-blue-500/20 rounded text-[10px]">Delete</kbd> to remove.
                    </div>
                  </div>

                  {/* Add Annotation Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => addAnnotation('arrow')}
                      className="px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/30 text-amber-200 rounded text-xs flex items-center gap-1.5"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Arrow
                    </button>
                    <button
                      onClick={() => addAnnotation('line')}
                      className="px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/30 text-amber-200 rounded text-xs flex items-center gap-1.5"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      Line
                    </button>
                    <button
                      onClick={() => addAnnotation('circle')}
                      className="px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/30 text-amber-200 rounded text-xs flex items-center gap-1.5"
                    >
                      <Circle className="w-3.5 h-3.5" />
                      Circle
                    </button>
                    <button
                      onClick={() => addAnnotation('rectangle')}
                      className="px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/30 text-amber-200 rounded text-xs flex items-center gap-1.5"
                    >
                      <Square className="w-3.5 h-3.5" />
                      Box
                    </button>
                    <button
                      onClick={() => addAnnotation('highlight')}
                      className="px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/30 text-amber-200 rounded text-xs flex items-center gap-1.5"
                    >
                      <Paintbrush className="w-3.5 h-3.5" />
                      Highlight
                    </button>
                  </div>

                  {/* Annotation List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {screenshot.annotations.length === 0 && (
                      <div className="text-center py-6 text-amber-200/40 text-xs">
                        Add annotations to highlight features
                      </div>
                    )}
                    {screenshot.annotations.map((annotation, idx) => {
                      const isSelected = selectedAnnotation === annotation.id;
                      return (
                        <div
                          key={annotation.id}
                          className={`bg-neutral-950/50 border rounded-lg p-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500/50 bg-blue-500/5'
                              : 'border-amber-600/10 hover:border-amber-600/30'
                          }`}
                          onClick={() => setSelectedAnnotation(annotation.id)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="checkbox"
                                checked={annotation.enabled}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  updateAnnotation(annotation.id, { enabled: e.target.checked });
                                }}
                                className="w-4 h-4 accent-amber-600"
                              />
                              <input
                                type="color"
                                value={annotation.color}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  updateAnnotation(annotation.id, { color: e.target.value });
                                }}
                                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-1">
                                <div className="text-xs text-amber-200/80 capitalize font-medium">
                                  {annotation.type} {idx + 1}
                                </div>
                                {isSelected && (
                                  <div className="text-[10px] text-amber-200/50 mt-0.5">
                                    Click and drag to move · Blue handle to resize · Green handle to rotate
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeAnnotation(annotation.id);
                              }}
                              className="p-1.5 hover:bg-red-500/10 text-red-400/70 hover:text-red-400 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick Stroke Width Control - Only for non-highlight types */}
                          {isSelected && annotation.enabled && annotation.type !== 'highlight' && (
                            <div className="mt-3 pt-3 border-t border-amber-600/10">
                              <label className="block text-xs mb-1.5 text-amber-200/60">
                                Stroke: {annotation.strokeWidth}px
                              </label>
                              <input
                                type="range"
                                min="2"
                                max="32"
                                value={annotation.strokeWidth}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  updateAnnotation(annotation.id, { strokeWidth: parseInt(e.target.value) });
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full accent-amber-600"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Settings */}
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-amber-200/70 hover:text-amber-200 transition-colors mb-3"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                <Settings2 className="w-4 h-4" />
                <span className="text-sm">Layout Settings</span>
                <span className="text-xs">{showAdvanced ? '−' : '+'}</span>
              </button>

              {showAdvanced && (
                <div className="space-y-4 pl-6 border-l-2 border-amber-600/20">
                  <div>
                    <label className="block text-sm mb-2 text-amber-200/80" style={{ fontFamily: 'system-ui, sans-serif' }}>
                      Text Vertical Offset: {screenshot.textTopOffset || 0}px
                    </label>
                    <input
                      type="range"
                      min="-200"
                      max="1500"
                      value={screenshot.textTopOffset || 0}
                      onChange={(e) => onUpdate(screenshot.id, { textTopOffset: parseInt(e.target.value) })}
                      className="w-full accent-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-amber-200/80" style={{ fontFamily: 'system-ui, sans-serif' }}>
                      Gradient Height: {screenshot.gradientHeight || 400}px
                    </label>
                    <input
                      type="range"
                      min="200"
                      max="800"
                      value={screenshot.gradientHeight || 400}
                      onChange={(e) => onUpdate(screenshot.id, { gradientHeight: parseInt(e.target.value) })}
                      className="w-full accent-amber-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-amber-200/80" style={{ fontFamily: 'system-ui, sans-serif' }}>
                      Phone Vertical Offset: {screenshot.phoneTopOffset || 0}px
                    </label>
                    <input
                      type="range"
                      min="-600"
                      max="200"
                      value={screenshot.phoneTopOffset || 0}
                      onChange={(e) => onUpdate(screenshot.id, { phoneTopOffset: parseInt(e.target.value) })}
                      className="w-full accent-amber-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}