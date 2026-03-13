"use client";

import { Person } from "@/types/person";
import { Plus, User } from "lucide-react";
import { useEffect, useRef, useState, useLayoutEffect, useCallback } from "react";

interface VisualGraphProps {
  people: Person[];
  activePerson: Person;
  onSelect: (p: Person) => void;
  onAddRelative: (p: Person) => void;
}

export default function VisualGraph({ people, activePerson, onSelect, onAddRelative }: VisualGraphProps) {
	const [lines, setLines] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const findPeople = (ids: string[] | undefined) => people.filter(p => ids?.includes(p.id));
  const parents = findPeople(activePerson?.parents);
  const children = findPeople(activePerson?.children);
  const spouse = people.find(p => p.id === activePerson?.spouse);
  const inLaws = spouse ? findPeople(spouse.parents) : [];

	// Logic to calculate line paths
  const updateLines = useCallback(() => {
			if (!containerRef.current || !activePerson?.id) return;
			
			const containerRect = containerRef.current.getBoundingClientRect();
			const newPaths: string[] = [];

			const getCenter = (id: string) => {
				if (!id) return null;
				const el = containerRef.current?.querySelector(`[data-node-id="${id}"]`);
				if (!el) return null;
				const r = el.getBoundingClientRect();
				return {
					x: (r.left + r.width / 2) - containerRect.left,
					y: (r.top + r.height / 2) - containerRect.top
				};
			};

			const findPeople = (ids: string[] | undefined) => people.filter(p => ids?.includes(p.id));
			const parents = findPeople(activePerson.parents);
			const children = findPeople(activePerson.children);
			const spouse = people.find(p => p.id === activePerson.spouse);
			const inLaws = spouse ? findPeople(spouse.parents) : [];

			const activeMid = getCenter(activePerson.id);
			if (!activeMid) return;

			parents.forEach(p => {
				const pMid = getCenter(p.id);
				if (pMid) newPaths.push(`M ${activeMid.x} ${activeMid.y} L ${pMid.x} ${pMid.y}`);
			});

			if (spouse) {
				const sMid = getCenter(spouse.id);
				if (sMid) {
					newPaths.push(`M ${activeMid.x} ${activeMid.y} L ${sMid.x} ${sMid.y}`);
					inLaws.forEach(il => {
						const ilMid = getCenter(il.id);
						if (ilMid) newPaths.push(`M ${sMid.x} ${sMid.y} L ${ilMid.x} ${ilMid.y}`);
					});
				}
			}

			children.forEach(c => {
				const cMid = getCenter(c.id);
				if (cMid) newPaths.push(`M ${activeMid.x} ${activeMid.y} L ${cMid.x} ${cMid.y}`);
			});

			// 2. ONLY SET STATE IF THE PATHS HAVE ACTUALLY CHANGED
			// Joining the strings is a quick way to compare arrays
			setLines(prev => {
				if (prev.join('|') === newPaths.join('|')) return prev;
				return newPaths;
			});
		}, [activePerson, people]); // Only recreate if the family data changes

		// 3. Separate the Layout Effect from the Resize logic
		useLayoutEffect(() => {
			const frame = requestAnimationFrame(updateLines);
			return () => cancelAnimationFrame(frame);
		}, [updateLines]);

		useEffect(() => {
			const observer = new ResizeObserver(() => {
				// Use requestAnimationFrame to "throttle" the update to the browser's refresh rate
				window.requestAnimationFrame(updateLines);
			});

			if (containerRef.current) {
				observer.observe(containerRef.current);
			}

			return () => observer.disconnect();
		}, [updateLines]);

		if (!activePerson) return null;

  return (
    <div ref={containerRef} className="relative flex-1 w-full h-full flex flex-col items-center justify-center overflow-hidden p-10">
      {/* SVG Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        {lines.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="white"
            strokeWidth="2"
            strokeOpacity="0.2"
            fill="none"
            strokeDasharray="5,5" // Makes the lines dashed for a cleaner look
            // className="animate-in fade-in duration-1000"
          />
        ))}
      </svg>

      {/* Rows (Using your existing Grid/Flex logic) */}
      <div className="z-10 flex flex-col items-center gap-[8vh] w-full max-w-6xl">
        
        {/* ROW: PARENTS */}
        <div className="grid grid-cols-3 w-full items-end">
          <div />
          <div className="flex justify-center gap-[2vw]">
            {parents.map(p => <NodeCard key={p.id} person={p} variant="small" onClick={() => onSelect(p)} onAdd={() => onAddRelative(p)} />)}
          </div>
          <div className="flex justify-start pl-[4vw]">
            {inLaws.length > 0 && (
              <div className="flex gap-[2vw] border-l border-white/10 pl-4">
                {inLaws.map(p => <NodeCard key={p.id} person={p} variant="small" onClick={() => onSelect(p)} onAdd={() => onAddRelative(p)} />)}
              </div>
            )}
          </div>
        </div>

        {/* ROW: ACTIVE */}
        <div className="grid grid-cols-3 w-full items-center">
          <div />
          <div className="flex justify-center">
            <NodeCard person={activePerson} variant="small" isActive onClick={() => onSelect(activePerson)} onAdd={() => onAddRelative(activePerson)} />
          </div>
          <div className="flex justify-start pl-[5vw]">
            {spouse && <NodeCard person={spouse} variant="small" onClick={() => onSelect(spouse)} onAdd={() => onAddRelative(spouse)} />}
          </div>
        </div>

        {/* ROW: CHILDREN */}
        <div className="flex flex-wrap justify-center gap-[2vw]">
          {children.map(p => <NodeCard key={p.id} person={p} variant="small" onClick={() => onSelect(p)} onAdd={() => onAddRelative(p)} />)}
        </div>
      </div>
    </div>
  );
}

