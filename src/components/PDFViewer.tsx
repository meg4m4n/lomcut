import React, { useEffect, useRef, useState } from 'react';

// Load PDF.js from the global window object
const pdfjsLib = (window as any).pdfjsLib;

// Ensure the worker is correctly set
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js";

interface PDFViewerProps {
  file: File | null;
  onPieceMark?: (position: { x: number; y: number }) => void;
}

interface MarkedPiece {
  x: number;
  y: number;
  type: 'cut' | 'defect';
}

export function PDFViewer({ file, onPieceMark }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState<any | null>(null);
  const [scale, setScale] = useState(1.5);
  const [markedPieces, setMarkedPieces] = useState<MarkedPiece[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number } | null>(null);

  // Load PDF document
  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
      setIsLoading(true);
      try {
        const fileReader = new FileReader();
        fileReader.onload = async function() {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const doc = await pdfjsLib.getDocument({ data: typedarray }).promise;
          setPdfDoc(doc);
          const page = await doc.getPage(1);
          setCurrentPage(page);
        };
        fileReader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('Error loading PDF:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPDF();

    return () => {
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, [file]);

  // Render PDF page
  useEffect(() => {
    if (!currentPage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const viewport = currentPage.getViewport({ scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    const renderTask = currentPage.render(renderContext);

    renderTask.promise.then(() => {
      // Draw marked pieces after rendering the page
      markedPieces.forEach(piece => {
        drawMarker(context, piece);
      });
    });

    return () => {
      renderTask.cancel();
    };
  }, [currentPage, scale, markedPieces, offset]);

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault(); // Prevent default right-click menu
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - offset.x) / scale;
    const y = (event.clientY - rect.top - offset.y) / scale;
    const isRightClick = event.button === 2;

    // Check if clicking on an existing marker
    const existingIndex = markedPieces.findIndex(piece => 
      Math.abs(piece.x - x) < 10 / scale && Math.abs(piece.y - y) < 10 / scale
    );

    if (existingIndex !== -1) {
      // Remove the marker if it exists (double click behavior)
      setMarkedPieces(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      // Add new marker
      const newPiece = { 
        x, 
        y, 
        type: isRightClick ? 'defect' : 'cut'
      };
      setMarkedPieces(prev => [...prev, newPiece]);

      if (onPieceMark) {
        onPieceMark({ x, y });
      }
    }
  };

  // Draw marker function
  const drawMarker = (context: CanvasRenderingContext2D, piece: MarkedPiece) => {
    const size = 6 * scale;
    context.save();

    context.beginPath();
    context.arc(piece.x * scale + offset.x, piece.y * scale + offset.y, size, 0, 2 * Math.PI);
    context.fillStyle = piece.type === 'cut' ? 'rgba(34, 197, 94, 0.8)' : 'rgba(220, 38, 38, 0.8)';
    context.fill();
    context.strokeStyle = piece.type === 'cut' ? '#22C55E' : '#DC2626';
    context.lineWidth = 2;
    context.stroke();

    context.restore();
  };

  // Zooming with scroll (Only inside the preview)
  const handleWheelZoom = (event: React.WheelEvent<HTMLDivElement>) => {
    // Check if the mouse is inside the container
    if (!containerRef.current?.contains(event.target as Node)) return;
    
    // Stop event propagation and prevent default behavior
    event.stopPropagation();
    event.preventDefault();

    if (!canvasRef.current || !containerRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const prevScale = scale;
    const newScale = Math.min(3, Math.max(0.5, prevScale + (event.deltaY < 0 ? 0.1 : -0.1)));

    setScale(newScale);

    // Adjust offset to zoom towards mouse position
    setOffset(prev => ({
      x: prev.x - (mouseX - prev.x) * (newScale / prevScale - 1),
      y: prev.y - (mouseY - prev.y) * (newScale / prevScale - 1),
    }));
  };

  // Panning the PDF when zoomed
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (scale > 1) {
      setIsDragging(true);
      setLastMousePos({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !lastMousePos) return;

    const dx = event.clientX - lastMousePos.x;
    const dy = event.clientY - lastMousePos.y;

    setOffset(prev => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));

    setLastMousePos({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastMousePos(null);
  };

  return (
    <div 
      className="relative border overflow-hidden rounded-lg bg-gray-50" 
      style={{ height: '600px' }} // Fixed height container
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div 
        className="absolute inset-0 overflow-auto"
        onWheel={handleWheelZoom}
      >
        <canvas 
          ref={canvasRef} 
          onMouseDown={handleMouseDown} 
          onMouseMove={handleMouseMove} 
          onMouseUp={handleMouseUp} 
          onClick={handleCanvasClick} 
          onContextMenu={handleCanvasClick} 
          className="cursor-grab"
        />
      </div>
    </div>
  );
}
