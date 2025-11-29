import { motion, useScroll, useSpring } from 'framer-motion';

export default function ProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1.5 bg-gray-100 origin-left">
      <motion.div
        className="h-full bg-[#FAFF00]"
        style={{ scaleX }}
      />
    </div>
  );
}
