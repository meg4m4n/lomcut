import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';

// Load PDF.js from the global window object
const pdfjsLib = (window as any).pdfjsLib;

// Ensure the worker is correctly set
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js";

interface PDFViewerProps {
  file: File | null;
  onSaveSnapshot?: (snapshot: string, pageNumber: number) => void;
}

interface Mark {
  x: number;
  y: number;
  type: "cut" | "defect";
}

export function PDFViewer({ file, onSaveSnapshot }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [scale, setScale] = useState(1);
  const [markType, setMarkType] = useState<"cut" | "defect">("cut");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load PDF document
  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // First check if the file is actually a PDF
        if (!file.type.includes('pdf')) {
          throw new Error('O arquivo selecionado não é um PDF válido.');
        }

        const arrayBuffer = await file.arrayBuffer();
        const typedarray = new Uint8Array(arrayBuffer);
        
        const loadingTask = pdfjsLib.getDocument({ data: typedarray });
        
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        
        const page = await doc.getPage(1);
        await renderPage(page);
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar o PDF. Por favor, tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();

    return () => {
      if (pdfDoc) {
        pdfDoc.destroy().catch(console.error);
      }
    };
  }, [file]);

  const renderPage = async (page: any) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    try {
      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
      // Draw marks after PDF renders
      marks.forEach((mark) => {
        drawMark(context, mark.x, mark.y, mark.type);
      });
    } catch (err) {
      console.error("Error rendering PDF page:", err);
      setError('Erro ao renderizar a página. Por favor, tente novamente.');
    }
  };

  const changePage = async (delta: number) => {
    const newPage = currentPage + delta;
    if (!pdfDoc || newPage < 1 || newPage > totalPages) return;

    setIsLoading(true);
    setError(null);
    try {
      const page = await pdfDoc.getPage(newPage);
      setCurrentPage(newPage);
      setMarks([]); // Clear marks when changing pages
      await renderPage(page);
    } catch (err) {
      console.error("Error changing page:", err);
      setError('Erro ao mudar de página. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWheel = async (event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.5, Math.min(3, scale + delta));
      
      if (newScale !== scale) {
        setScale(newScale);
        
        if (pdfDoc) {
          try {
            const page = await pdfDoc.getPage(currentPage);
            await renderPage(page);
          } catch (err) {
            console.error("Error updating zoom:", err);
            setError('Erro ao ajustar o zoom. Por favor, tente novamente.');
          }
        }
      }
    }
  };

  const drawMark = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: "cut" | "defect"
  ) => {
    const size = 15;
    context.save();
    
    if (type === "cut") {
      // Checkmark for cut
      context.strokeStyle = "#22c55e";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(x - size/2, y);
      context.lineTo(x - size/6, y + size/2);
      context.lineTo(x + size/2, y - size/2);
      context.stroke();
    } else {
      // X mark for defect
      context.strokeStyle = "#ef4444";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(x - size/2, y - size/2);
      context.lineTo(x + size/2, y + size/2);
      context.moveTo(x + size/2, y - size/2);
      context.lineTo(x - size/2, y + size/2);
      context.stroke();
    }
    
    context.restore();
  };

  const handleCanvasClick = async (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !pdfDoc) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicking near an existing mark to remove it
    const threshold = 15;
    const existingMarkIndex = marks.findIndex(
      (mark) => Math.abs(mark.x - x) < threshold && Math.abs(mark.y - y) < threshold
    );

    if (existingMarkIndex !== -1) {
      // Remove the mark
      const newMarks = marks.filter((_, i) => i !== existingMarkIndex);
      setMarks(newMarks);
      
      // Redraw the page and remaining marks
      try {
        const page = await pdfDoc.getPage(currentPage);
        await renderPage(page);
      } catch (err) {
        console.error("Error redrawing page:", err);
        setError('Erro ao atualizar as marcações. Por favor, tente novamente.');
      }
    } else {
      // Add new mark
      const newMark = { x, y, type: markType };
      setMarks(prev => [...prev, newMark]);
      
      // Draw the new mark
      const context = canvas.getContext("2d");
      if (context) {
        drawMark(context, x, y, markType);
      }
    }
  };

  const takeSnapshot = () => {
    if (!canvasRef.current || !onSaveSnapshot) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSaveSnapshot(dataUrl, currentPage);
    } catch (err) {
      console.error("Error taking snapshot:", err);
      setError('Erro ao capturar imagem. Por favor, tente novamente.');
    }
  };

  if (!file) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">Selecione um arquivo PDF para visualizar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMarkType("cut")}
            className={`px-3 py-1 rounded-lg flex items-center gap-1 ${
              markType === "cut"
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            ✓ Corte
          </button>
          <button
            onClick={() => setMarkType("defect")}
            className={`px-3 py-1 rounded-lg flex items-center gap-1 ${
              markType === "defect"
                ? "bg-red-100 text-red-700 border border-red-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            ✕ Defeito
          </button>
        </div>
        {onSaveSnapshot && (
          <button
            onClick={takeSnapshot}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Camera className="w-4 h-4" />
            <span>Capturar</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div 
        className="border rounded-lg overflow-hidden bg-gray-50 relative"
        onWheel={handleWheel}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="cursor-crosshair mx-auto"
        />
      </div>

      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => changePage(-1)}
            disabled={currentPage <= 1 || isLoading}
            className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={currentPage >= totalPages || isLoading}
            className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="text-sm text-gray-500">
          Zoom: {Math.round(scale * 100)}% (Ctrl + Scroll)
        </div>
      </div>
    </div>
  );
}