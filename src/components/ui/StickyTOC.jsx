import { useState, useEffect } from 'react';

const StickyTOC = () => {
    const [headings, setHeadings] = useState([]);
    const [activeId, setActiveId] = useState('');

    useEffect(() => {
        // Query the DOM for all h2 elements that were rendered by the block parser
        // We know they have the class 'font-sans font-black text-3xl' from StandardTemplate.astro
        const elements = Array.from(document.querySelectorAll('article h2'));

        // Map them to an array of objects
        const headingData = elements.map((elem, index) => {
            // Assign an ID if it doesn't have one so we can jump to it
            // Stripping HTML tags just in case
            const text = elem.textContent || `Section ${index + 1}`;
            const id = elem.id || text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            elem.id = id;
            return { id, text };
        });

        setHeadings(headingData);

        // Intersection Observer to highlight active TOC item
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '0px 0px -80% 0px' }
        );

        elements.forEach((elem) => observer.observe(elem));

        return () => {
            elements.forEach((elem) => observer.unobserve(elem));
        };
    }, []);

    if (headings.length === 0) return null;

    return (
        <div className="mt-12 hidden lg:block">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FAFF00] mb-4 block">In this story</span>
            <ul className="space-y-3 border-l-2 border-gray-100 pl-4">
                {headings.map((heading) => (
                    <li key={heading.id}>
                        <a
                            href={`#${heading.id}`}
                            className={`text-xs block font-bold transition-all duration-300 ${activeId === heading.id
                                    ? "text-black translate-x-1"
                                    : "text-gray-400 hover:text-black"
                                }`}
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            {heading.text}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default StickyTOC;
