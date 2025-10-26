
import React from 'react';
import type { SimulationParams } from '../types';

interface ControlsProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  deltaT: number;
}

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: string;
}> = ({ label, icon, ...props }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
        <label className="flex items-center space-x-2 font-medium text-slate-300">
            <span>{icon}</span>
            <span>{label}</span>
        </label>
        <span className="text-sm font-mono px-2 py-1 rounded-md bg-slate-700 text-cyan-300">
            {props.value.toFixed(2)}
        </span>
    </div>
    <input
      type="range"
      {...props}
      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer range-lg accent-cyan-400"
    />
  </div>
);

const NumberInput: React.FC<{
  label: string;
  value: number;
  step: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: string;
}> = ({ label, icon, value, step, onChange }) => (
  <div className="space-y-2">
    <label className="flex items-center space-x-2 font-medium text-slate-300">
      <span>{icon}</span>
      <span>{label}</span>
    </label>
    <input
      type="number"
      step={step}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-cyan-300 font-mono focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none"
    />
  </div>
);


export const Controls: React.FC<ControlsProps> = ({ params, setParams, deltaT }) => {
  return (
    <aside className="absolute top-4 left-4 w-full max-w-sm p-6 bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl text-slate-100 flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-cyan-300">Olimpiadas Stem Liceo Femenino de Cundinamarca Mercedes Nariño 905</h1>
        <p className="text-sm text-slate-400 mt-2">Simulación Interactiva de Mapa de Calor</p>
      </div>

      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
        <p className="text-sm font-mono text-slate-400">Intensidad UHI (ΔT)</p>
        <p className="text-4xl font-bold text-amber-400 tracking-tight">{deltaT.toFixed(2)} °C</p>
      </div>
      
      <div className="space-y-6">
        <NumberInput
          label="Constante de Temperatura Base (C)"
          icon="🌡️"
          step={0.1}
          value={params.baseConstant}
          onChange={(e) => setParams(p => ({ ...p, baseConstant: parseFloat(e.target.value) || 0 }))}
        />
        <Slider
          label="Superficie Impermeable (S)"
          icon="🧱"
          min={0.01} max={1} step={0.01}
          value={params.imperviousSurface}
          onChange={(e) => setParams(p => ({ ...p, imperviousSurface: parseFloat(e.target.value) }))}
        />
        <Slider
          label="Densidad de Población (P)"
          icon="👥"
          min={0.01} max={1} step={0.01}
          value={params.populationDensity}
          onChange={(e) => setParams(p => ({ ...p, populationDensity: parseFloat(e.target.value) }))}
        />
        <Slider
          label="Cobertura Verde (G)"
          icon="🌳"
          min={0.01} max={1} step={0.01}
          value={params.greenCoverage}
          onChange={(e) => setParams(p => ({ ...p, greenCoverage: parseFloat(e.target.value) }))}
        />
      </div>

      <div className="text-xs text-slate-400 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
        <p className="font-semibold text-slate-300 mb-1">Fórmula del Modelo:</p>
        <p className="font-mono text-center bg-slate-900 p-2 rounded">
            ΔT = C + (K ⋅ S ⋅ P) / G
        </p>
        <p className="mt-2" dangerouslySetInnerHTML={{
          __html: `La temperatura de la ciudad (<span class="text-amber-400">ΔT</span>) comienza en un valor base (<span class="text-slate-300">C</span>), aumenta con el pavimento (<span class="text-slate-300">S</span>) y la gente (<span class="text-slate-300">P</span>), y se enfría con la vegetación (<span class="text-slate-300">G</span>).`
        }}>
        </p>
      </div>
    </aside>
  );
};
