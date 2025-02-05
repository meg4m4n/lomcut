import React, { useState, useEffect } from 'react';
import { Scissors, Plus, ArrowRight } from 'lucide-react';
import { CuttingList } from './components/CuttingList';
import { CutDetails } from './components/CutDetails';
import { CuttingTable } from './components/CuttingTable';
import { CutRegistration } from './components/CutRegistration';
import { LabelPrinting } from './components/LabelPrinting';
import { Converter } from './components/Converter';
import { Auth } from './components/Auth';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import type { CutDetails as ICutDetails, Material } from './types';

function App() {
  const { user, loading } = useAuth();
  const [cuts, setCuts] = useState<ICutDetails[]>([]);
  const [selectedCut, setSelectedCut] = useState<ICutDetails | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sizes, setSizes] = useState<Record<string, number>>({});

  // Check if we're on the converter page
  const isConverterPage = window.location.pathname === '/converter';

  useEffect(() => {
    if (!user) return;

    // Fetch cuts from Supabase
    const fetchCuts = async () => {
      const { data, error } = await supabase
        .from('cuts')
        .select(`
          *,
          materials (
            *,
            sizes (*),
            services (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cuts:', error);
        return;
      }

      // Transform the data to match our frontend types
      const transformedCuts = data.map(cut => ({
        id: cut.id,
        client: {
          name: cut.client_name,
          brand: cut.client_brand,
        },
        orderDate: cut.order_date,
        deadline: cut.deadline,
        modelReference: cut.model_reference,
        description: cut.description || '',
        gender: cut.gender,
        type: cut.type,
        projectLink: cut.project_link || '',
        status: cut.status,
        materials: cut.materials?.map(material => ({
          id: material.id,
          name: material.name,
          supplier: material.supplier,
          color: material.color,
          width: material.width,
          cutRef: material.cut_ref || '',
          dxfFile: null, // We'll handle file downloads separately
          pdfFile: null,
          sizes: material.sizes?.reduce((acc, size) => ({
            ...acc,
            [size.size]: size.quantity,
          }), {}),
        })) || [],
      }));

      setCuts(transformedCuts);
    };

    fetchCuts();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (isConverterPage) {
    return <Converter />;
  }

  const handleAddCut = async () => {
    try {
      // Create a new cut in Supabase first
      const { data: newCut, error } = await supabase
        .from('cuts')
        .insert({
          client_name: '',
          client_brand: '',
          order_date: new Date().toISOString(),
          model_reference: '',
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Transform the new cut to match our frontend type
      const transformedCut: ICutDetails = {
        id: newCut.id,
        client: {
          name: '',
          brand: '',
        },
        orderDate: newCut.order_date,
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

      setCuts((prev) => [...prev, transformedCut]);
      setSelectedCut(transformedCut);
    } catch (err) {
      console.error('Error creating new cut:', err);
    }
  };

  const handleDeleteCut = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cuts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCuts((prev) => prev.filter((cut) => cut.id !== id));
      if (selectedCut?.id === id) {
        setSelectedCut(null);
      }
    } catch (err) {
      console.error('Error deleting cut:', err);
    }
  };

  const handleUpdateCut = async (updatedCut: ICutDetails) => {
    try {
      const { error } = await supabase
        .from('cuts')
        .update({
          client_name: updatedCut.client.name,
          client_brand: updatedCut.client.brand,
          order_date: updatedCut.orderDate,
          deadline: updatedCut.deadline || null,
          model_reference: updatedCut.modelReference,
          description: updatedCut.description || null,
          gender: updatedCut.gender,
          type: updatedCut.type,
          project_link: updatedCut.projectLink || null,
          status: updatedCut.status,
        })
        .eq('id', updatedCut.id);

      if (error) throw error;

      setCuts((prevCuts) =>
        prevCuts.map((cut) => (cut.id === updatedCut.id ? updatedCut : cut))
      );
      setSelectedCut(null);
    } catch (err) {
      console.error('Error updating cut:', err);
    }
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
            <div className="flex items-center gap-4">
              <a
                href="/converter"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
              >
                CONVERTER
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
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
                onAddMaterial={async (material) => {
                  try {
                    // Save material to Supabase
                    const { data, error } = await supabase
                      .from('materials')
                      .insert({
                        cut_id: selectedCut.id,
                        name: material.name,
                        supplier: material.supplier,
                        color: material.color,
                        width: material.width,
                        cut_ref: material.cutRef,
                        user_id: user.id,
                      })
                      .select()
                      .single();

                    if (error) throw error;

                    // Save sizes
                    if (material.sizes) {
                      const sizesPromises = Object.entries(material.sizes).map(
                        ([size, quantity]) =>
                          supabase.from('sizes').insert({
                            material_id: data.id,
                            size,
                            quantity,
                            user_id: user.id,
                          })
                      );
                      await Promise.all(sizesPromises);
                    }

                    // Update local state
                    const updatedCut = {
                      ...selectedCut,
                      materials: [...selectedCut.materials, { ...material, id: data.id }],
                    };
                    handleUpdateCut(updatedCut);
                  } catch (err) {
                    console.error('Error adding material:', err);
                  }
                }}
                onUpdateSizes={setSizes}
              />
              <CutRegistration
                materials={selectedCut.materials}
                onUpdatePieceStatus={async (pieceId, status) => {
                  // Update piece status in Supabase
                }}
              />
              <LabelPrinting
                modelReference={selectedCut.modelReference}
                sizes={selectedCut.sizes}
                materials={selectedCut.materials}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;