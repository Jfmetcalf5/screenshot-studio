import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Download, Plus, Trash2, Upload, Settings2, ArrowUpRight, Circle, Square, Minus, Paintbrush,
  Smartphone, Tablet, Copy, Save, Image, Type, Palette, RotateCcw, RotateCw,
  GripVertical, ChevronDown, FileArchive, Layers, Menu, X
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// ==================== TYPES ====================

type AnnotationType = 'arrow' | 'line' | 'circle' | 'rectangle' | 'highlight';
type DeviceType = 'iphone-16-pro-max' | 'iphone-16' | 'iphone-se' | 'ipad-pro' | 'android-pixel' | 'android-samsung';
type DeviceColor = 'black' | 'white' | 'gold' | 'silver' | 'blue' | 'purple';
type TextAlign = 'left' | 'center' | 'right';
type FontWeight = '400' | '500' | '600' | '700' | '800' | '900';

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
  bgImage?: string;
  bgPattern?: string;
  gradientHeight?: number;
  phoneTopOffset?: number;
  textTopOffset?: number;
  textHorizontalOffset?: number;
  annotations: Annotation[];
  deviceType: DeviceType;
  deviceColor: DeviceColor;
  showDeviceFrame: boolean;
  fontFamily: string;
  titleFontSize: number;
  subtitleFontSize: number;
  textAlign: TextAlign;
  titleFontWeight: FontWeight;
  subtitleFontWeight: FontWeight;
  textShadow: boolean;
}

interface Template {
  id: string;
  name: string;
  screenshot: Omit<Screenshot, 'id' | 'image'>;
}

// ==================== CONSTANTS ====================

const DEVICE_CONFIGS: Record<DeviceType, { name: string; width: number; height: number; screenWidth: number; screenHeight: number; borderRadius: number }> = {
  'iphone-16-pro-max': { name: 'iPhone 16 Pro Max', width: 1290, height: 2796, screenWidth: 1100, screenHeight: 2400, borderRadius: 55 },
  'iphone-16': { name: 'iPhone 16', width: 1179, height: 2556, screenWidth: 1000, screenHeight: 2200, borderRadius: 50 },
  'iphone-se': { name: 'iPhone SE', width: 750, height: 1334, screenWidth: 650, screenHeight: 1150, borderRadius: 0 },
  'ipad-pro': { name: 'iPad Pro 12.9"', width: 2048, height: 2732, screenWidth: 1800, screenHeight: 2400, borderRadius: 40 },
  'android-pixel': { name: 'Pixel 8 Pro', width: 1344, height: 2992, screenWidth: 1150, screenHeight: 2600, borderRadius: 45 },
  'android-samsung': { name: 'Galaxy S24', width: 1440, height: 3120, screenWidth: 1250, screenHeight: 2750, borderRadius: 50 },
};

const DEVICE_COLORS: Record<DeviceColor, { name: string; gradient: string }> = {
  'black': { name: 'Black', gradient: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)' },
  'white': { name: 'White', gradient: 'linear-gradient(145deg, #f5f5f5 0%, #e0e0e0 100%)' },
  'gold': { name: 'Gold', gradient: 'linear-gradient(145deg, #d4af37 0%, #b8962e 100%)' },
  'silver': { name: 'Silver', gradient: 'linear-gradient(145deg, #c0c0c0 0%, #a8a8a8 100%)' },
  'blue': { name: 'Blue', gradient: 'linear-gradient(145deg, #4a6fa5 0%, #3d5a80 100%)' },
  'purple': { name: 'Purple', gradient: 'linear-gradient(145deg, #7b68ee 0%, #6a5acd 100%)' },
};

const FONT_FAMILIES = [
  { value: 'system-ui, sans-serif', name: 'System' },
  { value: 'Georgia, serif', name: 'Georgia' },
  { value: 'Arial, sans-serif', name: 'Arial' },
  { value: '"Helvetica Neue", sans-serif', name: 'Helvetica' },
  { value: 'Verdana, sans-serif', name: 'Verdana' },
];

