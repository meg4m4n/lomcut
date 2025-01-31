import React, { useState } from 'react';
import { Calendar, Link, Users, X, ArrowLeft } from 'lucide-react';
import type { CutDetails as ICutDetails, ProtoType } from '../types';

interface CutDetailsProps {
  cut: ICutDetails;
  onUpdate: (updatedCut: ICutDetails) => void;
  onCancel: () => void;
}

export function CutDetails({ cut, onUpdate, onCancel }: CutDetailsProps) {
  const [editForm, setEditForm] = useState(cut);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(editForm);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditForm((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof ICutDetails],
          [child]: value,
        },
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            {cut.id === editForm.id ? 'Editar Detalhes do Corte' : 'New Cut'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Cliente
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600">Nome</label>
                  <input
                    type="text"
                    name="client.name"
                    value={editForm.client.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Marca</label>
                  <input
                    type="text"
                    name="client.brand"
                    value={editForm.client.brand}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Prazos</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600">
                    Data do Pedido
                  </label>
                  <input
                    type="date"
                    name="orderDate"
                    value={editForm.orderDate}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Data Entrega
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={editForm.deadline}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Link para Projecto
              </h3>
              <input
                type="url"
                name="projectLink"
                value={editForm.projectLink}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Detalhes do Modelo
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600">
                    Reference
                  </label>
                  <input
                    type="text"
                    name="modelReference"
                    value={editForm.modelReference}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">
                    Descrição
                  </label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Género
                </label>
                <select
                  name="gender"
                  value={editForm.gender}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="male">Homem</option>
                  <option value="female">Mulher</option>
                  <option value="unisex">Unisex</option>
                  <option value="unisex">Menino</option>
                  <option value="unisex">Menina</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Tipologia
                </label>
                <select
                  name="type"
                  value={editForm.type}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="1st proto">1º Proto</option>
                  <option value="2nd proto">2º Proto</option>
                  <option value="3rd proto">3º Proto</option>
                  <option value="size-set">Size-Set</option>
                  <option value="production">Produção</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Estado
              </label>
              <select
                name="status"
                value={editForm.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="pending">Pendente</option>
                <option value="in-progress">Em Produção</option>
                <option value="completed">Completo</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
