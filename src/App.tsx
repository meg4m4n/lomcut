import React, { useState } from 'react';
import { Scissors, Plus } from 'lucide-react';
import { CuttingList } from './components/CuttingList';
import { CutDetails } from './components/CutDetails';
import { CuttingTable } from './components/CuttingTable';
import { CutRegistration } from './components/CutRegistration';
import { LabelPrinting } from './components/LabelPrinting';
import type { CutDetails as ICutDetails, Material, PieceStatus } from './types';

// Sample data
const sampleCuts: ICutDetails[] = [
  {
    id: '1',
    client: {
      name: 'Fashion Corp',
      brand: 'StyleWear',
    },
    orderDate: '2024-03-10',
    deadline: '2024-03-20',
    modelReference: 'FW24-001',
    description: 'Summer collection blazer',
    gender: 'female',
    type: '1st proto',
    projectLink: 'https://example.com/project/1',
    status: 'pending',
    materials: [],
    sizes: {},
  },
];

function App() {
  const [cuts, setCuts] = useState<ICutDetails[]>(sampleCuts);
  const [selectedCut, setSelectedCut] = useState<ICutDetails | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sizes, setSizes] = useState<Record<string, number>>({});

  const handleAddCut = () => {
    const newCut: ICutDetails = {
      id: Date.now().toString(),
      client: {
        name: '',
        brand: '',
      },
      orderDate: new Date().toISOString().split('T')[0],
      deadline: '',
      modelReference: '',
      description: '',
      gender: 'unisex',
      type: '1st proto',
      projectLink: '',
      status: 'pending',
      materials: [],
      sizes: {},
    };
    setCuts((prev) => [...prev, newCut]);
    setSelectedCut(newCut);
  };

  const handleDeleteCut = (id: string) => {
    setCuts((prev) => prev.filter((cut) => cut.id !== id));
    if (selectedCut?.id === id) {
      setSelectedCut(null);
    }
  };

  const handleUpdateCut = (updatedCut: ICutDetails) => {
    setCuts((prevCuts) =>
      prevCuts.map((cut) => (cut.id === updatedCut.id ? updatedCut : cut))
    );
    setSelectedCut(null);
  };

  const handleAddMaterial = (material: Material) => {
    setMaterials((prev) => [...prev, material]);
    if (selectedCut) {
      const updatedCut = {
        ...selectedCut,
        materials: [...selectedCut.materials, material],
      };
      handleUpdateCut(updatedCut);
    }
  };

  const handleUpdateSizes = (newSizes: Record<string, number>) => {
    setSizes(newSizes);
    if (selectedCut) {
      const updatedCut = {
        ...selectedCut,
        sizes: newSizes,
      };
      handleUpdateCut(updatedCut);
    }
  };

  const handleUpdatePieceStatus = (pieceId: string, status: PieceStatus) => {
    console.log('Updating piece status:', pieceId, status);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Scissors className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Lomartex - Gestão de Corte
              </h1>
            </div>
            {!selectedCut && (
              <button
                onClick={handleAddCut}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Cut
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {!selectedCut ? (
            <CuttingList
              cuts={cuts}
              onSelectCut={setSelectedCut}
              onDeleteCut={handleDeleteCut}
            />
          ) : (
            <>
              <CutDetails
                cut={selectedCut}
                onUpdate={handleUpdateCut}
                onCancel={() => setSelectedCut(null)}
              />
              <CuttingTable
                materials={selectedCut.materials}
                onAddMaterial={handleAddMaterial}
                onUpdateSizes={handleUpdateSizes}
              />
              <CutRegistration
                materials={selectedCut.materials}
                onUpdatePieceStatus={handleUpdatePieceStatus}
              />
              <LabelPrinting
                modelReference={selectedCut.modelReference}
                sizes={sizes}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
export default App;
