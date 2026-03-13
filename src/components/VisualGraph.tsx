"use client";

import { Person } from "@/types/person";
import { Plus, User } from "lucide-react";
import { useEffect, useRef, useState, useLayoutEffect, useCallback } from "react";

// Props needed for VisualGraph
interface VisualGraphProps {
  people: Person[];
  activePerson: Person;
  onSelect: (p: Person) => void;
  onAddRelative: (p: Person) => void;
}

export default function VisualGraph({ people, activePerson, onSelect, onAddRelative }: VisualGraphProps) {
	// useState to hold the SVG path data for both dashed (marriage) and solid (parent-child) lines
	const [paths, setPaths] = useState<{ dashed: string[], solid: string[] }>({ 
		dashed: [], 
		solid: [] 
	});
  const containerRef = useRef<HTMLDivElement>(null);

	/*
		For each generation, people are grouped into individual or spouse pairs and sorted by the ID of the first person in the unit.
		This is so the layout remains stable and minimizes "jumping" when changing the activePerson, 
		as the relative order of siblings and spouses is preserved based on their IDs.
	*/
  const generations = getGenerationalLevels(activePerson, people, 5);
  const sortedLevelKeys = Object.keys(generations)
    .map(Number)
    .sort((a, b) => a - b);

	sortedLevelKeys.forEach(level => {
		const peopleInLevel = generations[level];
		const units: Person[][] = [];
		const processed = new Set<string>();

		// 1. Group into Units (Single people or Spouse Pairs)
		peopleInLevel.forEach(p => {
			if (processed.has(p.id)) return;

			const spouse = peopleInLevel.find(s => s.id === p.spouse);
			if (spouse) {
				// Always put the lower ID first within the pair for absolute stability
				const pair = [p, spouse].sort((a, b) => a.id.localeCompare(b.id));
				units.push(pair);
				processed.add(p.id);
				processed.add(spouse.id);
			} else {
				units.push([p]);
				processed.add(p.id);
			}
		});

		// 2. Sort the Units themselves by the ID of the first person in the unit
		// This is the key to stopping the "jump" when you change activePerson
		units.sort((unitA, unitB) => unitA[0].id.localeCompare(unitB[0].id));

		// 3. Flatten back into the generation
		generations[level] = units.flat();
	});

	// Logic to calculate line paths
	const updateLines = useCallback(() => {
		if (!containerRef.current) return;
		const containerRect = containerRef.current.getBoundingClientRect();
		const dashedPaths: string[] = [];
		const solidPaths: string[] = [];

		const getCenter = (id: string) => {
			const el = containerRef.current?.querySelector(`[data-node-id="${id}"]`);
			if (!el) return null;
			const r = el.getBoundingClientRect();
			return {
				x: (r.left + r.width / 2) - containerRect.left,
				y: (r.top + r.height / 2) - containerRect.top
			};
		};

		const processedMarriages = new Set<string>();

		people.forEach(p => {
			const pMid = getCenter(p.id);
			if (!pMid) return;

			if (p.spouse) {
				const marriageKey = [p.id, p.spouse].sort().join("-");
				if (!processedMarriages.has(marriageKey)) {
					const sMid = getCenter(p.spouse);
					if (sMid) {
						// 1. DASHED Line for Marriage
						dashedPaths.push(`M ${pMid.x} ${pMid.y} L ${sMid.x} ${sMid.y}`);

						// 2. SOLID Lines for Children (from midpoint)
						const midX = (pMid.x + sMid.x) / 2;
						const midY = (pMid.y + sMid.y) / 2;
						
						p.children?.forEach(childId => {
							const cMid = getCenter(childId);
							if (cMid) {
								const midPointY = (midY + cMid.y) / 2;
								solidPaths.push(`M ${midX} ${midY} V ${midPointY} H ${cMid.x} V ${cMid.y}`);
							}
						});
					}
					processedMarriages.add(marriageKey);
				}
			} else {
				// Single parent solid lines
				p.children?.forEach(childId => {
					const cMid = getCenter(childId);
					if (cMid) solidPaths.push(`M ${pMid.x} ${pMid.y} L ${cMid.x} ${cMid.y}`);
				});
			}
		});

		setPaths({ dashed: dashedPaths, solid: solidPaths });
	}, [people]);

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
    <div ref={containerRef} className="relative flex-1 w-full h-full overflow-auto p-20">
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
				{/* Render Dashed Marriage Lines */}
				{paths.dashed.map((d, i) => (
					<path
						key={`dashed-${i}`}
						d={d}
						stroke="white"
						strokeWidth="2"
						strokeOpacity="0.3"
						fill="none"
						strokeDasharray="5,5" // Dashed lines
					/>
				))}

				{/* Render Solid Children Lines */}
				{paths.solid.map((d, i) => (
					<path
						key={`solid-${i}`}
						d={d}
						stroke="white"
						strokeWidth="2"
						strokeOpacity="0.5" // Made a bit more prominent
						fill="none"
						// No strokeDasharray, solid lines
					/>
				))}
			</svg>

      <div className="relative z-10 flex flex-col items-center gap-24">
        {// Render each generation by row, with people spaced out evenly and centered horizontally
				sortedLevelKeys.map(level => (
          <div 
						key={level} 
						className="flex flex-row flex-nowrap justify-center items-center gap-12 min-h-[150px]">
            {// Render each person in the generation using the NodeCard component
						generations[level].map(p => (
              <NodeCard 
                key={p.id} 
                person={p} 
                variant="small" 
                isActive={p.id === activePerson.id}
                onClick={() => onSelect(p)} 
                onAdd={() => onAddRelative(p)} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// This function establishes the structure and styling of each individual family member in the graph
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
        className={`w-full h-full rounded-xl shadow-sm border-2 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-2 text-center
          ${isActive ? "border-[#698b6a] scale-105 shadow-md bg-[#698b6a]" : "border-transparent hover:border-gray-200 hover:shadow-md bg-white "}`}
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

// This function uses BFS to traverse the family tree starting from the active person, 
// grouping people into generational levels based on their relationships (parents, children, spouses).
function getGenerationalLevels(activePerson: Person, allPeople: Person[], maxDepth = 2) {
  const levels: Record<number, Person[]> = {};
  const visited = new Set<string>();
  // We track 'distance' to know when to stop
  const queue: { id: string; level: number; distance: number }[] = [
    { id: activePerson.id, level: 0, distance: 0 }
  ];

  visited.add(activePerson.id);

  while (queue.length > 0) {
    const { id, level, distance } = queue.shift()!;
    const person = allPeople.find(p => p.id === id);
    if (!person) continue;

    if (!levels[level]) levels[level] = [];
    levels[level].push(person);

    // Stop searching further if we've reached the edge of our maxDepth
    if (distance >= maxDepth) continue;

    // Identify all neighbors
    const neighbors = [
      ...(person.parents || []).map(pid => ({ id: pid, level: level - 1 })),
      ...(person.children || []).map(pid => ({ id: pid, level: level + 1 })),
      ...(person.spouse ? [{ id: person.spouse, level: level }] : [])
    ];

    for (const rel of neighbors) {
      if (!visited.has(rel.id)) {
        visited.add(rel.id);
        queue.push({ ...rel, distance: distance + 1 });
      }
    }
  }
  return levels;
}