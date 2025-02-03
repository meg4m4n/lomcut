import React, { useState } from 'react';
import {
  Plus,
  Upload,
  AlertCircle,
  Trash2,
  Check,
  X,
  Edit2,
  FileText,
  Download,
} from 'lucide-react';
import type { Material } from '../types';

interface CuttingTableProps {
  materials: Material[];
  onAddMaterial: (material: Material) => void;
  onUpdateSizes: (sizes: Record<string, number>) => void;
}

interface MaterialFormData {
  name: string;
  supplier: string;
  color: string;
  width: number;
  cutRef: string;
  sizes: Record<string, number>;
  dxfFile: File | null;
  pdfFile: File | null;
}

export function CuttingTable({
  materials,
  onAddMaterial,
  onUpdateSizes,
}: CuttingTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newMaterial, setNewMaterial] = useState<boolean>(true);
  const [editForm, setEditForm] = useState<MaterialFormData>({
    name: '',
    supplier: '',
    color: '',
    width: 0,
    cutRef: '',
    sizes: {},
    dxfFile: null,
    pdfFile: null,
  });
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [newSize, setNewSize] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSizeQuantityChange = (
    materialId: string | null,
    size: string,
    value: string,
    isEditing = false
  ) => {
    const quantity = parseInt(value) || 0;
    
    if (isEditing && editingMaterial) {
      setEditingMaterial(prev => ({
        ...prev!,
        sizes: {
          ...prev!.sizes,
          [size]: quantity,
        },
      }));
    } else if (!isEditing) {
      setEditForm(prev => ({
        ...prev,
        sizes: {
          ...prev.sizes,
          [size]: quantity,
        },
      }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEditing = false
  ) => {
    const { name, value, type } = e.target;
    const updateFunc = isEditing ? setEditingMaterial : setEditForm;
    updateFunc((prev) => ({
      ...prev!,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'dxf' | 'pdf',
    isEditing = false
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isEditing && editingMaterial) {
        setEditingMaterial(prev => ({
          ...prev!,
          [type === 'dxf' ? 'dxfFile' : 'pdfFile']: file,
        }));
      } else {
        setEditForm(prev => ({
          ...prev,
          [type === 'dxf' ? 'dxfFile' : 'pdfFile']: file,
        }));
      }
    }
  };

  const handleSave = () => {
    if (!editForm.name || !editForm.supplier || !editForm.color || editForm.width <= 0) {
      return;
    }

    const newMaterialData: Material = {
      name: editForm.name,
      supplier: editForm.supplier,
      color: editForm.color,
      width: editForm.width,
      cutRef: editForm.cutRef,
      dxfFile: editForm.dxfFile,
      pdfFile: editForm.pdfFile,
      sizes: editForm.sizes,
    };
    
    onAddMaterial(newMaterialData);
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);

    setEditForm({
      name: '',
      supplier: '',
      color: '',
      width: 0,
      cutRef: '',
      sizes: editForm.sizes,
      dxfFile: null,
      pdfFile: null,
    });
  };

  const handleUpdate = (index: number) => {
    if (!editingMaterial) return;
    
    const updatedMaterials = [...materials];
    updatedMaterials[index] = editingMaterial;
    onAddMaterial(editingMaterial);
    setEditingMaterial(null);
    setEditingId(null);
  };

  const handleEdit = (material: Material, index: number) => {
    setEditingId(index);
    setEditingMaterial({ ...material });
  };

  const handleDelete = (index: number) => {
    const updatedMaterials = materials.filter((_, i) => i !== index);
    const totalSizes: Record<string, number> = {};
    
    updatedMaterials.forEach((material) => {
      Object.entries(material.sizes || {}).forEach(([size, qty]) => {
        totalSizes[size] = (totalSizes[size] || 0) + qty;
      });
    });
    
    onUpdateSizes(totalSizes);
  };

  const resetForm = () => {
    setNewMaterial(true);
    setEditForm({
      name: '',
      supplier: '',
      color: '',
      width: 0,
      cutRef: '',
      sizes: {},
      dxfFile: null,
      pdfFile: null,
    });
    setEditingId(null);
    setEditingMaterial(null);
  };

  const downloadFile = (file: File, filename: string) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Detalhes do Corte</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ref. Corte
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tecido/Malha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fornecedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Largura (cm)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ficheiros
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tamanhos e Quantidades
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {newMaterial && !editingId && (
              <tr className="bg-blue-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    name="cutRef"
                    value={editForm.cutRef}
                    onChange={handleInputChange}
                    placeholder="Ref. Corte"
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    placeholder="Nome do material"
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    name="supplier"
                    value={editForm.supplier}
                    onChange={handleInputChange}
                    placeholder="Fornecedor"
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    name="color"
                    value={editForm.color}
                    onChange={handleInputChange}
                    placeholder="Cor"
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    name="width"
                    value={editForm.width || ''}
                    onChange={handleInputChange}
                    placeholder="Largura"
                    min="0"
                    step="0.1"
                    className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="file"
                        accept=".dxf"
                        onChange={(e) => handleFileChange(e, 'dxf')}
                        className="hidden"
                        id="new-dxf-file"
                      />
                      <label
                        htmlFor="new-dxf-file"
                        className={`flex items-center px-2 py-1 border rounded text-sm cursor-pointer hover:bg-gray-50 ${
                          editForm.dxfFile ? 'bg-green-100 border-green-500' : ''
                        }`}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        DXF {editForm.dxfFile ? '✓' : ''}
                      </label>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, 'pdf')}
                        className="hidden"
                        id="new-pdf-file"
                      />
                      <label
                        htmlFor="new-pdf-file"
                        className={`flex items-center px-2 py-1 border rounded text-sm cursor-pointer hover:bg-gray-50 ${
                          editForm.pdfFile ? 'bg-green-100 border-green-500' : ''
                        }`}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        PDF {editForm.pdfFile ? '✓' : ''}
                      </label>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Tamanho"
                        className="w-24 px-2 py-1 text-sm border rounded"
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newSize.trim()) {
                            setEditForm(prev => ({
                              ...prev,
                              sizes: {
                                ...prev.sizes,
                                [newSize.trim()]: 0,
                              },
                            }));
                            setNewSize('');
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newSize.trim()) {
                            setEditForm(prev => ({
                              ...prev,
                              sizes: {
                                ...prev.sizes,
                                [newSize.trim()]: 0,
                              },
                            }));
                            setNewSize('');
                          }
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(editForm.sizes).map(([size, quantity]) => (
                        <div key={size} className="flex items-center space-x-2">
                          <span className="text-sm w-16">{size}</span>
                          <input
                            type="number"
                            min="0"
                            value={quantity}
                            onChange={(e) => handleSizeQuantityChange(null, size, e.target.value)}
                            className="w-20 px-2 py-1 text-sm border rounded"
                          />
                          <button
                            onClick={() => {
                              const { [size]: _, ...rest } = editForm.sizes;
                              setEditForm(prev => ({
                                ...prev,
                                sizes: rest,
                              }));
                            }}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={handleSave}
                      className={`text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${
                        saveSuccess ? 'text-green-800 bg-green-100 rounded-full p-1' : ''
                      }`}
                      disabled={!editForm.name || !editForm.supplier || !editForm.color || !editForm.width}
                    >
                      <Check className={`h-5 w-5 ${saveSuccess ? 'animate-bounce' : ''}`} />
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {materials.map((material, index) => (
              <tr key={index} className={editingId === index ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === index ? (
                    <input
                      type="text"
                      name="cutRef"
                      value={editingMaterial?.cutRef || ''}
                      onChange={(e) => handleInputChange(e, true)}
                      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{material.cutRef}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === index ? (
                    <input
                      type="text"
                      name="name"
                      value={editingMaterial?.name || ''}
                      onChange={(e) => handleInputChange(e, true)}
                      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{material.name}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === index ? (
                    <input
                      type="text"
                      name="supplier"
                      value={editingMaterial?.supplier || ''}
                      onChange={(e) => handleInputChange(e, true)}
                      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{material.supplier}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === index ? (
                    <input
                      type="text"
                      name="color"
                      value={editingMaterial?.color || ''}
                      onChange={(e) => handleInputChange(e, true)}
                      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{material.color}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === index ? (
                    <input
                      type="number"
                      name="width"
                      value={editingMaterial?.width || ''}
                      onChange={(e) => handleInputChange(e, true)}
                      className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.1"
                      required
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{material.width}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingId === index ? (
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="file"
                          accept=".dxf"
                          onChange={(e) => handleFileChange(e, 'dxf', true)}
                          className="hidden"
                          id={`edit-dxf-file-${index}`}
                        />
                        <label
                          htmlFor={`edit-dxf-file-${index}`}
                          className={`flex items-center px-2 py-1 border rounded text-sm cursor-pointer hover:bg-gray-50 ${
                            editingMaterial?.dxfFile ? 'bg-green-100 border-green-500' : ''
                          }`}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          DXF {editingMaterial?.dxfFile ? '✓' : ''}
                        </label>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(e, 'pdf', true)}
                          className="hidden"
                          id={`edit-pdf-file-${index}`}
                        />
                        <label
                          htmlFor={`edit-pdf-file-${index}`}
                          className={`flex items-center px-2 py-1 border rounded text-sm cursor-pointer hover:bg-gray-50 ${
                            editingMaterial?.pdfFile ? 'bg-green-100 border-green-500' : ''
                          }`}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          PDF {editingMaterial?.pdfFile ? '✓' : ''}
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      {material.dxfFile && (
                        <button
                          onClick={() => downloadFile(material.dxfFile!, `${material.name}-${material.color}.dxf`)}
                          className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          DXF
                        </button>
                      )}
                      {material.pdfFile && (
                        <button
                          onClick={() => downloadFile(material.pdfFile!, `${material.name}-${material.color}.pdf`)}
                          className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          PDF
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === index ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Tamanho"
                          className="w-24 px-2 py-1 text-sm border rounded"
                          value={newSize}
                          onChange={(e) => setNewSize(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newSize.trim() && editingMaterial) {
                              setEditingMaterial(prev => ({
                                ...prev!,
                                sizes: {
                                  ...prev!.sizes,
                                  [newSize.trim()]: 0,
                                },
                              }));
                              setNewSize('');
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (newSize.trim() && editingMaterial) {
                              setEditingMaterial(prev => ({
                                ...prev!,
                                sizes: {
                                  ...prev!.sizes,
                                  [newSize.trim()]: 0,
                                },
                              }));
                              setNewSize('');
                            }
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(editingMaterial?.sizes || {}).map(([size, quantity]) => (
                          <div key={size} className="flex items-center space-x-2">
                            <span className="text-sm w-16">{size}</span>
                            <input
                              type="number"
                              min="0"
                              value={quantity}
                              onChange={(e) => handleSizeQuantityChange(null, size, e.target.value, true)}
                              className="w-20 px-2 py-1 text-sm border rounded"
                            />
                            <button
                              onClick={() => {
                                if (!editingMaterial) return;
                                const { [size]: _, ...rest } = editingMaterial.sizes;
                                setEditingMaterial(prev => ({
                                  ...prev!,
                                  sizes: rest,
                                }));
                              }}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {Object.entries(material.sizes || {}).map(([size, quantity]) => (
                        <div key={size} className="flex items-center space-x-2">
                          <span className="text-sm w-16">{size}</span>
                          <span className="text-sm">{quantity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end space-x-2">
                    {editingId === index ? (
                      <>
                        <button
                          onClick={() => handleUpdate(index)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={resetForm}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(material, index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {materials.length === 0 && !newMaterial && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Não existem materiais adicionados</p>
          <p className="text-sm text-gray-400">
            Clique "Adicionar Corte" para registar
          </p>
        </div>
      )}
    </div>
  );
}
