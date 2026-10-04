export type PageFormat = 'a4' | 'letter' | 'legal' | 'square';
export type PageOrientation = 'portrait' | 'landscape' | 'auto';
export type GridLayout = '1_per_page' | '2_per_page' | '3_per_page' | '4_per_page' | '6_per_page';
export type MarginOption = 'none' | 'narrow' | 'standard' | 'wide';
export type FilterPreset = 'none' | 'grayscale' | 'scan' | 'contrast' | 'warm' | 'cool' | 'invert';
export type ImageFit = 'contain' | 'cover' | 'original';
export type CoverTheme = 'minimal' | 'executive' | 'modern_dark' | 'editorial';
export type PageBackground = 'white' | 'warm_white' | 'light_gray' | 'dark';

export interface UploadedImage {
  id: string;
  name: string;
  type: string;
  size: number;
  originalUrl: string;
  previewUrl: string;
  width: number;
  height: number;
  rotation: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  fit: ImageFit;
  filter: FilterPreset;
  brightness: number; // -50 to +50
  contrast: number;   // -50 to +50
  saturation: number; // 0 to 200 (100 = normal)
  title: string;
  caption: string;
  selected?: boolean;
}

export interface PdfConfig {
  documentTitle: string;
  pageSize: PageFormat;
  orientation: PageOrientation;
  layout: GridLayout;
  margin: MarginOption;
  imageQuality: number; // 0.7 to 1.0
  includeCover: boolean;
  coverTitle: string;
  coverSubtitle: string;
  coverAuthor: string;
  coverDate: string;
  coverTheme: CoverTheme;
  showPageNumbers: boolean;
  showHeaders: boolean;
  headerText: string;
  showImageTitles: boolean;
  showImageCaptions: boolean;
  backgroundColor: PageBackground;
}

export interface GeneratedPdfResult {
  blob: Blob;
  dataUrl: string;
  filename: string;
  pageCount: number;
  fileSizeBytes: number;
}

export interface SavedPdfHistoryItem {
  id: string;
  filename: string;
  title: string;
  date: string;
  pageCount: number;
  imageCount: number;
  fileSizeBytes: number;
  dataUrl?: string;
}
