import React, { useState } from 'react';
import { ListFilter, Search, Pencil, Trash2 } from 'lucide-react';
import type { CutDetails } from '../types';

interface CuttingListProps {
  cuts: CutDetails[];
  onSelectCut: (cut: CutDetails) => void;
  onDeleteCut: (id: string) => void;
}

export function CuttingList({
  cuts,
  onSelectCut,
  onDeleteCut,
}: CuttingListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getStatusInPortuguese = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'in-progress':
        return 'Em Produção';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };

  const filteredCuts = cuts.filter((cut) => {
    const matchesSearch =
      cut.modelReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cut.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cut.client.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || cut.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Lista de Cortes</h2>
        <div className="flex gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Procurar Corte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Filtrar Estados</option>
            <option value="pending">Pendente</option>
            <option value="in-progress">Em Produção</option>
            <option value="completed">Concluído</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Referência
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipologia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCuts.map((cut) => (
              <tr key={cut.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {cut.modelReference || 'No Reference'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {cut.client.name || 'No Client'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {cut.client.brand || 'No Brand'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(cut.orderDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Due:{' '}
                    {cut.deadline
                      ? new Date(cut.deadline).toLocaleDateString()
                      : 'Not set'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{cut.type}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${
                      cut.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : cut.status === 'in-progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {getStatusInPortuguese(cut.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onSelectCut(cut)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDeleteCut(cut.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCuts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Não foram encontrados cortes</p>
            <p className="text-sm text-gray-400">
              Tente ajustar a pesquisa ou filtros
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
