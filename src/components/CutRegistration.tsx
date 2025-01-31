import React, { useState, useEffect } from 'react';
import { Check, X, MessageSquare, FileDown } from 'lucide-react';
import type { PieceStatus, Material } from '../types';

interface CutRegistrationProps {
  materials: Material[];
  onUpdatePieceStatus: (pieceId: string, status: PieceStatus) => void;
}

export function CutRegistration({
  materials,
  onUpdatePieceStatus,
}: CutRegistrationProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [dxfContent, setDxfContent] = useState<string | null>(null);

  // Function to read and parse DXF file
  const readDXFFile = async (file: File) => {
    try {
      const text = await file.text();
      // Here you would normally parse the DXF file
      // For now, we'll just extract some basic geometry
      const entities = extractEntitiesFromDXF(text);
      setDxfContent(entities);
    } catch (error) {
      console.error('Error reading DXF file:', error);
    }
  };

  // Simple DXF entity extraction (this is a placeholder - you'd need a proper DXF parser)
  const extractEntitiesFromDXF = (dxfText: string) => {
    // This is a simplified example - in reality, you'd use a proper DXF parser
    return 'M10,10 L100,10 L100,100 L10,100 Z';
  };

  useEffect(() => {
    if (selectedMaterial?.dxfFile) {
      readDXFFile(selectedMaterial.dxfFile);
    } else {
      setDxfContent(null);
    }
  }, [selectedMaterial]);

  const handlePieceClick = (pieceId: string) => {
    setSelectedPiece(pieceId);
  };

  const handleStatusUpdate = (status: 'cut' | 'defect') => {
    if (selectedPiece) {
      onUpdatePieceStatus(selectedPiece, {
        id: selectedPiece,
        status,
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
            onClick={() => handleStatusUpdate('cut')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            disabled={!selectedPiece}
          >
            <Check className="h-5 w-5 mr-2" />
            Cortado
          </button>
          <button
            onClick={() => handleStatusUpdate('defect')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
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
              value={
                selectedMaterial ? materials.indexOf(selectedMaterial) : ''
              }
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

          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">
              Pré-visualização do Corte
            </h3>
            {selectedMaterial?.dxfFile ? (
              <svg
                width="100%"
                height="400"
                viewBox="0 0 400 400"
                className="border rounded bg-gray-50"
              >
                {dxfContent && (
                  <path
                    d={dxfContent}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="cursor-pointer hover:stroke-blue-500"
                    onClick={() => handlePieceClick('1')}
                  />
                )}
              </svg>
            ) : (
              <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded border-2 border-dashed border-gray-300">
                <p className="text-gray-500">
                  Selecione o corte para ver o plano
                </p>
              </div>
            )}
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
                placeholder="Add notes about the cut..."
                className="flex-1 p-2 border rounded-lg min-h-[150px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">
              Selecionar a Peça para ver detalhes
            </h3>
            {selectedPiece ? (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Material: {selectedMaterial?.name}
                </p>
                <p className="text-sm text-gray-600">
                  Color: {selectedMaterial?.color}
                </p>
                <p className="text-sm text-gray-600">
                  Supplier: {selectedMaterial?.supplier}
                </p>
                <p className="text-sm text-gray-600">
                  ID da peça: {selectedPiece}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Selecionar a Peça para ver detalhes
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
