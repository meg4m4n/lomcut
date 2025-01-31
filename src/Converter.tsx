import React, { useState } from 'react';
import { ArrowLeft, ArrowRightLeft } from 'lucide-react';

export function Converter() {
  const [weight, setWeight] = useState<string>('');
  const [meters, setMeters] = useState<string>('');
  const [gsm, setGsm] = useState<string>('');
  const [width, setWidth] = useState<string>('');

  const calculateMeters = () => {
    if (weight && gsm && width) {
      const weightKg = parseFloat(weight);
      const gsmValue = parseFloat(gsm);
      const widthM = parseFloat(width) / 100; // convert cm to meters
      const result = (weightKg * 1000) / (gsmValue * widthM);
      setMeters(result.toFixed(2));
    }
  };

  const calculateWeight = () => {
    if (meters && gsm && width) {
      const metersValue = parseFloat(meters);
      const gsmValue = parseFloat(gsm);
      const widthM = parseFloat(width) / 100; // convert cm to meters
      const result = (metersValue * gsmValue * widthM) / 1000;
      setWeight(result.toFixed(2));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <a
            href="/"
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </a>
          <h1 className="text-3xl font-bold text-gray-800">Conversor de Unidades</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gramagem (g/m²)
                </label>
                <input
                  type="number"
                  value={gsm}
                  onChange={(e) => setGsm(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 180"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Largura (cm)
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 150"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 5.5"
                  />
                </div>
                <button
                  onClick={calculateMeters}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  disabled={!weight || !gsm || !width}
                >
                  <ArrowRightLeft className="h-5 w-5" />
                  Converter para Metros
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metros Lineares
                  </label>
                  <input
                    type="number"
                    value={meters}
                    onChange={(e) => setMeters(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 20"
                  />
                </div>
                <button
                  onClick={calculateWeight}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  disabled={!meters || !gsm || !width}
                >
                  <ArrowRightLeft className="h-5 w-5" />
                  Converter para Peso
                </button>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Como usar:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Insira a gramagem do tecido em g/m²</li>
                <li>Insira a largura do tecido em centímetros</li>
                <li>Para converter:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Insira o peso em kg para obter metros lineares</li>
                    <li>OU insira metros lineares para obter o peso em kg</li>
                  </ul>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
