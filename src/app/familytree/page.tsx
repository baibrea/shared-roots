"use client";

import Link from "next/link";
import { useState } from "react";
import AddPersonForm from "@/lib/AddPersonForm";
import { usePeople } from "@/lib/PeopleContext";
import { Person } from "@/types/person";

export default function FamilyTreePage() {
  const { people } = usePeople();
  const [showForm, setShowForm] = useState(false);
  const [referencePerson, setReferencePerson] = useState<Person | null>(null);
  console.log("People loaded: ", people);

  return (
    <div className="p-10 ">
      <h1 className="text-2xl font-bold mb-6">Family Tree</h1>

      {people.length === 0 && <p>No people added yet.</p>}

      <ul className="space-y-4">
        {people.map((p) => (
          <li key={p.id} className="p-4 bg-white rounded-xl shadow text-[#3A433A]">
            <strong>
              {p.firstName} {p.lastName}
            </strong>
            <p>Person ID: {p.id}</p>
            <p>Birth Date: {p.birthDate || "Unknown"}</p>
            <p>Birth Location: {p.birthLocation || "Unknown"}</p>
            <p>Title: {p.title || "Unknown"}</p>
            <p>Bio: {p.bio || "Unknown"}</p>
            <p>Health Details: {p.healthDetails || "Unknown"}</p>
            <p>Parents: {p.parents?.length ? p.parents.join(", ") : "Unknown"}</p>
            <p>Children: {p.children?.length ? p.children.join(", ") : "Unknown"}</p>
            <p>Spouse: {p.spouse ?? "Unknown"}</p>

            <button
              onClick={() => {
                setReferencePerson(p);
                setShowForm(true);
              }}
              className="mt-2 px-3 py-1 bg-[#383838] text-white rounded-full hover:bg-[#282828]"
            >
              +
            </button>
          </li>
        ))}
      </ul>

      {showForm && referencePerson && (
        <AddPersonForm 
          onClose={() => setShowForm(false)} 
          referencePerson={referencePerson} 
        />
      )}

    </div>
  );
}