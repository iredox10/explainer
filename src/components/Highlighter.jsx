import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function Highlighter({ children }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

    return (
        <span ref={ref} className="relative inline-block px-1">
            <motion.span
                className="absolute inset-0 -z-10 -skew-x-[10deg] bg-yellow-300"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isInView ? 1 : 0 }}
                transition={{ duration: 0.6, ease: "circOut" }}
                style={{ originX: 0 }}
            />
            <span className="relative z-0 font-bold text-gray-900">{children}</span>
        </span>
    );
}
