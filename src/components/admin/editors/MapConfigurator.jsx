import React, { useState, useMemo, useRef } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps";
import { Move, ZoomIn, MapPin, Globe, Plus, Trash2, Crosshair, MessageSquare } from "lucide-react";
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { geoMercator } from "d3-geo";

const AFRICA_URL = "https://cdn.jsdelivr.net/npm/@highcharts/map-collection/custom/africa.topo.json";
const NIGERIA_URL = "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/nigeria/nigeria-states.json";

export default function MapConfigurator({ value, onChange }) {
    // Default config if value is undefined or partial
    const config = {
        center: [20, 0],
        zoom: 1,
        scope: "africa",
        ...value,
        markers: value?.markers || [],
        annotations: value?.annotations || [],
        // Ensure highlight is always an array for internal logic, even if passed as string (legacy)
        highlight: Array.isArray(value?.highlight) 
            ? value.highlight 
            : (value?.highlight ? [value.highlight] : [])
    };

    const [hoveredGeo, setHoveredGeo] = useState(null);
    const [isDroppingPin, setIsDroppingPin] = useState(false);
    const [isAnnotating, setIsAnnotating] = useState(false);
    const [newMarker, setNewMarker] = useState({ lat: "", lon: "", label: "" });
    const mapRef = useRef(null);
    
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const isNigeria = config.scope === 'nigeria';
    const mapUrl = isNigeria ? NIGERIA_URL : AFRICA_URL;
    const projectionCenter = isNigeria ? [8.6753, 9.0820] : [20, 0];
    const projectionScale = isNigeria ? 2500 : 150;
    
    // Map dimensions
    const width = 800;
    const height = 600;

    // Create projection manually to support inversion for "Drop Pin"
    const projection = useMemo(() => {
        return geoMercator()
            .center(projectionCenter)
            .scale(projectionScale)
            .translate([width / 2, height / 2]);
    }, [projectionCenter, projectionScale]);

    const handleScopeChange = (newScope) => {
        const isNowNigeria = newScope === 'nigeria';
        onChange({
            ...config,
            scope: newScope,
            center: isNowNigeria ? [8.6753, 9.0820] : [20, 0],
            zoom: 1,
            highlight: [],
            markers: [] // Reset markers on scope change? Maybe safer.
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
        if (isDroppingPin) return; // Don't highlight if dropping pin

        const name = geo.properties.name || geo.properties.NAME_1;
        const currentHighlights = config.highlight;
        
        let newHighlights;
        if (currentHighlights.includes(name)) {
            newHighlights = currentHighlights.filter(h => h !== name);
        } else {
            newHighlights = [...currentHighlights, name];
        }

        onChange({
            ...config,
            highlight: newHighlights
        });
    };

    const handleMapClick = (e) => {
        if (!isDroppingPin && !isAnnotating) return;

        const svgRect = e.currentTarget.getBoundingClientRect();
        
        // Calculate click position relative to SVG
        const clickX = e.clientX - svgRect.left;
        const clickY = e.clientY - svgRect.top;

        if (isAnnotating) {
            const x = parseFloat(((clickX / svgRect.width) * 100).toFixed(2));
            const y = parseFloat(((clickY / svgRect.height) * 100).toFixed(2));
            
            onChange({
                ...config,
                annotations: [...config.annotations, { x, y, text: "New Label" }]
            });
            setIsAnnotating(false);
            return;
        }

        // Scale to viewBox coordinates (800x600)
        const svgX = clickX * (width / svgRect.width);
        const svgY = clickY * (height / svgRect.height);

        // Inverse the ZoomableGroup transform
        // transform is: translate(tx, ty) scale(zoom)
        // tx = width/2 - cx*zoom
        // ty = height/2 - cy*zoom
        // where [cx, cy] is the projected center
        
        const [cx, cy] = projection(config.center);
        
        const tx = width / 2 - cx * config.zoom;
        const ty = height / 2 - cy * config.zoom;

        // P_screen = P_projected * zoom + t
        // P_projected = (P_screen - t) / zoom
        
        const projectedX = (svgX - tx) / config.zoom;
        const projectedY = (svgY - ty) / config.zoom;

        const inverted = projection.invert([projectedX, projectedY]);

        if (inverted) {
            setNewMarker({
                ...newMarker,
                lat: parseFloat(inverted[1].toFixed(4)),
                lon: parseFloat(inverted[0].toFixed(4))
            });
            setIsDroppingPin(false);
        }
    };

    const addMarker = () => {
        if (!newMarker.lat || !newMarker.lon) return;
        
        const markerToAdd = {
            lat: parseFloat(newMarker.lat),
            lon: parseFloat(newMarker.lon),
            label: newMarker.label || `Marker ${config.markers.length + 1}`,
            icon: "map-pin" // Default icon required by schema
        };

        onChange({
            ...config,
            markers: [...config.markers, markerToAdd]
        });

        setNewMarker({ lat: "", lon: "", label: "" });
    };

    const removeMarker = (index) => {
        const updated = [...config.markers];
        updated.splice(index, 1);
        onChange({
            ...config,
            markers: updated
        });
    };

    const updateAnnotation = (index, text) => {
        const updated = [...config.annotations];
        updated[index] = { ...updated[index], text };
        onChange({ ...config, annotations: updated });
    };

    const removeAnnotation = (index) => {
        const updated = [...config.annotations];
        updated.splice(index, 1);
        onChange({ ...config, annotations: updated });
    };

    return (
        <div className="space-y-4">
            <div 
                ref={mapRef}
                className={`relative w-full h-[500px] bg-[#F5F5F3] border border-gray-200 rounded-lg overflow-hidden group ${isDroppingPin || isAnnotating ? 'cursor-crosshair' : ''}`}
                onMouseMove={(e) => {
                    mouseX.set(e.clientX + 10);
                    mouseY.set(e.clientY + 10);
                }}
                onClick={handleMapClick} // Capture clicks on the container/SVG
            >
                {/* Annotations Preview */}
                {config.annotations.map((ann, i) => (
                    <div
                        key={i}
                        className="absolute z-20 px-2 py-1 bg-[#FAFF00] text-black text-xs font-bold shadow-md border border-black transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                    >
                        {ann.text}
                    </div>
                ))}

                <ComposableMap
                    projection={projection}
                    width={width}
                    height={height}
                    className="w-full h-full"
                    style={{ pointerEvents: isDroppingPin ? 'none' : 'auto' }} // Pass clicks to container when dropping pin
                >
                        <ZoomableGroup
                        center={config.center}
                        zoom={config.zoom}
                        onMoveEnd={handleMoveEnd}
                        minZoom={1}
                        maxZoom={10}
                        filterZoomEvent={isDroppingPin || isAnnotating ? () => false : undefined} // Disable zoom when dropping pin or annotating
                    >
                        <Geographies geography={mapUrl} key={mapUrl}>
                            {({ geographies }) =>
                                geographies.map((geo) => {
                                    const geoName = geo.properties.name || geo.properties.NAME_1;
                                    const isHighlighted = config.highlight.some(h => 
                                        h?.toLowerCase() === geoName?.toLowerCase() || 
                                        h === geo.id
                                    );
                                    
                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent container click if needed
                                                handleGeoClick(geo);
                                            }}
                                            onMouseEnter={() => setHoveredGeo(geoName)}
                                            onMouseLeave={() => setHoveredGeo(null)}
                                            style={{
                                                default: {
                                                    fill: isHighlighted ? "#FAFF00" : "#D6D6DA",
                                                    stroke: "#FFFFFF",
                                                    strokeWidth: 0.5,
                                                    outline: "none",
                                                    cursor: isDroppingPin || isAnnotating ? "crosshair" : "pointer",
                                                    transition: "all 250ms"
                                                },
                                                hover: {
                                                    fill: isHighlighted ? "#FAFF00" : "#9ca3af",
                                                    stroke: "#FFFFFF",
                                                    strokeWidth: 0.5,
                                                    outline: "none",
                                                    cursor: isDroppingPin || isAnnotating ? "crosshair" : "pointer"
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
                        
                        {/* Render Markers */}
                        {config.markers.map((marker, i) => (
                            <Marker key={i} coordinates={[marker.lon, marker.lat]}>
                                <circle r={4 / config.zoom} fill="#FF0000" stroke="#fff" strokeWidth={1} />
                                <text
                                    textAnchor="middle"
                                    y={-10 / config.zoom}
                                    style={{ fontFamily: "system-ui", fill: "#333", fontSize: `${10 / config.zoom}px`, fontWeight: "bold" }}
                                >
                                    {marker.label}
                                </text>
                            </Marker>
                        ))}
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
                        <span>{config.highlight.length ? `${config.highlight.length} Selected` : "None"}</span>
                    </div>
                </div>

                <div className="absolute bottom-2 left-0 w-full text-center text-[10px] text-gray-400 pointer-events-none">
                    {isDroppingPin ? "Click to drop pin" : isAnnotating ? "Click to add label" : "Drag to pan • Scroll to zoom • Click to highlight"}
                </div>

                <AnimatePresence>
                    {hoveredGeo && !isDroppingPin && !isAnnotating && (
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

            {/* Annotations Editor */}
            <div className="bg-white p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Annotations
                    </h3>
                    <button
                        onClick={() => setIsAnnotating(!isAnnotating)}
                        className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${isAnnotating ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Plus className="w-3 h-3" />
                        Add Label
                    </button>
                </div>
                
                {config.annotations.length > 0 ? (
                    <div className="space-y-2">
                        {config.annotations.map((ann, i) => (
                            <div key={i} className="flex items-center gap-2 bg-gray-50 p-2 rounded text-sm">
                                <input
                                    type="text"
                                    value={ann.text}
                                    onChange={(e) => updateAnnotation(i, e.target.value)}
                                    className="flex-1 bg-transparent border-b border-gray-300 focus:border-black outline-none px-1 text-xs font-bold"
                                />
                                <span className="text-gray-400 text-xs font-mono">
                                    [{ann.x.toFixed(0)}%, {ann.y.toFixed(0)}%]
                                </span>
                                <button 
                                    onClick={() => removeAnnotation(i)}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 bg-gray-50 rounded border border-dashed border-gray-200 text-xs text-gray-400">
                        Click "Add Label" then click on map to place annotation
                    </div>
                )}
            </div>

            {/* Markers Editor */}
            <div className="bg-white p-4 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Markers
                </h3>
                
                {/* Existing Markers List */}
                {config.markers.length > 0 && (
                    <div className="mb-4 space-y-2">
                        {config.markers.map((marker, i) => (
                            <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{marker.label}</span>
                                    <span className="text-gray-400 text-xs">
                                        [{marker.lat.toFixed(2)}, {marker.lon.toFixed(2)}]
                                    </span>
                                </div>
                                <button 
                                    onClick={() => removeMarker(i)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add New Marker */}
                <div className="flex items-end gap-2 bg-gray-50 p-3 rounded-md border border-gray-100">
                    <div className="flex-1 space-y-1">
                        <label className="text-[10px] uppercase text-gray-500 font-bold">Label</label>
                        <input 
                            type="text" 
                            placeholder="City Name"
                            className="w-full text-xs p-1.5 border border-gray-300 rounded"
                            value={newMarker.label}
                            onChange={e => setNewMarker({...newMarker, label: e.target.value})}
                        />
                    </div>
                    <div className="w-20 space-y-1">
                        <label className="text-[10px] uppercase text-gray-500 font-bold">Lat</label>
                        <input 
                            type="number" 
                            className="w-full text-xs p-1.5 border border-gray-300 rounded"
                            value={newMarker.lat}
                            onChange={e => setNewMarker({...newMarker, lat: e.target.value})}
                        />
                    </div>
                    <div className="w-20 space-y-1">
                        <label className="text-[10px] uppercase text-gray-500 font-bold">Lon</label>
                        <input 
                            type="number" 
                            className="w-full text-xs p-1.5 border border-gray-300 rounded"
                            value={newMarker.lon}
                            onChange={e => setNewMarker({...newMarker, lon: e.target.value})}
                        />
                    </div>
                    
                    <button
                        onClick={() => setIsDroppingPin(!isDroppingPin)}
                        className={`p-1.5 rounded mb-[1px] border ${isDroppingPin ? 'bg-blue-100 border-blue-300 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100'}`}
                        title="Drop Pin on Map"
                    >
                        <Crosshair className="w-4 h-4" />
                    </button>

                    <button 
                        onClick={addMarker}
                        disabled={!newMarker.lat || !newMarker.lon}
                        className="p-1.5 bg-black text-white rounded mb-[1px] disabled:opacity-50 hover:bg-gray-800"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
