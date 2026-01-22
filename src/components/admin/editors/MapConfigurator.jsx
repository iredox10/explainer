import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps";
import { Move, ZoomIn, MapPin, Globe, Plus, Trash2, Crosshair, MessageSquare, Palette } from "lucide-react";
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { geoMercator, geoCentroid, geoPath } from "d3-geo";
import * as topojson from "topojson-client";

const AFRICA_URL = "https://cdn.jsdelivr.net/npm/@highcharts/map-collection/custom/africa.topo.json";
const NIGERIA_URL = "https://raw.githubusercontent.com/BolajiBI/topojson-maps/master/countries/nigeria/nigeria-states.json";
// GRID3 Nigeria LGA GeoJSON - clean, properly formatted data
const NIGERIA_LGA_URL = "/data/grid3-lga.geojson";

const NIGERIA_STATES = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Fct", "Gombe", "Imo",
    "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
    "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
    "Yobe", "Zamfara"
];

const STATE_COORDINATES = {
    "Abia": [7.4860, 5.5320],
    "Adamawa": [13.2700, 10.2703],
    "Akwa Ibom": [7.8500, 5.0080],
    "Anambra": [7.0700, 6.2104],
    "Bauchi": [10.1900, 11.6804],
    "Bayelsa": [6.0600, 4.7700],
    "Benue": [8.1300, 7.1904],
    "Borno": [12.1900, 10.6204],
    "Cross River": [8.3300, 4.9604],
    "Delta": [5.6800, 5.8904],
    "Ebonyi": [8.0100, 6.2600],
    "Edo": [5.6200, 6.3405],
    "Ekiti": [5.2200, 7.6304],
    "Enugu": [7.3833, 6.8670],
    "Federal Capital Territory": [7.5333, 9.0833],
    "Gombe": [11.1700, 10.2904],
    "Imo": [7.0260, 5.4930],
    "Jigawa": [9.3503, 11.7992],
    "Kaduna": [7.7100, 11.0800],
    "Kano": [8.5200, 12.0000],
    "Katsina": [7.6207, 12.5631],
    "Kebbi": [4.1075, 11.4168],
    "Kogi": [6.7400, 7.8004],
    "Kwara": [4.5500, 8.4900],
    "Lagos": [3.5774, 6.5269],
    "Nassarawa": [8.2383, 8.4388],
    "Niger": [5.4700, 10.4004],
    "Ogun": [3.4389, 6.9789],
    "Ondo": [5.2000, 7.2504],
    "Osun": [4.1800, 7.6300],
    "Oyo": [3.5643, 8.2151],
    "Plateau": [9.6826, 9.0583],
    "Rivers": [7.0100, 4.8100],
    "Sokoto": [5.3152, 13.0611],
    "Taraba": [10.7376, 8.0141],
    "Yobe": [11.9660, 11.7490],
    "Zamfara": [6.6600, 12.1704]
};

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
    const [lgaData, setLgaData] = useState(null); // For state-level maps
    const mapRef = useRef(null);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const isNigeria = config.scope?.toLowerCase() === 'nigeria';
    const isState = NIGERIA_STATES.some(s => s.toLowerCase() === config.scope?.toLowerCase());

    // Fetch LGA data when a state is selected
    useEffect(() => {
        if (isState) {
            fetch(NIGERIA_LGA_URL)
                .then(res => res.json())
                .then(data => {
                    // GRID3 GeoJSON - features are directly in data.features
                    const features = data.features || [];
                    // Filter for the selected state using 'statename' property
                    const stateFeatures = features.filter(f => {
                        const stateName = (f.properties.statename || "").toLowerCase();
                        return stateName === config.scope.toLowerCase();
                    });
                    console.log(`Loaded ${stateFeatures.length} LGAs for ${config.scope}`);
                    setLgaData(stateFeatures);
                })
                .catch(err => console.error('Failed to load LGA data:', err));
        } else {
            setLgaData(null);
        }
    }, [isState, config.scope]);


    const mapUrl = isState ? NIGERIA_LGA_URL : (isNigeria ? NIGERIA_URL : AFRICA_URL);

    // Use a simpler projection setup - fixed center at Nigeria and let ZoomableGroup handle positioning
    const projectionCenter = [8.6753, 9.0820]; // Always centered on Nigeria
    const projectionScale = 2500; // Fixed scale - ZoomableGroup will handle zoom

    // Map dimensions
    const width = 800;
    const height = 600;

    // For state-level maps, we need the projection centered on the state
    const projectionConfig = useMemo(() => {
        if (isState) {
            const stateCoords = STATE_COORDINATES[config.scope] || [8.6753, 9.0820];
            return {
                center: stateCoords,
                scale: 15000 // High zoom for state-level
            };
        } else if (isNigeria) {
            return {
                center: [8.6753, 9.0820],
                scale: 2500
            };
        }
        return {
            center: [20, 0],
            scale: 150
        };
    }, [isState, isNigeria, config.scope]);

    // Create a d3 projection that uses fitSize for automatic centering and scaling
    const stateProjection = useMemo(() => {
        if (isState && lgaData && lgaData.length > 0) {
            // Create a FeatureCollection from the LGA data
            const featureCollection = {
                type: "FeatureCollection",
                features: lgaData
            };
            // Use fitSize to automatically center and scale the projection
            // IMPORTANT: disable clipExtent to prevent the bounding rectangle from appearing
            return geoMercator()
                .fitSize([width, height], featureCollection)
                .clipExtent(null);
        }
        return null;
    }, [isState, lgaData, width, height]);

    const pathGenerator = useMemo(() => {
        if (stateProjection) {
            return geoPath().projection(stateProjection);
        }
        return null;
    }, [stateProjection]);

    const handleScopeChange = (newScope) => {
        const isNowState = NIGERIA_STATES.some(s => s.toLowerCase() === newScope.toLowerCase());

        let newCenter = [20, 0];
        let newZoom = 1;

        if (newScope === 'nigeria') {
            newCenter = [8.6753, 9.0820];
            newZoom = 1;
        } else if (isNowState) {
            // For state-level maps, use state coordinates as center
            // The projectionConfig handles the scale, so zoom stays at 1
            newCenter = STATE_COORDINATES[newScope] || [8.6753, 9.0820];
            newZoom = 1;
        }

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

    const handleRecenter = () => {
        const nextCenter = isState
            ? (STATE_COORDINATES[config.scope] || [8.6753, 9.0820])
            : (isNigeria ? [8.6753, 9.0820] : [20, 0]);
        const nextZoom = isState ? 1 : (isNigeria ? 1 : 1);

        onChange({
            ...config,
            center: nextCenter,
            zoom: nextZoom
        });
    };

    const clampZoom = (value) => Math.min(20, Math.max(0.5, value));

    const handleZoomChange = (delta) => {
        if (isState) return;
        const nextZoom = clampZoom((config.zoom || 1) + delta);
        onChange({
            ...config,
            zoom: nextZoom
        });
    };

    const handleWheelZoom = (e) => {
        if (isState || isDroppingPin || isAnnotating) return;
        e.preventDefault();
        const direction = e.deltaY > 0 ? -0.3 : 0.3;
        handleZoomChange(direction);
    };

    const getGeoName = (geo, stateMode) => {
        if (!geo?.properties) return 'Unknown';
        if (stateMode) {
            return (geo.properties.lganame || geo.properties.admin2Name || geo.properties.admin2 || geo.properties.NAME_2 || 'Unknown').trim();
        }
        return (geo.properties.NAME_1 || geo.properties.name || geo.properties.admin1Name || geo.properties.admin1 || geo.properties.State || geo.properties.state || 'Unknown').trim();
    };

    const handleGeoClick = (geo) => {
        if (isDroppingPin || isAnnotating) return;

        const name = getGeoName(geo, isState);
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
                onWheel={handleWheelZoom}
            >
                {/* Debug info - helpful for user to see if filtering is working */}
                <div className="absolute top-2 right-2 bg-black/80 text-white text-[8px] px-2 py-1 rounded-md z-20 font-mono" data-no-dnd="true">
                    Scope: {config.scope} | JSON: {mapUrl.split('/').pop()}
                </div>

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

                {/* State-level map using direct d3-geo rendering */}
                {isState && lgaData && pathGenerator ? (
                    <svg
                        viewBox={`0 0 ${width} ${height}`}
                        className="w-full h-full"
                        style={{ background: '#F5F5F3' }}
                    >
                        <g>
                            {lgaData.map((geo, i) => {
                                const name = getGeoName(geo, true) || `LGA-${i}`;
                                const fillColor = config.highlight[name] || "#E0E0E0";
                                const isHighlighted = !!config.highlight[name];
                                const pathD = pathGenerator(geo);
                                const centroid = stateProjection(geoCentroid(geo));

                                return (
                                    <g key={name}>
                                        <path
                                            d={pathD}
                                            fill={fillColor}
                                            stroke="#FFFFFF"
                                            strokeWidth={0.5}
                                            style={{ cursor: 'pointer', transition: 'fill 250ms' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleGeoClick(geo);
                                            }}
                                            onMouseEnter={() => setHoveredGeo(name)}
                                            onMouseLeave={() => setHoveredGeo(null)}
                                        />
                                        {isHighlighted && centroid && (
                                            <g transform={`translate(${centroid[0]}, ${centroid[1] + 5})`}>
                                                <rect x="-30" y="-12" width="60" height="24" rx="4" fill="black" fillOpacity={0.7} />
                                                <text textAnchor="middle" y="4" fill="white" style={{ fontSize: '8px', fontWeight: 'bold' }}>
                                                    {name.toUpperCase()}
                                                </text>
                                            </g>
                                        )}
                                    </g>
                                );
                            })}
                        </g>
                        {/* Debug counter */}
                        <text x={width - 10} y={20} textAnchor="end" fill="#999" style={{ fontSize: '10px' }}>
                            {lgaData.length} LGAs loaded
                        </text>
                    </svg>
                ) : (

                    <ComposableMap
                        projection="geoMercator"
                        projectionConfig={projectionConfig}
                        width={width}
                        height={height}
                        className="w-full h-full"
                        style={{ pointerEvents: isDroppingPin ? 'none' : 'auto' }}
                    >
                        <ZoomableGroup
                            center={isState ? projectionConfig.center : config.center}
                            zoom={isState ? 1 : config.zoom}
                            onMoveEnd={isState ? undefined : handleMoveEnd}
                            minZoom={0.5}
                            maxZoom={20}
                            filterZoomEvent={isDroppingPin || isAnnotating ? () => false : undefined}
                        >
                            <Geographies
                                geography={mapUrl}
                                key={`${mapUrl}-${config.scope}`} // Force re-render when scope changes
                                parseGeographies={(geos) => {
                                    if (geos.objects) {
                                        // Robust key detection
                                        const key = geos.objects.lga ? "lga" : (geos.objects.NGA_adm1 ? "NGA_adm1" : Object.keys(geos.objects)[0]);
                                        return topojson.feature(geos, geos.objects[key]).features;
                                    }
                                    return geos;
                                }}
                            >
                                {({ geographies }) => {
                                    // Robust filtering for LGAs
                                    const filteredGeos = isState
                                        ? geographies.filter(geo => {
                                            const p = geo.properties;
                                            const admin1 = (p.admin1Name || p.admin1 || p.NAME_1 || p.State || p.state || "").trim().toLowerCase();
                                            const scope = config.scope.toLowerCase().trim();
                                            // Match both "Kano" and "Kano State"
                                            return admin1 === scope || admin1 === `${scope} state` || admin1.includes(scope);
                                        })
                                        : geographies;

                                    return (
                                        <>
                                            {/* Internal counter for debugging matches */}
                                            <Marker coordinates={isState ? (STATE_COORDINATES[config.scope] || [8, 10]) : [20, 0]}>
                                                <text y={-230} textAnchor="middle" fill="#999" style={{ fontSize: '8px', pointerEvents: 'none', fontWeight: 'bold' }}>
                                                    {isState ? `Showing ${filteredGeos.length} LGAs for ${config.scope}` : `Showing all ${geographies.length} regions`}
                                                </text>
                                            </Marker>

                                            {filteredGeos.map((geo) => {
                                                // Robust name detection: for LGA it's admin2Name, for States it's NAME_1
                                                const name = getGeoName(geo, isState);
                                                const fillColor = config.highlight[name] || "#E0E0E0";
                                                const isHighlighted = !!config.highlight[name];

                                                // Use explicit centroid calculation for better accuracy
                                                const centroid = geo.properties.centroid || geoCentroid(geo);

                                                return (
                                                    <React.Fragment key={geo.rsmKey || name}>
                                                        <Geography
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
                                                                    stroke: isState ? "#FFFFFF" : "#607D8B",
                                                                    strokeWidth: isState ? 0.3 : 0.5,
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
                                                        {isHighlighted && (
                                                            <Marker coordinates={centroid}>
                                                                <g transform="translate(0, 5)">
                                                                    <rect x="-30" y="-12" width="60" height="24" rx="4" fill="black" fillOpacity={0.7} />
                                                                    <text textAnchor="middle" y="4" fill="white" style={{ fontSize: '8px', fontWeight: 'bold' }}>
                                                                        {name.toUpperCase()}
                                                                    </text>
                                                                </g>
                                                            </Marker>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </>
                                    );
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
                )}

                {/* Config Overlay */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur border border-gray-100 p-4 rounded-xl shadow-xl space-y-3 z-10 pointer-events-auto" data-no-dnd="true">
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

                {!isState && (
                    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10" data-no-dnd="true">
                        <button
                            onClick={() => handleZoomChange(0.5)}
                            className="w-9 h-9 bg-white/90 backdrop-blur border border-gray-100 rounded-full shadow-lg text-black flex items-center justify-center hover:bg-white"
                            title="Zoom in"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleRecenter}
                            className="w-9 h-9 bg-white/90 backdrop-blur border border-gray-100 rounded-full shadow-lg text-black flex items-center justify-center hover:bg-white"
                            title="Recenter map"
                        >
                            <Crosshair className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleZoomChange(-0.5)}
                            className="w-9 h-9 bg-white/90 backdrop-blur border border-gray-100 rounded-full shadow-lg text-black flex items-center justify-center hover:bg-white"
                            title="Zoom out"
                        >
                            <Move className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="absolute bottom-4 left-0 w-full text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 pointer-events-none">
                    {isDroppingPin ? "Click to drop pin" : isAnnotating ? "Click to add label" : "Drag to pan • Click to paint LGAs"}
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
                    <p className="text-[10px] font-bold text-gray-300 italic">No regions highlighted yet. Click the map to start painting.</p>
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
