"use client";

import { Person } from "@/types/person";
import { Plus, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  Handle,
  Position,
  NodeProps,
  Background,
  Controls,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

// Layout Constants: Affects spacing and sizing of graph elements.
const NODE_W     = 130;   // Node width  (px)
const NODE_H     = 130;   // Node height (px)
const SPOUSE_GAP = 60;    // Horizontal gap between spouses
const UNIT_GAP   = 60;    // Horizontal gap between units (sibling groups or solo individuals within a generation)
const ROW_GAP    = 160;   // Vertical gap between generations

const hiddenHandle: React.CSSProperties = {
  opacity: 0,
  background: "transparent",
  border: "none",
  width: 1,
  height: 1,
};

// Person Node
function PersonNode({ data }: NodeProps) {
  const { person, isActive, onSelect, onAdd } = data as {
    person: Person;
    isActive: boolean;
    onSelect: () => void;
    onAdd: () => void;
  };

  return (
    <div className="relative group" style={{ width: NODE_W, height: NODE_H }}>
      {/* Structural handles — hidden, just used for edge routing */}
      <Handle type="target" position={Position.Top}    id="top"    style={hiddenHandle} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={hiddenHandle} />
      <Handle type="source" position={Position.Right}  id="right"  style={hiddenHandle} />
      <Handle type="target" position={Position.Left}   id="left"   style={hiddenHandle} />

      {/* Card */}
      <div
        className={`
          w-full h-full rounded-xl shadow-sm border-2 transition-all duration-300
          cursor-pointer flex flex-col items-center justify-center p-2 text-center
          ${isActive
            ? "border-[#698b6a] scale-105 shadow-md bg-[#698b6a]"
            : "border-transparent hover:border-gray-200 hover:shadow-md bg-white"
          }
        `}
      >
        {person.avatar ? (
          <img 
                      src={person.avatar}
                      alt={`${person.firstName} ${person.lastName}`} 
                      className="w-16 h-16 rounded-full object-cover mx-auto"
                    />
        ) : (<User className={`w-1/3 h-1/3 ${isActive ? "text-white" : "text-gray-400"}`} />)
        }
          
        
        <span className={`font-bold leading-tight text-xs ${isActive ? "text-white" : "text-[#3A433A]"}`}>
          {person.firstName}<br />{person.lastName}
        </span>
      </div>
      
      {/* Add Button */}
      <button
        onClick={e => { e.stopPropagation(); onAdd(); }}
        className="
          absolute -top-1 -right-1 w-5 h-5 bg-[#383838] text-white rounded-full
          flex items-center justify-center shadow-lg
          opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0
          transition-all duration-200 hover:bg-black z-20
        "
      >
        <Plus size={10} />
      </button>
    </div>
  );
}

// Midpoint "couple" node for routing edges between spouses and children.
function CoupleNode() {
  return (
    <div style={{ width: 1, height: 1 }}>
      <Handle type="source" position={Position.Bottom} id="bottom" style={hiddenHandle} />
    </div>
  );
}

const nodeTypes = { personNode: PersonNode, coupleNode: CoupleNode };

// Breadth-First Search of family graph to assign generational levels, starting from the active person
function getGenerationalLevels(
  activePerson: Person,
  allPeople: Person[],
  maxDepth = 10
): Record<number, Person[]> {
  const levels: Record<number, Person[]> = {};
  const visited = new Set<string>();
  const queue: { id: string; level: number; distance: number }[] = [
    { id: activePerson.id, level: 0, distance: 0 },
  ];
  visited.add(activePerson.id);

  while (queue.length > 0) {
    const { id, level, distance } = queue.shift()!;
    const person = allPeople.find(p => p.id === id);
    if (!person) continue;

    (levels[level] ??= []).push(person);
    if (distance >= maxDepth) continue;

    // Traverse through family relationships: parents (up), children (down), spouses (same level)
    [
      ...(person.parents  ?? []).map(pid => ({ id: pid, level: level - 1 })),
      ...(person.children ?? []).map(pid => ({ id: pid, level: level + 1 })),
      ...(person.spouses  ?? []).map(pid => ({ id: pid, level })),
    ].forEach(rel => {
      if (!visited.has(rel.id)) {
        visited.add(rel.id);
        queue.push({ ...rel, distance: distance + 1 });
      }
    });
  }
  return levels;
}

// Graph Builder
interface CoupleRecord {
  coupleId: string;
  p1Id: string;
  p2Id: string;
  midX: number;
  midY: number;
}

function buildGraph(
  people: Person[],
  activePerson: Person,
  onSelect: (p: Person) => void,
  onAddRelative: (p: Person) => void
): { nodes: Node[]; edges: Edge[]; posMap: Record<string, { x: number; y: number }>; layoutKeys: Record<string, string> } {

  const levels    = getGenerationalLevels(activePerson, people, 10);
  const levelKeys = Object.keys(levels).map(Number).sort((a, b) => a - b);

  const posMap:      Record<string, { x: number; y: number }> = {}; // Final positions for each person node
  const couplesByKey: Record<string, CoupleRecord>            = {}; // Couple records for spouse pairs, keyed by sorted person IDs (e.g. "pid1--pid2")
  const layoutKeys: Record<string, string> = {}; // Layout keys for stable positioning: "level:rowIndex:totalWidth:unitIndex:memberIndex"

  // Pass 1: Compute Layout Positions for All Visible People
  levelKeys.forEach((level, rowIndex) => {
    const peopleInLevel = levels[level] ?? [];

    const idToPerson = new Map(peopleInLevel.map(p => [p.id, p]));
    const sortedPeople = [...peopleInLevel].sort((a, b) => a.id.localeCompare(b.id));

    // Build units of siblings (people with the same parents) using parent ID sets as keys. Solo individuals get their own unique key.
    const getParentKey = (p: Person) => {
      const parents = (p.parents ?? []).slice().sort();
      return parents.length ? parents.join("|") : `solo:${p.id}`;
    };

    const unitsByKey: Record<string, Person[]> = {};
    const personUnitKey: Record<string, string> = {};

    // Initial grouping into units by shared parent sets (siblings together, solo individuals separate)
    for (const p of sortedPeople) {
      const key = getParentKey(p);
      unitsByKey[key] = unitsByKey[key] ?? [];
      unitsByKey[key].push(p);
      personUnitKey[p.id] = key;
    }

    // Merge solo spouses into the units of their partners to keep couples together.
    // This ensures couples always appear adjacent in the final layout.
    const soloKeys = Object.keys(unitsByKey).filter(k => k.startsWith("solo:"));
    for (const soloKey of soloKeys) {
      const soloMembers = unitsByKey[soloKey] ?? [];
      for (const solo of soloMembers) {
        // Find which unit contains this solo person's spouse
        for (const spouse of solo.spouses ?? []) {
          const spouseUnitKey = personUnitKey[spouse];
          if (spouseUnitKey && spouseUnitKey !== soloKey) {

            // Merge solo into spouse's unit
            unitsByKey[spouseUnitKey]!.push(solo);
            personUnitKey[solo.id] = spouseUnitKey;

            // Remove from solo unit
            const idx = unitsByKey[soloKey]!.indexOf(solo);
            if (idx > -1) unitsByKey[soloKey]!.splice(idx, 1);
            break;
          }
        }
      }
    }

    // Remove empty units
    for (const k of soloKeys) {
      if ((unitsByKey[k] ?? []).length === 0) delete unitsByKey[k];
    }

    // Build adjacency between units (through marriages)
    const unitAdj: Record<string, Set<string>> = {};
    for (const k of Object.keys(unitsByKey)) unitAdj[k] = new Set<string>();
    for (const p of peopleInLevel) {
      const myKey = personUnitKey[p.id];
      for (const sid of p.spouses ?? []) {
        if (!idToPerson.has(sid)) continue;
        const otherKey = personUnitKey[sid];
        if (otherKey && otherKey !== myKey) {
          unitAdj[myKey].add(otherKey);
          unitAdj[otherKey].add(myKey);
        }
      }
    }

    // Find connected blocks of units to keep related units together
    const unitVisited = new Set<string>();
    const unitBlocks: string[][] = [];
    const allUnitKeys = Object.keys(unitsByKey).sort();

    for (const k of allUnitKeys) {
      if (unitVisited.has(k)) continue;

      const q = [k];
      unitVisited.add(k);
      const block: string[] = [];

      while (q.length) {
        const cur = q.shift()!;
        block.push(cur);

        for (const nb of unitAdj[cur] ?? []) {
          if (!unitVisited.has(nb)) {
            unitVisited.add(nb);
            q.push(nb);
          }
        }
      }

      unitBlocks.push(block);
    }

    // Compute parent-based X anchors for each unit: the average X of all parents with assigned positions.
    // Units with left-leaning parents will be placed more to the left, and vice versa.
    const unitAnchor: Record<string, number | undefined> = {};
    for (const block of unitBlocks) {
      for (const k of block) {
        const members = unitsByKey[k] ?? [];
        const parentXs: number[] = [];
        for (const m of members) {
          for (const pid of m.parents ?? []) {
            const ppos = posMap[pid];
            if (ppos) parentXs.push(ppos.x + NODE_W / 2);
          }
        }
        if (parentXs.length > 0) {
          unitAnchor[k] = parentXs.reduce((a, b) => a + b) / parentXs.length;
        }
      }
    }

    // Sort blocks left to right using anchor positions
    const blocksByMinAnchor = unitBlocks.map(block => {
      const anchors = block.map(k => unitAnchor[k]).filter(x => x !== undefined) as number[];
      const minAnchor = anchors.length > 0 ? Math.min(...anchors) : Infinity;
      return { block, minAnchor };
    }).sort((a, b) => a.minAnchor - b.minAnchor);

    const orderedUnitKeys: string[] = [];

    for (const { block } of blocksByMinAnchor) {

      // Split into anchored (has parent X) and anchorless units
      const anchored = block.filter(k => unitAnchor[k] !== undefined)
        .sort((a, b) => unitAnchor[a]! - unitAnchor[b]!);
      const anchorless = block.filter(k => unitAnchor[k] === undefined);

      // If all units have anchors, use that order directly
      if (anchorless.length === 0) {
        orderedUnitKeys.push(...anchored);
        continue;
      }

      if (anchored.length === 0) {
        // No parent anchors: use greedy leaf-based fallback
        const degMap = Object.fromEntries(block.map(k => [k, unitAdj[k]?.size ?? 0]));
        const leaves = block.filter(k => degMap[k] <= 1).sort();
        const start = (leaves.length > 0 ? leaves : [...block].sort())[0];
        const used = new Set<string>([start]);
        const order = [start];
        while (used.size < block.length) {
          const last = order[order.length - 1];
          const next = Array.from(unitAdj[last] ?? []).find(n => block.includes(n) && !used.has(n)) ??
                       block.find(k => !used.has(k))!;
          order.push(next);
          used.add(next);
        }
        orderedUnitKeys.push(...order);
        continue;
      }

      // Mixed: start with anchored in sorted order, then insert anchorless near neighbors
      const ordered: string[] = [...anchored];
      const remaining: string[] = [];

      for (const k of anchorless) {
        const neighAnchored = Array.from(unitAdj[k] ?? []).filter(n => anchored.includes(n));

        if (neighAnchored.length > 0) {
          // Insert near neighbor anchored units
          const meanAnchor = neighAnchored.map(n => unitAnchor[n]!).reduce((a, b) => a + b) / neighAnchored.length;

          let idx = ordered.findIndex(x => unitAnchor[x] !== undefined && unitAnchor[x]! > meanAnchor);
          if (idx === -1) idx = ordered.length;

          ordered.splice(idx, 0, k);
        } else {
          remaining.push(k);
        }
      }

      // Place fully isolated units at extremes
      remaining.sort((a, b) => (unitsByKey[a]?.length ?? 0) - (unitsByKey[b]?.length ?? 0));

      const leftExtras: string[] = [];
      const rightExtras: string[] = [];

      for (let i = 0; i < remaining.length; i++) {
        if (i % 2 === 0) leftExtras.unshift(remaining[i]);
        else rightExtras.push(remaining[i]);
      }

      orderedUnitKeys.push(...leftExtras, ...ordered, ...rightExtras);
    }

    // Order members within each unit: spouses together, sorted by ID.
    // Also compute layout keys for stable ordering across renders
    const units: Person[][] = [];
    for (let ui = 0; ui < orderedUnitKeys.length; ui++) {
      const key = orderedUnitKeys[ui];
      const leftKey = orderedUnitKeys[ui - 1];
      const rightKey = orderedUnitKeys[ui + 1];

      const members = [...unitsByKey[key]].sort((a, b) => a.id.localeCompare(b.id));

      const leftArr: Person[] = [];
      const rightArr: Person[] = [];
      const middleArr: Person[] = [];
      const otherArr: Person[] = [];

      for (const m of members) {
        const spouses = new Set(m.spouses ?? []);

        const hasLeft = leftKey && [...spouses].some(sid => personUnitKey[sid] === leftKey);
        const hasRight = rightKey && [...spouses].some(sid => personUnitKey[sid] === rightKey);
        const hasOther = [...spouses].some(sid => {
          const k = personUnitKey[sid];
          return !!k && k !== key && k !== leftKey && k !== rightKey;
        });

        if (hasLeft && !hasRight) leftArr.push(m);
        else if (hasRight && !hasLeft) rightArr.push(m);
        else if (hasLeft && hasRight) middleArr.push(m);
        else if (hasOther) otherArr.push(m);
        else middleArr.push(m);
      }

      leftArr.sort((a, b) => a.id.localeCompare(b.id));
      middleArr.sort((a, b) => a.id.localeCompare(b.id));
      rightArr.sort((a, b) => a.id.localeCompare(b.id));
      otherArr.sort((a, b) => a.id.localeCompare(b.id));

      units.push([...leftArr, ...middleArr, ...rightArr, ...otherArr]);
    }

    // Compute total row width
    const totalWidth = units.reduce((sum, unit, i) => {
      const unitW = unit.length * NODE_W + Math.max(0, unit.length - 1) * SPOUSE_GAP;
      return sum + unitW + (i > 0 ? UNIT_GAP : 0);
    }, 0);

    let curX = -totalWidth / 2;
    const y = rowIndex * (NODE_H + ROW_GAP);

    // Assign positions inside each unit (left-to-right), and record layout keys
    units.forEach((unit, unitIndex) => {
      unit.forEach((member, i) => {
        const x = curX + i * (NODE_W + SPOUSE_GAP);
        posMap[member.id] = { x, y };
        layoutKeys[member.id] = `${level}:${rowIndex}:${totalWidth}:${unitIndex}:${i}`;
      });

      const unitW = unit.length * NODE_W + Math.max(0, unit.length - 1) * SPOUSE_GAP;
      curX += unitW + UNIT_GAP;
    });

    // Build couple midpoint nodes for spouses in this level, keyed by sorted person ID pairs (e.g. "pid1--pid2")
    for (const p of peopleInLevel) {
      for (const spouseId of p.spouses ?? []) {
        if (!posMap[p.id] || !posMap[spouseId]) continue;
        const spousePerson = people.find(x => x.id === spouseId);
        if (!spousePerson || !(spousePerson.spouses ?? []).includes(p.id)) continue;

        const coupleKey = [p.id, spouseId].sort().join("--");
        if (couplesByKey[coupleKey]) continue;
        const midX = (posMap[p.id].x + posMap[spouseId].x) / 2 + NODE_W / 2;
        const midY = (posMap[p.id].y + posMap[spouseId].y) / 2 + NODE_H / 2;
        couplesByKey[coupleKey] = {
          coupleId: `couple-${coupleKey}`,
          p1Id: p.id,
          p2Id: spouseId,
          midX,
          midY,
        };
      }
    }
    
  });

  // Pass 2: Build Nodes and Marriage Edges
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  for (const [personId, pos] of Object.entries(posMap)) {
    const person = people.find(p => p.id === personId);
    if (!person) continue;
    nodes.push({
      id: personId,
      type: "personNode",
      position: pos,
      data: {
        person,
        isActive: personId === activePerson.id,
        onSelect: () => onSelect(person),
        onAdd:    () => onAddRelative(person),
      },
    });
  }

  // Couple nodes + primary dashed marriage lines
  const drawnMarriages = new Set<string>();

  for (const { coupleId, p1Id, p2Id, midX, midY } of Object.values(couplesByKey)) {
    nodes.push({
      id: coupleId,
      type: "coupleNode",
      position: { x: midX - 0.5, y: midY - 0.5 },
      data: {},
    });

    const key = [p1Id, p2Id].sort().join("--");
    drawnMarriages.add(key);

    edges.push({
      id:           `marriage-${coupleId}`,
      source:       p1Id,
      target:       p2Id,
      sourceHandle: "right",
      targetHandle: "left",
      type:         "straight",
      style: {
        stroke: "white", strokeWidth: 2,
        strokeOpacity: 0.7, strokeDasharray: "6,4",
      },
    });
  }

  // Extra marriage lines for spouses that aren't connected through a couple node 
  // (ex. multiple spouses in the same generation, or spouses in different generations where only one parent is visible).
  for (const [personId] of Object.entries(posMap)) {
    const person = people.find(p => p.id === personId);
    if (!person) continue;

    for (const spouseId of person.spouses ?? []) {
      if (!posMap[spouseId]) continue;

      const spousePerson = people.find(x => x.id === spouseId);
      // Only render extra marriage lines when the relationship is mutual
      if (!spousePerson || !(spousePerson.spouses ?? []).includes(personId)) continue;

      const key = [personId, spouseId].sort().join("--");
      if (drawnMarriages.has(key)) continue;

      drawnMarriages.add(key);

      edges.push({
        id:    `marriage-extra-${key}`,
        source: key.split("--")[0],
        target: key.split("--")[1],
        type:  "straight",
        style: {
          stroke: "white", strokeWidth: 2,
          strokeOpacity: 0.7, strokeDasharray: "6,4",
        },
      });
    }
  }

  // Pass 3: Parent to Child Edges
  const childToVisibleParents: Record<string, string[]> = {};

  for (const [childId] of Object.entries(posMap)) {
    const child = people.find(p => p.id === childId);
    const visibleParents = (child?.parents ?? []).filter(pid => posMap[pid]);

    if (visibleParents.length > 0) {
      childToVisibleParents[childId] = visibleParents;
    }
  }

  const drawnChildEdges = new Set<string>();

  for (const [childId, parentIds] of Object.entries(childToVisibleParents)) {
    if (drawnChildEdges.has(childId)) continue;
    drawnChildEdges.add(childId);

    // Find the best source for this child's edge.
    let bestSource: string | null = null;

    // Prefer couple node if both parents exist and are married (i.e. have a couple node)
    if (parentIds.length === 2) {
      const coupleKey = parentIds.sort().join("--");
      const couple = couplesByKey[coupleKey];
      if (couple) {
        bestSource = couple.coupleId;
      }
    }

    // If no couple node found, use the first visible parent
    if (!bestSource && parentIds.length > 0) {
      bestSource = parentIds[0];
    }

    if (bestSource) {
      const id = `pc-${bestSource}→${childId}`;
      edges.push({
        id,
        source: bestSource,
        sourceHandle: "bottom",
        target: childId,
        targetHandle: "top",
        type: "smoothstep",
        style: { stroke: "white", strokeWidth: 2, strokeOpacity: 0.7 },
      });
    }
  }

  return { nodes, edges, posMap, layoutKeys };
}

// Inner Flow Component (Requires ReactFlowProvider Context)
function Inner({ nodes: inNodes, edges: inEdges, onNodeClick, focusNodeId, focusZoom, onRequestFit }: { 
  nodes: Node[]; 
  edges: Edge[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onNodeClick: (event: any, node: Node) => void;
  focusNodeId?: string | null;
  focusZoom?: number;
  onRequestFit?: () => void;
}) {
  // ReactFlow-managed state for nodes and edges, initialized from props and updated on layout changes
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(inNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(inEdges);

  // View control helpers
  const { fitView, setCenter, setViewport } = useReactFlow();

  // Ref to the container div for computing view transforms
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync whenever the computed layout changes
  useEffect(() => {
    setRfNodes(inNodes);
    setRfEdges(inEdges);
  }, [inNodes, inEdges, setRfNodes, setRfEdges]);

  // Handle camera behavior (focus node OR fit view) whenever the layout or focus node changes
  useEffect(() => {
    const t = setTimeout(() => {
      if (focusNodeId) {
        // Find node to focus
        const node = inNodes.find(n => n.id === focusNodeId);
        if (node) {

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const centerX = (node.position as any).x + NODE_W / 2;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const centerY = (node.position as any).y + NODE_H / 2;

          // Default zoom if not provided by props
          const zoom = typeof focusZoom === "number" ? focusZoom : 1.15;

          // If setViewport is available, use setViewport for smooth zooming and panning to the target node (newer API, more control)
          if (setViewport && containerRef.current) {
            const w = containerRef.current.clientWidth || window.innerWidth;
            const h = containerRef.current.clientHeight || window.innerHeight;

            // Translate so node center is at the center of the view, then apply zoom
            const tx = w / 2 - zoom * centerX;
            const ty = h / 2 - zoom * centerY;

            try {
              // @ts-expect - runtime types may vary
              setViewport({ x: tx, y: ty, zoom }, { duration: 300 });
            } catch (e) {
              // ignore and fallback
            }
            return;
          }

          // Fallback: try setCenter (older API, may not support zoom or smooth behavior)
          if (setCenter) {
            try {
              // @ts-expect-error - runtime types may vary
              setCenter(centerX, centerY, zoom, { duration: 300 });
            } catch (e) {
              try {
                // @ts-expect-error - runtime types may vary
                setCenter(centerX, centerY, zoom);
              } catch (e) {
                // ignore
              }
            }
            return;
          }
        }
      }

      // Default to fitting the view to the whole graph if no focus node or if centering fails
      fitView({ padding: 0.25, duration: 300 });
    }, 60); // Delay to process the new nodes and edges before trying to center/fit

    return () => clearTimeout(t);
  }, [inNodes, fitView, focusNodeId, focusZoom, setCenter]);

  return (
    <div className="w-full h-full relative" ref={containerRef}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        {/* Basic zoom/pan controls */}
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* Reset camera button */}
      <div style={{ position: "absolute", top: 8, right: 8, zIndex: 40 }}>
        <button
          onClick={() => {
            try {
              fitView({ padding: 0.25, duration: 300 }); // Reset to fit view on button click
            } catch (e) {
              // ignore
            }
            if (onRequestFit) onRequestFit(); // Clear focus node externally if needed
          }}
          className="px-2 py-1 rounded bg-gray-800 text-white text-sm shadow"
        >
          Reset View
        </button>
      </div>
    </div>
  );
}

// Public Component
interface VisualGraphProps {
  people: Person[];
  activePerson: Person;
  onSelect: (p: Person) => void;
  onAddRelative: (p: Person) => void;
}

export default function VisualGraph({
  people,
  activePerson,
  onSelect,
  onAddRelative,
}: VisualGraphProps) {
  // Stable memoized callbacks that update only when props change
  const stableSelect = useCallback((p: Person) => onSelect(p), [onSelect]);
  const stableAdd    = useCallback((p: Person) => onAddRelative(p), [onAddRelative]);

  // Build the graph data (nodes, edges, positions) from the people data and active person (memoized)
  const graph = useMemo(
    () => buildGraph(people, activePerson, stableSelect, stableAdd),
    [people, activePerson, stableSelect, stableAdd]
  );

  // Cache previous layout keys and positions to minimize node movement
  const prevLayoutKeysRef = useRef<Record<string, string>>({});
  const prevPosRef = useRef<Record<string, { x: number; y: number }>>({});

  // State for nodes and edges to be passed to ReactFlow, initialized from computed graph and updated on layout changes
  const [displayNodes, setDisplayNodes] = useState<Node[]>(() => graph.nodes);
  const [displayEdges, setDisplayEdges] = useState<Edge[]>(() => graph.edges);

  // Node to focus on after layout changes
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  // Compute stable node positions in an effect so we can safely read/update refs
  useEffect(() => {
    const finalPosMap: Record<string, { x: number; y: number }> = {};

    const newNodes = graph.nodes.map(n => {
      const key = graph.layoutKeys?.[n.id];

      // If the node existed in the previous layout and has the same layout key, keep its previous position to minimize movement
      if (key && prevLayoutKeysRef.current[n.id] === key && prevPosRef.current[n.id]) {
        const pos = prevPosRef.current[n.id];
        finalPosMap[n.id] = pos;
        return { ...n, position: pos };
      }

      // Else, use the new computed position from the graph layout
      finalPosMap[n.id] = n.position;
      return n;
    });
    
    // Update refs with the new layout keys and positions for the next render
    prevLayoutKeysRef.current = { ...(graph.layoutKeys || {}) };
    prevPosRef.current = finalPosMap;

    // Push to ReactFlow state
    setDisplayNodes(newNodes);
    setDisplayEdges(graph.edges);
  }, [graph]);


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeClick = useCallback((event: any, node: Node) => {
    // Remember the clicked node so Inner can center+zoom on it after layout
    setFocusNodeId(node.id);
    if (node.data?.onSelect) {
      node.data.onSelect();
    }
  }, [setFocusNodeId]);

  return (
    <ReactFlowProvider>
      <div className="w-full h-full">
        <Inner
          nodes={displayNodes}
          edges={displayEdges}
          onNodeClick={handleNodeClick}
          focusNodeId={focusNodeId}
          focusZoom={1.15}
          onRequestFit={() => setFocusNodeId(null)} // Clear focus on reset view
        />
      </div>
    </ReactFlowProvider>
  );
}