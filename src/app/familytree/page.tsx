"use client";

import Link from "next/link";
import { useState } from "react";
import AddPersonForm from "@/lib/AddPersonForm";
import { usePeople } from "@/lib/PeopleContext";
import FamilyTreeChart from "@/components/FamilyTreeChart";

export default function FamilyTreePage() {
  const { people } = usePeople();
  const [showForm, setShowForm] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<{ id: string; name: string } | null>(null);
  console.log("People loaded: ", people);

  const handleNodeClick = (person: {id: string, name: string }) => {
    setSelectedPerson(person);
    setShowForm(true);
  };

  return (
    <div className="p-10 ">
      <h1 className="text-2xl font-bold mb-6">Family Tree</h1>

      {people.length === 0 && <p>No people added yet.</p>}

      {people.length > 0 && (
        <FamilyTreeChart people={people} />
      )}

      {/* <ul className="space-y-4">
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
          </li>
        ))}
      </ul> */}

      <button
        onClick={() => setShowForm(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-black px-5 mt-5 hover:bg-[#383838] md:w-[200px]"
      >
        Add Family Member
      </button>

      {showForm && <AddPersonForm onClose={() => setShowForm(false)} />}

    </div>
  );
}