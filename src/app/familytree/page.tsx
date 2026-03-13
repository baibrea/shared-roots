"use client";

import Link from "next/link";
import { useState } from "react";
import AddPersonForm from "@/lib/AddPersonForm";
import { usePeople } from "@/lib/PeopleContext";
import { Person } from "@/types/person";
import VisualGraph from "@/components/VisualGraph";
import SearchBar from "@/components/SearchBar";

export default function FamilyTreePage() {
  const { people } = usePeople();
  const [showForm, setShowForm] = useState(false);
  const [referencePerson, setReferencePerson] = useState<Person | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  console.log("People loaded: ", people);

  const activePerson = selectedPerson || people[0] || null;

  const filteredPeople = people.filter((p) => {
    const fullName = (p.firstName + " " + p.lastName).toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const handleAddRelative = (p: Person) => {
    setReferencePerson(p);
    setShowForm(true);
  }

  function getPersonName(id: string | undefined) {
    if (!id) return "Unknown";

    const person = people.find((p) => p.id === id);

    if (!person) return "Unknown";

    return person.firstName + " " + person.lastName;
  }

  function getPeopleNames(ids: string[] | undefined) {
    if (!ids || ids.length === 0) return "Unknown";

    const names = ids.map((id) => {
      const person = people.find((p) => p.id === id);
      return person ? person.firstName + " " + person.lastName : "Unknown";
    });
    return names.join(", ");
  }

  return (
    <div className="flex h-screen">
      <div className="w-3/4 p-10 overflow-y-auto border-r border-gray-200 flex flex-col">
        <h1 className="text-2xl font-bold mb-6">Family Tree</h1>

        {people.length === 0 && <p>No people added yet.</p>}

        {/* <ul className="space-y-4">
          {people.map((p) => (
            <li 
              key={p.id} 
              onClick={() => setSelectedPerson(p)}
              className="p-4 bg-white rounded-xl shadow text-[#3A433A] cursor-pointer">
              <strong>
                {p.firstName} {p.lastName}
              </strong>
              <p>Person ID: {p.id}</p>
              <p>Birth Date: {p.birthDate || "Unknown"}</p>
              <p>Birth Location: {p.birthLocation || "Unknown"}</p>
              <p>Title: {p.title || "Unknown"}</p>
              <p>Bio: {p.bio || "Unknown"}</p>
              <p>Health Details: {p.healthDetails || "Unknown"}</p>
              <p>Parents: {getPeopleNames(p.parents)}</p>
              <p>Children: {getPeopleNames(p.children)}</p>
              <p>Spouse: {getPersonName(p.spouse)}</p>

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
        </ul> */}

        <VisualGraph people={people} activePerson={activePerson} onSelect={setSelectedPerson} onAddRelative={handleAddRelative} />

        {showForm && referencePerson && (
          <AddPersonForm 
            onClose={() => setShowForm(false)} 
            referencePerson={referencePerson} 
            onPersonAdded={(newId) => {
              setSearchTerm(""); // Clear search to show the new person in the list
              const newPerson = people.find(p => p.id === newId);
              if (newPerson) {
                setSelectedPerson(newPerson);
              }
            }}
          />
        )}

      </div>
      <div className="w-1/4 p-10">
        {/* UI when no family member is selected */}
        {!selectedPerson && (
          // <div>
          // <strong>
          //   <p>family members!</p>
          // </strong>

          // <ul>
          //   {people.map((p) => (
          //     <li 
          //     key={p.id} 
          //     onClick={() => setSelectedPerson(p)}
          //     className="cursor-pointer"
          //     >
          //       {p.firstName} {p.lastName}
          //     </li>
          //   ))}
          // </ul>
          // </div>
          <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold mb-4">Directory</h2>
            
            {/* New Component Integrated Here */}
            <SearchBar 
              value={searchTerm} 
              onChange={setSearchTerm} 
            />

            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
              {searchTerm ? "Search Results" : "All Members"}
            </p>

            <ul className="space-y-2 overflow-y-auto">
              {filteredPeople.map((p) => (
                <li 
                  key={p.id} 
                  onClick={() => setSelectedPerson(p)}
                  className="p-3 rounded-xl border border-transparent hover:border-gray-100 hover:bg-gray-50 cursor-pointer transition-all"
                >
                  <div className="font-medium">{p.firstName} {p.lastName}</div>
                  <div className="text-xs text-gray-400">{p.birthDate?.split('-')[0] || "---"}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* UI when a family member is selected */}
        {selectedPerson && (
          <div>
            <button
              onClick={() => setSelectedPerson(null)}
            >
              Back
            </button>

            <h2>
              {selectedPerson.firstName} {selectedPerson.lastName}
            </h2>

            <p>Birth Date: {selectedPerson.birthDate || "Unknown"}</p>
            <p>Birth Location: {selectedPerson.birthLocation || "Unknown"}</p>
            <p>Title: {selectedPerson.title || "Unknown"}</p>
            <p>Bio: {selectedPerson.bio || "Unknown"}</p>
            <p>Health Details: {selectedPerson.healthDetails || "Unknown"}</p>

            <p>Parents: {getPeopleNames(selectedPerson.parents)}</p>
            <p>Children: {getPeopleNames(selectedPerson.children)}</p>
            <p>Spouse: {getPersonName(selectedPerson.spouse)}</p>
          </div>
        )}

      </div>

    </div>
  );
}