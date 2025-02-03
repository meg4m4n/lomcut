import React, { useEffect, useRef, useState } from "react";
import { Download } from 'lucide-react';

// Load PDF.js from the global window object
const pdfjsLib = (window as any).pdfjsLib;

// Ensure the worker is correctly set
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js";

interface PDFViewerProps {
  file: File | null;
  onTextExtracted?: (lines: string[]) => void;
}

interface MarkedPiece {
  x: number;
  y: number;
  type: "cut" | "defect";
}

interface TextItem {
  text: string;
  x: number;
  y: number;
}

export function PDFViewer({ file, onTextExtracted }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [markedPieces, setMarkedPieces] = useState<MarkedPiece[]>([]);
  const [scale, setScale] = useState(1);

  // Load PDF document and extract text
  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
      try {
        const fileReader = new FileReader();
        fileReader.onload = async function () {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const doc = await pdfjsLib.getDocument({ data: typedarray }).promise;
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          const page = await doc.getPage(1);
          renderPage(page);

          // Extract text content
          const textContent = await page.getTextContent();
          const items = textContent.items.map((item: any) => ({
            text: item.str,
            x: item.transform[4],
            y: item.transform[5],
          }));

          // Group and sort text items
          const groupedText = items.reduce((acc: { [key: number]: TextItem[] }, item) => {
            const roundedY = Math.round(item.y / 10) * 10;
            if (!acc[roundedY]) {
              acc[roundedY] = [];
            }
            acc[roundedY].push(item);
            return acc;
          }, {});

          const sortedLines = Object.entries(groupedText)
            .sort(([y1], [y2]) => Number(y2) - Number(y1))
            .map(([_, items]) => 
              items.sort((a, b) => a.x - b.x).map(item => item.text).join(' ')
            );

          if (onTextExtracted) {
            onTextExtracted(sortedLines);
          }
        };
        fileReader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };

    loadPDF();

    return () => {
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, [file, onTextExtracted]);

  const renderPage = async (page: any) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    try {
      await page.render(renderContext).promise;
      // Draw marks after PDF renders
      markedPieces.forEach((piece) => {
        drawMarker(context, piece.x, piece.y, piece.type);
      });
    } catch (error) {
      console.error("Error rendering page:", error);
    }
  };

  // Change page
  const changePage = async (newPage: number) => {
    if (!pdfDoc || newPage < 1 || newPage > totalPages) return;

    try {
      const page = await pdfDoc.getPage(newPage);
      setCurrentPage(newPage);
      renderPage(page);
    } catch (error) {
      console.error("Error changing page:", error);
    }
  };

  // Handle zoom
  const handleWheel = (event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      setScale((prevScale) => {
        const newScale = Math.max(0.5, Math.min(3, prevScale + delta));
        if (pdfDoc) {
          pdfDoc.getPage(currentPage).then((page: any) => renderPage(page));
        }
        return newScale;
      });
    }
  };

  // Draw a marker on the canvas
  const drawMarker = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: "cut" | "defect"
  ) => {
    context.save();
    context.beginPath();
    context.arc(x, y, 6, 0, 2 * Math.PI);
    context.fillStyle = type === "cut" ? "rgba(34, 197, 94, 0.8)" : "rgba(220, 38, 38, 0.8)";
    context.fill();
    context.strokeStyle = type === "cut" ? "#22C55E" : "#DC2626";
    context.lineWidth = 2;
    context.stroke();
    context.restore();
  };

  // Handle mouse click for marking
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicking near an existing mark
    const threshold = 10;
    const existingIndex = markedPieces.findIndex(
      (piece) =>
        Math.abs(piece.x - x) < threshold && Math.abs(piece.y - y) < threshold
    );

    if (existingIndex !== -1) {
      // Remove the mark if it exists
      setMarkedPieces((prev) => prev.filter((_, i) => i !== existingIndex));
    } else {
      // Add new mark
      const newMark = {
        x,
        y,
        type: event.button === 2 ? "defect" : "cut",
      };
      setMarkedPieces((prev) => [...prev, newMark]);
    }
  };

  // Save canvas as image
  const saveCanvasAsImage = () => {
    if (!canvasRef.current || !file) return;

    const canvas = canvasRef.current;
    const link = document.createElement('a');
    
    // Get file name without extension
    const fileName = file.name.replace(/\.[^/.]+$/, "");
    
    link.download = `${fileName}-page${currentPage}-marked.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* PDF Preview */}
      <div 
        ref={containerRef}
        className="border rounded-lg overflow-auto bg-gray-50"
        style={{ maxHeight: '600px' }}
        onWheel={handleWheel}
      >
        <div className="relative min-w-fit">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onContextMenu={handleCanvasClick}
            className="cursor-crosshair"
          />
        </div>
      </div>

      {/* Page navigation and zoom controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Próxima
          </button>
          <button
            onClick={saveCanvasAsImage}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            title="Guardar página atual como imagem"
          >
            <Download className="h-4 w-4" />
            <span>Guardar Imagem</span>
          </button>
        </div>
        <div className="flex gap-2 text-sm text-gray-600">
          <span>Zoom: {Math.round(scale * 100)}%</span>
          <span className="text-gray-400">|</span>
          <span className="italic">Use Ctrl + Mouse Wheel para zoom</span>
        </div>
      </div>
    </div>
  );
}
