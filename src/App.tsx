/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { PawPrint, ArrowRight, ArrowDown, Search, X, Filter } from 'lucide-react';
import { cn } from './lib/utils';
import { CHRONICLE_EVENTS, CHRONICLE_TITLE, CHRONICLE_SUBTITLE } from './constants';

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const toEventTimestamp = (event: { year: string; date: string }) => {
  const year = Number.parseInt(event.year, 10);
  if (Number.isNaN(year)) return Number.MAX_SAFE_INTEGER;

  const normalizedDate = event.date.toLowerCase().replace(/\./g, '').trim();
  const match = normalizedDate.match(/^([a-z]+)\s+(\d{1,2})$/);
  if (!match) return Number.MAX_SAFE_INTEGER;

  const month = MONTH_INDEX[match[1]];
  const day = Number.parseInt(match[2], 10);
  if (month === undefined || Number.isNaN(day)) return Number.MAX_SAFE_INTEGER;

  return new Date(year, month, day).getTime();
};

const FIXED_IMAGE_FRAME_STYLE = { width: 180, height: 220 } as const;
const DESKTOP_EVENT_CARD_WIDTH = 430;
const DESCRIPTION_PREVIEW_MAX = 30;

const getDescriptionPreview = (text: string) => {
  if (text.length <= DESCRIPTION_PREVIEW_MAX) return text;
  return `${text.slice(0, DESCRIPTION_PREVIEW_MAX).trimEnd()}...`;
};

