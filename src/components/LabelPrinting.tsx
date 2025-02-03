import React, { useState } from 'react';
import { Printer, Settings, X, Plus } from 'lucide-react';

interface LabelPrintingProps {
  modelReference: string;
  sizes: Record<string, number>;
}

export function LabelPrinting({ modelReference, sizes }: LabelPrintingProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
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
