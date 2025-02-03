import React, { useState, useEffect } from 'react';
import { Scissors, MessageSquare, FileDown, Save, Trash2, HelpCircle, Image } from 'lucide-react';
import { PDFViewer } from './PDFViewer';
import type { PieceStatus, Material } from '../types';

interface CutRegistrationProps {
  materials: Material[];
  onUpdatePieceStatus: (pieceId: string, status: PieceStatus) => void;
}

interface Snapshot {
  id: string;
  image: string;
  timestamp: string;
  materialName: string;
  pageNumber: number;
}

export function CutRegistration({
  materials,
  onUpdatePieceStatus,
}: CutRegistrationProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ id: string; text: string }[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [showSnapshots, setShowSnapshots] = useState(false);

  useEffect(() => {
    // Add default help note if no notes exist
    if (notes.length === 0) {
      setNotes([{
        id: 'help-note',
        text: `Como usar a pré-visualização:

• Cortado: Clique com o lado esquerdo do rato para marcar uma peça como cortada
• Defeito: Clique com o lado direito do rato para marcar uma peça com defeito
• Remover marca: Clique em cima de uma marca existente para a remover

Dicas:
- Pode usar o scroll do rato para aumentar/diminuir o zoom
- Quando ampliado, clique e arraste para mover a visualização
- As marcas são guardadas automaticamente`
      }]);
    }
  }, []);

  const handlePieceMark = (position: { x: number; y: number }) => {
    console.log('Piece marked at:', position);
  };

  const handleSaveSnapshot = (imageData: string, pageNumber: number) => {
    if (!selectedMaterial) return;
    
    const newSnapshot: Snapshot = {
      id: Date.now().toString(),
      image: imageData,
      timestamp: new Date().toLocaleString(),
      materialName: selectedMaterial.name,
      pageNumber
    };
    
    setSnapshots(prev => [newSnapshot, ...prev]);
  };

  const deleteSnapshot = (id: string) => {
    setSnapshots(prev => prev.filter(snapshot => snapshot.id !== id));
  };

  const addNote = () => {
    if (newNote.trim()) {
      const note = {
        id: Date.now().toString(),
        text: newNote.trim()
      };
      setNotes(prev => [...prev, note]);
      setNewNote('');
    }
  };

  const updateNote = (id: string, newText: string) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, text: newText } : note
    ));
    setEditingNoteId(null);
  };

  const deleteNote = (id: string) => {
    if (id === 'help-note') return; // Prevent deleting the help note
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Registo de Corte</h2>
        <button
          onClick={() => setShowSnapshots(!showSnapshots)}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            showSnapshots 
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Image className="w-5 h-5" />
          <span>Capturas ({snapshots.length})</span>
        </button>
      </div>

      <div className="space-y-6">
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

        {showSnapshots ? (
          <div className="grid grid-cols-2 gap-4">
            {snapshots.map(snapshot => (
              <div key={snapshot.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{snapshot.materialName}</h4>
                    <p className="text-sm text-gray-500">
                      Página {snapshot.pageNumber} • {snapshot.timestamp}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteSnapshot(snapshot.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <img 
                  src={snapshot.image} 
                  alt={`Captura de ${snapshot.materialName}`}
                  className="w-full rounded border"
                />
              </div>
            ))}
            {snapshots.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-gray-50 rounded-lg">
                <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma captura guardada</p>
                <p className="text-sm text-gray-400">
                  Use o botão "Capturar" na visualização do PDF para guardar imagens
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="border rounded-lg">
            {selectedMaterial?.pdfFile ? (
              <PDFViewer
                file={selectedMaterial.pdfFile}
                onSaveSnapshot={handleSaveSnapshot}
              />
            ) : (
              <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded border-2 border-dashed border-gray-300">
                <p className="text-gray-500">Selecione o corte para ver o plano</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">Notas</h3>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-green-500 bg-green-100"></div>
                  <span className="text-sm text-gray-500">Cortado</span>
                  <div className="w-4 h-4 border-2 border-red-500 bg-red-100 ml-4"></div>
                  <span className="text-sm text-gray-500">Defeito</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Adicionar nova nota..."
                className="flex-1 p-2 border rounded-lg min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={addNote}
                disabled={!newNote.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {notes.map(note => (
                <div 
                  key={note.id} 
                  className={`flex items-start space-x-2 p-3 rounded-lg ${
                    note.id === 'help-note' 
                      ? 'bg-blue-50 border border-blue-100' 
                      : 'bg-gray-50'
                  }`}
                >
                  {editingNoteId === note.id ? (
                    <>
                      <textarea
                        value={note.text}
                        onChange={(e) => updateNote(note.id, e.target.value)}
                        className="flex-1 p-2 border rounded-lg min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={() => setEditingNoteId(null)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        {note.id === 'help-note' && (
                          <div className="flex items-center gap-2 mb-2">
                            <HelpCircle className="h-5 w-5 text-blue-500" />
                            <span className="font-medium text-blue-700">Como usar</span>
                          </div>
                        )}
                        <p className="text-sm text-gray-700 whitespace-pre-line">{note.text}</p>
                      </div>
                      <div className="flex space-x-2">
                        {note.id !== 'help-note' && (
                          <>
                            <button
                              onClick={() => setEditingNoteId(note.id)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteNote(note.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
