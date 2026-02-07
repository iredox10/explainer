import React, { useState } from 'react';
import { Plus, Trash2, BarChart2, PieChart, Activity, FileJson, X, Loader2, AreaChart, ScatterChart } from 'lucide-react';
import AnimatedChart from '../../ui/AnimatedChart';

export default function ChartConfigurator({ value, onChange }) {
    // Default initial state
    const defaultConfig = {
        type: 'line',
        title: 'Chart Title',
        data: [
            { label: 'Point A', value: 10, color: '#FAFF00' },
            { label: 'Point B', value: 25, color: '#FAFF00' },
            { label: 'Point C', value: 15, color: '#FAFF00' }
        ],
        accentColor: '#FAFF00'
    };

    // Merge provided value with defaults to ensure structure exists
    const config = { ...defaultConfig, ...(value || {}) };
    
    // Ensure annotations exist
    if (!config.annotations) config.annotations = [];

    const [isAnnotating, setIsAnnotating] = useState(false);
    const [bulkData, setBulkData] = useState('');
    const [showBulk, setShowBulk] = useState(false);

    // Update helper
    const updateConfig = (updates) => {
        onChange({ ...config, ...updates });
    };

    const handleChartClick = (e) => {
        if (!isAnnotating) return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const x = parseFloat(((e.clientX - rect.left) / rect.width * 100).toFixed(2));
        const y = parseFloat(((e.clientY - rect.top) / rect.height * 100).toFixed(2));
        
        updateConfig({
            annotations: [...config.annotations, { x, y, text: 'New Label' }]
        });
        setIsAnnotating(false);
    };

    const updateAnnotation = (index, text) => {
        const updated = [...config.annotations];
        updated[index] = { ...updated[index], text };
        updateConfig({ annotations: updated });
    };

    const removeAnnotation = (index) => {
        const updated = config.annotations.filter((_, i) => i !== index);
        updateConfig({ annotations: updated });
    };

    // Data row helpers
    const updateRow = (index, field, val) => {
        const newData = [...config.data];
        newData[index] = { ...newData[index], [field]: val };
        updateConfig({ data: newData });
    };

    const addRow = () => {
        updateConfig({
            data: [...config.data, { label: 'New Point', value: 0, color: config.accentColor || '#FAFF00' }]
        });
    };

    const removeRow = (index) => {
        const newData = config.data.filter((_, i) => i !== index);
        updateConfig({ data: newData });
    };

    const handleBulkImport = () => {
        try {
            let imported = [];
            const trimmed = bulkData.trim();
            if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                // Try JSON
                const parsed = JSON.parse(trimmed);
                imported = Array.isArray(parsed) ? parsed : [parsed];
            } else {
                // Try CSV (Label, Value)
                imported = trimmed.split('\n').filter(Boolean).map(line => {
                    const parts = line.split(',');
                    const label = parts[0]?.trim();
                    const value = Number(parts[1]?.trim());
                    return { label: label || 'Imported', value: isNaN(value) ? 0 : value, color: config.accentColor || '#FAFF00' };
                });
            }
            
            if (imported.length > 0) {
                updateConfig({
                    data: imported.map(d => ({
                        label: String(d.label || 'Point'),
                        value: Number(d.value) || 0,
                        color: d.color || config.accentColor || '#FAFF00'
                    }))
                });
                setShowBulk(false);
                setBulkData('');
            }
        } catch (err) {
            alert('Import failed. Please check format (JSON array or Label,Value lines).');
        }
    };

    // Prepare data for AnimatedChart
    const chartData = config.data.map(d => Number(d.value) || 0);
    const chartLabels = config.data.map(d => d.label);
    const chartColors = config.data.map(d => d.color);

    return (
        <div className="space-y-8 bg-gray-50 p-6 rounded-3xl border border-gray-100">
            {/* Header / Type Selection */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Data Visualization</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Configure your chart data</p>
                </div>
                
                <div className="flex flex-wrap gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    {[
                        { id: 'line', icon: Activity, label: 'Line' },
                        { id: 'area', icon: AreaChart, label: 'Area' },
                        { id: 'bar', icon: BarChart2, label: 'Bar' },
                        { id: 'pie', icon: PieChart, label: 'Pie' },
                        { id: 'scatter', icon: ScatterChart, label: 'Scatter' }
                    ].map((type) => (
                        <button
                            key={type.id}
                            onClick={() => updateConfig({ type: type.id })}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                config.type === type.id 
                                    ? 'bg-black text-white shadow-md' 
                                    : 'text-gray-400 hover:text-black hover:bg-gray-50'
                            }`}
                        >
                            <type.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{type.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Live Preview */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden relative">
                <div className="absolute top-4 right-4 z-10 bg-black/5 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500 border border-white/20">
                    Live Preview
                </div>
                {isAnnotating && (
                    <div className="absolute inset-0 z-50 cursor-crosshair bg-black/5 flex items-center justify-center pointer-events-none">
                        <div className="bg-black text-white px-3 py-1 text-xs font-bold rounded shadow-lg animate-pulse">
                            Click to place label
                        </div>
                    </div>
                )}
                <div 
                    className={`h-[300px] w-full ${isAnnotating ? 'cursor-crosshair' : ''}`}
                    onClick={handleChartClick}
                >
                    <AnimatedChart 
                        type={config.type}
                        data={chartData}
                        labels={chartLabels}
                        colors={chartColors}
                        accentColor={config.accentColor}
                        label={config.title}
                        annotations={config.annotations}
                    />
                </div>
            </div>

            {/* Configuration Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Global Settings */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Chart Title</label>
                        <input
                            type="text"
                            value={config.title}
                            onChange={(e) => updateConfig({ title: e.target.value })}
                            className="w-full bg-white border border-gray-200 p-3 rounded-xl text-sm font-bold focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                            placeholder="e.g. Annual Growth"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Global Accent Color</label>
                        <div className="flex gap-2">
                            <div className="relative w-12 h-12 rounded-xl border border-gray-200 shadow-sm overflow-hidden shrink-0">
                                <input
                                    type="color"
                                    value={config.accentColor}
                                    onChange={(e) => updateConfig({ accentColor: e.target.value })}
                                    className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0"
                                />
                            </div>
                            <input
                                type="text"
                                value={config.accentColor}
                                onChange={(e) => updateConfig({ accentColor: e.target.value })}
                                className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-mono uppercase focus:outline-none focus:border-black transition-all"
                                placeholder="#000000"
                            />
                        </div>
                    </div>

                    {/* Annotations Section */}
                    <div className="space-y-2 border-t border-gray-100 pt-4">
                         <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Annotations</label>
                            <button
                                onClick={() => setIsAnnotating(!isAnnotating)}
                                className={`text-[9px] px-2 py-1 rounded border flex items-center gap-1 font-black uppercase tracking-widest transition-all ${isAnnotating ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                <Plus className="w-3 h-3" />
                                Add Label
                            </button>
                        </div>

                        {config.annotations.length > 0 ? (
                            <div className="space-y-2">
                                {config.annotations.map((ann, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 p-2 rounded-lg text-sm shadow-sm">
                                        <input
                                            type="text"
                                            value={ann.text}
                                            onChange={(e) => updateAnnotation(i, e.target.value)}
                                            className="flex-1 bg-transparent border-none p-0 text-xs font-bold focus:ring-0"
                                        />
                                        <button 
                                            onClick={() => removeAnnotation(i)}
                                            className="text-gray-300 hover:text-red-500 p-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-[9px] text-gray-400 italic text-center py-2">
                                No annotations added.
                            </div>
                        )}
                    </div>
                </div>

                {/* Data Table */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Data Points</label>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setShowBulk(!showBulk)}
                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <FileJson className="w-3 h-3" /> {showBulk ? 'Hide Import' : 'Bulk Import'}
                            </button>
                            <button 
                                onClick={addRow}
                                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <Plus className="w-3 h-3" /> Add Row
                            </button>
                        </div>
                    </div>

                    {showBulk && (
                        <div className="bg-black text-white p-6 rounded-2xl space-y-4 shadow-2xl">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Bulk Data Importer</h4>
                                <div className="flex gap-2 text-[8px] font-bold text-gray-400">
                                    <span>CSV (Label,Value)</span>
                                    <span>•</span>
                                    <span>JSON Array</span>
                                </div>
                            </div>
                            <textarea 
                                className="w-full h-32 bg-white/10 border border-white/10 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-yellow-400 transition-colors"
                                placeholder={"Lagos, 45\nAbuja, 30\nKano, 25"}
                                value={bulkData}
                                onChange={(e) => setBulkData(e.target.value)}
                            />
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => setShowBulk(false)}
                                    className="px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/50 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleBulkImport}
                                    className="bg-yellow-400 text-black px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                                >
                                    Process Import
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="grid grid-cols-12 gap-2 bg-gray-50 p-3 border-b border-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-400">
                            <div className="col-span-1">Color</div>
                            <div className="col-span-6">Label</div>
                            <div className="col-span-4">Value</div>
                            <div className="col-span-1 text-center">Act</div>
                        </div>
                        
                        <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {config.data.map((row, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 p-2 items-center hover:bg-gray-50 transition-colors group">
                                    <div className="col-span-1">
                                        <div className="relative w-8 h-8 rounded-lg border border-gray-200 overflow-hidden cursor-pointer shadow-sm hover:scale-110 transition-transform">
                                            <div className="absolute inset-0" style={{ backgroundColor: row.color }} />
                                            <input
                                                type="color"
                                                value={row.color}
                                                onChange={(e) => updateRow(idx, 'color', e.target.value)}
                                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-6">
                                        <input
                                            type="text"
                                            value={row.label}
                                            onChange={(e) => updateRow(idx, 'label', e.target.value)}
                                            className="w-full bg-transparent border-none p-1.5 text-xs font-bold focus:ring-0 placeholder:text-gray-300"
                                            placeholder="Label"
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <input
                                            type="number"
                                            value={row.value}
                                            onChange={(e) => updateRow(idx, 'value', Number(e.target.value))}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-lg p-1.5 text-xs font-mono text-right focus:bg-white focus:border-black focus:outline-none transition-colors"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                        <button 
                                            onClick={() => removeRow(idx)}
                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remove Row"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            
                            {config.data.length === 0 && (
                                <div className="p-8 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
                                    <p>No data points defined.</p>
                                    <button onClick={addRow} className="text-blue-500 hover:underline font-bold">Add your first data point</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
