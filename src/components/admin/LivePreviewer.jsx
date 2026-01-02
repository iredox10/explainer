import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Bookmark, Share2 } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import BeforeAfter from '../ui/BeforeAfter';
import ScrollyIsland from '../ScrollyIsland';

export default function LivePreviewer() {
  const [story, setStory] = useState(null);
  const [activeStep, setActiveStep] = useState(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'GHOST_PREVIEW_UPDATE') {
        setStory(event.data.story);
        if (event.data.activeStepIndex !== undefined) {
          setActiveStep(event.data.activeStepIndex);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    // Notify parent we are ready
    window.parent.postMessage({ type: 'GHOST_PREVIEW_READY' }, '*');
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 animate-pulse">Waiting for synchronization...</p>
        </div>
      </div>
    );
  }

  const blocks = typeof story.content === 'string' ? JSON.parse(story.content) : (story.content || []);
  const steps = typeof story.scrollySections === 'string' ? JSON.parse(story.scrollySections) : (story.scrollySections || []);

  return (
    <div className="bg-white text-gray-900 font-sans selection:bg-yellow-300 selection:text-black min-h-screen">
      <ProgressBar />
      
      {story.layout === 'scrolly' ? (
        <ScrollyLayout story={story} blocks={blocks} steps={steps} activeStep={activeStep} />
      ) : (
        <StandardLayout story={story} blocks={blocks} />
      )}
    </div>
  );
}

function StandardLayout({ story, blocks }) {
  return (
    <main>
      <div className="pt-12 pb-16 px-6 bg-[#f8f9fa] border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <span className="bg-black text-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] mb-8 inline-block">
            {story.category}
          </span>
          <h1 className="font-serif text-5xl md:text-6xl font-black tracking-tighter leading-[0.95] mb-8 text-black">
            {story.headline}
          </h1>
          <p className="text-xl text-gray-600 font-serif leading-relaxed mb-8 border-l-4 border-yellow-400 pl-6">
            {story.subhead}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <article className="font-serif text-[1.2rem] leading-[1.8] text-gray-900">
          {blocks.map((block, index) => (
            <BlockRenderer key={block.id || index} block={block} index={index} />
          ))}
        </article>
      </div>
    </main>
  );
}

function ScrollyLayout({ story, blocks, steps, activeStep }) {
  return (
    <main>
      <div className="relative h-[80vh] flex flex-col items-center justify-center text-center p-6 overflow-hidden bg-black text-white">
        {story.videoUrl ? (
          <video
            src={story.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
        ) : (
          <img src={story.heroImage} className="absolute inset-0 w-full h-full object-cover opacity-60" />
        )}
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] mb-6 uppercase">
            {story.headline}
          </h1>
          <p className="text-xl md:text-2xl font-medium text-gray-300 max-w-2xl mx-auto italic">
            {story.subhead}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-24 text-2xl font-serif leading-relaxed text-gray-900">
        {blocks.map((block, index) => (
          <BlockRenderer key={block.id || index} block={block} index={index} />
        ))}
      </div>

      <ScrollyIsland steps={steps} forcedStep={activeStep} />
    </main>
  );
}

function BlockRenderer({ block, index }) {
  switch (block.type) {
    case 'heading':
      return (
        <h2 className="font-sans font-black text-3xl text-black mt-16 mb-8 tracking-tight border-b-4 border-yellow-300 inline-block pb-1">
          {block.text}
        </h2>
      );
    case 'p':
      return <p className={`mb-8 ${index === 0 ? "first-letter:float-left first-letter:text-[5rem] first-letter:font-black first-letter:mr-3" : ""}`}>{block.text}</p>;
    case 'quote':
      return (
        <blockquote className="my-16 border-l-4 border-[#FAFF00] pl-8 font-serif text-3xl italic text-gray-700">
          {block.text}
          {block.author && <cite className="block text-xs font-sans font-black uppercase tracking-widest text-gray-400 mt-4 not-italic">— {block.author}</cite>}
        </blockquote>
      );
    case 'callout':
      return (
        <div className="bg-gray-50 p-8 my-12 border-t-4 border-black">
          <h4 className="font-sans font-black uppercase text-xs text-gray-400 mb-3">{block.title}</h4>
          <p className="text-xl font-bold text-black">{block.text}</p>
        </div>
      );
    case 'image':
      return (
        <figure className="my-12">
          <img src={block.url} className="w-full h-auto rounded-3xl" />
          {block.caption && <figcaption className="mt-4 text-xs font-bold text-gray-400 text-center uppercase tracking-widest">{block.caption}</figcaption>}
        </figure>
      );
    case 'beforeAfter':
      return (
        <BeforeAfter
          leftImage={block.leftImage}
          rightImage={block.rightImage}
          leftLabel={block.leftLabel}
          rightLabel={block.rightLabel}
          caption={block.caption}
        />
      );
    default:
      return null;
  }
}
