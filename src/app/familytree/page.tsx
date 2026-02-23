"use client";

import { usePeople } from "@/lib/PeopleContext";

export default function FamilyTreePage() {
  const { people } = usePeople();

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">Family Tree (Only the data)</h1>

      {people.length === 0 && <p>No people added yet.</p>}

      <ul className="space-y-4">
        {people.map((p) => (
          <li key={p.id} className="p-4 bg-white rounded-xl shadow text-black">
            <strong>
              {p.firstName} {p.lastName}
            </strong>
            <p>Person ID: {p.id}</p>
            <p>Birth Date: {p.birthDate || "Unknown"}</p>
            <p>Birth Location: {p.birthLocation || "Unknown"}</p>
            <p>Title: {p.title || "Unknown"}</p>
            <p>Bio: {p.bio || "Unknown"}</p>
            <p>Health Details: {p.healthDetails || "Unknown"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}