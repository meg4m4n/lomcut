import React from 'react';
import { Printer, Settings } from 'lucide-react';

interface LabelPrintingProps {
  modelReference: string;
  sizes: Record<string, number>;
}

export function LabelPrinting({ modelReference, sizes }: LabelPrintingProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Imprimir etiquetas</h2>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Settings className="h-5 w-5 text-gray-600" />
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
            <Printer className="h-5 w-5 mr-2" />
            Imprimir Etiquetas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Pré-visualizar Etiqueta</h3>
          <div className="border rounded-lg p-4 space-y-4">
            <div className="w-[23mm] h-[51mm] border-2 border-dashed border-gray-300 p-2 scale-150 origin-top-left">
              <div className="text-[8pt] space-y-1">
                <p className="font-bold">{modelReference}</p>
                <p>Size: {Object.keys(sizes)[0]}</p>
                <div className="mt-2">
                  <img
                    src="https://barcode.tec-it.com/barcode.ashx?data=ABC123&code=Code128&dpi=96"
                    alt="Barcode"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Lista de Impressão</h3>
          <div className="border rounded-lg p-4">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left text-sm font-medium text-gray-500">
                    Tamanho
                  </th>
                  <th className="text-left text-sm font-medium text-gray-500">
                    Quantidade
                  </th>
                  <th className="text-left text-sm font-medium text-gray-500">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(sizes).map(([size, quantity]) => (
                  <tr key={size}>
                    <td className="py-2 text-sm text-gray-900">{size}</td>
                    <td className="py-2 text-sm text-gray-900">{quantity}</td>
                    <td className="py-2 text-sm text-gray-500">
                      Pronto para impressão
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