function NodeCard({ person, variant, isActive, onClick, onAdd }: { 
  person: Person, 
  variant: 'small' | 'large', 
  isActive?: boolean, 
  onClick: () => void,
  onAdd: () => void 
}) {
  // CLAMP LOGIC: clamp(minimum, preferred, maximum)
  // preferred is 15% of the viewport width (15vw)
  const cardWidth = variant === 'large' 
    ? "w-[clamp(120px,18vw,180px)]" 
    : "w-[clamp(90px,12vw,130px)]";
    
  const cardHeight = variant === 'large' 
    ? "h-[clamp(140px,22vh,200px)]" 
    : "h-[clamp(110px,16vh,150px)]";

  return (
    <div data-node-id={person.id} className={`relative group shrink-0 ${cardWidth} aspect-square`}>
      <div 
        onClick={onClick}
        className={`w-full h-full bg-white rounded-xl shadow-sm border-2 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-2 text-center
          ${isActive ? "border-[#698b6a] scale-105 shadow-md" : "border-transparent hover:border-gray-200 hover:shadow-md"}`}
      >
        {/* Icon also scales using a percentage of the card's width */}
        <div className={`rounded-full bg-gray-50 flex items-center justify-center mb-1 transition-colors group-hover:bg-gray-100 
          ${variant === 'large' ? 'w-1/3 h-1/3' : 'w-1/4 h-1/4'}`}>
          <User className={`w-1/2 h-1/2 ${isActive ? "text-[#698b6a]" : "text-gray-400"}`} />
        </div>
        
        <span className="font-bold text-[#3A433A] leading-tight text-[min(2.5vw,14px)] md:text-[min(1.2vw,14px)]">
          {person?.firstName} <br/> {person?.lastName}
        </span>
      </div>

      {/* Button scales slightly too */}
      <button
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className="absolute -top-1 -right-1 w-[20%] aspect-square max-w-[28px] min-w-[20px] bg-[#383838] text-white rounded-full flex items-center justify-center shadow-lg 
                   opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-200 hover:bg-black z-20"
      >
        <Plus size="60%" />
      </button>
    </div>
  );
}