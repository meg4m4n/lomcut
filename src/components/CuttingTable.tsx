import React, { useState, useEffect } from 'react';
import {
  Plus,
  Upload,
  AlertCircle,
  Trash2,
  Check,
  X,
  Edit2,
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
}

export function CuttingTable({
  materials,
  onAddMaterial,
  onUpdateSizes,
}: CuttingTableProps) {
  const [sizes, setSizes] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newMaterial, setNewMaterial] = useState<boolean>(false);
  const [newSize, setNewSize] = useState<string>('');
  const [editForm, setEditForm] = useState<MaterialFormData>({
    name: '',
    supplier: '',
    color: '',
    width: 0,
  });
  const [dxfFile, setDxfFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Update sizes when a size quantity changes
  const handleSizeQuantityChange = (size: string, value: string) => {
    const quantity = parseInt(value) || 0;
    const newSizes = {
      ...sizes,
      [size]: quantity,
    };
    setSizes(newSizes);
    onUpdateSizes(newSizes);
  };

  const handleAddSize = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSize.trim()) {
      const updatedSizes = { ...sizes, [newSize.trim()]: 0 };
      setSizes(updatedSizes);
      onUpdateSizes(updatedSizes);
      setNewSize('');
    }
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    const newSizes = { ...sizes };
    delete newSizes[sizeToRemove];
    setSizes(newSizes);
    onUpdateSizes(newSizes);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index?: number
  ) => {
    const { name, value, type } = e.target;
    if (index !== undefined) {
      const updatedMaterials = [...materials];
      updatedMaterials[index] = {
        ...updatedMaterials[index],
        [name]: type === 'number' ? parseFloat(value) : value,
      };
    } else {
      setEditForm((prev) => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value,
      }));
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'dxf' | 'pdf'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'dxf') {
        setDxfFile(file);
      } else {
        setPdfFile(file);
      }
    }
  };

  const handleSave = (index?: number) => {
    const newMaterial: Material = {
      ...editForm,
      dxfFile,
      pdfFile,
    };
    onAddMaterial(newMaterial);
    setNewMaterial(false);
    setEditForm({
      name: '',
      supplier: '',
      color: '',
      width: 0,
    });
    setDxfFile(null);
    setPdfFile(null);
    setEditingId(null);
  };

  const handleDelete = (index: number) => {
    const updatedMaterials = materials.filter((_, i) => i !== index);
    // Update materials through parent
    // onUpdateMaterials(updatedMaterials);
  };

  const renderEditableRow = (material: Material, index: number) => {
    const isEditing = editingId === index;

    if (!isEditing) {
      return (
        <tr key={index} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="text-sm text-gray-900">{material.name}</span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="text-sm text-gray-900">{material.supplier}</span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="text-sm text-gray-900">{material.color}</span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className="text-sm text-gray-900">{material.width}</span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex space-x-2">
              {material.dxfFile && (
                <span className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded">
                  DXF
                </span>
              )}
              {material.pdfFile && (
                <span className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded">
                  PDF
                </span>
              )}
            </div>
          </td>
          {Object.keys(sizes).map((size) => (
            <td key={size} className="px-6 py-4 whitespace-nowrap">
              <input
                type="number"
                min="0"
                value={sizes[size]}
                onChange={(e) => handleSizeQuantityChange(size, e.target.value)}
                onBlur={(e) => handleSizeQuantityChange(size, e.target.value)}
                className="w-16 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </td>
          ))}
          <td className="px-6 py-4 whitespace-nowrap text-right">
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditingId(index)}
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
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr key={index} className="bg-blue-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="text"
            name="name"
            value={material.name}
            onChange={(e) => handleInputChange(e, index)}
            className="w-full px-2 py-1 border rounded"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="text"
            name="supplier"
            value={material.supplier}
            onChange={(e) => handleInputChange(e, index)}
            className="w-full px-2 py-1 border rounded"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="text"
            name="color"
            value={material.color}
            onChange={(e) => handleInputChange(e, index)}
            className="w-full px-2 py-1 border rounded"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <input
            type="number"
            name="width"
            value={material.width}
            onChange={(e) => handleInputChange(e, index)}
            className="w-full px-2 py-1 border rounded"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex gap-2">
            <input
              type="file"
              accept=".dxf"
              onChange={(e) => handleFileChange(e, 'dxf')}
              className="hidden"
              id={`dxf-file-${index}`}
            />
            <label
              htmlFor={`dxf-file-${index}`}
              className="flex items-center px-2 py-1 border rounded text-sm cursor-pointer hover:bg-gray-50"
            >
              <Upload className="h-4 w-4 mr-1" />
              DXF
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(e, 'pdf')}
              className="hidden"
              id={`pdf-file-${index}`}
            />
            <label
              htmlFor={`pdf-file-${index}`}
              className="flex items-center px-2 py-1 border rounded text-sm cursor-pointer hover:bg-gray-50"
            >
              <Upload className="h-4 w-4 mr-1" />
              PDF
            </label>
          </div>
        </td>
        {Object.keys(sizes).map((size) => (
          <td key={size} className="px-6 py-4 whitespace-nowrap">
            <input
              type="number"
              min="0"
              value={sizes[size]}
              onChange={(e) => handleSizeQuantityChange(size, e.target.value)}
              onBlur={(e) => handleSizeQuantityChange(size, e.target.value)}
              className="w-16 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </td>
        ))}
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => handleSave(index)}
              className="text-green-600 hover:text-green-800"
            >
              <Check className="h-5 w-5" />
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Detalhes do Corte</h2>
        <button
          onClick={() => setNewMaterial(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Adicionar Corte
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
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
              {Object.entries(sizes).map(([size]) => (
                <th
                  key={size}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider group relative"
                >
                  <div className="flex items-center">
                    <span>{size}</span>
                    <button
                      onClick={() => handleRemoveSize(size)}
                      className="ml-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 relative">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    onKeyDown={handleAddSize}
                    placeholder="Adicionar Tamanho..."
                    className="w-20 px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Plus className="h-4 w-4 text-blue-600" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {newMaterial && (
              <tr className="bg-blue-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    placeholder="Material name"
                    className="w-full px-2 py-1 border rounded"
                    required
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    name="supplier"
                    value={editForm.supplier}
                    onChange={handleInputChange}
                    placeholder="Supplier"
                    className="w-full px-2 py-1 border rounded"
                    required
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    name="color"
                    value={editForm.color}
                    onChange={handleInputChange}
                    placeholder="Color"
                    className="w-full px-2 py-1 border rounded"
                    required
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    name="width"
                    value={editForm.width}
                    onChange={handleInputChange}
                    placeholder="Width"
                    min="0"
                    step="0.1"
                    className="w-full px-2 py-1 border rounded"
                    required
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".dxf"
                      onChange={(e) => handleFileChange(e, 'dxf')}
                      className="hidden"
                      id="new-dxf-file"
                    />
                    <label
                      htmlFor="new-dxf-file"
                      className="flex items-center px-2 py-1 border rounded text-sm cursor-pointer hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      DXF
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, 'pdf')}
                      className="hidden"
                      id="new-pdf-file"
                    />
                    <label
                      htmlFor="new-pdf-file"
                      className="flex items-center px-2 py-1 border rounded text-sm cursor-pointer hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      PDF
                    </label>
                  </div>
                </td>
                {Object.keys(sizes).map((size) => (
                  <td key={size} className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="0"
                      value={sizes[size]}
                      onChange={(e) =>
                        handleSizeQuantityChange(size, e.target.value)
                      }
                      onBlur={(e) =>
                        handleSizeQuantityChange(size, e.target.value)
                      }
                      className="w-16 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleSave()}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setNewMaterial(false)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {materials.map((material, index) =>
              renderEditableRow(material, index)
            )}
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
