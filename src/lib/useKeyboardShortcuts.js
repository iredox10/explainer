import { useEffect, useCallback } from 'react';

export function useKeyboardShortcuts(shortcuts, deps = []) {
    const handleKeyDown = useCallback((e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }

        const key = [];
        if (e.metaKey || e.ctrlKey) key.push('ctrl');
        if (e.shiftKey) key.push('shift');
        if (e.altKey) key.push('alt');
        key.push(e.key.toLowerCase());
        const combo = key.join('+');

        const matchingShortcut = shortcuts.find(s => {
            const sKey = s.key.toLowerCase();
            const sCombo = [
                s.ctrl && 'ctrl',
                s.shift && 'shift',
                s.alt && 'alt',
                sKey
            ].filter(Boolean).join('+');
            return sCombo === combo;
        });

        if (matchingShortcut) {
            e.preventDefault();
            matchingShortcut.action();
        }
    }, [shortcuts, ...deps]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

export function useEditorShortcuts({ onSave, onPreview, onPublish, onExit }) {
    const shortcuts = [
        { key: 's', ctrl: true, action: onSave, label: 'Save' },
        { key: 'p', ctrl: true, action: onPreview, label: 'Preview' },
        { key: 'Enter', ctrl: true, action: onPublish, label: 'Publish' },
        { key: 'Escape', action: onExit, label: 'Exit' }
    ].filter(s => s.action);

    useKeyboardShortcuts(shortcuts);

    return shortcuts;
}

export function ShortcutBadge({ keys }) {
    return (
        <span className="inline-flex items-center gap-1 text-[9px] text-gray-400">
            {keys.map((key, i) => (
                <span key={i}>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[9px] font-bold">
                        {key === 'ctrl' ? '⌘' : key === 'shift' ? '⇧' : key === 'alt' ? '⌥' : key.toUpperCase()}
                    </kbd>
                    {i < keys.length - 1 && <span className="text-gray-300">+</span>}
                </span>
            ))}
        </span>
    );
}

export function ShortcutsHelp({ shortcuts }) {
    return (
        <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Keyboard Shortcuts</h4>
            <div className="space-y-2">
                {shortcuts.map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">{s.label}</span>
                        <ShortcutBadge keys={[
                            s.ctrl && 'ctrl',
                            s.shift && 'shift',
                            s.alt && 'alt',
                            s.key
                        ].filter(Boolean)} />
                    </div>
                ))}
            </div>
        </div>
    );
}