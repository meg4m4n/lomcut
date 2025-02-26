import React, { useState, useEffect } from 'react';
import { Printer, Settings, X, Plus, Minus, Check, List } from 'lucide-react';
import type { LabelEntry, ServiceType, LabelService, Material } from '../types';

const SERVICES: ServiceType[] = [
  'ESTAMPARIA',
  'TRANSFER',
  'BORDADO',
  'EMBOSSING',
  'DTG',
  'DTF',
  'PEDRAS',
  'LAVANDARIA',
  'TINGIMENTO',
  'CORTE LASER',
  'COLADOS',
  'OUTROS'
];

interface LabelPrintingProps {
  modelReference: string;
  sizes: Record<string, number>;
  materials: Material[];
}

const createEmptyServices = (): Record<ServiceType, LabelService> => {
  return SERVICES.reduce((acc, service) => ({
    ...acc,
    [service]: {
      type: service,
      enabled: false,
      quantity: 0
    }
  }), {} as Record<ServiceType, LabelService>);
};

export function LabelPrinting({ modelReference, sizes, materials }: LabelPrintingProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [labelSettings, setLabelSettings] = useState({
    dpi: 96,
    copies: 1
  });
  const [selectedEntry, setSelectedEntry] = useState<LabelEntry | null>(null);
  const [labelEntries, setLabelEntries] = useState<LabelEntry[]>([]);
  const [editingQuantity, setEditingQuantity] = useState<{index: number, value: string} | null>(null);
  const [showServices, setShowServices] = useState(false);

  useEffect(() => {
    const entries: LabelEntry[] = [];
    
    materials.forEach(material => {
      Object.entries(material.sizes).forEach(([size, quantity]) => {
        const existingEntry = entries.find(entry => entry.size === size);
        
        if (existingEntry) {
          existingEntry.quantity += quantity;
          existingEntry.labelsToPrint = Math.max(existingEntry.labelsToPrint, existingEntry.quantity);
        } else {
          entries.push({
            cutRef: material.cutRef || '',
            modelRef: modelReference,
            size,
            quantity,
            services: createEmptyServices(),
            labelsToPrint: quantity
          });
        }
      });
    });

    setLabelEntries(entries);
  }, [materials, modelReference, sizes]);

  const handleSettingsChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setLabelSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelsToPrint = labelEntries.flatMap(entry => 
      Array(entry.labelsToPrint).fill(entry)
    );

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Labels</title>
          <style>
            @page {
              size: 25mm 52mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .label {
              width: 25mm;
              height: 52mm;
              padding: 2mm;
              box-sizing: border-box;
              page-break-after: always;
              font-size: 8pt;
            }
            .label p {
              margin: 0;
              line-height: 1.2;
            }
            .label .info-line {
              display: flex;
              justify-content: space-between;
              margin-bottom: 0.5mm;
            }
            .label .info-line span {
              font-weight: normal;
            }
            .label .services {
              margin-top: 2mm;
              border-top: 0.5px solid #ccc;
              padding-top: 1mm;
            }
            .label .service-line {
              font-size: 7pt;
              color: #666;
              margin-bottom: 0.5mm;
            }
            @media print {
              .label {
                page-break-after: always;
              }
            }
          </style>
        </head>
        <body>
          ${labelsToPrint.map(entry => `
            <div class="label">
              <p style="font-weight: bold; margin-bottom: 1mm;">${entry.modelRef}</p>
              <div class="info-line">
                <span>Ref:</span>
                <span>${entry.cutRef}</span>
              </div>
              <div class="info-line">
                <span>Tam:</span>
                <span>${entry.size}</span>
              </div>
              ${Object.values(entry.services)
                .filter(service => service.enabled)
                .map(service => `
                  <div class="service-line">
                    ${service.type} - ${service.quantity} un.
                  </div>
                `).join('')}
            </div>
          `).join('')}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const updateLabelCount = (index: number, increment: boolean) => {
    setLabelEntries(prev => prev.map((entry, i) => {
      if (i === index) {
        return {
          ...entry,
          labelsToPrint: increment 
            ? entry.labelsToPrint + 1 
            : Math.max(0, entry.labelsToPrint - 1)
        };
      }
      return entry;
    }));
  };

  const updateQuantity = (index: number, value: string) => {
    const quantity = parseInt(value) || 0;
    setLabelEntries(prev => prev.map((entry, i) => {
      if (i === index) {
        return {
          ...entry,
          quantity,
          labelsToPrint: Math.max(entry.labelsToPrint, quantity)
        };
      }
      return entry;
    }));
  };

  const toggleService = (entryIndex: number, service: ServiceType) => {
    setLabelEntries(prev => prev.map((entry, i) => {
      if (i === entryIndex) {
        const updatedServices = {
          ...entry.services,
          [service]: {
            ...entry.services[service],
            enabled: !entry.services[service].enabled,
            quantity: entry.services[service].enabled ? 0 : entry.quantity
          }
        };
        return { ...entry, services: updatedServices };
      }
      return entry;
    }));
  };

  const updateServiceQuantity = (entryIndex: number, service: ServiceType, quantity: number) => {
    setLabelEntries(prev => prev.map((entry, i) => {
      if (i === entryIndex) {
        const updatedServices = {
          ...entry.services,
          [service]: {
            ...entry.services[service],
            quantity: Math.max(0, quantity)
          }
        };
        return { ...entry, services: updatedServices };
      }
      return entry;
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Imprimir etiquetas</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Definições"
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Printer className="h-5 w-5" />
            <span>Imprimir ({labelEntries.reduce((sum, entry) => sum + entry.labelsToPrint, 0)} etiquetas)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Lista de Etiquetas</h3>
            <button
              onClick={() => setShowServices(!showServices)}
              className={`p-2 rounded-lg flex items-center gap-2 ${
                showServices ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="Mostrar/Esconder Serviços"
            >
              <List className="h-5 w-5" />
              <span className="text-sm">
                {showServices ? 'Esconder Serviços' : 'Mostrar Serviços'}
              </span>
            </button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ref. Corte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ref. Modelo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tamanho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qtd.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Etiquetas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {labelEntries.map((entry, index) => (
                  <tr 
                    key={index}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedEntry === entry ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={entry.cutRef}
                        onChange={(e) => {
                          const newEntries = [...labelEntries];
                          newEntries[index].cutRef = e.target.value;
                          setLabelEntries(newEntries);
                        }}
                        className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {entry.modelRef}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {entry.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={entry.quantity}
                        onChange={(e) => updateQuantity(index, e.target.value)}
                        min="0"
                        className="w-20 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => updateLabelCount(index, false)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          value={entry.labelsToPrint}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            const newEntries = [...labelEntries];
                            newEntries[index].labelsToPrint = Math.max(0, value);
                            setLabelEntries(newEntries);
                          }}
                          min="0"
                          className="w-16 px-2 py-1 text-sm text-center border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => updateLabelCount(index, true)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showServices && selectedEntry && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Serviços para {selectedEntry.size}</h4>
              <div className="grid grid-cols-2 gap-4">
                {SERVICES.map((service) => {
                  const serviceData = selectedEntry.services[service];
                  return (
                    <div 
                      key={service}
                      className={`p-3 border rounded-lg ${
                        serviceData.enabled ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleService(
                              labelEntries.indexOf(selectedEntry),
                              service
                            )}
                            className={`p-1 rounded ${
                              serviceData.enabled 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200'
                            }`}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-medium">{service}</span>
                        </div>
                        {serviceData.enabled && (
                          <input
                            type="number"
                            value={serviceData.quantity}
                            onChange={(e) => updateServiceQuantity(
                              labelEntries.indexOf(selectedEntry),
                              service,
                              parseInt(e.target.value) || 0
                            )}
                            className="w-20 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Pré-visualizar Etiqueta</h3>
          <div className="border rounded-lg p-4">
            {selectedEntry ? (
              <div className="w-[25mm] h-[52mm] border-2 border-dashed border-gray-300 p-2 scale-[2] origin-top-left">
                <div className="text-[8pt] space-y-1">
                  <p className="font-bold">{selectedEntry.modelRef}</p>
                  <div className="flex justify-between">
                    <span>Ref:</span>
                    <span>{selectedEntry.cutRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tam:</span>
                    <span>{selectedEntry.size}</span>
                  </div>
                  {Object.values(selectedEntry.services)
                    .filter(service => service.enabled)
                    .map((service, index) => (
                      <div key={index} className="text-[7pt] text-gray-600">
                        {service.type} - {service.quantity} un.
                      </div>
                    ))
                  }
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-500">
                Selecione uma etiqueta para pré-visualizar
              </div>
            )}
          </div>
        </div>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Definições de Impressão</h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-1 text-gray-600 hover:text-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  DPI
                </label>
                <select
                  name="dpi"
                  value={labelSettings.dpi}
                  onChange={handleSettingsChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value={72}>72</option>
                  <option value={96}>96</option>
                  <option value={150}>150</option>
                  <option value={300}>300</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}