const PRESET_THEMES = [
  { name: 'Amber', bgColor1: '#fef3c7', bgColor2: '#fefce8', bgColor3: '#fed7aa', titleColor: '#78350f', subtitleColor: '#92400e' },
  { name: 'Ocean', bgColor1: '#dbeafe', bgColor2: '#eff6ff', bgColor3: '#bfdbfe', titleColor: '#1e3a5f', subtitleColor: '#1e40af' },
  { name: 'Forest', bgColor1: '#d1fae5', bgColor2: '#ecfdf5', bgColor3: '#a7f3d0', titleColor: '#064e3b', subtitleColor: '#047857' },
  { name: 'Purple', bgColor1: '#ede9fe', bgColor2: '#f5f3ff', bgColor3: '#ddd6fe', titleColor: '#4c1d95', subtitleColor: '#6d28d9' },
  { name: 'Rose', bgColor1: '#fce7f3', bgColor2: '#fdf2f8', bgColor3: '#fbcfe8', titleColor: '#831843', subtitleColor: '#be185d' },
  { name: 'Dark', bgColor1: '#334155', bgColor2: '#1e293b', bgColor3: '#475569', titleColor: '#f1f5f9', subtitleColor: '#cbd5e1' },
  { name: 'White', bgColor1: '#ffffff', bgColor2: '#fafafa', bgColor3: '#f5f5f5', titleColor: '#171717', subtitleColor: '#525252' },
  { name: 'Night', bgColor1: '#0f172a', bgColor2: '#1e293b', bgColor3: '#334155', titleColor: '#f8fafc', subtitleColor: '#94a3b8' },
];

const DEFAULT_SCREENSHOT: Omit<Screenshot, 'id'> = {
  image: '',
  title: 'Feature Title',
  subtitle: 'Description here',
  titleColor: '#78350f',
  subtitleColor: '#92400e',
  bgColor1: '#fef3c7',
  bgColor2: '#fefce8',
  bgColor3: '#fed7aa',
  bgImage: '',
  bgPattern: '',
  gradientHeight: 400,
  phoneTopOffset: 0,
  textTopOffset: 0,
  textHorizontalOffset: 0,
  annotations: [],
  deviceType: 'iphone-16-pro-max',
  deviceColor: 'black',
  showDeviceFrame: true,
  fontFamily: 'system-ui, sans-serif',
  titleFontSize: 96,
  subtitleFontSize: 56,
  textAlign: 'center',
  titleFontWeight: '700',
  subtitleFontWeight: '400',
  textShadow: false,
};

const BUILT_IN_TEMPLATES: Template[] = [
  { id: 'minimal', name: 'Minimal', screenshot: { ...DEFAULT_SCREENSHOT, showDeviceFrame: false, bgColor1: '#ffffff', bgColor2: '#fafafa', bgColor3: '#f5f5f5', titleColor: '#171717', subtitleColor: '#525252' } },
  { id: 'dark', name: 'Dark', screenshot: { ...DEFAULT_SCREENSHOT, bgColor1: '#0f172a', bgColor2: '#1e293b', bgColor3: '#334155', titleColor: '#f8fafc', subtitleColor: '#94a3b8' } },
  { id: 'vibrant', name: 'Vibrant', screenshot: { ...DEFAULT_SCREENSHOT, bgColor1: '#ec4899', bgColor2: '#8b5cf6', bgColor3: '#3b82f6', titleColor: '#ffffff', subtitleColor: '#fce7f3', textShadow: true } },
];

const getPatternStyle = (pattern: string, color: string): string => {
  const patternColor = color + '20';
  switch (pattern) {
    case 'dots': return `radial-gradient(circle, ${patternColor} 1px, transparent 1px)`;
    case 'grid': return `linear-gradient(${patternColor} 1px, transparent 1px), linear-gradient(90deg, ${patternColor} 1px, transparent 1px)`;
    default: return '';
  }
};

// ==================== MAIN APP ====================

