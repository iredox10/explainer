import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps";
import { MapPin } from 'lucide-react';

const AFRICA_URL = "https://cdn.jsdelivr.net/npm/@highcharts/map-collection/custom/africa.topo.json";
const NIGERIA_URL = "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/nigeria/nigeria-states.json";

const MotionGeography = motion(Geography);

export default function AnimatedMap({ center = [20, 0], zoom = 1, highlight, label, scope = 'africa', markers = [], annotations = [] }) {
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
    const mapUrl = isNigeria ? NIGERIA_URL : AFRICA_URL;
    const defaultCenter = isNigeria ? [8.6753, 9.0820] : [20, 0];
    const defaultScale = isNigeria ? 2500 : 150;

    return (
        <div 
            className="relative h-full w-full flex items-center justify-center bg-white"
            onMouseMove={(e) => {
                mouseX.set(e.clientX + 10);
                mouseY.set(e.clientY + 10);
            }}
        >
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: defaultScale,
                    center: defaultCenter
                }}
                className="w-full h-full"
            >
                <ZoomableGroup
                    center={renderCenter}
                    zoom={renderZoom}
                >
                    {/* Add key to force re-render when mapUrl changes */}
                    <Geographies geography={mapUrl} parseGeographies={(geos) => geos} key={mapUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => {
                                const isHighlighted = highlight && (
                                    Array.isArray(highlight)
                                        ? highlight.some(h => 
                                            geo.properties.name?.toLowerCase() === h.toLowerCase() ||
                                            geo.id === h ||
                                            geo.properties.NAME_1?.toLowerCase() === h.toLowerCase()
                                        )
                                        : (
                                            geo.properties.name?.toLowerCase() === highlight.toLowerCase() ||
                                            geo.id === highlight ||
                                            geo.properties.NAME_1?.toLowerCase() === highlight.toLowerCase() // Handle Nigeria TopoJSON properties
                                        )
                                );
                                return (
                                    <MotionGeography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        onMouseEnter={() => {
                                            setHoveredGeo(geo.properties.name || geo.properties.NAME_1);
                                        }}
                                        onMouseLeave={() => {
                                            setHoveredGeo(null);
                                        }}
                                        initial={false}
                                        animate={{
                                            fill: isHighlighted ? "#FAFF00" : "#F5F5F3",
                                        }}
                                        transition={{ duration: 0.8 }}
                                        stroke="#D6D6DA"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none" },
                                            hover: { fill: "#FAFF00", outline: "none" },
                                            pressed: { outline: "none" },
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
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
