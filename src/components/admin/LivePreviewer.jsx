import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Bookmark, Share2 } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import BeforeAfter from '../ui/BeforeAfter';
import ScrollyIsland from '../ScrollyIsland';
import AnimatedMap from '../ui/AnimatedMap';
import AnimatedChart from '../ui/AnimatedChart';
import Timeline from '../ui/Timeline';
import BottleneckGraphic from '../ui/BottleneckGraphic';

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
  const legacySteps = typeof story.scrollySections === 'string' ? JSON.parse(story.scrollySections) : (story.scrollySections || []);
  const scrollyBlocks = blocks.filter((block) => block.type === 'scrolly-group');
  const scrollySteps = legacySteps.length > 0
    ? legacySteps
    : scrollyBlocks.flatMap((block) => block.steps || []);

  return (
    <div className="bg-white text-gray-900 font-sans selection:bg-yellow-300 selection:text-black min-h-screen">
      <ProgressBar />
      
      {story.layout === 'scrolly' ? (
        <ScrollyLayout story={story} blocks={blocks} steps={scrollySteps} activeStep={activeStep} />
      ) : (
        <StandardLayout story={story} blocks={blocks} scrollyBlocks={scrollyBlocks} />
      )}
    </div>
  );
}

function StandardLayout({ story, blocks, scrollyBlocks = [] }) {
  const standardBlocks = blocks.filter((block) => block.type !== 'scrolly-group');

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
          {standardBlocks.map((block, index) => (
            <BlockRenderer key={block.id || index} block={block} index={index} />
          ))}
        </article>
      </div>

      {scrollyBlocks.length > 0 && (
        <div className="border-y border-gray-100">
          {scrollyBlocks.map((block, index) => (
            <ScrollyIsland key={block.id || index} steps={block.steps || []} id={`preview-scrolly-${index}`} />
          ))}
        </div>
      )}
    </main>
  );
}

function ScrollyLayout({ story, blocks, steps, activeStep }) {
  const storyBlocks = blocks.filter((block) => block.type !== 'scrolly-group');

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
        {storyBlocks.map((block, index) => (
          <BlockRenderer key={block.id || index} block={block} index={index} />
        ))}
      </div>

      {steps.length > 0 && (
        <ScrollyIsland steps={steps} forcedStep={activeStep} />
      )}
    </main>
  );
}

function BlockRenderer({ block, index }) {
  switch (block.type) {
    case 'heading':
      return (
        <h2 className="font-sans font-black text-3xl text-black mt-16 mb-8 tracking-tight border-b-4 border-yellow-300 inline-block pb-1">
          <span dangerouslySetInnerHTML={{ __html: block.text || '' }} />
        </h2>
      );
    case 'p':
      return (
        <p
          className={`mb-8 ${index === 0 ? "first-letter:float-left first-letter:text-[5rem] first-letter:font-black first-letter:mr-3" : ""}`}
          dangerouslySetInnerHTML={{ __html: block.text || '' }}
        />
      );
    case 'quote':
      return (
        <blockquote className="my-16 border-l-4 border-[#FAFF00] pl-8 font-serif text-3xl italic text-gray-700">
          <span dangerouslySetInnerHTML={{ __html: block.text || '' }} />
          {block.author && <cite className="block text-xs font-sans font-black uppercase tracking-widest text-gray-400 mt-4 not-italic">— {block.author}</cite>}
        </blockquote>
      );
    case 'callout':
      return (
        <div className="bg-gray-50 p-8 my-12 border-t-4 border-black">
          <h4 className="font-sans font-black uppercase text-xs text-gray-400 mb-3">{block.title}</h4>
          <p className="text-xl font-bold text-black" dangerouslySetInnerHTML={{ __html: block.text || '' }} />
        </div>
      );
    case 'image':
      return (
        <figure className="my-12">
          <img src={block.url} className="w-full h-auto rounded-3xl" />
          {block.caption && <figcaption className="mt-4 text-xs font-bold text-gray-400 text-center uppercase tracking-widest">{block.caption}</figcaption>}
        </figure>
      );
    case 'video':
      return (
        <figure className="my-12">
          <video
            src={block.url}
            className="w-full h-auto rounded-3xl"
            controls={!block.autoplay}
            autoPlay={block.autoplay}
            muted={block.autoplay}
            loop
            playsInline
          />
          {block.caption && <figcaption className="mt-4 text-xs font-bold text-gray-400 text-center uppercase tracking-widest">{block.caption}</figcaption>}
        </figure>
      );
    case 'map':
      return (
        <div className="my-12 border border-gray-200 bg-gray-50 rounded-2xl overflow-hidden relative shadow-sm h-[420px]">
          <AnimatedMap
            center={block.center}
            zoom={block.zoom}
            highlight={block.highlight}
            label={block.label}
            scope={block.scope}
            markers={block.markers}
            annotations={block.annotations}
            overlayIcons={block.overlayIcons}
            showRecenter={true}
          />
        </div>
      );
    case 'chart':
      return (
        <div className="my-12 bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm min-h-[320px]">
          <AnimatedChart
            type={block.chartType}
            data={block.chartData}
            labels={block.chartLabels}
            colors={block.chartColors}
            accentColor={block.accentColor}
            label={block.title || block.label}
            annotations={block.annotations}
          />
        </div>
      );
    case 'timeline':
      return (
        <div className="my-12 bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden min-h-[320px]">
          <Timeline
            label={block.label}
            highlight={block.highlight}
            steps={block.timelineSteps || []}
            variant={block.style || 'track'}
            animated={false}
            showContextLabel={false}
            hud={false}
          />
        </div>
      );
    case 'bottleneck':
      return (
        <div className="my-12">
          <BottleneckGraphic
            sourceLabel={block.sourceLabel}
            sourceValue={block.sourceValue}
            outputLabel={block.outputLabel}
            outputValue={block.outputValue}
            unit={block.unit}
            bottleneckLabel={block.bottleneckLabel}
            bottleneckSubLabel={block.bottleneckSubLabel}
            caption={block.caption}
          />
        </div>
      );
    case 'scrolly-group':
      return (
        <div className="my-12 -mx-6 border-y border-gray-100">
          <ScrollyIsland steps={block.steps || []} id={`preview-inline-scrolly-${block.id || index}`} />
        </div>
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
