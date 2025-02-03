import React, { useState } from 'react';
import { Printer, Settings, X, Plus } from 'lucide-react';

interface LabelPrintingProps {
  modelReference: string;
  sizes: Record<string, number>;
}

export function LabelPrinting({ modelReference, sizes }: LabelPrintingProps) {
  const [settingsOpen, setSettingsOpen] = uimport React, { useState, useEffect } from 'react';
import { Printer, Settings, X, Plus, Minus, Check } from 'lucide-react';
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
    barcodeType: 'Code128',
    dpi: 96,
  });
  const [selectedEntry, setSelectedEntry] = useState<LabelEntry | null>(null);
  const [labelEntries, setLabelEntries] = useState<LabelEntry[]>([]);
  const [editingQuantity, setEditingQuantity] = useState<{index: number, value: string} | null>(null);

  // Initialize label entries from materials and sizes
  useEffect(() => {
    const entries: LabelEntry[] = [];
    
    materials.forEach(material => {
      Object.entries(material.sizes).forEach(([size, quantity]) => {
        // Check if an entry for this size already exists
        const existingEntry = entries.find(entry => entry.size === size);
        
        if (existingEntry) {
          // Update quantity if entry exists
          existingEntry.quantity += quantity;
          existingEntry.labelsToPrint = Math.max(existingEntry.labelsToPrint, existingEntry.quantity);
        } else {
          // Create new entry if it doesn't exist
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

  const handleSettingsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLabelSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrint = () => {
    console.log('Printing labels with settings:', labelSettings);
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
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Printer className="h-5 w-5 mr-2" />
            Imprimir Etiquetas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Lista de Etiquetas</h3>
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
                      {editingQuantity?.index === index ? (
                        <input
                          type="number"
                          value={editingQuantity.value}
                          onChange={(e) => setEditingQuantity({ index, value: e.target.value })}
                          onBlur={() => {
                            updateQuantity(index, editingQuantity.value);
                            setEditingQuantity(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateQuantity(index, editingQuantity.value);
                              setEditingQuantity(null);
                            }
                          }}
                          className="w-20 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-text"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingQuantity({ index, value: entry.quantity.toString() });
                          }}
                        >
                          {entry.quantity}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => updateLabelCount(index, false)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-medium w-8 text-center">
                          {entry.labelsToPrint}
                        </span>
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

          {selectedEntry && (
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
              <div className="w-[25mm] h-[52mm] border-2 border-dashed border-gray-300 p-2 scale-150 origin-top-left">
                <div className="text-[8pt] space-y-1">
                  <p className="font-bold">{selectedEntry.modelRef}</p>
                  <p className="text-xs">Ref. Corte: {selectedEntry.cutRef}</p>
                  <p className="text-xs">Tamanho: {selectedEntry.size}</p>
                  {Object.values(selectedEntry.services)
                    .filter(service => service.enabled)
                    .map((service, index) => (
                      <p key={index} className="text-xs truncate">
                        {service.type} ({service.quantity})
                      </p>
                    ))
                  }
                  <div className="mt-2">
                    <img
                      src={`https://barcode.tec-it.com/barcode.ashx?data=${selectedEntry.cutRef}&code=${labelSettings.barcodeType}&dpi=${labelSettings.dpi}`}
                      alt="Barcode"
                      className="w-full"
                    />
                  </div>
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
                  Tipo de Código de Barras
                </label>
                <select
                  name="barcodeType"
                  value={labelSettings.barcodeType}
                  onChange={handleSettingsChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Code128">Code 128</option>
                  <option value="Code39">Code 39</option>
                  <option value="EAN13">EAN 13</option>
                  <option value="EAN8">EAN 8</option>
                  <option value="UPCA">UPC-A</option>
                  <option value="UPCE">UPC-E</option>
                </select>
              </div>
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
}seState(false);
  const [labelSettings, setLabelSettings] = useState({
    barcodeType: 'Code128',
    dpi: 96,
  });
  const [extractedLines, setExtractedLines] = useState<string[]>([]);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);

  const handleSettingsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLabelSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrint = () => {
    // Placeholder for print logic
    console.log('Printing labels with settings:', labelSettings);
  };

  const handleTextExtracted = (lines: string[]) => {
    setExtractedLines(lines);
  };

  const toggleLineSelection = (line: string) => {
    setSelectedLines(prev => 
      prev.includes(line)
        ? prev.filter(l => l !== line)
        : [...prev, line]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Imprimir etiquetas</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
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
                {selectedLines.map((line, index) => (
                  <p key={index} className="text-xs truncate">{line}</p>
                ))}
                <div className="mt-2">
                  <img
                    src={`https://barcode.tec-it.com/barcode.ashx?data=ABC123&code=${labelSettings.barcodeType}&dpi=${labelSettings.dpi}`}
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
            <div className="space-y-4">
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {extractedLines.map((line, index) => (
                  <div 
                    key={index}
                    onClick={() => toggleLineSelection(line)}
                    className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                      selectedLines.includes(line)
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm">{line}</p>
                    </div>
                    {selectedLines.includes(line) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLineSelection(line);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
                  Tipo de Código de Barras
                </label>
                <select
                  name="barcodeType"
                  value={labelSettings.barcodeType}
                  onChange={handleSettingsChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Code128">Code 128</option>
                  <option value="Code39">Code 39</option>
                  <option value="EAN13">EAN 13</option>
                  <option value="EAN8">EAN 8</option>
                  <option value="UPCA">UPC-A</option>
                  <option value="UPCE">UPC-E</option>
                </select>
              </div>
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
