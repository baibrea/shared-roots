// "use client";

// import { Person } from "@/types/person";
// import { Plus, User } from "lucide-react";

// interface VisualGraphProps {
//   people: Person[];
//   activePerson: Person;
//   onSelect: (p: Person) => void;
//   onAddRelative: (p: Person) => void;
// }

// export default function VisualGraph({ people, activePerson, onSelect, onAddRelative }: VisualGraphProps) {
//   // Helper to find people by ID
//   const findPeople = (ids: string[] | undefined) => 
//     people.filter(p => ids?.includes(p.id));

//   const parents = findPeople(activePerson.parents);
//   const children = findPeople(activePerson.children);
//   const spouse = people.find(p => p.id === activePerson.spouse);

//   return (
//     <div className="flex flex-col items-center gap-12 w-full py-10">
      
//       {/* 1. PARENTS ROW */}
//       <div className="flex gap-6 items-end min-h-[120px]">
//         {parents.map(p => (
//           <NodeCard key={p.id} person={p} variant="small" onClick={() => onSelect(p)} />
//         ))}
//         {parents.length < 2 && (
//           <AddNodeButton onClick={() => onAddRelative(activePerson)} label="Add Parent" />
//         )}
//       </div>

//       {/* 2. CENTER ROW (Active Person + Spouse) */}
//       <div className="flex items-center gap-16 relative">
//         <NodeCard 
//           person={activePerson} 
//           variant="large" 
//           isActive 
//           onClick={() => {}} 
//         />
        
//         {/* Connection Line between spouses */}
//         <div className="absolute left-1/2 w-16 h-[2px] bg-gray-300 -z-10" />

//         {spouse ? (
//           <NodeCard person={spouse} variant="large" onClick={() => onSelect(spouse)} />
//         ) : (
//           <AddNodeButton onClick={() => onAddRelative(activePerson)} label="Add Spouse" />
//         )}
//       </div>

//       {/* 3. CHILDREN ROW */}
//       <div className="flex flex-wrap justify-center gap-6 min-h-[120px]">
//         {children.map(p => (
//           <NodeCard key={p.id} person={p} variant="small" onClick={() => onSelect(p)} />
//         ))}
//         <AddNodeButton onClick={() => onAddRelative(activePerson)} label="Add Child" />
//       </div>
//     </div>
//   );
// }

// // --- Internal UI Components ---

// function NodeCard({ person, variant, isActive, onClick }: { person: Person, variant: 'small' | 'large', isActive?: boolean, onClick: () => void }) {
//   const size = variant === 'large' ? 'w-48 h-56' : 'w-36 h-40';
//   return (
//     <div 
//       onClick={onClick}
//       className={`${size} bg-white rounded-2xl shadow-sm border-2 transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center
//         ${isActive ? "border-[#698b6a] scale-105 ring-4 ring-[#698b6a]/10" : "border-transparent hover:border-gray-300"}`}
//     >
//       <div className={`rounded-full bg-gray-100 flex items-center justify-center mb-3 ${variant === 'large' ? 'w-16 h-16' : 'w-12 h-12'}`}>
//         <User className={isActive ? "text-[#698b6a]" : "text-gray-400"} />
//       </div>
//       <span className="font-bold text-[#3A433A] leading-tight">
//         {person.firstName} <br/> {person.lastName}
//       </span>
//       <span className="text-xs text-gray-400 mt-1">{person.birthDate?.split('-')[0] || 'Unknown'}</span>
//     </div>
//   );
// }

// function AddNodeButton({ onClick, label }: { onClick: () => void, label: string }) {
//   return (
//     <button 
//       onClick={onClick}
//       className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-300 transition-all"
//     >
//       <Plus size={20} />
//       <span className="text-[10px] mt-2 uppercase tracking-wider font-semibold">{label}</span>
//     </button>
//   );
// }

"use client";

import { Person } from "@/types/person";
import { Plus, User } from "lucide-react";

interface VisualGraphProps {
  people: Person[];
  activePerson: Person;
  onSelect: (p: Person) => void;
  onAddRelative: (p: Person) => void;
}

export default function VisualGraph({ people, activePerson, onSelect, onAddRelative }: VisualGraphProps) {
  const findPeople = (ids: string[] | undefined) => 
    people.filter(p => ids?.includes(p.id));

  const parents = findPeople(activePerson?.parents);
  const children = findPeople(activePerson?.children);
  const spouse = people.find(p => p.id === activePerson?.spouse);

  return (
    <div className="flex flex-col items-center gap-16 w-full py-10">
      
      {/* 1. PARENTS ROW */}
      <div className="flex gap-10 items-end min-h-[140px]">
        {parents.map(p => (
          <NodeCard key={p.id} person={p} variant="small" onClick={() => onSelect(p)} onAdd={() => onAddRelative(p)} />
        ))}
      </div>

      {/* 2. CENTER ROW (Active Person + Spouse) */}
      <div className="flex items-center gap-20 relative">
        <NodeCard 
          person={activePerson} 
          variant="large" 
          isActive 
          onClick={() => onSelect(activePerson)} 
          onAdd={() => onAddRelative(activePerson)}
        />
        
        {spouse && (
          <NodeCard 
            person={spouse} 
            variant="large" 
            onClick={() => onSelect(spouse)} 
            onAdd={() => onAddRelative(spouse)} 
          />
        )}
      </div>

      {/* 3. CHILDREN ROW */}
      <div className="flex flex-wrap justify-center gap-10 min-h-[140px]">
        {children.map(p => (
          <NodeCard key={p.id} person={p} variant="small" onClick={() => onSelect(p)} onAdd={() => onAddRelative(p)} />
        ))}
      </div>
    </div>
  );
}

function NodeCard({ 
  person, 
  variant, 
  isActive, 
  onClick, 
  onAdd 
}: { 
  person: Person, 
  variant: 'small' | 'large', 
  isActive?: boolean, 
  onClick: () => void,
  onAdd: () => void 
}) {
  const size = variant === 'large' ? 'w-48 h-52' : 'w-36 h-40';
  
  return (
    <div className="relative group">
      {/* The Actual Card */}
      <div 
        onClick={onClick}
        className={`${size} bg-white rounded-2xl shadow-sm border-2 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-4 text-center
          ${isActive ? "border-[#698b6a] scale-105 shadow-md" : "border-transparent hover:border-gray-200 hover:shadow-md"}`}
      >
        <div className={`rounded-full bg-gray-50 flex items-center justify-center mb-3 transition-colors group-hover:bg-gray-100 ${variant === 'large' ? 'w-16 h-16' : 'w-12 h-12'}`}>
          <User className={isActive ? "text-[#698b6a]" : "text-gray-400"} />
        </div>
        <span className="font-bold text-[#3A433A] leading-tight text-sm md:text-base">
          {person?.firstName} <br/> {person?.lastName}
        </span>
      </div>

      {/* The Floating Hover Button */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevents the card's onClick from firing
          onAdd();
        }}
        className="absolute -top-3 -right-3 w-8 h-8 bg-[#383838] text-white rounded-full flex items-center justify-center shadow-lg 
                   opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:bg-black hover:scale-110 z-20"
        title="Add relative"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}