"use client";

import { Person } from "@/types/person";

export default function FamilyTreeCanvas({
  people,
}: {
  people: Person[];
}) {

  const nodePositions: Record<string, { x: number; y: number }> = {};

  people.forEach((p, i) => {
    nodePositions[p.id] = {
      x: 100 + i * 200,
      y: 100,
    };
  });

  return (
    <div className="relative w-full h-full bg-[#f5f5f5] rounded-xl">

      <svg className="absolute inset-0 pointer-events-none">
        {people.map((p) =>
          p.children?.map((childId) => {
            const parent = nodePositions[p.id];
            const child = nodePositions[childId];

            if (!parent || !child) return null;

            return (
              <line
                key={p.id + childId}
                x1={parent.x + 80}
                y1={parent.y + 40}
                x2={child.x + 80}
                y2={child.y}
                stroke="black"
              />
            );
          })
        )}
      </svg>

      {people.map((p, index) => {
        const pos = nodePositions[p.id];

        return (
          <div
            key={p.id}
            className="absolute bg-white shadow rounded-xl p-3 w-40 text-center"
            style={{
              left: pos.x,
              top: pos.y,
            }}
          >
            <strong>
              {p.firstName} {p.lastName}
            </strong>

            <p className="text-xs">
              {p.birthDate || "Unknown"}
            </p>
          </div>
        );
      })}
    </div>
  );
}