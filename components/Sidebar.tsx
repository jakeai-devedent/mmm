
import React, { useState } from 'react';
import { EditorTool } from '../types.ts';
import { SparklesIcon, EraserIcon, MaximizeIcon, ImageIcon, WandIcon } from './Icons.tsx';

interface SidebarProps {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  onGenerate: (prompt: string) => void;
  onEdit: (instruction: string) => void;
  onErase: (description: string) => void;
  onUpscale: () => void;
  onRemoveBG: () => void;
  isProcessing: boolean;
  hasImage: boolean;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onClearMask: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTool,
  onToolChange,
  onGenerate,
  onEdit,
  onErase,
  onUpscale,
  onRemoveBG,
  isProcessing,
  hasImage,
  brushSize,
  onBrushSizeChange,
  onClearMask
}) => {
  const [prompt, setPrompt] = useState('');

  const tools = [
    { id: EditorTool.GENERATE, icon: SparklesIcon, label: 'Generate' },
    { id: EditorTool.EDIT, icon: WandIcon, label: 'Edit' },
    { id: EditorTool.ERASE, icon: EraserIcon, label: 'Erase Object' },
    { id: EditorTool.UPSCALE, icon: MaximizeIcon, label: 'Upscale' },
    { id: EditorTool.REMOVE_BG, icon: ImageIcon, label: 'Remove BG' },
  ];

  const handleAction = () => {
    if (activeTool === EditorTool.GENERATE) onGenerate(prompt);
    if (activeTool === EditorTool.EDIT) onEdit(prompt);
    if (activeTool === EditorTool.ERASE) onErase(prompt);
    if (activeTool === EditorTool.UPSCALE) onUpscale();
    if (activeTool === EditorTool.REMOVE_BG) onRemoveBG();
  };

  return (
    <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full shadow-2xl z-20">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
          Lumina AI Studio
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Professional Creative AI</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            disabled={!hasImage && tool.id !== EditorTool.GENERATE}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTool === tool.id
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-lg'
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
            } ${(!hasImage && tool.id !== EditorTool.GENERATE) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <tool.icon />
            <span className="font-medium">{tool.label}</span>
          </button>
        ))}

        {activeTool === EditorTool.ERASE && hasImage && (
          <div className="mt-6 p-4 bg-zinc-800/50 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Brush Size</label>
              <span className="text-xs text-zinc-500 font-mono">{brushSize}px</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="100" 
              value={brushSize} 
              onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <button 
              onClick={onClearMask}
              className="w-full py-2 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-lg transition-colors"
            >
              Clear Painting
            </button>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
        {(activeTool === EditorTool.GENERATE || activeTool === EditorTool.EDIT || activeTool === EditorTool.ERASE) ? (
          <div className="space-y-4">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {activeTool === EditorTool.GENERATE ? 'Imagine something...' : 
               activeTool === EditorTool.ERASE ? 'Describe selection' : 'What should change?'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeTool === EditorTool.GENERATE ? "A cinematic portrait of a cyberpunk explorer..." : 
                activeTool === EditorTool.ERASE ? "What are you erasing? (e.g. 'the person')" : "Change the sky to sunset..."
              }
              className="w-full h-28 bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-zinc-600"
            />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <p className="text-sm text-zinc-400 leading-relaxed">
              {activeTool === EditorTool.UPSCALE ? "Instantly enhance resolution and details using advanced AI." : 
               "Remove the background with surgical precision while keeping the subject."}
            </p>
          </div>
        )}

        <button
          onClick={handleAction}
          disabled={isProcessing || (!prompt && (activeTool === EditorTool.GENERATE || activeTool === EditorTool.EDIT || activeTool === EditorTool.ERASE))}
          className={`w-full mt-6 py-4 px-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${
            isProcessing 
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none' 
              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] active:scale-95'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Processing...</span>
            </div>
          ) : 'Apply AI Action'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
