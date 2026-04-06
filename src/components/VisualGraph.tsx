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

// ─── Layout constants ──────────────────────────────────────────────────────────
const NODE_W     = 130;   // person card width  (px)
const NODE_H     = 130;   // person card height (px)
const SPOUSE_GAP = 60;    // gap between two spouses in a pair
const UNIT_GAP   = 50;    // gap between independent units in a row
const ROW_GAP    = 160;   // vertical gap between generations

const hiddenHandle: React.CSSProperties = {
  opacity: 0,
  background: "transparent",
  border: "none",
  width: 1,
  height: 1,
};

// ─── Custom node: visible person card ─────────────────────────────────────────
function PersonNode({ data }: NodeProps) {
  const { person, isActive, onSelect, onAdd } = data as {
    person: Person;
    isActive: boolean;
    onSelect: () => void;
    onAdd: () => void;
  };

  return (
    <div className="relative group" style={{ width: NODE_W, height: NODE_H }}>
      {/* Structural handles — invisible, used only for edge routing */}
      <Handle type="target" position={Position.Top}    id="top"    style={hiddenHandle} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={hiddenHandle} />
      <Handle type="source" position={Position.Right}  id="right"  style={hiddenHandle} />
      <Handle type="target" position={Position.Left}   id="left"   style={hiddenHandle} />

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
        <div className="w-1/4 h-1/4 rounded-full bg-gray-50 flex items-center justify-center mb-1">
          <User className={`w-1/2 h-1/2 ${isActive ? "text-white" : "text-gray-400"}`} />
        </div>
        <span className={`font-bold leading-tight text-xs ${isActive ? "text-white" : "text-[#3A433A]"}`}>
          {person.firstName}<br />{person.lastName}
        </span>
      </div>

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

/**
 * Invisible 1×1 node placed at the exact midpoint between two spouses.
 * Child edges originate from its bottom handle, ensuring lines always
 * point to the correct couple — even when a person has multiple marriages.
 */
function CoupleNode() {
  return (
    <div style={{ width: 1, height: 1 }}>
      <Handle type="source" position={Position.Bottom} id="bottom" style={hiddenHandle} />
    </div>
  );
}

// Defined outside the component so React Flow never re-registers node types
const nodeTypes = { personNode: PersonNode, coupleNode: CoupleNode };

// ─── BFS: assign each visible person a generational level ─────────────────────
function getGenerationalLevels(
  activePerson: Person,
  allPeople: Person[],
  maxDepth = 5
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

// ─── Graph builder ─────────────────────────────────────────────────────────────
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

  const posMap:      Record<string, { x: number; y: number }> = {};
  const couplesByKey: Record<string, CoupleRecord>            = {};
  const layoutKeys: Record<string, string> = {};

  // ── Pass 1: compute positions for every visible person ──────────────────────
  levelKeys.forEach((level, rowIndex) => {
    const peopleInLevel = levels[level] ?? [];

    // Build adjacency for spouse links within this level and compute connected components.
    const idToPerson = new Map(peopleInLevel.map(p => [p.id, p]));
    const adj: Record<string, Set<string>> = {};
    peopleInLevel.forEach(p => (adj[p.id] = new Set<string>()));
    for (const p of peopleInLevel) {
      for (const sid of p.spouses ?? []) {
        if (!idToPerson.has(sid)) continue;
        adj[p.id].add(sid);
        adj[sid].add(p.id);
      }
    }

    // Discover connected components (clusters) of spouses; each cluster becomes a layout unit.
    const visited = new Set<string>();
    const units: Person[][] = [];
    const sortedPeople = [...peopleInLevel].sort((a, b) => a.id.localeCompare(b.id));
    for (const p of sortedPeople) {
      if (visited.has(p.id)) continue;
      const compIds: string[] = [];
      const q = [p.id];
      visited.add(p.id);
      while (q.length) {
        const id = q.shift()!;
        compIds.push(id);
        for (const nb of adj[id] ?? []) {
          if (!visited.has(nb)) {
            visited.add(nb);
            q.push(nb);
          }
        }
      }
      const compPersons = compIds.map(id => idToPerson.get(id)!).sort((a, b) => a.id.localeCompare(b.id));
      units.push(compPersons);
    }

    // Sort units deterministically
    units.sort((a, b) => a[0].id.localeCompare(b[0].id));

    // Compute total width where each unit can be larger than two people
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

    // Create couple records for every visible spouse-pair in this level (used for children routing)
    for (const p of peopleInLevel) {
      for (const spouseId of p.spouses ?? []) {
        if (!posMap[p.id] || !posMap[spouseId]) continue;
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

  // ── Pass 2: build nodes ──────────────────────────────────────────────────────
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
        strokeOpacity: 0.4, strokeDasharray: "6,4",
      },
    });
  }

  // Dashed lines for additional marriages (e.g. second spouse not grouped together)
  for (const [personId] of Object.entries(posMap)) {
    const person = people.find(p => p.id === personId);
    if (!person) continue;
    for (const spouseId of person.spouses ?? []) {
      if (!posMap[spouseId]) continue;
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
          strokeOpacity: 0.4, strokeDasharray: "6,4",
        },
      });
    }
  }

  // ── Pass 3: parent-child edges ───────────────────────────────────────────────
  const drawn = new Set<string>();

  for (const parentId of Object.keys(posMap)) {
    const parent = people.find(p => p.id === parentId);
    if (!parent) continue;

    for (const childId of parent.children ?? []) {
      if (!posMap[childId]) continue;

      const child      = people.find(p => p.id === childId);

      // Is there a co-parent who is also one of this parent's spouses AND is visible?
      const coParentId = (parent.spouses ?? []).find(
        sid => posMap[sid] && (child?.parents ?? []).includes(sid)
      );

      if (coParentId) {
        const coupleKey = [parentId, coParentId].sort().join("--");
        const couple    = couplesByKey[coupleKey];

        if (couple) {
          // Both parents are grouped as a couple → route from their shared couple node
          const id = `pc-${couple.coupleId}→${childId}`;
          if (drawn.has(id)) continue;
          drawn.add(id);
          edges.push({
            id,
            source: couple.coupleId, sourceHandle: "bottom",
            target: childId,         targetHandle: "top",
            type:  "smoothstep",
            style: { stroke: "white", strokeWidth: 2, strokeOpacity: 0.5 },
          });
        } else {
          // Co-parent is visible but they're not grouped (e.g. second marriage)
          // Fall through to single-parent edge below
          const id = `pc-${parentId}→${childId}`;
          if (drawn.has(id)) continue;
          drawn.add(id);
          edges.push({
            id,
            source: parentId, sourceHandle: "bottom",
            target: childId,  targetHandle: "top",
            type:  "smoothstep",
            style: { stroke: "white", strokeWidth: 2, strokeOpacity: 0.5 },
          });
        }
      } else {
        // No co-parent in view → single-parent line
        const id = `pc-${parentId}→${childId}`;
        if (drawn.has(id)) continue;
        drawn.add(id);
        edges.push({
          id,
          source: parentId, sourceHandle: "bottom",
          target: childId,  targetHandle: "top",
          type:  "smoothstep",
          style: { stroke: "white", strokeWidth: 2, strokeOpacity: 0.5 },
        });
      }
    }
  }

  return { nodes, edges, posMap, layoutKeys };
}