const EventSection = React.memo(({ event, index, isMobile, onOpenDetail }: { event: any; index: number; isMobile: boolean; onOpenDetail: (e: any) => void }) => {
  const useFixedImageSize = Boolean(event.image) && Boolean(event.fixedImageSize);
  const shouldShowReadMore = event.description.length > DESCRIPTION_PREVIEW_MAX;

  return (
    <div 
      className={cn(
        "relative flex flex-col shrink-0",
        !isMobile ? "h-screen border-r border-muted/30" : "w-full py-12 px-6 border-b border-muted/30"
      )}
      style={!isMobile ? { width: DESKTOP_EVENT_CARD_WIDTH } : undefined}
    >
      {/* Connecting Line (Desktop) */}
      {!isMobile && (
        <div className="absolute top-1/2 left-0 w-full h-px horizontal-line -translate-y-1/2 z-0" />
      )}

      {/* Content Container */}
      <div className={cn(
        "relative z-10 flex flex-col h-full",
        isMobile ? "space-y-8" : ""
      )}>
        
        {/* Top Half: Text Content (Desktop) */}
        <div className={cn(
          "flex-1 flex flex-col",
          !isMobile ? "justify-end pb-8 px-12" : "space-y-6"
        )}>
          {/* Year & Date Group */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-stroke text-5xl md:text-7xl font-black leading-none">
                {event.year}
              </span>
              <span className="text-accent font-bold tracking-widest text-[10px] uppercase opacity-60">
                {event.date}
              </span>
            </div>
          </div>

          {/* Main Content */}
          <div className={cn(
            "relative mt-6",
            isMobile ? "space-y-4" : "h-[176px]"
          )}>
            {!event.image && !isMobile && (
              <div className="absolute -top-16 -left-8 opacity-[0.04] pointer-events-none">
                <PawPrint size={200} className="text-accent" />
              </div>
            )}

            <div className={cn(
              isMobile ? "" : "h-[44px] overflow-hidden"
            )}>
              <div className="flex flex-wrap gap-2 content-start max-h-full overflow-hidden">
              {event.dogNames?.map((dog: string) => (
                <span key={dog} className="px-2 py-0.5 bg-accent/10 text-accent text-[9px] font-bold rounded-full tracking-wider">
                  @{dog}
                </span>
              ))}
              </div>
            </div>
            
            <div className={cn(
              "space-y-3",
              isMobile ? "" : "mt-4 h-[120px] flex flex-col"
            )}>
              <h3 
                onClick={() => onOpenDetail(event)}
                className="font-serif text-lg md:text-xl font-bold text-fg leading-tight cursor-pointer hover:text-accent transition-colors shrink-0"
              >
                {event.title}
              </h3>
              <div 
                className="group flex-1 min-h-0"
              >
                {shouldShowReadMore ? (
                  <p className="text-fg/70 text-sm md:text-base max-w-xs leading-relaxed font-serif max-h-[3.5rem] overflow-hidden">
                    {`${getDescriptionPreview(event.description)} `}
                    <button
                      type="button"
                      onClick={() => onOpenDetail(event)}
                      className="inline-flex items-center gap-1 text-[0.85em] font-serif font-normal text-fg/45 hover:text-fg/60 transition-colors align-baseline whitespace-nowrap"
                    >
                      阅读更多
                    </button>
                  </p>
                ) : (
                  <p className="text-fg/70 text-sm md:text-base max-w-xs leading-relaxed font-serif line-clamp-2">
                    {event.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Dot (Desktop) */}
        {!isMobile && (
          <div className="absolute top-1/2 -left-[6px] w-3 h-3 rounded-full event-dot -translate-y-1/2 z-20" />
        )}

        {/* Bottom Half: Image Content (Desktop) */}
        {!isMobile ? (
          <div className="flex-1 flex flex-col justify-start pt-8 px-12">
            {event.image && (
              <div className={cn(
                "relative group",
                useFixedImageSize ? "mx-auto shrink-0" : "w-full max-w-[320px]"
              )}
              style={useFixedImageSize ? FIXED_IMAGE_FRAME_STYLE : undefined}>
                <motion.img 
                  initial={{ opacity: 0, scale: 1.1 }}
                  whileInView={{ opacity: 1, scale: 1.05 }}
                  viewport={{ once: true, margin: "200px" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  src={`${import.meta.env.BASE_URL}${event.image}`} 
                  alt={event.title}
                  loading="lazy"
                  className={cn(
                    "transition-transform duration-700 ease-in-out group-hover:scale-100",
                    useFixedImageSize ? "w-full h-full object-contain object-top" : "w-full h-auto"
                  )}
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
        ) : (
          event.image && (
            <div className={cn(
              "relative group",
              useFixedImageSize ? "mx-auto shrink-0" : "w-full max-w-[320px]"
            )}
            style={useFixedImageSize ? FIXED_IMAGE_FRAME_STYLE : undefined}>
              <motion.img 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "100px" }}
                transition={{ duration: 0.6 }}
                src={`${import.meta.env.BASE_URL}${event.image}`} 
                alt={event.title}
                loading="lazy"
                className={cn(
                  useFixedImageSize ? "w-full h-full object-contain object-top" : "w-full h-auto"
                )}
                referrerPolicy="no-referrer"
              />
            </div>
          )
        )}
      </div>
    </div>
  );
});

EventSection.displayName = 'EventSection';

export default function App() {
  const targetRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeYear, setActiveYear] = useState<string | null>(null);
  const [selectedDog, setSelectedDog] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const years = useMemo(() => {
    const y = Array.from(new Set(CHRONICLE_EVENTS.map(e => e.year)));
    return y.sort((a, b) => parseInt(a) - parseInt(b));
  }, [CHRONICLE_EVENTS]);

  const allDogs = useMemo(() => {
    const dogs = new Set<string>();
    CHRONICLE_EVENTS.forEach(e => e.dogNames?.forEach(d => dogs.add(d)));
    return Array.from(dogs).sort();
  }, [CHRONICLE_EVENTS]);

  const filteredEvents = useMemo(() => {
    const events = selectedDog
      ? CHRONICLE_EVENTS.filter(e => e.dogNames?.includes(selectedDog))
      : CHRONICLE_EVENTS;

    return events
      .map((event, index) => ({ event, index }))
      .sort((a, b) => {
        const timeDiff = toEventTimestamp(a.event) - toEventTimestamp(b.event);
        if (timeDiff !== 0) return timeDiff;
        return a.index - b.index;
      })
      .map(item => item.event);
  }, [selectedDog, CHRONICLE_EVENTS]);

  // Scroll to first item when filter changes
  useEffect(() => {
    // Small delay to ensure the DOM has updated its height and layout
    const timer = setTimeout(() => {
      if (selectedDog && filteredEvents.length > 0) {
        scrollToEvent(filteredEvents[0].id);
      } else if (!selectedDog) {
        scrollToEvent(null);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedDog, filteredEvents.length]);

  const eventsByYear = useMemo(() => {
    const grouped: Record<string, typeof CHRONICLE_EVENTS> = {};
    filteredEvents.forEach(event => {
      if (!grouped[event.year]) grouped[event.year] = [];
      grouped[event.year].push(event);
    });
    return grouped;
  }, [filteredEvents]);

  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  // Calculate total width for horizontal scroll
  // Hero (100vw) + Events (N * DESKTOP_EVENT_CARD_WIDTH) + End (100vw)
  const totalHorizontalScroll = useMemo(() => {
    if (typeof window === 'undefined') return 0;
    if (isMobile) return 0;
    return window.innerWidth + (filteredEvents.length * DESKTOP_EVENT_CARD_WIDTH);
  }, [isMobile, filteredEvents.length]);

  const x = useTransform(scrollYProgress, [0, 1], [0, -totalHorizontalScroll]);

  const scrollToEvent = (eventId: string | null) => {
    if (!eventId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveYear(null);
      return;
    }

    const index = filteredEvents.findIndex(e => e.id === eventId);
    if (index === -1) return;

    setActiveYear(filteredEvents[index].year);

    if (isMobile) {
      const elements = document.querySelectorAll('[data-event-id]');
      const targetElement = Array.from(elements).find(el => el.getAttribute('data-event-id') === eventId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // Precise centering logic for desktop horizontal scroll
      const vw = window.innerWidth;
      const targetX = vw + (index * DESKTOP_EVENT_CARD_WIDTH) + (DESKTOP_EVENT_CARD_WIDTH * 0.5) - (vw * 0.5);
      
      const targetProgress = targetX / totalHorizontalScroll;
      
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({
        top: Math.max(0, Math.min(targetProgress * scrollHeight, scrollHeight)),
        behavior: 'smooth'
      });
    }
  };

  return (
    <main 
      ref={targetRef} 
      className={cn("relative bg-paper", isMobile ? "h-auto" : "")}
      style={!isMobile ? { height: `${(filteredEvents.length + 2) * 100}vh` } : {}}
    >
      <div className={cn("top-0 flex overflow-hidden", !isMobile ? "sticky h-screen" : "flex-col")}>
        {/* Progress Bar */}
        <motion.div 
          style={{ scaleX: scrollYProgress }}
          className="fixed top-0 left-0 right-0 h-1 bg-accent origin-left z-50"
        />

        {/* Navigation Panel */}
        <div className="fixed top-6 right-6 z-[60] flex flex-col items-end gap-2">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-12 h-12 rounded-full bg-accent text-bg flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            {isFilterOpen ? <X size={20} /> : <Search size={20} />}
          </button>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="bg-paper border border-muted/30 p-6 rounded-3xl shadow-2xl w-80 max-h-[80vh] overflow-y-auto hide-scrollbar"
              >
                <div className="space-y-8">
                  <div className="flex justify-between items-center border-b border-muted/30 pb-4">
                    <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-fg/40">目录与筛选</span>
                    <button 
                      onClick={() => {
                        setSelectedDog(null);
                      }}
                      className="text-[10px] font-bold text-accent hover:underline"
                    >
                      重置
                    </button>
                  </div>

                  {/* Dog Filter Tags */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-bold tracking-widest uppercase text-fg/30">按狗狗筛选</span>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => setSelectedDog(null)}
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold transition-all",
                          !selectedDog ? "bg-accent text-bg" : "bg-muted/30 text-fg/40 hover:bg-muted/50"
                        )}
                      >
                        全部
                      </button>
                      {allDogs.map(dog => (
                        <button 
                          key={dog}
                          onClick={() => setSelectedDog(dog)}
                          className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold transition-all",
                            selectedDog === dog ? "bg-accent text-bg" : "bg-muted/30 text-fg/40 hover:bg-muted/50"
                          )}
                        >
                          {dog}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Year/Event Index */}
                  <div className="space-y-6">
                    <span className="text-[9px] font-bold tracking-widest uppercase text-fg/30">快速跳转</span>
                    {Object.keys(eventsByYear).sort().map(year => (
                      <div key={year} className="space-y-3">
                        <h4 className="font-display text-xl font-black text-fg/20 border-l-2 border-accent/20 pl-3">
                          {year}
                        </h4>
                        <div className="grid gap-2 pl-3">
                          {eventsByYear[year].map(event => (
                            <button 
                              key={event.id}
                              onClick={() => {
                                scrollToEvent(event.id);
                                if (isMobile) setIsFilterOpen(false);
                              }}
                              className="group flex flex-col items-start text-left py-2 border-b border-muted/10 last:border-0"
                            >
                              <span className="text-[9px] font-bold text-accent tracking-widest uppercase opacity-60 group-hover:opacity-100 transition-opacity">
                                {event.date}
                              </span>
                              <span className="text-xs font-serif text-fg/60 group-hover:text-fg transition-colors line-clamp-1">
                                {event.title}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Rail */}
        <div className={cn(
          "bg-paper z-40 border-muted/30",
          !isMobile 
            ? "fixed left-0 top-0 h-full w-16 border-r flex flex-col items-center justify-between py-12" 
            : "sticky top-0 w-full h-16 border-b flex items-center justify-between px-6"
        )}>
          <PawPrint size={24} className="text-accent" />
          {!isMobile ? (
            <div className="rotate-90 origin-center whitespace-nowrap text-[10px] tracking-[0.5em] uppercase font-bold text-fg/20">
              Dog Chronicle {years[0]}—{years[years.length - 1]}
            </div>
          ) : (
            <span className="text-[10px] tracking-widest uppercase font-bold text-fg/40">Chronicle</span>
          )}
          <div className="text-[10px] font-bold text-accent">CH</div>
        </div>

        <motion.div 
          style={!isMobile ? { x } : {}} 
          className={cn("flex will-change-transform", !isMobile ? "flex-row" : "flex-col w-full")}
        >
          {/* Hero Section */}
          <section className="min-w-full md:min-w-screen h-screen flex flex-col items-center justify-center px-12 md:px-32 relative border-r border-muted/30 overflow-hidden">
            <div className="max-w-4xl relative z-10">
              {/* Sticker Collage Background */}
              <div className="absolute inset-0 -z-10 pointer-events-none flex items-center justify-center">
                <motion.img 
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  src={`${import.meta.env.BASE_URL}dogs/dogs_group.png`} 
                  className="w-full max-w-4xl h-auto object-contain drop-shadow-xl opacity-90 -translate-y-32 md:-translate-y-56 will-change-transform"
                  referrerPolicy="no-referrer"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>

              <div className="space-y-8 md:space-y-12 text-center md:text-left relative">
                <h1 className="font-serif text-[11vw] sm:text-[10vw] md:text-[8vw] lg:text-[100px] xl:text-[120px] leading-tight font-black tracking-tighter whitespace-nowrap mix-blend-multiply">
                  {CHRONICLE_TITLE}
                </h1>

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-20">
                  <p className="text-fg/60 text-xs md:text-sm max-w-xs leading-relaxed uppercase tracking-widest font-serif italic bg-bg/40 backdrop-blur-sm p-2 rounded">
                    {CHRONICLE_SUBTITLE}
                  </p>
                  <motion.div 
                    animate={!isMobile ? { x: [0, 10, 0] } : { y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex items-center gap-4 text-accent"
                  >
                    <span className="text-[10px] font-bold tracking-widest uppercase">
                      {isMobile ? "向下滚动" : "向右探索"}
                    </span>
                    {isMobile ? <ArrowDown size={16} /> : <ArrowRight size={16} />}
                  </motion.div>
                </div>
              </div>
            </div>
          </section>

          {/* Chronicle Events */}
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event, index) => (
              <motion.div 
                key={event.id} 
                data-event-id={event.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
              >
                <EventSection 
                  event={event} 
                  index={index} 
                  isMobile={isMobile} 
                  onOpenDetail={setSelectedEvent}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* End Section */}
          <section className="min-w-full md:min-w-screen h-screen flex flex-col items-center justify-center px-12 md:px-32 bg-[#F7F3E9] relative border-l border-muted/20">
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none flex items-center justify-center">
              <PawPrint size={600} className="text-fg" />
            </div>
            
            <div className="relative z-10 flex flex-col items-center">
              <h2 className="font-serif text-6xl md:text-[8vw] font-black leading-none text-center text-fg/90 tracking-tighter">
                未完<br />待拉
              </h2>
              
              <div className="mt-16 flex flex-col items-center gap-6">
                <div className="w-px h-32 bg-gradient-to-b from-accent/60 to-transparent" />
                <span className="font-serif italic text-sm text-fg/40 tracking-widest uppercase">
                  To be continued
                </span>
              </div>
            </div>
          </section>
        </motion.div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="absolute inset-0 bg-bg/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-bg h-full shadow-2xl overflow-y-auto border-l border-muted/30"
            >
              <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-8 right-8 p-2 hover:bg-muted/20 rounded-full transition-colors z-10"
              >
                <X size={24} />
              </button>

              <div className="p-12 md:p-24 space-y-12">
                <div className="space-y-4">
                  <div className="flex items-baseline gap-4">
                    <span className="font-display text-stroke text-7xl md:text-9xl font-black leading-none">
                      {selectedEvent.year}
                    </span>
                    <span className="text-accent font-bold tracking-[0.2em] text-xs md:text-sm uppercase">
                      {selectedEvent.date}
                    </span>
                  </div>
                  <div className="h-1 w-24 bg-accent" />
                </div>

                <div className="space-y-8">
                  <h2 className="font-serif text-4xl md:text-6xl font-black text-fg leading-tight">
                    {selectedEvent.title || "编年史记事"}
                  </h2>
                  
                  <div className="flex flex-wrap gap-3">
                    {selectedEvent.dogNames?.map((dog: string) => (
                      <span key={dog} className="px-4 py-1.5 bg-accent/10 text-accent text-xs font-bold rounded-full tracking-wider">
                        @{dog}
                      </span>
                    ))}
                  </div>

                  <div className="prose prose-lg">
                    <p className="text-fg/80 text-lg md:text-xl leading-relaxed font-serif whitespace-pre-wrap">
                      {selectedEvent.description}
                    </p>
                  </div>

                  {selectedEvent.image && (
                    <div className={cn("pt-8", selectedEvent.fixedImageSize ? "flex justify-center" : "") }>
                      {selectedEvent.fixedImageSize ? (
                        <div className="rounded-sm shadow-lg overflow-hidden" style={FIXED_IMAGE_FRAME_STYLE}>
                          <img
                            src={`${import.meta.env.BASE_URL}${selectedEvent.image}`}
                            alt={selectedEvent.title}
                            className="w-full h-full object-contain object-top"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <img
                          src={`${import.meta.env.BASE_URL}${selectedEvent.image}`}
                          alt={selectedEvent.title}
                          className="w-full h-auto rounded-sm shadow-lg"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