export default function App() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [history, setHistory] = useState<Screenshot[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showMenu, setShowMenu] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');

  useEffect(() => {
    const saved = localStorage.getItem('screenshot-studio-data');
    const savedTemplates = localStorage.getItem('screenshot-studio-templates');
    if (saved) try { setScreenshots(JSON.parse(saved)); } catch {}
    if (savedTemplates) try { setTemplates(JSON.parse(savedTemplates)); } catch {}
  }, []);

  useEffect(() => {
    if (screenshots.length > 0) localStorage.setItem('screenshot-studio-data', JSON.stringify(screenshots));
  }, [screenshots]);

  useEffect(() => {
    if (templates.length > 0) localStorage.setItem('screenshot-studio-templates', JSON.stringify(templates));
  }, [templates]);

  const pushHistory = useCallback((newScreenshots: Screenshot[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newScreenshots);
    if (newHistory.length > 30) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) { setHistoryIndex(historyIndex - 1); setScreenshots(history[historyIndex - 1]); }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) { setHistoryIndex(historyIndex + 1); setScreenshots(history[historyIndex + 1]); }
  }, [history, historyIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const addScreenshot = (template?: Template) => {
    const base = template ? { ...template.screenshot } : { ...DEFAULT_SCREENSHOT };
    const newScreenshot: Screenshot = { ...base, id: Date.now().toString(), image: '' };
    const newScreenshots = [...screenshots, newScreenshot];
    setScreenshots(newScreenshots);
    pushHistory(newScreenshots);
    setShowMenu(false);
  };

  const duplicateScreenshot = (s: Screenshot) => {
    const idx = screenshots.findIndex(x => x.id === s.id);
    const newScreenshots = [...screenshots];
    newScreenshots.splice(idx + 1, 0, { ...s, id: Date.now().toString() });
    setScreenshots(newScreenshots);
    pushHistory(newScreenshots);
  };

  const removeScreenshot = (id: string) => {
    const newScreenshots = screenshots.filter(s => s.id !== id);
    setScreenshots(newScreenshots);
    pushHistory(newScreenshots);
    if (newScreenshots.length === 0) localStorage.removeItem('screenshot-studio-data');
  };

  const updateScreenshot = (id: string, updates: Partial<Screenshot>) => {
    const newScreenshots = screenshots.map(s => s.id === id ? { ...s, ...updates } : s);
    setScreenshots(newScreenshots);
    pushHistory(newScreenshots);
  };

  const moveScreenshot = (dragIndex: number, hoverIndex: number) => {
    const newScreenshots = [...screenshots];
    const [dragged] = newScreenshots.splice(dragIndex, 1);
    newScreenshots.splice(hoverIndex, 0, dragged);
    setScreenshots(newScreenshots);
    pushHistory(newScreenshots);
  };

  const saveAsTemplate = (s: Screenshot, name: string) => {
    const { id, image, ...rest } = s;
    setTemplates([...templates, { id: Date.now().toString(), name, screenshot: rest }]);
  };

  const downloadScreenshot = async (ref: HTMLDivElement | null, title: string, config: typeof DEVICE_CONFIGS[DeviceType]) => {
    if (!ref) return null;
    try {
      const dataUrl = exportFormat === 'jpeg'
        ? await htmlToImage.toJpeg(ref, { quality: 0.92, pixelRatio: 1, width: config.width, height: config.height })
        : await htmlToImage.toPng(ref, { quality: 1, pixelRatio: 1, width: config.width, height: config.height });
      return { dataUrl, filename: `${title.toLowerCase().replace(/\s+/g, '-')}.${exportFormat}` };
    } catch { return null; }
  };

  const downloadSingle = async (ref: HTMLDivElement | null, title: string, config: typeof DEVICE_CONFIGS[DeviceType]) => {
    const result = await downloadScreenshot(ref, title, config);
    if (result) {
      const link = document.createElement('a');
      link.download = result.filename;
      link.href = result.dataUrl;
      link.click();
    }
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    for (let i = 0; i < screenshots.length; i++) {
      const s = screenshots[i];
      const el = document.getElementById(`screenshot-${s.id}`);
      if (el) {
        await new Promise(r => setTimeout(r, 200));
        const result = await downloadScreenshot(el as HTMLDivElement, `${i + 1}-${s.title}`, DEVICE_CONFIGS[s.deviceType]);
        if (result) zip.file(result.filename, result.dataUrl.split(',')[1], { base64: true });
      }
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.download = 'screenshots.zip';
    link.href = URL.createObjectURL(content);
    link.click();
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-slate-950 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-4 sm:mb-6 flex items-center justify-between gap-2">
            <h1 className="text-slate-100 text-xl sm:text-2xl font-medium tracking-tight">Screenshot Studio</h1>

            <div className="flex items-center gap-2">
              <button onClick={undo} disabled={historyIndex <= 0} className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-lg transition-colors"><RotateCcw className="w-4 h-4" /></button>
              <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-lg transition-colors"><RotateCw className="w-4 h-4" /></button>

              <button onClick={downloadAll} disabled={screenshots.length === 0} className="hidden sm:flex p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-lg transition-colors"><FileArchive className="w-4 h-4" /></button>

              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 bg-slate-100 hover:bg-white text-slate-900 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 rounded-xl border border-slate-700 p-3 z-50 shadow-xl">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-slate-200 text-sm font-medium">New Screenshot</span>
                      <button onClick={() => setShowMenu(false)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
                    </div>
                    <button onClick={() => addScreenshot()} className="w-full p-3 mb-2 bg-slate-100 hover:bg-white text-slate-900 rounded-lg text-sm font-medium transition-colors">Blank Screenshot</button>
                    <div className="text-xs text-slate-500 mb-2">Templates</div>
                    <div className="grid grid-cols-2 gap-2">
                      {BUILT_IN_TEMPLATES.map(t => (
                        <button key={t.id} onClick={() => addScreenshot(t)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-left transition-colors">
                          <div className="w-full h-8 rounded mb-1" style={{ background: `linear-gradient(135deg, ${t.screenshot.bgColor1} 0%, ${t.screenshot.bgColor3} 100%)` }} />
                          <div className="text-xs text-slate-300">{t.name}</div>
                        </button>
                      ))}
                      {templates.map(t => (
                        <button key={t.id} onClick={() => addScreenshot(t)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-left transition-colors">
                          <div className="w-full h-8 rounded mb-1" style={{ background: `linear-gradient(135deg, ${t.screenshot.bgColor1} 0%, ${t.screenshot.bgColor3} 100%)` }} />
                          <div className="text-xs text-slate-300 truncate">{t.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Screenshots */}
          <div className="space-y-4">
            {screenshots.map((screenshot, index) => (
              <ScreenshotCard
                key={screenshot.id}
                screenshot={screenshot}
                index={index}
                onDownload={downloadSingle}
                onRemove={removeScreenshot}
                onUpdate={updateScreenshot}
                onDuplicate={duplicateScreenshot}
                onMove={moveScreenshot}
                onSaveAsTemplate={saveAsTemplate}
              />
            ))}
          </div>

          {screenshots.length === 0 && (
            <div className="text-center py-20">
              <div className="text-slate-500 text-lg mb-4">No screenshots yet</div>
              <button onClick={() => addScreenshot()} className="px-6 py-3 bg-slate-100 hover:bg-white text-slate-900 rounded-lg font-medium inline-flex items-center gap-2 transition-colors">
                <Plus className="w-5 h-5" /> Create Screenshot
              </button>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}

// ==================== SCREENSHOT CARD ====================

interface ScreenshotCardProps {
  screenshot: Screenshot;
  index: number;
  onDownload: (ref: HTMLDivElement | null, title: string, config: typeof DEVICE_CONFIGS[DeviceType]) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Screenshot>) => void;
  onDuplicate: (s: Screenshot) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onSaveAsTemplate: (s: Screenshot, name: string) => void;
}

function ScreenshotCard({ screenshot, index, onDownload, onRemove, onUpdate, onDuplicate, onMove, onSaveAsTemplate }: ScreenshotCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const screenshotRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'style' | 'layout' | 'device'>('text');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const deviceConfig = DEVICE_CONFIGS[screenshot.deviceType];
  const previewWidth = typeof window !== 'undefined' && window.innerWidth < 640 ? 280 : 200;
  const previewScale = previewWidth / deviceConfig.width;
  const previewHeight = deviceConfig.height * previewScale;

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'SCREENSHOT',
    item: { index },
    collect: (m) => ({ isDragging: m.isDragging() }),
  });

  const [, drop] = useDrop({
    accept: 'SCREENSHOT',
    hover: (item: { index: number }) => {
      if (item.index !== index) { onMove(item.index, index); item.index = index; }
    },
  });

  preview(drop(ref));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdate(screenshot.id, { image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div ref={ref} className={`bg-slate-900 rounded-xl border border-slate-800 overflow-hidden ${isDragging ? 'opacity-50' : ''}`}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-2 bg-slate-900/50">
        <div ref={drag} className="cursor-grab p-1 hover:bg-slate-800 rounded transition-colors"><GripVertical className="w-4 h-4 text-slate-500" /></div>
        <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs">{index + 1}</div>
        <span className="text-slate-100 text-sm truncate flex-1">{screenshot.title || 'Untitled'}</span>
        <button onClick={() => onDuplicate(screenshot)} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"><Copy className="w-3.5 h-3.5" /></button>
        <button onClick={() => setShowSaveTemplate(!showSaveTemplate)} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"><Save className="w-3.5 h-3.5" /></button>
        <button onClick={() => onRemove(screenshot.id)} className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>

      {showSaveTemplate && (
        <div className="px-3 py-2 bg-slate-800/50 border-b border-slate-800 flex gap-2">
          <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Template name" className="flex-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-100 text-sm" />
          <button onClick={() => { if (templateName) { onSaveAsTemplate(screenshot, templateName); setTemplateName(''); setShowSaveTemplate(false); }}} className="px-3 py-1 bg-slate-100 text-slate-900 rounded text-sm font-medium">Save</button>
        </div>
      )}

      <div className="p-3">
        {/* Mobile: Stack vertically, Desktop: Side by side */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Preview */}
          <div className="flex flex-col items-center sm:items-start">
            <div
              className="border border-slate-800 rounded-lg bg-slate-950 relative overflow-hidden mb-2"
              style={{ width: `${previewWidth}px`, height: `${previewHeight}px` }}
            >
              <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', width: `${deviceConfig.width}px`, height: `${deviceConfig.height}px` }}>
                <div
                  id={`screenshot-${screenshot.id}`}
                  ref={screenshotRef}
                  className="relative"
                  style={{
                    width: `${deviceConfig.width}px`,
                    height: `${deviceConfig.height}px`,
                    background: screenshot.bgImage ? `url(${screenshot.bgImage}) center/cover` : `linear-gradient(135deg, ${screenshot.bgColor1} 0%, ${screenshot.bgColor2} 50%, ${screenshot.bgColor3} 100%)`,
                    padding: '48px',
                  }}
                >
                  {screenshot.bgPattern && (
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: getPatternStyle(screenshot.bgPattern, screenshot.titleColor), backgroundSize: '20px 20px' }} />
                  )}
                  {!screenshot.bgImage && (
                    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none" style={{ height: `${(screenshot.gradientHeight || 400) + 200}px`, background: `linear-gradient(to bottom, ${screenshot.bgColor1} 0%, ${screenshot.bgColor1} ${((screenshot.gradientHeight || 400) / ((screenshot.gradientHeight || 400) + 200)) * 100}%, transparent 100%)` }} />
                  )}
                  <div className="relative z-30" style={{ marginTop: `${screenshot.textTopOffset || 0}px`, marginLeft: `${screenshot.textHorizontalOffset || 0}px`, textAlign: screenshot.textAlign }}>
                    <h2 className="mb-4 leading-tight px-8" style={{ color: screenshot.titleColor, fontFamily: screenshot.fontFamily, fontSize: `${screenshot.titleFontSize}px`, fontWeight: screenshot.titleFontWeight, textShadow: screenshot.textShadow ? '0 4px 20px rgba(0,0,0,0.3)' : 'none' }}>
                      {screenshot.title.split('\\n').map((line, i, arr) => <span key={i}>{line}{i < arr.length - 1 && <br />}</span>)}
                    </h2>
                    <p className="leading-relaxed px-8" style={{ color: screenshot.subtitleColor, fontFamily: screenshot.fontFamily, fontSize: `${screenshot.subtitleFontSize}px`, fontWeight: screenshot.subtitleFontWeight, textShadow: screenshot.textShadow ? '0 2px 10px rgba(0,0,0,0.2)' : 'none' }}>
                      {screenshot.subtitle.split('\\n').map((line, i, arr) => <span key={i}>{line}{i < arr.length - 1 && <br />}</span>)}
                    </p>
                  </div>
                  {screenshot.showDeviceFrame ? (
                    <div className="relative mx-auto z-10" style={{ width: `${deviceConfig.screenWidth + 16}px`, top: `${screenshot.phoneTopOffset || 0}px` }}>
                      <div className="relative shadow-2xl" style={{ background: DEVICE_COLORS[screenshot.deviceColor].gradient, padding: '8px', borderRadius: `${deviceConfig.borderRadius}px` }}>
                        <div className="relative overflow-hidden" style={{ borderRadius: `${deviceConfig.borderRadius - 7}px`, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}>
                          <div className="relative bg-white" style={{ height: `${deviceConfig.screenHeight}px` }}>
                            {screenshot.image ? (
                              <img src={screenshot.image} alt="" className="w-full block" style={{ height: 'auto', minHeight: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                                <Upload className="w-16 h-16 text-neutral-300" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative mx-auto z-10 overflow-hidden rounded-2xl shadow-2xl" style={{ width: `${deviceConfig.screenWidth}px`, top: `${screenshot.phoneTopOffset || 0}px` }}>
                      <div className="relative bg-white" style={{ height: `${deviceConfig.screenHeight}px` }}>
                        {screenshot.image ? (
                          <img src={screenshot.image} alt="" className="w-full block" style={{ height: 'auto', minHeight: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                            <Upload className="w-16 h-16 text-neutral-300" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => onDownload(screenshotRef.current, screenshot.title, deviceConfig)} className="w-full bg-slate-100 hover:bg-white text-slate-900 py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors" style={{ maxWidth: `${previewWidth}px` }}>
              <Download className="w-4 h-4" /> Download
            </button>
          </div>

          {/* Editor */}
          <div className="flex-1 min-w-0">
            {/* Image Upload */}
            <div onClick={() => fileInputRef.current?.click()} className="border border-dashed border-slate-700 rounded-lg p-3 mb-3 hover:border-slate-600 hover:bg-slate-800/50 cursor-pointer transition-colors">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Upload className="w-4 h-4" />
                {screenshot.image ? 'Change screenshot image' : 'Upload screenshot image'}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-3 overflow-x-auto">
              {(['text', 'style', 'layout', 'device'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-slate-100 text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                  {tab === 'text' && <Type className="w-3 h-3 inline mr-1" />}
                  {tab === 'style' && <Palette className="w-3 h-3 inline mr-1" />}
                  {tab === 'layout' && <Settings2 className="w-3 h-3 inline mr-1" />}
                  {tab === 'device' && <Smartphone className="w-3 h-3 inline mr-1" />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-3">
              {activeTab === 'text' && (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Title</label>
                    <textarea value={screenshot.title} onChange={(e) => onUpdate(screenshot.id, { title: e.target.value })} rows={2} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm resize-none focus:border-slate-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Subtitle</label>
                    <textarea value={screenshot.subtitle} onChange={(e) => onUpdate(screenshot.id, { subtitle: e.target.value })} rows={2} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm resize-none focus:border-slate-500 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Font</label>
                      <select value={screenshot.fontFamily} onChange={(e) => onUpdate(screenshot.id, { fontFamily: e.target.value })} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs">
                        {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Align</label>
                      <div className="flex gap-1">
                        {(['left', 'center', 'right'] as const).map(a => (
                          <button key={a} onClick={() => onUpdate(screenshot.id, { textAlign: a })} className={`flex-1 py-1.5 rounded text-xs transition-colors ${screenshot.textAlign === a ? 'bg-slate-100 text-slate-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{a[0].toUpperCase()}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Title Size: {screenshot.titleFontSize}</label>
                      <input type="range" min="48" max="140" value={screenshot.titleFontSize} onChange={(e) => onUpdate(screenshot.id, { titleFontSize: parseInt(e.target.value) })} className="w-full accent-slate-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Sub Size: {screenshot.subtitleFontSize}</label>
                      <input type="range" min="24" max="80" value={screenshot.subtitleFontSize} onChange={(e) => onUpdate(screenshot.id, { subtitleFontSize: parseInt(e.target.value) })} className="w-full accent-slate-400" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={screenshot.textShadow} onChange={(e) => onUpdate(screenshot.id, { textShadow: e.target.checked })} className="accent-slate-400" />
                    <span className="text-xs text-slate-300">Text shadow</span>
                  </label>
                </>
              )}

              {activeTab === 'style' && (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Themes</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PRESET_THEMES.map(t => (
                        <button key={t.name} onClick={() => onUpdate(screenshot.id, { bgColor1: t.bgColor1, bgColor2: t.bgColor2, bgColor3: t.bgColor3, titleColor: t.titleColor, subtitleColor: t.subtitleColor })} className="p-1 rounded hover:ring-2 hover:ring-slate-500 transition-all" title={t.name}>
                          <div className="w-full h-6 rounded" style={{ background: `linear-gradient(135deg, ${t.bgColor1} 0%, ${t.bgColor3} 100%)` }} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Title</label>
                      <div className="flex gap-1">
                        <input type="color" value={screenshot.titleColor} onChange={(e) => onUpdate(screenshot.id, { titleColor: e.target.value })} className="w-8 h-7 rounded cursor-pointer bg-transparent" />
                        <input type="text" value={screenshot.titleColor} onChange={(e) => onUpdate(screenshot.id, { titleColor: e.target.value })} className="flex-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Subtitle</label>
                      <div className="flex gap-1">
                        <input type="color" value={screenshot.subtitleColor} onChange={(e) => onUpdate(screenshot.id, { subtitleColor: e.target.value })} className="w-8 h-7 rounded cursor-pointer bg-transparent" />
                        <input type="text" value={screenshot.subtitleColor} onChange={(e) => onUpdate(screenshot.id, { subtitleColor: e.target.value })} className="flex-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs font-mono" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Background</label>
                    <div className="flex gap-1 items-center">
                      <input type="color" value={screenshot.bgColor1} onChange={(e) => onUpdate(screenshot.id, { bgColor1: e.target.value })} className="w-8 h-7 rounded cursor-pointer bg-transparent" />
                      <input type="color" value={screenshot.bgColor2} onChange={(e) => onUpdate(screenshot.id, { bgColor2: e.target.value })} className="w-8 h-7 rounded cursor-pointer bg-transparent" />
                      <input type="color" value={screenshot.bgColor3} onChange={(e) => onUpdate(screenshot.id, { bgColor3: e.target.value })} className="w-8 h-7 rounded cursor-pointer bg-transparent" />
                      <div className="flex-1 h-7 rounded" style={{ background: `linear-gradient(135deg, ${screenshot.bgColor1} 0%, ${screenshot.bgColor2} 50%, ${screenshot.bgColor3} 100%)` }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Pattern</label>
                    <select value={screenshot.bgPattern || ''} onChange={(e) => onUpdate(screenshot.id, { bgPattern: e.target.value })} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs">
                      <option value="">None</option>
                      <option value="dots">Dots</option>
                      <option value="grid">Grid</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'layout' && (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Text Y: {screenshot.textTopOffset || 0}</label>
                    <input type="range" min="-200" max="1200" value={screenshot.textTopOffset || 0} onChange={(e) => onUpdate(screenshot.id, { textTopOffset: parseInt(e.target.value) })} className="w-full accent-slate-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Text X: {screenshot.textHorizontalOffset || 0}</label>
                    <input type="range" min="-400" max="400" value={screenshot.textHorizontalOffset || 0} onChange={(e) => onUpdate(screenshot.id, { textHorizontalOffset: parseInt(e.target.value) })} className="w-full accent-slate-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Device Y: {screenshot.phoneTopOffset || 0}</label>
                    <input type="range" min="-600" max="200" value={screenshot.phoneTopOffset || 0} onChange={(e) => onUpdate(screenshot.id, { phoneTopOffset: parseInt(e.target.value) })} className="w-full accent-slate-400" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Gradient: {screenshot.gradientHeight || 400}</label>
                    <input type="range" min="200" max="800" value={screenshot.gradientHeight || 400} onChange={(e) => onUpdate(screenshot.id, { gradientHeight: parseInt(e.target.value) })} className="w-full accent-slate-400" />
                  </div>
                </>
              )}

              {activeTab === 'device' && (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Device</label>
                    <select value={screenshot.deviceType} onChange={(e) => onUpdate(screenshot.id, { deviceType: e.target.value as DeviceType })} className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs">
                      {Object.entries(DEVICE_CONFIGS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Color</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {Object.entries(DEVICE_COLORS).map(([k, v]) => (
                        <button key={k} onClick={() => onUpdate(screenshot.id, { deviceColor: k as DeviceColor })} className={`w-7 h-7 rounded-full border-2 transition-transform ${screenshot.deviceColor === k ? 'border-slate-300 scale-110' : 'border-transparent hover:scale-105'}`} style={{ background: v.gradient }} title={v.name} />
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={screenshot.showDeviceFrame} onChange={(e) => onUpdate(screenshot.id, { showDeviceFrame: e.target.checked })} className="accent-slate-400" />
                    <span className="text-xs text-slate-300">Show device frame</span>
                  </label>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
