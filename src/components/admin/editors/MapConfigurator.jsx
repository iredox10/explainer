import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { Move, ZoomIn, MapPin, Globe } from "lucide-react";
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';

const AFRICA_URL = "https://cdn.jsdelivr.net/npm/@highcharts/map-collection/custom/africa.topo.json";
const NIGERIA_URL = "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/nigeria/nigeria-states.json";

export default function MapConfigurator({ value, onChange }) {
    // Default config if value is undefined or partial
    const config = {
        center: [20, 0],
        zoom: 1,
        highlight: "",
        scope: "africa",
        ...value
    };

    const [hoveredGeo, setHoveredGeo] = useState(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const isNigeria = config.scope === 'nigeria';
    const mapUrl = isNigeria ? NIGERIA_URL : AFRICA_URL;
    const projectionCenter = isNigeria ? [8.6753, 9.0820] : [20, 0];
    const projectionScale = isNigeria ? 2500 : 150;

    const handleScopeChange = (newScope) => {
        const isNowNigeria = newScope === 'nigeria';
        onChange({
            ...config,
            scope: newScope,
            center: isNowNigeria ? [8.6753, 9.0820] : [20, 0],
            zoom: 1,
            highlight: ""
        });
    };

    const handleMoveEnd = ({ coordinates, zoom }) => {
        onChange({
            ...config,
            center: [
                parseFloat(coordinates[0].toFixed(4)), 
                parseFloat(coordinates[1].toFixed(4))
            ],
            zoom: parseFloat(zoom.toFixed(4))
        });
    };

    const handleGeoClick = (geo) => {
        console.log("Clicked Geo Properties:", geo.properties);
        const name = geo.properties.name || geo.properties.NAME_1; // NAME_1 for Nigeria states
        console.log("Resolved Name:", name);
        
        // Toggle highlight
        const newHighlight = config.highlight === name ? "" : name;
        onChange({
            ...config,
            highlight: newHighlight
        });
    };

    return (
        <div 
            className="relative w-full h-[500px] bg-[#F5F5F3] border border-gray-200 rounded-lg overflow-hidden group"
            onMouseMove={(e) => {
                mouseX.set(e.clientX + 10);
                mouseY.set(e.clientY + 10);
            }}
        >
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: projectionScale,
                    center: projectionCenter
                }}
                className="w-full h-full"
            >
                <ZoomableGroup
                    center={config.center}
                    zoom={config.zoom}
                    onMoveEnd={handleMoveEnd}
                    minZoom={1}
                    maxZoom={10}
                >
                    {/* Add key to force re-render when mapUrl changes */}
                    <Geographies geography={mapUrl} key={mapUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const geoName = geo.properties.name || geo.properties.NAME_1;
                                const isHighlighted = config.highlight && (
                                    geoName?.toLowerCase() === config.highlight.toLowerCase() ||
                                    geo.id === config.highlight
                                );
                                
                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onClick={() => handleGeoClick(geo)}
                                        onMouseEnter={() => setHoveredGeo(geoName)}
                                        onMouseLeave={() => setHoveredGeo(null)}
                                        style={{
                                            default: {
                                                fill: isHighlighted ? "#FAFF00" : "#D6D6DA",
                                                stroke: "#FFFFFF",
                                                strokeWidth: 0.5,
                                                outline: "none",
                                                cursor: "pointer",
                                                transition: "all 250ms"
                                            },
                                            hover: {
                                                fill: isHighlighted ? "#FAFF00" : "#9ca3af",
                                                stroke: "#FFFFFF",
                                                strokeWidth: 0.5,
                                                outline: "none",
                                                cursor: "pointer"
                                            },
                                            pressed: {
                                                fill: "#FAFF00",
                                                stroke: "#FFFFFF",
                                                strokeWidth: 0.5,
                                                outline: "none"
                                            },
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>

            {/* Config Overlay */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur border border-gray-200 p-3 rounded-md shadow-sm text-xs font-mono text-gray-600 space-y-2 z-10 pointer-events-auto select-none">
                 <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-2">
                    <Globe className="w-3 h-3" />
                    <select 
                        value={config.scope} 
                        onChange={(e) => handleScopeChange(e.target.value)}
                        className="bg-transparent font-bold text-black outline-none cursor-pointer hover:bg-gray-100 rounded px-1 -ml-1"
                    >
                        <option value="africa">Africa</option>
                        <option value="nigeria">Nigeria</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <Move className="w-3 h-3" />
                    <span>[{config.center[0].toFixed(2)}, {config.center[1].toFixed(2)}]</span>
                </div>
                <div className="flex items-center gap-2">
                    <ZoomIn className="w-3 h-3" />
                    <span>x{config.zoom.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-black font-bold">
                    <MapPin className="w-3 h-3" />
                    <span>{config.highlight || "None"}</span>
                </div>
            </div>

            <div className="absolute bottom-2 left-0 w-full text-center text-[10px] text-gray-400 pointer-events-none">
                Drag to pan • Scroll to zoom • Click to highlight
            </div>

            <AnimatePresence>
                {hoveredGeo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            left: 0,
                            top: 0,
                            x: mouseX,
                            y: mouseY,
                            pointerEvents: 'none',
                            zIndex: 50
                        }}
                        className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded shadow-xl"
                    >
                        {hoveredGeo}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
