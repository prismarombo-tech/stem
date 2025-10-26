
import React, { useMemo, useState } from 'react';
import type { SimulationParams } from '../types';

const GRID_SIZE = 25;

const useHeatmap = (grid: ('building' | 'tree' | 'empty')[], params: SimulationParams, normalizedDeltaT: number, deltaT: number) => {
    return useMemo(() => {
        const heatGrid = new Array(GRID_SIZE * GRID_SIZE).fill(0);
        
        const baseHeat = params.imperviousSurface * 0.4 + normalizedDeltaT * 0.5;

        for (let i = 0; i < heatGrid.length; i++) {
            heatGrid[i] = baseHeat;
        }

        grid.forEach((cellType, index) => {
            const x = index % GRID_SIZE;
            const y = Math.floor(index / GRID_SIZE);

            let heatModifier = 0;
            if (cellType === 'building') {
                heatModifier = 0.5;
            } else if (cellType === 'tree') {
                heatModifier = -0.4;
            }

            if (heatModifier !== 0) {
                 for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                            const neighborIndex = ny * GRID_SIZE + nx;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            const falloff = Math.exp(-distance * 0.8);
                            heatGrid[neighborIndex] += heatModifier * falloff;
                        }
                    }
                }
            }
        });
        
        const maxHeat = Math.max(...heatGrid, 1.0);
        const minHeat = Math.min(...heatGrid, 0.0);
        const range = maxHeat - minHeat;
        
        const normalizedHeatGrid = range < 1e-6 ? heatGrid.map(() => 0.5) : heatGrid.map(h => (h - minHeat) / range);
        
        const temperatureGrid = normalizedHeatGrid.map(h => params.baseConstant + (deltaT - params.baseConstant) * h);

        return { heatData: normalizedHeatGrid, temperatureData: temperatureGrid };

    }, [grid, params.imperviousSurface, normalizedDeltaT, deltaT, params.baseConstant]);
};

const colorStops = [
    { stop: 0.0, color: [74, 144, 226] },   // Cool Blue
    { stop: 0.25, color: [80, 227, 194] },  // Aqua
    { stop: 0.5, color: [245, 166, 35] },    // Orange
    { stop: 0.75, color: [208, 2, 27] },      // Red
    { stop: 1.0, color: [189, 16, 224] },   // Purple/Hot
];

const interpolateColor = (val: number, stops: typeof colorStops) => {
    if (val <= stops[0].stop) return stops[0].color;
    if (val >= stops[stops.length - 1].stop) return stops[stops.length - 1].color;

    for (let i = 0; i < stops.length - 1; i++) {
        const start = stops[i];
        const end = stops[i + 1];
        if (val >= start.stop && val <= end.stop) {
            const t = (val - start.stop) / (end.stop - start.stop);
            const r = Math.round(start.color[0] * (1 - t) + end.color[0] * t);
            const g = Math.round(start.color[1] * (1 - t) + end.color[1] * t);
            const b = Math.round(start.color[2] * (1 - t) + end.color[2] * t);
            return [r, g, b];
        }
    }
    return stops[stops.length - 1].color; // Fallback
};

const getHeatColor = (heatValue: number) => {
    const clampedHeat = Math.max(0, Math.min(1, heatValue));
    const [r, g, b] = interpolateColor(clampedHeat, colorStops);
    return `rgb(${r}, ${g}, ${b})`;
};

const Cell: React.FC<{
    type: 'building' | 'tree' | 'empty', 
    heat: number,
    temperature: number,
    onClick: () => void,
}> = React.memo(({ type, heat, temperature, onClick }) => {
    const backgroundColor = getHeatColor(heat);
    const [isHovered, setIsHovered] = useState(false);

    const typeTranslations = {
        building: 'edificio',
        tree: 'árbol',
        empty: 'vacía',
    };

    const ariaLabel = `Celda ${typeTranslations[type]}, temperatura ${temperature.toFixed(2)}°C. Haz clic para cambiar.`;
    
    return (
        <div 
            className="cell-container"
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ backgroundColor }}
            role="button"
            aria-label={ariaLabel}
        >
            {isHovered && (
                <div className="temp-tooltip">
                    {temperature.toFixed(2)}°C
                </div>
            )}
            {type === 'building' && <div className="building-roof" />}
            {type === 'tree' && <div className="tree-canopy" />}
        </div>
    );
});

export const UrbanScene: React.FC<{ 
    params: SimulationParams; 
    normalizedDeltaT: number;
    deltaT: number;
    gridData: ('building' | 'tree' | 'empty')[];
    onCellClick: (index: number) => void;
}> = ({ params, normalizedDeltaT, deltaT, gridData, onCellClick }) => {
    const { heatData, temperatureData } = useHeatmap(gridData, params, normalizedDeltaT, deltaT);

    return (
        <div className="flex items-center justify-center h-full w-full p-4">
             <style>{`
                .grid-container {
                    background-color: #1a202c;
                    padding: 0.75rem;
                    border-radius: 1rem;
                    box-shadow: 0 0 40px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.5);
                    transition: transform 0.5s ease;
                }
                .grid-container:hover {
                    transform: scale(1.02);
                }
                .cell-container {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 3px;
                    cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease;
                    will-change: transform;
                }
                .cell-container:hover {
                    transform: scale(1.15);
                    z-index: 10;
                    box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
                }

                .temp-tooltip {
                    position: absolute;
                    bottom: 110%;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-family: monospace;
                    white-space: nowrap;
                    z-index: 20;
                    pointer-events: none; /* So it doesn't interfere with mouse events on the cell */
                }

                .building-roof, .tree-canopy {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    margin: auto;
                    animation: pop-in 0.3s ease-out forwards;
                    transform-origin: center center;
                }

                @keyframes pop-in {
                    from { transform: scale(0.5); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                .building-roof {
                    width: 80%;
                    height: 80%;
                    background: linear-gradient(135deg, #626f81, #8997aa);
                    border: 1px solid #4a5568;
                    box-shadow: 
                        inset 0 0 5px rgba(0,0,0,0.3),
                        2px 2px 5px rgba(0,0,0,0.4);
                    border-radius: 2px;
                }

                .tree-canopy {
                    width: 90%;
                    height: 90%;
                    background: radial-gradient(circle, #58a75e, #388e3c 60%, #1e5e2f 100%);
                    border-radius: 50%;
                    filter: drop-shadow(2px 2px 3px rgba(0,0,0,0.5));
                }
            `}</style>
            <div
                className="grid grid-container"
                style={{
                    gridTemplateColumns: `repeat(${GRID_SIZE}, 25px)`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, 25px)`,
                    gap: '3px'
                }}
            >
            {gridData.map((type, index) => (
                <Cell 
                    key={index} 
                    type={type} 
                    heat={heatData[index]}
                    temperature={temperatureData[index]}
                    onClick={() => onCellClick(index)}
                />
            ))}
            </div>
        </div>
    );
};
