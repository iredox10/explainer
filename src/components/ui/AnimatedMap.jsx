import { useState, useEffect, useMemo } from 'react';
import { geoCentroid, geoMercator, geoPath } from "d3-geo";
import * as topojson from "topojson-client";
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps";
import { MapPin } from 'lucide-react';

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

const MotionGeography = motion(Geography);

export default function AnimatedMap({ center = [20, 0], zoom = 1, highlight, label, scope = 'africa', markers = [], annotations = [], overlayIcons = [] }) {
    const springConfig = { damping: 20, stiffness: 100, mass: 1 };

    // Motion values for our coordinates
    const lon = useMotionValue(center[0]);
    const lat = useMotionValue(center[1]);
    const z = useMotionValue(zoom);

    // Smooth springs
    const smoothLon = useSpring(lon, springConfig);
    const smoothLat = useSpring(lat, springConfig);
    const smoothZ = useSpring(z, springConfig);

    // Tooltip state
    const [hoveredGeo, setHoveredGeo] = useState(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Sync props to motion values
    useEffect(() => {
        lon.set(center[0]);
        lat.set(center[1]);
        z.set(zoom);
    }, [center, zoom, lon, lat, z]);

    // Internal state to force re-render for ZoomableGroup (since it needs raw numbers)
    const [renderCenter, setRenderCenter] = useState(center);
    const [renderZoom, setRenderZoom] = useState(zoom);

    useEffect(() => {
        const unsubLon = smoothLon.on("change", (v) => setRenderCenter(prev => [v, prev[1]]));
        const unsubLat = smoothLat.on("change", (v) => setRenderCenter(prev => [prev[0], v]));
        const unsubZ = smoothZ.on("change", (v) => setRenderZoom(v));
        return () => { unsubLon(); unsubLat(); unsubZ(); };
    }, [smoothLon, smoothLat, smoothZ]);

    const isNigeria = scope === 'nigeria';
    const isState = NIGERIA_STATES.some(s => s.toLowerCase() === scope.toLowerCase());

    let mapUrl = AFRICA_URL;
    let objectKey = null;

    if (isNigeria) {
        mapUrl = NIGERIA_URL;
        objectKey = "NGA_adm1";
    } else if (isState) {
        mapUrl = NIGERIA_LGA_URL;
        objectKey = "lga";
    }

    const defaultCenter = isNigeria ? [8.6753, 9.0820] : (isState ? STATE_COORDINATES[scope] || center : [20, 0]);

    // Dynamic projection config based on scope
    const projectionConfig = useMemo(() => {
        if (isState) {
            return {
                center: STATE_COORDINATES[scope] || [8.6753, 9.0820],
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
    }, [isState, isNigeria, scope]);

    // Fetch and manage LGA data for state-level rendering
    const [lgaData, setLgaData] = useState(null);

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
                        return stateName === scope.toLowerCase();
                    });
                    setLgaData(stateFeatures);
                })
                .catch(err => console.error('Failed to load LGA data:', err));
        } else {
            setLgaData(null);
        }
    }, [isState, scope]);

    // Create projection using fitSize for automatic centering
    const stateProjection = useMemo(() => {
        if (isState && lgaData && lgaData.length > 0) {
            const featureCollection = { type: "FeatureCollection", features: lgaData };
            // Disable clipExtent to prevent bounding rectangle from appearing in paths
            return geoMercator().fitSize([800, 600], featureCollection).clipExtent(null);
        }
        return null;
    }, [isState, lgaData]);

    const pathGenerator = useMemo(() => {
        if (stateProjection) {
            return geoPath().projection(stateProjection);
        }
        return null;
    }, [stateProjection]);

    return (
        <div
            className="relative h-full w-full flex items-center justify-center bg-white"
            onMouseMove={(e) => {
                mouseX.set(e.clientX + 10);
                mouseY.set(e.clientY + 10);
            }}
        >
            {/* State-level map using d3-geo direct rendering */}
            {isState && lgaData && pathGenerator ? (
                <svg
                    viewBox="0 0 800 600"
                    className="w-full h-full"
                    style={{ background: '#F5F5F3' }}
                >
                    {lgaData.map((geo, i) => {
                        // GRID3 GeoJSON uses 'lganame' property
                        const name = geo.properties.lganame || geo.properties.admin2Name || `LGA-${i}`;
                        const pathD = pathGenerator(geo);
                        const centroid = stateProjection(geoCentroid(geo));

                        // Check highlight
                        let fillColor = "#F5F5F3";
                        if (highlight) {
                            if (typeof highlight === 'object' && !Array.isArray(highlight)) {
                                const key = Object.keys(highlight).find(k => k.toLowerCase() === name.toLowerCase());
                                if (key) fillColor = highlight[key];
                            }
                        }

                        return (
                            <g key={name}>
                                <path
                                    d={pathD}
                                    fill={fillColor}
                                    stroke="#FFFFFF"
                                    strokeWidth={0.5}
                                    style={{ transition: 'fill 300ms' }}
                                />
                                {/* Label for highlighted LGAs */}
                                {fillColor !== "#F5F5F3" && centroid && (
                                    <g transform={`translate(${centroid[0]}, ${centroid[1]})`}>
                                        <rect x="-25" y="-10" width="50" height="20" rx="3" fill="black" fillOpacity={0.7} />
                                        <text textAnchor="middle" y="4" fill="white" style={{ fontSize: '7px', fontWeight: 'bold' }}>
                                            {name.toUpperCase()}
                                        </text>
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </svg>
            ) : (
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={projectionConfig}
                    className="w-full h-full"
                >
                    <ZoomableGroup
                        center={renderCenter}
                        zoom={renderZoom}
                    >
                        <Geographies
                            geography={mapUrl}
                            key={`${mapUrl}-${scope}`} // Force re-render when scope changes
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
                                // Filter if we are in state (LGA) view
                                const filteredGeos = isState
                                    ? geographies.filter(geo => {
                                        const admin1 = (geo.properties.admin1Name || geo.properties.admin1 || geo.properties.NAME_1 || "").trim().toLowerCase();
                                        const targetScope = scope.toLowerCase().trim();
                                        return admin1 === targetScope || admin1 === `${targetScope} state` || admin1.includes(targetScope);
                                    })
                                    : geographies;

                                return filteredGeos.map((geo) => {
                                    // Calculate color based on highlight type
                                    let fillColor = "#F5F5F3"; // Default off-white

                                    // Normalize names across different TopoJSON structures
                                    const geoName = isState ? (geo.properties.admin2Name || geo.properties.admin2) : (geo.properties.NAME_1 || geo.properties.name);
                                    const normalizedGeoName = geoName?.toLowerCase();
                                    const geoId = geo.id?.toString().toLowerCase();
                                    const geoRegion = (geo.properties.region || geo.properties.admin1Name)?.toLowerCase();

                                    if (highlight) {
                                        if (typeof highlight === 'string') {
                                            if (normalizedGeoName === highlight.toLowerCase() || geoId === highlight.toLowerCase() || geoRegion === highlight.toLowerCase()) {
                                                fillColor = "#FAFF00";
                                            }
                                        } else if (Array.isArray(highlight)) {
                                            if (highlight.some(h => normalizedGeoName === h.toLowerCase() || geoId === h.toLowerCase() || geoRegion === h.toLowerCase())) {
                                                fillColor = "#FAFF00";
                                            }
                                        } else if (typeof highlight === 'object') {
                                            const key = Object.keys(highlight).find(k =>
                                                normalizedGeoName === k.toLowerCase() ||
                                                geoId === k.toLowerCase() ||
                                                geoRegion === k.toLowerCase()
                                            );
                                            if (key) {
                                                fillColor = highlight[key];
                                            }
                                        }
                                    }

                                    return (
                                        <React.Fragment key={geo.rsmKey || geoName}>
                                            <MotionGeography
                                                geography={geo}
                                                onMouseEnter={() => {
                                                    setHoveredGeo(geoName);
                                                }}
                                                onMouseLeave={() => {
                                                    setHoveredGeo(null);
                                                }}
                                                initial={false}
                                                animate={{
                                                    fill: fillColor,
                                                }}
                                                transition={{ duration: 0.8 }}
                                                stroke={isState ? "#FFFFFF" : "#D6D6DA"}
                                                strokeWidth={isState ? 0.3 : 0.5}
                                                style={{
                                                    default: { outline: "none" },
                                                    hover: { fill: fillColor === "#F5F5F3" ? "#FAFF00" : fillColor, outline: "none" },
                                                    pressed: { outline: "none" },
                                                }}
                                            />
                                        </React.Fragment>
                                    );
                                });
                            }}
                        </Geographies>

                        {/* Overlay Icons (Resolved) */}
                        {overlayIcons?.map((item, i) => {
                            const Icon = {
                                'police': (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
                                'allocation': (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>,
                                'court': (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h20M7 8V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3M12 4v16M3 8h18M3 20h18"></path></svg>,
                                'heart': (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            }[item.icon.toLowerCase()] || MapPin;

                            return (
                                <Marker key={`icon-${i}`} coordinates={item.coordinates || [0, 0]}>
                                    <motion.g
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.5 + (i * 0.1) }}
                                        onMouseEnter={() => setHoveredGeo(item.label)}
                                        onMouseLeave={() => setHoveredGeo(null)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <circle r="12" fill="black" opacity="0.1" />
                                        <Icon
                                            size={20}
                                            className="text-black fill-[#FAFF00]"
                                            strokeWidth={2}
                                            transform="translate(-10, -10)"
                                        />
                                    </motion.g>
                                </Marker>
                            );
                        })}

                        {markers.map((marker, i) => (
                            <Marker key={i} coordinates={marker.coordinates}>
                                <g
                                    onMouseEnter={() => setHoveredGeo(marker.label)}
                                    onMouseLeave={() => setHoveredGeo(null)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <MapPin
                                        size={24}
                                        className="text-black fill-[#FAFF00]"
                                        strokeWidth={1.5}
                                        transform="translate(-12, -24)"
                                    />
                                </g>
                            </Marker>
                        ))}
                    </ZoomableGroup>
                </ComposableMap>
            )}

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

            {/* Annotations Layer */}
            {annotations.map((ann, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + (i * 0.1), duration: 0.5 }}
                    className="absolute z-40 px-3 py-1.5 bg-[#FAFF00] text-black text-xs md:text-sm font-bold shadow-lg border-2 border-black transform -translate-x-1/2 -translate-y-1/2 pointer-events-none whitespace-nowrap"
                    style={{
                        left: `${ann.x}%`,
                        top: `${ann.y}%`,
                    }}
                >
                    {ann.text}
                </motion.div>
            ))}

            <AnimatePresence mode="wait">
                <motion.div
                    key={label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="absolute bottom-6 right-6 md:bottom-10 md:right-10 bg-white/10 backdrop-blur-md border-l-4 border-[#FAFF00] px-4 py-3 md:px-8 md:py-6 shadow-2xl"
                >
                    <span className="block text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1 md:mb-2">Operational Sector</span>
                    <span className="block text-lg md:text-2xl font-bold text-black font-serif-display leading-none">{label}</span>
                </motion.div>
            </AnimatePresence>

        </div>
    );
}
