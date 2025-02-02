import React, { useState, useEffect } from 'react';
import { Scissors, MessageSquare, FileDown, Save, Trash2, HelpCircle } from 'lucide-react';
import { PDFViewer } from './PDFViewer';
import type { PieceStatus, Material } from '../types';

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
  const [notes, setNotes] = useState<{ id: string; text: string }[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

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

        <div className="border rounded-lg">
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
