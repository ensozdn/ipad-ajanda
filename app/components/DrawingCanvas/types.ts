export type BackgroundType = 'plain' | 'lined' | 'grid';
export type ToolType = 'pen' | 'eraser' | 'highlighter' | 'marker' | 'pencil' | 'crayon' | 'line' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'image';
export type LineStyleType = 'solid' | 'dashed' | 'dotted';

export interface Page {
  id: string;
  imageData: string;
  background: BackgroundType;
  placedTexts?: PlacedText[];
  placedImages?: PlacedImageData[];
}

export interface PlacedText {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
}

export interface PlacedImageData {
  x: number;
  y: number;
  width: number;
  height: number;
  imageData: string;
}

export interface PlacedImage {
  img: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectedImage {
  img: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextInput {
  x: number;
  y: number;
  text: string;
}

export interface Point {
  x: number;
  y: number;
}