// ─── Inner flow component (requires ReactFlowProvider context) ─────────────────
function Inner({ nodes: inNodes, edges: inEdges, onNodeClick }: { 
  nodes: Node[]; 
  edges: Edge[]; 
  onNodeClick: (event: any, node: Node) => void;
}) {
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(inNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(inEdges);
  const { fitView } = useReactFlow();

  // Sync whenever the computed layout changes
  useEffect(() => {
    setRfNodes(inNodes);
    setRfEdges(inEdges);
  }, [inNodes, inEdges, setRfNodes, setRfEdges]);

  // Re-fit the view after each layout change
  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.25, duration: 300 }), 60);
    return () => clearTimeout(t);
  }, [inNodes, fitView]);

  return (
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
      <Background color="#3a4232" gap={20} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

// ─── Public component ──────────────────────────────────────────────────────────
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
  // Stable callbacks that update when props change
  const stableSelect = useCallback((p: Person) => onSelect(p), [onSelect]);
  const stableAdd    = useCallback((p: Person) => onAddRelative(p), [onAddRelative]);

  const graph = useMemo(
    () => buildGraph(people, activePerson, stableSelect, stableAdd),
    [people, activePerson, stableSelect, stableAdd]
  );

  // Cache previous layout keys and positions to minimize node movement
  const prevLayoutKeysRef = useRef<Record<string, string>>({});
  const prevPosRef = useRef<Record<string, { x: number; y: number }>>({});

  const [displayNodes, setDisplayNodes] = useState<Node[]>(() => graph.nodes);
  const [displayEdges, setDisplayEdges] = useState<Edge[]>(() => graph.edges);

  // Compute stable node positions in an effect so we can safely read/update refs
  useEffect(() => {
    const finalPosMap: Record<string, { x: number; y: number }> = {};

    const newNodes = graph.nodes.map(n => {
      const key = graph.layoutKeys?.[n.id];
      if (key && prevLayoutKeysRef.current[n.id] === key && prevPosRef.current[n.id]) {
        const pos = prevPosRef.current[n.id];
        finalPosMap[n.id] = pos;
        return { ...n, position: pos };
      }

      finalPosMap[n.id] = n.position;
      return n;
    });

    prevLayoutKeysRef.current = { ...(graph.layoutKeys || {}) };
    prevPosRef.current = finalPosMap;

    setDisplayNodes(newNodes);
    setDisplayEdges(graph.edges);
  }, [graph]);

  const handleNodeClick = useCallback((event: any, node: Node) => {
    if (node.data?.onSelect) {
      node.data.onSelect();
    }
  }, []);

  return (
    <ReactFlowProvider>
      <div className="w-full h-full">
        <Inner nodes={displayNodes} edges={displayEdges} onNodeClick={handleNodeClick} />
      </div>
    </ReactFlowProvider>
  );
}