import React, { useState, useEffect } from 'react';
import { Check, X, MessageSquare, FileDown, AlertTriangle, PenTool as Tool } from 'lucide-react';
import type { PieceStatus, Material, Point, VectorPath, PathSegment, PathRepair } from '../types';

interface CutRegistrationProps {
  materials: Material[];
  onUpdatePieceStatus: (pieceId: string, status: PieceStatus) => void;
}

const REPAIR_THRESHOLD = 0.1; // 0.1mm threshold for gap detection
const MAX_REPAIR_DISTANCE = 5.0; // Maximum distance to attempt repair (5mm)

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

  // Enhanced distance calculation with precision handling
  const distance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
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
          if (dist > REPAIR_THRESHOLD && dist < minDistance && dist < MAX_REPAIR_DISTANCE) {
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

    // Check if any segment endpoints form a closed loop
    for (let i = 0; i < segments.length; i++) {
      const current = segments[i];
      const next = segments[(i + 1) % segments.length];
      
      if (distance(current.end, next.start) > REPAIR_THRESHOLD) {
        return false;
      }
    }

    return true;
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

      if (gap > REPAIR_THRESHOLD && gap < MAX_REPAIR_DISTANCE) {
        repairs.push({
          start: current.end,
          end: next.start,
          distance: gap,
        });

        // Add connecting segment
        repairedSegments.splice(i + 1, 0, {
          start: current.end,
          end: next.start,
        });
        i++; // Skip the newly added segment
      }
    }

    // Strategy 2: Connect closest unconnected endpoints
    if (!isPathClosed(repairedSegments)) {
      const closestPair = findClosestEndpoints(repairedSegments);
      if (closestPair) {
        repairs.push({
          start: closestPair.start,
          end: closestPair.end,
          distance: closestPair.distance,
        });

        // Add connecting segment
        repairedSegments.push({
          start: closestPair.start,
          end: closestPair.end,
        });
      }
    }

    // Strategy 3: Force close any remaining open path
    if (!isPathClosed(repairedSegments)) {
      const firstSegment = repairedSegments[0];
      const lastSegment = repairedSegments[repairedSegments.length - 1];
      const gap = distance(lastSegment.end, firstSegment.start);

      if (gap > REPAIR_THRESHOLD) {
        repairs.push({
          start: lastSegment.end,
          end: firstSegment.start,
          distance: gap,
        });

        repairedSegments.push({
          start: lastSegment.end,
          end: firstSegment.start,
        });
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
          
          // Parse coordinates
          while (i < lines.length && lines[i].trim() !== 'SEQEND') {
            const code = lines[i].trim();
            const value = parseFloat(lines[++i]);
            
            if (code === '10' || code === '11') points.push({ x: value, y: 0 });
            if (code === '20' || code === '21') points[points.length - 1].y = value;
          }

          // Create segments from points
          for (let j = 0; j < points.length - 1; j++) {
            currentSegments.push({
              start: points[j],
              end: points[j + 1],
            });
          }

          if (currentSegments.length > 0) {
            const { segments: repairedSegments, repairs } = repairPath(currentSegments);
            
            // Log repairs
            repairs.forEach(repair => {
              repairLog.push(
                `Closed gap between nodes [${repair.start.x.toFixed(2)},${repair.start.y.toFixed(2)}] and ` +
                `[${repair.end.x.toFixed(2)},${repair.end.y.toFixed(2)}] (distance: ${repair.distance.toFixed(2)}mm)`
              );
            });

            paths.push({
              id: `piece-${entityId++}`,
              segments: repairedSegments,
              isOpen: repairs.length > 0,
              repairs,
              status: 'uncut',
            });
          }
        }
      }

      setVectorPaths(paths);
      const openPaths = paths.filter(p => p.isOpen).length;
      setProcessingStatus({ 
        isProcessing: false, 
        message: `Processed ${paths.length} pieces. ${openPaths} required repairs.\n${
          openPaths > 0 ? `\nRepairs made:\n${repairLog.join('\n')}` : ''
        }` 
      });
    } catch (error) {
      console.error('Error processing vector file:', error);
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
    setSelectedPiece(path.id);
  };

  const handleStatusUpdate = (status: 'cut' | 'defect') => {
    if (selectedPiece) {
      setVectorPaths(paths =>
        paths.map(path =>
          path.id === selectedPiece ? { ...path, status: status } : path
        )
      );

      onUpdatePieceStatus(selectedPiece, {
        id: selectedPiece,
        status,
        notes,
      });
      
      setNotes('');
      setSelectedPiece(null);
    }
  };

  // Convert vector path to SVG path string
  const pathToSvgPath = (path: VectorPath): string => {
    if (path.segments.length === 0) return '';
    
    let d = `M ${path.segments[0].start.x} ${path.segments[0].start.y}`;
    path.segments.forEach(segment => {
      d += ` L ${segment.end.x} ${segment.end.y}`;
    });
    return d + ' Z';
  };

  // Calculate viewBox from all paths
  const calculateViewBox = (): string => {
    if (vectorPaths.length === 0) return '0 0 100 100';

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    vectorPaths.forEach(path => {
      path.segments.forEach(segment => {
        minX = Math.min(minX, segment.start.x, segment.end.x);
        minY = Math.min(minY, segment.start.y, segment.end.y);
        maxX = Math.max(maxX, segment.start.x, segment.end.x);
        maxY = Math.max(maxY, segment.start.y, segment.end.y);
      });
    });

    const padding = 10;
    return `${minX - padding} ${minY - padding} ${maxX - minX + 2 * padding} ${maxY - minY + 2 * padding}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Registo de Corte</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRepairs(!showRepairs)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
          >
            <Tool className="h-5 w-5 mr-2" />
            {showRepairs ? 'Hide' : 'Show'} Repairs
          </button>
          <button
            onClick={() => handleStatusUpdate('cut')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedPiece}
          >
            <Check className="h-5 w-5 mr-2" />
            Cortado
          </button>
          <button
            onClick={() => handleStatusUpdate('defect')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedPiece}
          >
            <X className="h-5 w-5 mr-2" />
            Defeito
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
                  <Check className="h-4 w-4" />
                )}
                <p className="text-sm">{processingStatus.message}</p>
              </div>
            </div>
          )}

          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Pré-visualização do Corte</h3>
            <div className="relative w-full" style={{ paddingBottom: '75%' }}>
              {vectorPaths.length > 0 ? (
                <svg
                  className="absolute inset-0 w-full h-full border rounded bg-gray-50"
                  viewBox={calculateViewBox()}
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <pattern id="hatch" patternUnits="userSpaceOnUse" width="4" height="4">
                      <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" 
                        style={{ stroke: 'currentColor', strokeWidth: 0.5 }} />
                    </pattern>
                  </defs>
                  {vectorPaths.map((path) => (
                    <g key={path.id}>
                      <path
                        d={pathToSvgPath(path)}
                        fill={path.status === 'uncut' 
                          ? 'url(#hatch)' 
                          : path.status === 'cut' 
                            ? 'rgba(34, 197, 94, 0.2)' 
                            : 'rgba(239, 68, 68, 0.2)'}
                        stroke={selectedPiece === path.id ? '#3B82F6' : '#1F2937'}
                        strokeWidth="2"
                        className={`cursor-pointer transition-colors duration-200 ${
                          path.isOpen ? 'stroke-yellow-500' : ''
                        } hover:stroke-blue-500`}
                        onClick={() => handlePieceClick(path)}
                      />
                      {showRepairs && path.repairs.map((repair, index) => (
                        <g key={`repair-${index}`} className="text-green-500">
                          <line
                            x1={repair.start.x}
                            y1={repair.start.y}
                            x2={repair.end.x}
                            y2={repair.end.y}
                            strokeWidth="2"
                            strokeDasharray="4"
                            className="stroke-current"
                          />
                          <circle
                            cx={repair.start.x}
                            cy={repair.start.y}
                            r="2"
                            className="fill-current"
                          />
                          <circle
                            cx={repair.end.x}
                            cy={repair.end.y}
                            r="2"
                            className="fill-current"
                          />
                        </g>
                      ))}
                    </g>
                  ))}
                </svg>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded border-2 border-dashed border-gray-300">
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
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Detalhes da Peça</h3>
            {selectedPiece && selectedMaterial ? (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Material:</span> {selectedMaterial.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Cor:</span> {selectedMaterial.color}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Fornecedor:</span> {selectedMaterial.supplier}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">ID da Peça:</span> {selectedPiece}
                </p>
                {vectorPaths.find(p => p.id === selectedPiece)?.isOpen && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <AlertTriangle className="h-4 w-4 inline-block mr-1" />
                      This piece has open geometry that was auto-repaired
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Selecione uma peça para ver os detalhes
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
