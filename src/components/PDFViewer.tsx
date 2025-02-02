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
    
    // Calculate position in PDF coordinates
    const x = (event.clientX - rect.left - offset.x) / scale;
    const y = (event.clientY - rect.top - offset.y) / scale;

    // Check if clicking on an existing marker
    const existingIndex = markedPieces.findIndex(piece => {
      const scaledX = piece.x * scale + offset.x;
      const scaledY = piece.y * scale + offset.y;
      return Math.abs(event.clientX - rect.left - scaledX) < 10 &&
             Math.abs(event.clientY - rect.top - scaledY) < 10;
    });

    if (existingIndex !== -1) {
      // Remove the marker if it exists
      setMarkedPieces(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      // Add new marker
      const newPiece = { 
        x,
        y,
        type: event.button === 2 ? 'defect' : 'cut'
      };
      setMarkedPieces(prev => [...prev, newPiece]);

      if (onPieceMark) {
        onPieceMark({ x, y });
      }
    }
  };

  // Draw marker function
  const drawMarker = (context: CanvasRenderingContext2D, piece: MarkedPiece) => {
    const scaledX = piece.x * scale + offset.x;
    const scaledY = piece.y * scale + offset.y;
    const size = 6;

    context.save();
    context.beginPath();
    context.arc(scaledX, scaledY, size, 0, 2 * Math.PI);
    context.fillStyle = piece.type === 'cut' ? 'rgba(34, 197, 94, 0.8)' : 'rgba(220, 38, 38, 0.8)';
    context.fill();
    context.strokeStyle = piece.type === 'cut' ? '#22C55E' : '#DC2626';
    context.lineWidth = 2;
    context.stroke();
    context.restore();
  };

  // Handle zooming
  const handleWheelZoom = (event: WheelEvent) => {
    event.preventDefault();
    
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate mouse position relative to canvas
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Calculate zoom
    const delta = -event.deltaY;
    const zoomFactor = delta > 0 ? 1.1 : 0.9;
    const newScale = Math.min(Math.max(0.5, scale * zoomFactor), 3);
    
    // Calculate new offset to zoom towards mouse position
    const newOffset = {
      x: offset.x - (mouseX - offset.x) * (zoomFactor - 1),
      y: offset.y - (mouseY - offset.y) * (zoomFactor - 1)
    };

    setScale(newScale);
    setOffset(newOffset);
  };

  // Set up wheel event listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      // Only handle zoom if the mouse is directly over the canvas
      const rect = canvas.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        handleWheelZoom(e);
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [scale, offset]);

  // Handle panning
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button === 0) { // Only start dragging on left click
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
      style={{ height: '600px' }}
    >
      <div className="absolute inset-0 overflow-auto">
        <canvas 
          ref={canvasRef} 
          onMouseDown={handleMouseDown} 
          onMouseMove={handleMouseMove} 
          onMouseUp={handleMouseUp} 
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick} 
          onContextMenu={handleCanvasClick} 
          className={`cursor-${isDragging ? 'grabbing' : 'grab'}`}
        />
      </div>
    </div>
  );
}
