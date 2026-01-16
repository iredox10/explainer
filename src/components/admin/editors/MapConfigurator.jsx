import React, { useState, useMemo, useRef } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps";
import { Move, ZoomIn, MapPin, Globe, Plus, Trash2, Crosshair, MessageSquare, Palette } from "lucide-react";
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { geoMercator } from "d3-geo";

const AFRICA_URL = "https://cdn.jsdelivr.net/npm/@highcharts/map-collection/custom/africa.topo.json";
const NIGERIA_URL = "https://raw.githubusercontent.com/BolajiBI/topojson-maps/master/countries/nigeria/nigeria-states.json";
const NIGERIA_LGA_URL = "https://raw.githubusercontent.com/NileshYAtDure/Nigeria_shape_File/main/lga.topojson";

const NIGERIA_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
    "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
    "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
    "Yobe", "Zamfara"
];

const DEFAULT_HIGHLIGHT_COLOR = "#FAFF00";

export default function MapConfigurator({ value, onChange }) {
    // Default config if value is undefined or partial
    const config = {
        center: [20, 0],
        zoom: 1,
        scope: "africa",
        ...value,
        markers: value?.markers || [],
        annotations: value?.annotations || [],
        // Ensure highlight is always an object internally for the color mapping UI
        highlight: typeof value?.highlight === 'object' && !Array.isArray(value?.highlight)
            ? value.highlight
            : (Array.isArray(value?.highlight)
                ? value.highlight.reduce((acc, name) => ({ ...acc, [name]: DEFAULT_HIGHLIGHT_COLOR }), {})
                : (value?.highlight ? { [value.highlight]: DEFAULT_HIGHLIGHT_COLOR } : {}))
    };

    const [hoveredGeo, setHoveredGeo] = useState(null);
    const [isDroppingPin, setIsDroppingPin] = useState(false);
    const [isAnnotating, setIsAnnotating] = useState(false);
    const [newMarker, setNewMarker] = useState({ lat: "", lon: "", label: "" });
    const [activeColor, setActiveColor] = useState(DEFAULT_HIGHLIGHT_COLOR);
    const mapRef = useRef(null);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const isNigeria = config.scope === 'nigeria';
    const isState = NIGERIA_STATES.some(s => s.toLowerCase() === config.scope.toLowerCase());

    let mapUrl = AFRICA_URL;
    if (isNigeria) mapUrl = NIGERIA_URL;
    if (isState) mapUrl = NIGERIA_LGA_URL;

    const projectionCenter = isNigeria ? [8.6753, 9.0820] : (isState ? config.center : [20, 0]);
    const projectionScale = isNigeria ? 2500 : (isState ? 5000 : 150);

    // Map dimensions
    const width = 800;
    const height = 600;

    const projection = useMemo(() => {
        return geoMercator()
            .center(projectionCenter)
            .scale(projectionScale)
            .translate([width / 2, height / 2]);
    }, [projectionCenter, projectionScale]);

    const handleScopeChange = (newScope) => {
        const isNowNigeria = newScope === 'nigeria';
        const isNowState = NIGERIA_STATES.some(s => s.toLowerCase() === newScope.toLowerCase());

        // Find state center if switching to state view
        let newCenter = isNowNigeria ? [8.6753, 9.0820] : [20, 0];
        let newZoom = 1;

        onChange({
            ...config,
            scope: newScope,
            center: newCenter,
            zoom: newZoom,
            highlight: {},
            markers: []
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
        if (isDroppingPin || isAnnotating) return;

        const name = geo.properties.name || geo.properties.NAME_1 || geo.properties.admin2Name;
        const currentHighlights = { ...config.highlight };

        if (currentHighlights[name]) {
            delete currentHighlights[name];
        } else {
            currentHighlights[name] = activeColor;
        }

        onChange({
            ...config,
            highlight: currentHighlights
        });
    };

    const handleUpdateColor = (name, color) => {
        onChange({
            ...config,
            highlight: {
                ...config.highlight,
                [name]: color
            }
        });
    };

    const handleMapClick = (e) => {
        if (!isDroppingPin && !isAnnotating) return;
        const svgRect = e.currentTarget.getBoundingClientRect();
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

        const svgX = clickX * (width / svgRect.width);
        const svgY = clickY * (height / svgRect.height);
        const [cx, cy] = projection(config.center);
        const tx = width / 2 - cx * config.zoom;
        const ty = height / 2 - cy * config.zoom;
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
        onChange({
            ...config,
            markers: [...config.markers, {
                lat: parseFloat(newMarker.lat),
                lon: parseFloat(newMarker.lon),
                label: newMarker.label || `Marker ${config.markers.length + 1}`,
                icon: "map-pin"
            }]
        });
        setNewMarker({ lat: "", lon: "", label: "" });
    };

    const removeMarker = (index) => {
        const updated = [...config.markers];
        updated.splice(index, 1);
        onChange({ ...config, markers: updated });
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

    const highlightedKeys = Object.keys(config.highlight);

    return (
        <div className="space-y-4">
            <div
                ref={mapRef}
                className={`relative w-full h-[500px] bg-[#F5F5F3] border border-gray-200 rounded-2xl overflow-hidden group ${isDroppingPin || isAnnotating ? 'cursor-crosshair' : ''}`}
                onMouseMove={(e) => {
                    mouseX.set(e.clientX + 10);
                    mouseY.set(e.clientY + 10);
                }}
                onClick={handleMapClick}
            >
                {/* Annotations Preview */}
                {config.annotations.map((ann, i) => (
                    <div
                        key={i}
                        className="absolute z-20 px-2 py-1 bg-[#FAFF00] text-black text-[10px] font-black uppercase shadow-md border border-black transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
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
                    style={{ pointerEvents: isDroppingPin ? 'none' : 'auto' }}
                >
                    <ZoomableGroup
                        center={config.center}
                        zoom={config.zoom}
                        onMoveEnd={handleMoveEnd}
                        minZoom={1}
                        maxZoom={10}
                        filterZoomEvent={isDroppingPin || isAnnotating ? () => false : undefined}
                    >
                        <Geographies geography={mapUrl} key={mapUrl}>
                            {({ geographies }) => {
                                const filteredGeos = isState
                                    ? geographies.filter(geo => geo.properties.admin1Name?.toLowerCase() === config.scope.toLowerCase())
                                    : geographies;

                                return filteredGeos.map((geo) => {
                                    const name = geo.properties.name || geo.properties.NAME_1 || geo.properties.admin2Name;
                                    const fillColor = config.highlight[name] || "#D6D6DA";
                                    const isHighlighted = !!config.highlight[name];

                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleGeoClick(geo);
                                            }}
                                            onMouseEnter={() => setHoveredGeo(name)}
                                            onMouseLeave={() => setHoveredGeo(null)}
                                            style={{
                                                default: {
                                                    fill: fillColor,
                                                    stroke: "#FFFFFF",
                                                    strokeWidth: 0.5,
                                                    outline: "none",
                                                    cursor: isDroppingPin || isAnnotating ? "crosshair" : "pointer",
                                                    transition: "all 250ms"
                                                },
                                                hover: {
                                                    fill: isHighlighted ? fillColor : "#9ca3af",
                                                    stroke: "#FFFFFF",
                                                    strokeWidth: 0.5,
                                                    outline: "none",
                                                },
                                                pressed: {
                                                    fill: activeColor,
                                                    stroke: "#FFFFFF",
                                                    strokeWidth: 0.5,
                                                    outline: "none"
                                                },
                                            }}
                                        />
                                    );
                                });
                            }}
                        </Geographies>

                        {config.markers.map((marker, i) => (
                            <Marker key={i} coordinates={[marker.lon, marker.lat]}>
                                <circle r={4 / config.zoom} fill="#000" stroke="#fff" strokeWidth={1} />
                                <text
                                    textAnchor="middle"
                                    y={-10 / config.zoom}
                                    className="font-black uppercase tracking-tighter"
                                    style={{ fill: "#000", fontSize: `${10 / config.zoom}px` }}
                                >
                                    {marker.label}
                                </text>
                            </Marker>
                        ))}
                    </ZoomableGroup>
                </ComposableMap>

                {/* Config Overlay */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur border border-gray-100 p-4 rounded-xl shadow-xl space-y-3 z-10 pointer-events-auto">
                    <div className="flex flex-col gap-3 pb-3 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <select
                                value={isState ? 'states' : config.scope}
                                onChange={(e) => handleScopeChange(e.target.value === 'states' ? 'Abia' : e.target.value)}
                                className="bg-transparent font-black uppercase text-[10px] tracking-widest text-black outline-none cursor-pointer"
                            >
                                <option value="africa">Africa</option>
                                <option value="nigeria">Nigeria (States)</option>
                                <option value="states">Specific State (LGA)</option>
                            </select>
                        </div>

                        {(isState || config.scope === 'states') && (
                            <div className="flex items-center gap-3 pl-7">
                                <Plus className="w-3 h-3 text-gray-400" />
                                <select
                                    value={isState ? config.scope : "Abia"}
                                    onChange={(e) => handleScopeChange(e.target.value)}
                                    className="bg-transparent font-black uppercase text-[9px] tracking-widest text-gray-400 outline-none cursor-pointer"
                                >
                                    {NIGERIA_STATES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block">Brush Color</label>
                        <div className="flex gap-1.5">
                            {['#FAFF00', '#FF4444', '#4444FF', '#44FF44', '#FF8800'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setActiveColor(c)}
                                    className={`w-6 h-6 rounded-full border-2 transition-transform ${activeColor === c ? 'scale-110 border-black shadow-lg' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-4 left-0 w-full text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 pointer-events-none">
                    {isDroppingPin ? "Click to drop pin" : isAnnotating ? "Click to add label" : "Drag to pan • Click to paint states"}
                </div>

                <AnimatePresence>
                    {hoveredGeo && !isDroppingPin && !isAnnotating && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{ position: 'fixed', left: 0, top: 0, x: mouseX, y: mouseY, pointerEvents: 'none', zIndex: 100 }}
                            className="px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-2xl"
                        >
                            {hoveredGeo}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Highlights List & Individual Colors */}
            <div className="bg-white p-6 border border-gray-100 rounded-3xl shadow-sm space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Color Mappings
                </h3>
                {highlightedKeys.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {highlightedKeys.map(name => (
                            <div key={name} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                                <span className="text-[10px] font-bold truncate mr-2">{name}</span>
                                <input
                                    type="color"
                                    value={config.highlight[name]}
                                    onChange={(e) => handleUpdateColor(name, e.target.value)}
                                    className="w-5 h-5 rounded-full border-none p-0 cursor-pointer overflow-hidden bg-transparent"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-[10px] font-bold text-gray-300 italic">No states highlighted yet. Click the map to start painting.</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 border border-gray-100 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Annotations
                        </h3>
                        <button onClick={() => setIsAnnotating(!isAnnotating)} className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${isAnnotating ? 'bg-black text-white border-black shadow-lg' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                            {isAnnotating ? 'Cancel' : 'Add Label'}
                        </button>
                    </div>
                    <div className="space-y-2">
                        {config.annotations.map((ann, i) => (
                            <div key={i} className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl group">
                                <input type="text" value={ann.text} onChange={(e) => updateAnnotation(i, e.target.value)} className="flex-1 bg-transparent text-[10px] font-black uppercase outline-none" />
                                <button onClick={() => removeAnnotation(i)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 border border-gray-100 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Markers
                        </h3>
                        <button onClick={() => setIsDroppingPin(!isDroppingPin)} className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${isDroppingPin ? 'bg-black text-white border-black shadow-lg' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                            {isDroppingPin ? 'Cancel' : 'Drop Pin'}
                        </button>
                    </div>
                    <div className="space-y-4">
                        {config.markers.map((marker, i) => (
                            <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded-xl">
                                <span className="text-[10px] font-black uppercase truncate px-2">{marker.label}</span>
                                <button onClick={() => removeMarker(i)} className="text-gray-300 hover:text-red-500 transition-colors px-2"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        ))}
                        {isDroppingPin && (
                            <div className="flex gap-2">
                                <input type="text" placeholder="Marker Label" className="flex-1 bg-white border border-gray-100 p-2 rounded-lg text-[10px] font-black uppercase" value={newMarker.label} onChange={e => setNewMarker({ ...newMarker, label: e.target.value })} />
                                <button onClick={addMarker} className="bg-black text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase">Add</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
