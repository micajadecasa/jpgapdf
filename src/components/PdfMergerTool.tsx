import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Layers,
  ChevronUp,
  ChevronDown,
  Trash2,
  Download,
  Share2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
  FileCheck,
  RefreshCw,
  FolderPlus,
} from 'lucide-react';
import {
  PdfToMergeItem,
  MergedPdfOutput,
  inspectPdfForMerge,
  mergePdfDocuments,
} from '../utils/pdfMerger';
import { downloadBlob } from '../utils/pdfToJpg';
import { formatBytes } from '../utils/imageProcessor';
import jsPDF from 'jspdf';

interface PdfMergerToolProps {
  onSwitchToPdfToJpg?: () => void;
  onSwitchToImagesToPdf?: () => void;
}

export const PdfMergerTool: React.FC<PdfMergerToolProps> = ({
  onSwitchToPdfToJpg,
  onSwitchToImagesToPdf,
}) => {
  const [items, setItems] = useState<PdfToMergeItem[]>([]);
  const [outputFilename, setOutputFilename] = useState<string>('Documentos_Combinados.pdf');
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [isReadingFiles, setIsReadingFiles] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [mergedResult, setMergedResult] = useState<MergedPdfOutput | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const rawFiles = Array.from(fileList);
    const pdfFiles = rawFiles.filter(
      (f) => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf'
    );

    if (pdfFiles.length === 0) {
      setErrorMessage('Por favor, selecciona archivos en formato PDF (.pdf).');
      return;
    }

    setErrorMessage(null);
    setIsReadingFiles(true);

    try {
      const newItems: PdfToMergeItem[] = [];

      for (let i = 0; i < pdfFiles.length; i++) {
        const file = pdfFiles[i];
        const inspection = await inspectPdfForMerge(file);
        newItems.push({
          id: `pdf_merge_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          file,
          name: file.name,
          sizeBytes: file.size,
          pageCount: inspection.pageCount,
          thumbnailUrl: inspection.thumbnailUrl,
        });
      }

      setItems((prev) => [...prev, ...newItems]);
      setMergedResult(null);
    } catch (err: any) {
      console.error('Error inspeccionando archivos PDF:', err);
      setErrorMessage('Ocurrió un error al leer los archivos PDF.');
    } finally {
      setIsReadingFiles(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setItems(updated);
    setMergedResult(null);
  };

  const handleDelete = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    setMergedResult(null);
  };

  const handleMerge = async () => {
    if (items.length < 2) {
      setErrorMessage('Añade al menos 2 archivos PDF para poder unirlos.');
      return;
    }

    setIsMerging(true);
    setErrorMessage(null);
    setProgressPercent(0);
    setProgressStatus('Iniciando combinación de documentos...');

    try {
      const result = await mergePdfDocuments(items, outputFilename, (curr, total, msg) => {
        const pct = Math.round((curr / total) * 100);
        setProgressPercent(pct);
        setProgressStatus(msg);
      });

      setMergedResult(result);
    } catch (err: any) {
      console.error('Error al unir PDFs:', err);
      setErrorMessage(err.message || 'No se pudieron combinar los archivos PDF.');
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownloadMerged = () => {
    if (!mergedResult) return;
    downloadBlob(mergedResult.blob, mergedResult.filename);
  };

  const handleShareMobile = async () => {
    if (!mergedResult) return;

    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([mergedResult.blob], mergedResult.filename, {
          type: 'application/pdf',
        });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: mergedResult.filename,
            text: 'Documentos PDF combinados con FolioPDF',
          });
          return;
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleDownloadMerged();
        }
        return;
      }
    }

    handleDownloadMerged();
  };

  // Helper: create 2 sample PDFs for testing with 1 click
  const handleLoadSamples = async () => {
    setIsReadingFiles(true);
    try {
      // PDF 1: Contrato o Memoria
      const doc1 = new jsPDF();
      doc1.setFillColor(37, 99, 235);
      doc1.rect(0, 0, 210, 30, 'F');
      doc1.setTextColor(255, 255, 255);
      doc1.setFontSize(18);
      doc1.text('Documento A: Memoria Descriptiva', 20, 20);
      doc1.setTextColor(71, 85, 105);
      doc1.setFontSize(12);
      doc1.text('Parte inicial del expediente que contiene los antecedentes.', 20, 50);
      doc1.text('Página 1 de 2 de la Memoria.', 20, 65);
      doc1.addPage();
      doc1.text('Página 2 de 2: Conclusiones de la memoria.', 20, 30);
      const blob1 = doc1.output('blob');
      const file1 = new File([blob1], '01_Memoria_Descriptiva.pdf', { type: 'application/pdf' });

      // PDF 2: Factura o Anexo
      const doc2 = new jsPDF();
      doc2.setFillColor(16, 185, 129);
      doc2.rect(0, 0, 210, 30, 'F');
      doc2.setTextColor(255, 255, 255);
      doc2.setFontSize(18);
      doc2.text('Documento B: Factura y Anexo Final', 20, 20);
      doc2.setTextColor(71, 85, 105);
      doc2.setFontSize(12);
      doc2.text('Comprobante financiero y liquidación correspondiente.', 20, 50);
      const blob2 = doc2.output('blob');
      const file2 = new File([blob2], '02_Factura_Anexo.pdf', { type: 'application/pdf' });

      await handleFilesSelected([file1, file2]);
    } finally {
      setIsReadingFiles(false);
    }
  };

  const totalPagesCount = items.reduce((acc, curr) => acc + curr.pageCount, 0);
  const totalSizeBytes = items.reduce((acc, curr) => acc + curr.sizeBytes, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Layers className="w-64 h-64 text-white" />
        </div>

        <div className="max-w-2xl space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs border border-white/20">
            <Layers className="w-3.5 h-3.5" />
            <span>Herramienta: Unir varios PDF</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Combina múltiples archivos PDF en un solo documento
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
            Sube tus documentos, ordénalos con arrastrar o flechas y únelos en un único archivo PDF
            completo. Rápido, sin pérdida de calidad y 100% privado en tu navegador.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-900 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(e.target.files);
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {/* Upload & Files Management Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        {items.length === 0 ? (
          /* Empty Drag & Drop Zone */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-600 bg-indigo-50/60 scale-[1.01]'
                : 'border-slate-300 hover:border-indigo-500 hover:bg-slate-50'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4 shadow-xs">
              {isReadingFiles ? (
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FolderPlus className="w-8 h-8" />
              )}
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Arrastra y suelta tus archivos PDF aquí
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Puedes seleccionar varios PDFs a la vez para unirlos en el orden que desees.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={isReadingFiles}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Seleccionar archivos PDF
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSamples();
                }}
                disabled={isReadingFiles}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Probar con 2 PDFs de ejemplo</span>
              </button>
            </div>
          </div>
        ) : (
          /* Populated PDF List */
          <div className="space-y-4">
            {/* Header summary of loaded items */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {items.length} {items.length === 1 ? 'documento cargado' : 'documentos listos para unir'}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500">
                  {totalPagesCount} páginas en total · {formatBytes(totalSizeBytes)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isMerging}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir más PDFs</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setItems([]);
                    setMergedResult(null);
                  }}
                  disabled={isMerging}
                  className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  Vaciar lista
                </button>
              </div>
            </div>

            {/* List of draggable/reorderable PDFs */}
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-3 flex items-center gap-3 transition-colors group shadow-2xs"
                >
                  {/* Order indicator */}
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs">
                    {index + 1}
                  </div>

                  {/* Thumbnail / PDF Icon */}
                  <div className="w-11 h-14 bg-white rounded-lg border border-slate-200 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <FileText className="w-6 h-6 text-red-500" />
                    )}
                  </div>

                  {/* Document metadata */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-semibold text-indigo-600">
                        {item.pageCount} {item.pageCount === 1 ? 'página' : 'páginas'}
                      </span>
                      <span>·</span>
                      <span>{formatBytes(item.sizeBytes)}</span>
                    </p>
                  </div>

                  {/* Reorder actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0 || isMerging}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 transition-colors cursor-pointer"
                      title="Mover arriba (se unirá antes)"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === items.length - 1 || isMerging}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 disabled:opacity-30 transition-colors cursor-pointer"
                      title="Mover abajo (se unirá después)"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(index)}
                      disabled={isMerging}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ml-1"
                      title="Quitar este documento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Merge Settings & Final Trigger */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex-1 max-w-sm">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre del archivo final
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={outputFilename}
                    onChange={(e) => setOutputFilename(e.target.value)}
                    placeholder="Documentos_Unidos.pdf"
                    className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 pointer-events-none">
                    .pdf
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleMerge}
                disabled={items.length < 2 || isMerging}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                {isMerging ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uniendo documentos...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>Unir {items.length} PDFs en uno</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar during merge */}
        {isMerging && (
          <div className="p-4 bg-indigo-50/80 rounded-xl border border-indigo-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-indigo-900 font-semibold">
              <span className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>{progressStatus || 'Uniendo PDFs...'}</span>
              </span>
              <span className="font-mono tabular-nums">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Merged Success Results Card */}
      {mergedResult && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-md space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ¡PDFs unidos con éxito en un solo documento!
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Archivo: <span className="font-semibold text-slate-800">{mergedResult.filename}</span> · {mergedResult.totalPageCount} páginas combinadas · {formatBytes(mergedResult.sizeBytes)}
                </p>
              </div>
            </div>

            {/* Main Download & Share Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadMerged}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar PDF Unido</span>
              </button>

              <button
                type="button"
                onClick={handleShareMobile}
                className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Compartir por WhatsApp, Telegram, Correo o Google Drive"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartir</span>
              </button>

              <a
                href={mergedResult.dataUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-slate-600" />
                <span>Abrir visor</span>
              </a>
            </div>
          </div>

          {/* Quick shortcuts to other tools */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>¿Quieres realizar otra acción con este archivo?</span>
            <div className="flex items-center gap-4">
              {onSwitchToPdfToJpg && (
                <button
                  type="button"
                  onClick={onSwitchToPdfToJpg}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold underline cursor-pointer"
                >
                  Extraer sus páginas a JPG
                </button>
              )}
              {onSwitchToImagesToPdf && (
                <button
                  type="button"
                  onClick={onSwitchToImagesToPdf}
                  className="text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                >
                  Ir a Crear PDF desde fotos
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
