
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { EditorTool, ImageHistory } from './types';
import { generateImage, editImage, upscaleImage, removeBackground, eraseObject } from './services/geminiService';
import { UploadIcon, DownloadIcon, LoaderIcon } from './components/Icons';

const App: React.FC = () => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<ImageHistory[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState<EditorTool>(EditorTool.GENERATE);
  const [brushSize, setBrushSize] = useState(40);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const addImageToHistory = useCallback((url: string, prompt?: string) => {
    const newItem: ImageHistory = {
      id: Math.random().toString(36).substr(2, 9),
      url,
      prompt,
      timestamp: Date.now()
    };
    setHistory(prev => [newItem, ...prev].slice(0, 10));
    setCurrentImage(url);
    clearMask();
  }, []);

  const clearMask = () => {
    const canvas = maskCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    if (activeTool !== EditorTool.ERASE) {
      clearMask();
    }
  }, [activeTool]);

  const getCanvasMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Calculate scale factor in case image is zoomed/resized
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (activeTool !== EditorTool.ERASE || !currentImage) return;
    setIsDrawing(true);
    const pos = getCanvasMousePos(e);
    const ctx = maskCanvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'; // Red semi-transparent for visibility
      ctx.lineWidth = brushSize;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || activeTool !== EditorTool.ERASE) return;
    const pos = getCanvasMousePos(e);
    const ctx = maskCanvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleGenerate = async (prompt: string) => {
    setIsProcessing(true);
    const result = await generateImage(prompt);
    if (result) addImageToHistory(result, prompt);
    setIsProcessing(false);
  };

  const handleEdit = async (instruction: string) => {
    if (!currentImage) return;
    setIsProcessing(true);
    const result = await editImage(currentImage, instruction);
    if (result) addImageToHistory(result, instruction);
    setIsProcessing(false);
  };

  const handleErase = async (description: string) => {
    if (!currentImage) return;
    setIsProcessing(true);
    // In a real sophisticated inpainting, we'd send the mask data too. 
    // Here we use the description and visual cues for Gemini.
    const result = await eraseObject(currentImage, description);
    if (result) addImageToHistory(result, `Erased ${description}`);
    setIsProcessing(false);
  };

  const handleUpscale = async () => {
    if (!currentImage) return;
    setIsProcessing(true);
    const result = await upscaleImage(currentImage);
    if (result) addImageToHistory(result, 'AI Upscale');
    setIsProcessing(false);
  };

  const handleRemoveBG = async () => {
    if (!currentImage) return;
    setIsProcessing(true);
    const result = await removeBackground(currentImage);
    if (result) addImageToHistory(result, 'Background Removed');
    setIsProcessing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        addImageToHistory(result, 'Uploaded Image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = `lumina-ai-edit-${Date.now()}.png`;
    link.click();
  };

  // Synchronize canvas size with displayed image size
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (maskCanvasRef.current) {
      maskCanvasRef.current.width = img.naturalWidth;
      maskCanvasRef.current.height = img.naturalHeight;
    }
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden select-none">
      <Sidebar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onGenerate={handleGenerate}
        onEdit={handleEdit}
        onErase={handleErase}
        onUpscale={handleUpscale}
        onRemoveBG={handleRemoveBG}
        isProcessing={isProcessing}
        hasImage={!!currentImage}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
        onClearMask={clearMask}
      />

      <main className="flex-1 flex flex-col relative bg-zinc-950 canvas-bg">
        {/* Header Bar */}
        <div className="h-16 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6 z-30">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-sm transition-all"
            >
              <UploadIcon />
              <span>Upload Image</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
              accept="image/*" 
            />
          </div>

          <div className="flex items-center space-x-4">
            {currentImage && (
              <button 
                onClick={handleDownload}
                className="flex items-center space-x-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-sm transition-all text-zinc-300"
              >
                <DownloadIcon />
                <span>Download Result</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden" ref={containerRef}>
          {isProcessing && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-zinc-900/90 p-10 rounded-3xl border border-zinc-800 shadow-2xl flex flex-col items-center space-y-6">
                <div className="relative">
                   <div className="absolute inset-0 bg-purple-500/30 blur-2xl rounded-full"></div>
                   <LoaderIcon />
                </div>
                <div className="text-center">
                  <p className="text-white text-lg font-semibold tracking-wide">AI Magic in Progress</p>
                  <p className="text-zinc-500 text-sm mt-2">Reimagining your image pixels...</p>
                </div>
              </div>
            </div>
          )}

          {currentImage ? (
            <div className={`relative flex items-center justify-center max-w-full max-h-full transition-all duration-300 ${activeTool === EditorTool.ERASE ? 'cursor-crosshair' : ''}`}>
              <img 
                src={currentImage} 
                alt="Edited" 
                onLoad={onImageLoad}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl border border-zinc-800"
                style={{ pointerEvents: 'none' }}
              />
              
              {/* Drawing Layer */}
              <canvas
                ref={maskCanvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className={`absolute inset-0 w-full h-full object-contain rounded-xl z-20 transition-opacity ${activeTool === EditorTool.ERASE ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              />
              
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full text-[10px] text-zinc-400 font-mono uppercase tracking-[0.2em]">
                {activeTool === EditorTool.ERASE ? 'Brush to Mark Removal Area' : 'AI Studio Canvas'}
              </div>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center space-y-6 p-16 border-2 border-dashed border-zinc-800 rounded-[2.5rem] hover:border-purple-500/50 hover:bg-zinc-900/50 transition-all cursor-pointer group max-w-lg"
            >
              <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:bg-zinc-800 transition-all shadow-xl">
                <UploadIcon />
              </div>
              <div className="text-center space-y-2">
                <p className="text-zinc-200 text-xl font-bold tracking-tight">Ready to create?</p>
                <p className="text-zinc-500 text-sm leading-relaxed">Upload a high-res image to begin editing with world-class AI models.</p>
              </div>
            </div>
          )}
        </div>

        {/* History / Versions Bar */}
        <div className="h-32 border-t border-zinc-900 bg-zinc-950/95 flex items-center px-8 space-x-8 overflow-x-auto z-30">
          <div className="flex-none">
            <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-3">Snapshots</div>
            <div className="h-1 w-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
          </div>
          <div className="flex space-x-5 py-4">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentImage(item.url)}
                className={`flex-none w-20 h-20 rounded-2xl border-2 overflow-hidden transition-all duration-500 relative group ${
                  currentImage === item.url ? 'border-purple-500 ring-4 ring-purple-500/20 scale-105' : 'border-zinc-800 opacity-40 hover:opacity-100 hover:border-zinc-700'
                }`}
              >
                <img src={item.url} alt="History" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            ))}
            {history.length === 0 && (
              <div className="flex items-center text-zinc-800 font-medium text-sm italic tracking-wide">
                Recent edits will appear here
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
