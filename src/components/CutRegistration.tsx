import React, { useState, useEffect } from 'react';
import { Scissors, Plus, ArrowRight, MessageSquare, FileDown, AlertTriangle, PenTool as Tool, Save, Wrench } from 'lucide-react';
import { PDFViewer } from './PDFViewer';
import type { PieceStatus, Material, Point, VectorPath, PathSegment, PathRepair, ContourAnalysis } from '../types';

interface CutRegistrationProps {
  materials: Material[];
  onUpdatePieceStatus: (pieceId: string, status: PieceStatus) => void;
}

export function CutRegistration({
  materials,
  onUpdatePieceStatus,
}: CutRegistrationProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [vectorPaths, setVectorPaths] = useState<VectorPath[]>([]);
  const [showRepairs, setShowRepairs] = useState(true);
  const [processingStatus, setProcessingStatus] = useState<{
    isProcessing: boolean;
    message: string;
  }>({ isProcessing: false, message: '' });
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});
  const [repairMode, setRepairMode] = useState(false);

  // Enhanced distance calculation with precision handling
  const distance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Detect if a point is inside a polygon using ray casting
  const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y))
          && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Calculate path length
  const calculatePathLength = (segments: PathSegment[]): number => {
    return segments.reduce((total, segment) => {
      return total + distance(segment.start, segment.end);
    }, 0);
  };

  // Calculate area of a polygon
  const calculateArea = (segments: PathSegment[]): number => {
    let area = 0;
    for (let i = 0; i < segments.length; i++) {
      const j = (i + 1) % segments.length;
      area += segments[i].start.x * segments[j].start.y;
      area -= segments[j].start.x * segments[i].start.y;
    }
    return Math.abs(area) / 2;
  };

  // Analyze contour characteristics
  const analyzeContour = (segments: PathSegment[]): ContourAnalysis => {
    const length = calculatePathLength(segments);
    const area = calculateArea(segments);
    
    return {
      isNotch: length < 10, // Maximum length for notches (in mm)
      isInterior: length < 50 || area < 100, // Minimum length for exterior contours (in mm)
      length,
    };
  };

  // Simplify path by removing redundant points
  const simplifyPath = (segments: PathSegment[]): PathSegment[] => {
    if (segments.length <= 2) return segments;
    
    const simplified: PathSegment[] = [segments[0]];
    
    for (let i = 1; i < segments.length - 1; i++) {
      const prev = simplified[simplified.length - 1];
      const current = segments[i];
      const next = segments[i + 1];
      
      // Calculate angle between segments
      const angle = Math.abs(Math.atan2(
        (next.start.y - current.start.y) * (current.start.x - prev.start.x) -
        (next.start.x - current.start.x) * (current.start.y - prev.start.y),
        (next.start.x - current.start.x) * (current.start.x - prev.start.x) +
        (next.start.y - current.start.y) * (current.start.y - prev.start.y)
      ));
      
      // Keep point if angle is significant
      if (angle > 0.1 || distance(prev.start, current.start) > 0.5) {
        simplified.push(current);
      }
    }
    
    simplified.push(segments[segments.length - 1]);
    return simplified;
  };

  // Enhanced path analysis to detect exterior vs interior paths
  const analyzePathGeometry = (paths: VectorPath[]): VectorPath[] => {
    // First pass: Calculate bounding boxes and areas
    const analyzedPaths = paths.map(path => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      path.segments.forEach(segment => {
        minX = Math.min(minX, segment.start.x, segment.end.x);
        minY = Math.min(minY, segment.start.y, segment.end.y);
        maxX = Math.max(maxX, segment.start.x, segment.end.x);
        maxY = Math.max(maxY, segment.start.y, segment.end.y);
      });

      return {
        ...path,
        boundingBox: { minX, minY, maxX, maxY },
        area: calculateArea(path.segments),
      };
    });

    // Second pass: Determine exterior/interior relationships
    return analyzedPaths.map(path => {
      const contourAnalysis = analyzeContour(path.segments);
      let isExterior = !contourAnalysis.isNotch && !contourAnalysis.isInterior;
      
      for (const otherPath of analyzedPaths) {
        if (otherPath === path || otherPath.area <= path.area) continue;
        
        if (path.boundingBox.minX >= otherPath.boundingBox.minX &&
            path.boundingBox.maxX <= otherPath.boundingBox.maxX &&
            path.boundingBox.minY >= otherPath.boundingBox.minY &&
            path.boundingBox.maxY <= otherPath.boundingBox.maxY) {
          
          const testPoint = path.segments[0].start;
          if (isPointInPolygon(testPoint, otherPath.segments.map(s => s.start))) {
            isExterior = false;
            break;
          }
        }
      }

      return {
        ...path,
        isExterior,
        segments: path.segments.map(segment => ({
          ...segment,
          type: isExterior ? 'exterior' : contourAnalysis.isNotch ? 'notch' : 'interior'
        }))
      };
    });
  };

  // Find closest endpoints between segments
  const findClosestEndpoints = (segments: PathSegment[]): {
    start: Point;
    end: Point;
    distance: number;
    startSegmentIndex: number;
    endSegmentIndex: number;
  } | null => {
    let closestPair = null;
    let minDistance = Infinity;

    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const pairs = [
          { p1: segments[i].start, p2: segments[j].start },
          { p1: segments[i].start, p2: segments[j].end },
          { p1: segments[i].end, p2: segments[j].start },
          { p1: segments[i].end, p2: segments[j].end },
        ];

        pairs.forEach(({ p1, p2 }) => {
          const dist = distance(p1, p2);
          if (dist > 0.1 && dist < minDistance && dist < 5.0) {
            minDistance = dist;
            closestPair = {
              start: p1,
              end: p2,
              distance: dist,
              startSegmentIndex: i,
              endSegmentIndex: j,
            };
          }
        });
      }
    }

    return closestPair;
  };

  // Enhanced path closure check
  const isPathClosed = (segments: PathSegment[]): boolean => {
    if (segments.length < 2) return false;

    for (let i = 0; i < segments.length; i++) {
      const current = segments[i];
      const next = segments[(i + 1) % segments.length];
      
      if (distance(current.end, next.start) > 0.1) {
        return false;
      }
    }

    return true;
  };

  // Find intersection between two line segments
  const findIntersection = (seg1: PathSegment, seg2: PathSegment): Point | null => {
    const x1 = seg1.start.x, y1 = seg1.start.y;
    const x2 = seg1.end.x, y2 = seg1.end.y;
    const x3 = seg2.start.x, y3 = seg2.start.y;
    const x4 = seg2.end.x, y4 = seg2.end.y;

    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (denominator === 0) return null;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1),
      };
    }

    return null;
  };

  // Enhanced auto-repair with multiple strategies
  const repairPath = (segments: PathSegment[]): { segments: PathSegment[]; repairs: PathRepair[] } => {
    const repairs: PathRepair[] = [];
    let repairedSegments = [...segments];

    // Strategy 1: Connect sequential gaps
    for (let i = 0; i < repairedSegments.length; i++) {
      const current = repairedSegments[i];
      const next = repairedSegments[(i + 1) % repairedSegments.length];
      const gap = distance(current.end, next.start);

      if (gap > 0.1 && gap < 5.0) {
        repairs.push({
          start: current.end,
          end: next.start,
          distance: gap,
          type: 'gap',
        });

        repairedSegments.splice(i + 1, 0, {
          start: current.end,
          end: next.start,
          isRepair: true,
          type: 'exterior',
        });
        i++;
      }
    }

    // Strategy 2: Fix self-intersections
    for (let i = 0; i < repairedSegments.length - 1; i++) {
      for (let j = i + 2; j < repairedSegments.length; j++) {
        const seg1 = repairedSegments[i];
        const seg2 = repairedSegments[j];
        
        const intersection = findIntersection(seg1, seg2);
        if (intersection) {
          repairs.push({
            start: intersection,
            end: intersection,
            distance: 0,
            type: 'intersection',
          });
          
          repairedSegments.splice(i, 1,
            { start: seg1.start, end: intersection, isRepair: true, type: 'exterior' },
            { start: intersection, end: seg1.end, isRepair: true, type: 'exterior' }
          );
          repairedSegments.splice(j + 1, 1,
            { start: seg2.start, end: intersection, isRepair: true, type: 'exterior' },
            { start: intersection, end: seg2.end, isRepair: true, type: 'exterior' }
          );
        }
      }
    }

    return { segments: repairedSegments, repairs };
  };

  // Enhanced vector file processing
  const processVectorFile = async (file: File) => {
    setProcessingStatus({ isProcessing: true, message: 'Processing file...' });
    try {
      const text = await file.text();
      const paths: VectorPath[] = [];
      const lines = text.split('\n');
      
      let currentSegments: PathSegment[] = [];
      let entityId = 1;
      let repairLog: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line === 'POLYLINE' || line === 'LINE') {
          currentSegments = [];
          let points: Point[] = [];
          
          while (i < lines.length && lines[i].trim() !== 'SEQEND') {
            const code = lines[i].trim();
            const value = parseFloat(lines[++i]);
            
            if (code === '10' || code === '11') points.push({ x: value, y: 0 });
            if (code === '20' || code === '21') points[points.length - 1].y = value;
          }

          for (let j = 0; j < points.length - 1; j++) {
            currentSegments.push({
              start: points[j],
              end: points[j + 1],
              isRepair: false,
              type: 'exterior',
            });
          }

          if (currentSegments.length > 0) {
            const simplifiedSegments = simplifyPath(currentSegments);
            const { segments: repairedSegments, repairs } = repairPath(simplifiedSegments);
            const contourAnalysis = analyzeContour(repairedSegments);
            
            if (!contourAnalysis.isNotch || repairs.length > 0) {
              paths.push({
                id: `piece-${entityId++}`,
                segments: repairedSegments,
                isOpen: repairs.length > 0,
                repairs,
                status: 'uncut',
                isExterior: !contourAnalysis.isInterior,
                boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
                area: 0,
              });

              repairs.forEach(repair => {
                repairLog.push(
                  `${repair.type === 'gap' ? 'Closed gap' : 'Fixed intersection'} at ` +
                  `[${repair.start.x.toFixed(2)},${repair.start.y.toFixed(2)}]` +
                  (repair.type === 'gap' ? ` (distance: ${repair.distance.toFixed(2)}mm)` : '')
                );
              });
            }
          }
        }
      }

      const analyzedPaths = analyzePathGeometry(paths);
      const significantPaths = analyzedPaths.filter(path => {
        const contourAnalysis = analyzeContour(path.segments);
        return path.isExterior || contourAnalysis.length > 10;
      });

      setVectorPaths(significantPaths);

      const repairedPaths = significantPaths.filter(p => p.repairs.length > 0).length;
      const exteriorPaths = significantPaths.filter(p => p.isExterior).length;
      
      setProcessingStatus({ 
        isProcessing: false, 
        message: `Processed ${significantPaths.length} paths (${exteriorPaths} exterior pieces). ` +
                `${repairedPaths} required repairs.\n${
                  repairedPaths > 0 ? `\nRepairs made:\n${repairLog.join('\n')}` : ''
                }` 
      });
    } catch (error) {
      setProcessingStatus({ 
        isProcessing: false, 
        message: 'Error processing file. Please check the format.' 
      });
    }
  };

  useEffect(() => {
    if (selectedMaterial?.dxfFile) {
      processVectorFile(selectedMaterial.dxfFile);
    } else {
      setVectorPaths([]);
      setProcessingStatus({ isProcessing: false, message: '' });
    }
  }, [selectedMaterial]);

  const handlePieceClick = (path: VectorPath) => {
    const currentCount = (clickCounts[path.id] || 0) + 1;
    setClickCounts(prev => ({
      ...prev,
      [path.id]: currentCount > 3 ? 1 : currentCount
    }));

    let newStatus: 'uncut' | 'cut' | 'defect' = 'uncut';
    if (currentCount === 1) newStatus = 'cut';
    else if (currentCount === 2) newStatus = 'defect';
    else if (currentCount === 3) newStatus = 'uncut';

    setVectorPaths(paths =>
      paths.map(p =>
        p.id === path.id ? { ...p, status: newStatus } : p
      )
    );

    onUpdatePieceStatus(path.id, {
      id: path.id,
      status: newStatus,
      notes,
    });

    if (newStatus === 'uncut') {
      setClickCounts(prev => {
        const { [path.id]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handlePieceMark = (position: { x: number; y: number }) => {
    console.log('Piece marked at:', position);
  };

  const handleSaveNotes = () => {
    if (selectedPiece) {
      onUpdatePieceStatus(selectedPiece, {
        id: selectedPiece,
        status: vectorPaths.find(p => p.id === selectedPiece)?.status || 'uncut',
        notes,
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Registo de Corte</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setRepairMode(!repairMode)}
            className={`px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center ${
              repairMode ? 'bg-yellow-700' : ''
            }`}
          >
            <Wrench className="h-5 w-5 mr-2" />
            Repair DXF
          </button>
          <button
            onClick={() => setShowRepairs(!showRepairs)}
            className={`px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center ${
              showRepairs ? 'bg-gray-700' : ''
            }`}
          >
            <Tool className="h-5 w-5 mr-2" />
            {showRepairs ? 'Hide' : 'Show'} Repairs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="flex items-center gap-4">
            <select
              value={selectedMaterial ? materials.indexOf(selectedMaterial) : ''}
              onChange={(e) =>
                setSelectedMaterial(materials[parseInt(e.target.value)])
              }
              className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Selecionar Corte...</option>
              {materials.map((material, index) => (
                <option key={index} value={index}>
                  {material.name} - {material.color} ({material.supplier})
                </option>
              ))}
            </select>
            {selectedMaterial?.dxfFile && (
              <button
                onClick={() => {
                  const url = URL.createObjectURL(selectedMaterial.dxfFile!);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = selectedMaterial.dxfFile!.name;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="p-2 text-blue-600 hover:text-blue-800"
                title="Download DXF"
              >
                <FileDown className="h-5 w-5" />
              </button>
            )}
          </div>

          {processingStatus.message && (
            <div className={`p-3 rounded-lg ${
              processingStatus.isProcessing 
                ? 'bg-blue-50 text-blue-700'
                : processingStatus.message.includes('Error')
                  ? 'bg-red-50 text-red-700'
                  : 'bg-green-50 text-green-700'
            }`}>
              <div className="flex items-center gap-2">
                {processingStatus.isProcessing ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent" />
                ) : processingStatus.message.includes('Error') ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <p className="text-sm whitespace-pre-line">{processingStatus.message}</p>
              </div>
            </div>
          )}

          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Pré-visualização do Corte</h3>
            <div className="relative w-full">
              {selectedMaterial?.pdfFile ? (
                <PDFViewer
                  file={selectedMaterial.pdfFile}
                  onPieceMark={handlePieceMark}
                />
              ) : (
                <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded border-2 border-dashed border-gray-300">
                  <p className="text-gray-500">Selecione o corte para ver o plano</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-4">Notas</h3>
            <div className="flex items-start space-x-2">
              <MessageSquare className="h-5 w-5 text-gray-400 mt-2" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicionar notas sobre o corte..."
                className="flex-1 p-2 border rounded-lg min-h-[150px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Save className="h-5 w-5 mr-2" />
                Guardar Notas
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Legenda</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-800 bg-[url('#hatch')]"></div>
                <span className="text-sm">Por Cortar (Clique 3×)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-green-500 bg-green-100"></div>
                <span className="text-sm">Cortado (Clique 1×)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-2 border-red-500 bg-red-100"></div>
                <span className="text-sm">Defeito (Clique 2×)</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Estatísticas</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm">
                <span className="font-medium">Total de Peças:</span>{' '}
                {vectorPaths.length}
              </p>
              <p className="text-sm">
                <span className="font-medium">Peças Exteriores:</span>{' '}
                {vectorPaths.filter(p => p.isExterior).length}
              </p>
              <p className="text-sm">
                <span className="font-medium">Cortadas:</span>{' '}
                {vectorPaths.filter(p => p.status === 'cut').length}
              </p>
              <p className="text-sm">
                <span className="font-medium">Defeitos:</span>{' '}
                {vectorPaths.filter(p => p.status === 'defect').length}
              </p>
              <p className="text-sm">
                <span className="font-medium">Por Cortar:</span>{' '}
                {vectorPaths.filter(p => p.status === 'uncut').length}
              </p>
              <p className="text-sm">
                <span className="font-medium">Reparações:</span>{' '}
                {vectorPaths.reduce((total, path) => total + path.repairs.length, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
