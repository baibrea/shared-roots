"use client";

import { useState } from "react";
import AddPersonForm from "@/lib/AddPersonForm";
import { usePeople } from "@/lib/PeopleContext";
import { Person } from "@/types/person";
import VisualGraph from "@/components/VisualGraph";
import SearchBar from "@/components/SearchBar";
import UpdatePersonForm from "@/lib/UpdatePersonForm";

export default function FamilyTreePage() {
  const { people } = usePeople();
  const [showForm, setShowForm] = useState(false);
  const [referencePerson, setReferencePerson] = useState<Person | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPerson, setEditingPerson] =  useState<Person | null>(null);

  const selectedPerson = people.find(p => p.id === selectedPersonId) || null;
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

  function getAge(birthDate: string | undefined) {
    if (!birthDate) return "Unknown";

    const today = new Date();
    const birth = new Date(birthDate);

    let age = today.getFullYear() - birth.getFullYear();
    const monthDifference = today.getMonth() - birth.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  return (
    <div className="flex h-screen">
      <div className="w-3/4 p-10 overflow-y-auto bg-[#393939] border-r border-gray-200 flex flex-col">
        <h1 className="text-2xl font-bold mb-6 shrink-0">Family Tree</h1>

        {people.length === 0 && <p>No people added yet.</p>}

        
        {// If there is an active person, show the graph. Otherwise, show a message prompting to add family members.
        activePerson ? (
          <div className="flex-1 flex items-center justify-center">
            <VisualGraph people={people} activePerson={activePerson} onSelect={(p) => setSelectedPersonId(p.id)} onAddRelative={handleAddRelative} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Loading family members....If you don&apos;t see any, start by adding a family member!</p>
          </div>
        )}        

        {// Show the add person form if it's enabled and a reference person has been selected
        showForm && referencePerson && (
          <AddPersonForm 
            onClose={() => setShowForm(false)} 
            referencePerson={referencePerson} 
            onPersonAdded={(newId) => {
              setSearchTerm(""); // Clear search to show the new person in the list
              const newPerson = people.find(p => p.id === newId);
              if (newPerson) {
                setSelectedPersonId(newPerson.id); // Automatically select the newly added person
              }
            }}
          />
        )}

      </div>
      <div className="w-1/4 p-10 bg-[#E9E9E9] text-black">
        {/* UI when no family member is selected */}
        {!selectedPerson && (
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
                  onClick={() => setSelectedPersonId(p.id)}
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
          <div className="h-full">
            <button
              onClick={() => setSelectedPersonId(null)}
              className="mb-6 px-4 py-2 bg-[#383838] text-white rounded-full hover:bg-[#282828]"
            >
              Back
            </button>

            <div className="text-center mb-8">
              <div className="py-30 bg-[#B5B5B5] rounded-2xl mb-10">
                image
              </div>

              <h2 className="text-m">
                <strong className="text-xl ">
                  {selectedPerson.firstName} {selectedPerson.lastName}
                </strong>
                {selectedPerson.birthDate
                  ? `, ${getAge(selectedPerson.birthDate)}`
                  : ""}
              </h2>
              <p className="">
                {selectedPerson.birthDate || "Unknown"}
              </p>

              <p className="">
                {selectedPerson.birthLocation || "Unknown"}
              </p>

              <p className="" >
                  Title: {selectedPerson.title || "Unknown"}
              </p>

            </div>

            <div className="mb-8">
              <h3 className="font-semibold mb-2 text-lg">Bio</h3>
              <p className="">
                {selectedPerson.bio || "No bio created yet."}
              </p>
            </div>

            <div className="flex gap-6">

              <div className="w-1/2 space-y-2">
                <h3 className="font-semibold text-lg">Details</h3>
                <p>
                  Health: {selectedPerson.healthDetails || "Unknown"}
                </p>
              </div>

              <div className="w-1/2 space-y-2">
                <h3 className="font-semibold text-lg">Family</h3>

                <p>
                  Parents: {getPeopleNames(selectedPerson.parents)}
                </p>
                <p>
                  Children: {getPeopleNames(selectedPerson.children)}
                </p>
                <p>
                  Spouse: {getPersonName(selectedPerson.spouse)}
                </p>
              </div>
              
            </div>
            {/* Button to modify family member profile */}
            <button
              onClick={() => setEditingPerson(selectedPerson)}
              className="mt-6 px-4 py-2 bg-[#383838] text-white rounded-full hover:bg-[#282828]"
            >
              Edit {selectedPerson.firstName}
            </button>

            {editingPerson && (
              <UpdatePersonForm
                person={editingPerson}
                onClose={() => setEditingPerson(null)}
              />
            )}

          </div>

        )}
      </div>
    </div>
  );
}