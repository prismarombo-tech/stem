
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Controls } from './components/Controls';
import { UrbanScene } from './components/UrbanScene';
import type { SimulationParams } from './types';

const GRID_SIZE = 25;

const generateGridData = (params: SimulationParams): ('building' | 'tree' | 'empty')[] => {
  const grid: ('building' | 'tree' | 'empty')[] = Array(GRID_SIZE * GRID_SIZE).fill('empty');
  const occupied = new Set<number>();

  const buildingCount = Math.floor(params.populationDensity * (GRID_SIZE * GRID_SIZE * 0.7));
  let placedBuildings = 0;
  for (let i = 0; i < grid.length * 3 && placedBuildings < buildingCount; i++) {
    const index = Math.floor(Math.random() * grid.length);
    if (!occupied.has(index)) {
      grid[index] = 'building';
      occupied.add(index);
      placedBuildings++;
    }
  }

  const treeCount = Math.floor(params.greenCoverage * (GRID_SIZE * GRID_SIZE * 0.6));
  let placedTrees = 0;
  for (let i = 0; i < grid.length * 3 && placedTrees < treeCount; i++) {
    const index = Math.floor(Math.random() * grid.length);
    if (!occupied.has(index)) {
      grid[index] = 'tree';
      occupied.add(index);
      placedTrees++;
    }
  }
  return grid;
};


const App: React.FC = () => {
  // State controlled by the sliders, dictates regeneration
  const [controlParams, setControlParams] = useState<SimulationParams>({
    imperviousSurface: 0.5,
    populationDensity: 0.5,
    greenCoverage: 0.5,
    baseConstant: 0.0,
  });

  // State for the grid itself, can be regenerated or manually edited
  const [gridData, setGridData] = useState<('building' | 'tree' | 'empty')[]>([]);
  
  // Regenerate grid when control params change
  useEffect(() => {
    setGridData(generateGridData(controlParams));
  }, [controlParams]);

  // Derived state from the grid, for display and calculations
  const displayParams = useMemo<SimulationParams>(() => {
    if (!gridData || gridData.length === 0) {
      return controlParams;
    }
    const buildingCount = gridData.filter(cell => cell === 'building').length;
    const treeCount = gridData.filter(cell => cell === 'tree').length;
    const totalCells = GRID_SIZE * GRID_SIZE;

    const populationDensity = Math.min(1, Math.max(0.01, buildingCount / (totalCells * 0.7)));
    const greenCoverage = Math.min(1, Math.max(0.01, treeCount / (totalCells * 0.6)));
    
    return {
      imperviousSurface: controlParams.imperviousSurface,
      populationDensity,
      greenCoverage,
      baseConstant: controlParams.baseConstant,
    };
  }, [gridData, controlParams.imperviousSurface, controlParams.baseConstant]);


  const { deltaT, normalizedDeltaT } = useMemo(() => {
    const C = displayParams.baseConstant; // Base constant
    const K = 15; // Proportionality constant for visual effect
    const S = displayParams.imperviousSurface;
    const P = displayParams.populationDensity;
    const G = displayParams.greenCoverage;

    // Ensure G is not zero to avoid division by zero
    const calculatedDeltaT = C + (K * S * P) / Math.max(G, 0.01);

    const VISUAL_MAX_DELTAT = C + (K / 0.1 * 1 * 1); // A more practical max for normalization
    
    const normalized = Math.min(calculatedDeltaT / VISUAL_MAX_DELTAT, 1.0);

    return { deltaT: calculatedDeltaT, normalizedDeltaT: normalized };
  }, [displayParams]);

  const handleCellClick = useCallback((index: number) => {
    setGridData(currentGrid => {
        const newGridData = [...currentGrid];
        const currentType = newGridData[index];
        
        if (currentType === 'empty') {
            newGridData[index] = 'building';
        } else if (currentType === 'building') {
            newGridData[index] = 'tree';
        } else { // 'tree'
            newGridData[index] = 'empty';
        }
        return newGridData;
    });
  }, []);

  return (
    <main className="relative h-screen w-screen text-white overflow-hidden">
      <div className="absolute top-0 left-0 h-full w-full">
         <UrbanScene 
            params={displayParams} 
            normalizedDeltaT={normalizedDeltaT}
            deltaT={deltaT}
            gridData={gridData}
            onCellClick={handleCellClick}
        />
      </div>
      <Controls params={displayParams} setParams={setControlParams} deltaT={deltaT} />
    </main>
  );
};

export default App;
