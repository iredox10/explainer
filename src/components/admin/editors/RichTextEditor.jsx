import { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Link, Eraser } from 'lucide-react';

const sanitizeHtml = (value) => {
    if (!value) return '';
    if (typeof value !== 'string') return String(value);
    return value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
};

export default function RichTextEditor({ value, onChange, placeholder, className = '', disabled = false, onFocus }) {
    const editorRef = useRef(null);
    const [formatState, setFormatState] = useState({
        bold: false,
        italic: false,
        link: false
    });

    useEffect(() => {
        if (!editorRef.current) return;
        const nextValue = sanitizeHtml(value || '');
        const currentValue = editorRef.current.innerHTML;
        if (nextValue !== currentValue) {
            editorRef.current.innerHTML = nextValue;
        }
    }, [value]);

    const updateFormatState = () => {
        if (disabled) return;
        const selection = window.getSelection();
        const anchorNode = selection?.anchorNode;

        if (!anchorNode || !editorRef.current || !editorRef.current.contains(anchorNode)) {
            setFormatState({ bold: false, italic: false, link: false });
            return;
        }

        const bold = document.queryCommandState('bold');
        const italic = document.queryCommandState('italic');
        const element = anchorNode.nodeType === 3 ? anchorNode.parentElement : anchorNode;
        const link = !!element?.closest?.('a');

        setFormatState({ bold, italic, link });
    };

    const updateValue = () => {
        if (!editorRef.current) return;
        const rawHtml = editorRef.current.innerHTML;
        const textContent = editorRef.current.textContent || '';
        const cleaned = textContent.trim().length === 0 ? '' : sanitizeHtml(rawHtml);
        onChange(cleaned);
    };

    const handleCommand = (command) => {
        if (disabled) return;
        editorRef.current?.focus();
        document.execCommand(command);
        updateValue();
        updateFormatState();
    };

    const handleLink = () => {
        if (disabled) return;
        if (formatState.link) {
            editorRef.current?.focus();
            document.execCommand('unlink');
            updateValue();
            updateFormatState();
            return;
        }

        const url = window.prompt('Enter URL');
        if (!url) return;
        editorRef.current?.focus();
        document.execCommand('createLink', false, url);
        updateValue();
        updateFormatState();
    };

    useEffect(() => {
        const handleSelectionChange = () => {
            updateFormatState();
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, [disabled]);

    const toolbarButtonClass = (isActive) => (
        `p-1.5 rounded-md border ${isActive ? 'bg-black text-white border-black' : 'border-gray-100 text-gray-500 hover:text-black hover:border-gray-200'}`
    );

    return (
        <div className="space-y-2">
            {!disabled && (
                <div className="flex items-center gap-1" data-no-dnd="true">
                    <button
                        type="button"
                        className={toolbarButtonClass(formatState.bold)}
                        onClick={() => handleCommand('bold')}
                        title="Bold"
                        aria-pressed={formatState.bold}
                    >
                        <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        className={toolbarButtonClass(formatState.italic)}
                        onClick={() => handleCommand('italic')}
                        title="Italic"
                        aria-pressed={formatState.italic}
                    >
                        <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        className={toolbarButtonClass(formatState.link)}
                        onClick={handleLink}
                        title={formatState.link ? 'Remove link' : 'Link'}
                        aria-pressed={formatState.link}
                    >
                        <Link className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        className={toolbarButtonClass(false)}
                        onClick={() => handleCommand('removeFormat')}
                        title="Clear formatting"
                    >
                        <Eraser className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
            <div
                ref={editorRef}
                className={`rich-text-editor ${className} ${disabled ? 'opacity-70' : ''}`}
                contentEditable={!disabled}
                data-placeholder={placeholder}
                onInput={updateValue}
                onBlur={updateValue}
                onKeyUp={updateFormatState}
                onMouseUp={updateFormatState}
                onFocus={onFocus}
                suppressContentEditableWarning={true}
                data-no-dnd="true"
            />
            <style>{`
                .rich-text-editor:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                }
                .rich-text-editor:focus:before {
                    content: '';
                }
                .rich-text-editor a {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}
