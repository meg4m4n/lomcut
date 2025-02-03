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
  pdfX: number;
  pdfY: number;
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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number } | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);

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

  // Render PDF and marks
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
      // Draw marks after PDF is rendered
      markedPieces.forEach(piece => {
        const viewportCoords = viewport.convertToViewportPoint(piece.pdfX, viewport.viewBox[3] - piece.pdfY);
        drawMarker(
          context,
          viewportCoords[0],
          viewportCoords[1],
          piece.type,
          scale
        );
      });
    });

    return () => {
      renderTask.cancel();
    };
  }, [currentPage, scale, markedPieces, position]);

  // Convert screen coordinates to PDF coordinates
  const screenToPdfCoordinates = (screenX: number, screenY: number) => {
    if (!canvasRef.current || !currentPage) return null;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const viewport = currentPage.getViewport({ scale });

    // Calculate position relative to canvas, accounting for scroll and zoom
    const x = (screenX - rect.left - position.x) / scale;
    const y = (screenY - rect.top - position.y) / scale;

    // Convert to PDF coordinates
    const pdfPoint = viewport.convertToPdfPoint(x, y);
    return {
      x: pdfPoint[0],
      y: viewport.viewBox[3] - pdfPoint[1] // Flip Y coordinate
    };
  };

  // Draw a marker on the canvas
  const drawMarker = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: 'cut' | 'defect',
    currentScale: number
  ) => {
    const baseSize = 6;
    const size = baseSize * (currentScale > 1 ? 1 + Math.log2(currentScale) * 0.5 : 1);

    context.save();
    context.beginPath();
    context.arc(x, y, size, 0, 2 * Math.PI);
    context.fillStyle = type === 'cut' ? 'rgba(34, 197, 94, 0.8)' : 'rgba(220, 38, 38, 0.8)';
    context.fill();
    context.strokeStyle = type === 'cut' ? '#22C55E' : '#DC2626';
    context.lineWidth = 2 / currentScale; // Adjust line width based on scale
    context.stroke();
    context.restore();
  };

  // Handle mouse click for marking
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (!currentPage || isDragging) return;

    const currentTime = Date.now();
    const isDoubleClick = currentTime - lastClickTime < 300;
    setLastClickTime(currentTime);

    const pdfCoords = screenToPdfCoordinates(event.clientX, event.clientY);
    if (!pdfCoords) return;

    const viewport = currentPage.getViewport({ scale });
    const clickRadius = 10 / scale; // Adjust click radius based on scale

    // Check if clicking on an existing marker
    const existingIndex = markedPieces.findIndex(piece => {
      const viewportCoords = viewport.convertToViewportPoint(piece.pdfX, viewport.viewBox[3] - piece.pdfY);
      const dx = (event.clientX - position.x - canvasRef.current!.getBoundingClientRect().left) / scale - viewportCoords[0];
      const dy = (event.clientY - position.y - canvasRef.current!.getBoundingClientRect().top) / scale - viewportCoords[1];
      return Math.sqrt(dx * dx + dy * dy) < clickRadius;
    });

    if (existingIndex !== -1 || isDoubleClick) {
      // Remove mark on double click or when clicking existing mark
      setMarkedPieces(prev => prev.filter((_, i) => i !== existingIndex));
    } else if (!isDragging) {
      // Add new mark only if not dragging
      const newPiece = {
        pdfX: pdfCoords.x,
        pdfY: pdfCoords.y,
        type: event.button === 2 ? 'defect' : 'cut'
      };
      setMarkedPieces(prev => [...prev, newPiece]);

      if (onPieceMark) {
        onPieceMark(pdfCoords);
      }
    }
  };

  // Handle zooming
  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    
    if (!canvasRef.current || !currentPage) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Calculate zoom
    const delta = event.deltaY;
    const zoomFactor = delta > 0 ? 0.9 : 1.1; // Invert zoom direction
    const newScale = Math.min(Math.max(0.5, scale * zoomFactor), 5);

    if (newScale !== scale) {
      // Calculate new position to zoom towards mouse cursor
      const scaleRatio = newScale / scale;
      const newPosition = {
        x: mouseX - (mouseX - position.x) * scaleRatio,
        y: mouseY - (mouseY - position.y) * scaleRatio
      };

      setScale(newScale);
      setPosition(newPosition);
    }
  };

  // Handle panning
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button === 0) { // Left click only
      event.preventDefault();
      setIsDragging(true);
      setLastMousePos({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !lastMousePos) return;

    const dx = event.clientX - lastMousePos.x;
    const dy = event.clientY - lastMousePos.y;

    setPosition(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));

    setLastMousePos({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastMousePos(null);
  };

  // Set up wheel event listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [scale, position]);

  // Add zoom buttons
  const handleZoomButton = (zoomIn: boolean) => {
    const zoomFactor = zoomIn ? 1.2 : 0.8;
    const newScale = Math.min(Math.max(0.5, scale * zoomFactor), 5);
    
    if (newScale !== scale) {
      // Zoom relative to center
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const scaleRatio = newScale / scale;
      const newPosition = {
        x: centerX - (centerX - position.x) * scaleRatio,
        y: centerY - (centerY - position.y) * scaleRatio
      };

      setScale(newScale);
      setPosition(newPosition);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative border overflow-hidden rounded-lg bg-gray-50" 
      style={{ height: '600px' }}
    >
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={() => handleZoomButton(true)}
          className="p-2 bg-white rounded-lg shadow hover:bg-gray-50 focus:outline-none"
        >
          +
        </button>
        <button
          onClick={() => handleZoomButton(false)}
          className="p-2 bg-white rounded-lg shadow hover:bg-gray-50 focus:outline-none"
        >
          -
        </button>
      </div>

      <div 
        className="absolute inset-0 overflow-hidden"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <canvas 
          ref={canvasRef} 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          onContextMenu={handleCanvasClick}
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            transformOrigin: '0 0',
          }}
        />
      </div>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-gray-600">Loading PDF...</div>
        </div>
      )}
    </div>
  );
}
