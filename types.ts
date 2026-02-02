
export enum EditorTool {
  GENERATE = 'GENERATE',
  EDIT = 'EDIT',
  ERASE = 'ERASE',
  UPSCALE = 'UPSCALE',
  REMOVE_BG = 'REMOVE_BG'
}

export interface ImageHistory {
  id: string;
  url: string;
  prompt?: string;
  timestamp: number;
}

export interface EditorState {
  currentImage: string | null;
  history: ImageHistory[];
  isProcessing: boolean;
  activeTool: EditorTool;
  brushSize: number;
}
