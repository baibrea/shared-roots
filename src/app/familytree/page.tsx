"use client";

import { act, use, useEffect, useState } from "react";
import AddPersonForm from "@/lib/AddPersonForm";
import { usePeople } from "@/lib/PeopleContext";
import { Person } from "@/types/person";
import VisualGraph from "@/components/VisualGraph";
import SearchBar from "@/components/SearchBar";
import UpdatePersonForm from "@/lib/UpdatePersonForm";
import { useFamily } from "@/lib/FamilyContext";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "@firebase/firestore";
import FamilyDropdown from "@/components/FamilyDropdown";
import Sidebar from "@/components/Sidebar";
import { uploadMedia } from "@/lib/media";
import MediaView from "@/components/MediaView";

export default function FamilyTreePage() {
  type Family = {
    id: string;
    name: string;
  };

  const { people } = usePeople();
  const [showForm, setShowForm] = useState(false);
  const [referencePerson, setReferencePerson] = useState<Person | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPerson, setEditingPerson] =  useState<Person | null>(null);

  const selectedPerson = people.find(p => p.id === selectedPersonId) || null;
  const activePerson = selectedPerson || people[0] || null;
  const { activeFamily } = useFamily();
  const currentUser = auth.currentUser;
  const familyView = true; // Indicates for media upload/retrieval that it is the family tree page
  const [showMediaWindow, setShowMediaWindow] = useState(false);
  
  const [userFamilies, setUserFamilies] = useState<Family[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();

        if (data) {
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");

          const families = data.families || [];
          setUserFamilies(families);
        }
      }

    });
    return () => unsubscribe();
  }, []);

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
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        firstName={firstName}
        lastName={lastName}
      />


      {/* Family Tree */}
      <div className="w-3/4 p-10 overflow-y-auto bg-[#b9c4b9] border-r border-gray-200 flex flex-col">
        {userFamilies.length > 0 ? (
          <FamilyDropdown 
            families={userFamilies}
            onCreateFamily={() => {}}
            showCreate={false}
          />
        ) : (
          <p
            className="w-1/3 min-w-40 max-w-60 py-3 px-5 text-left bg-white hover:bg-gray-100 rounded-md font-semibold text-black"
          >
            No families found.
          </p>
        )}

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

      {/* Right Panel */}
      <div className="w-1/4 flex flex-col overflow-y-auto p-10 bg-white text-black shadow-2xl">
        {/* UI when no family member is selected */}
        {!selectedPerson && (
          <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold mb-4">Directory</h2>
            <div className="flex flex-row">
              <input type="file" id="mediaFile"></input>
              <button 
                className="ml-4 px-4 py-2 mb-4 bg-[#2c3224] text-white rounded-full hover:bg-[#3E4B2C] cursor-pointer"
                onClick={() => {uploadMedia(
                  activeFamily?.id || "",
                  (document.getElementById("mediaFile") as HTMLInputElement).files?.[0] || new File([], ""),
                  (document.getElementById("mediaFile") as HTMLInputElement).files?.[0].type || "unknown",
                  "Uploaded test media",
                  currentUser?.uid || "",
                  familyView
                )}}
              >Upload</button>
            </div>
            
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
              className="mb-6 px-4 py-2 bg-[#2c3224] text-white rounded-2xl hover:bg-[#3E4B2C] cursor-pointer"
            >
              Back
            </button>

            <div className="text-center mb-8">

              <span className="relative">
                <div className="py-30 bg-[#B5B5B5] rounded-2xl mb-10">
                  {selectedPerson.avatar ? (
                    <img 
                      src={selectedPerson.avatar}
                      alt={`${selectedPerson.firstName} ${selectedPerson.lastName}`} 
                      className="w-32 h-32 rounded-full object-cover mx-auto"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-300 mx-auto">image</div>
                  )}
                </div>
                <button 
                  className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 rounded-full w-10 h-10 hover:bg-gray-300 cursor-pointer"
                  onClick={() => setShowMediaWindow(true)}
                >
                  <img src="/edit-svgrepo-com.svg" alt="Edit" />
                </button>
              </span>

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
                  Spouse(s): {getPeopleNames(selectedPerson.spouses)}
                </p>
              </div>
              
            </div>
            {/* Button to modify family member profile */}
            <button
              onClick={() => setEditingPerson(selectedPerson)}
              className="mt-6 px-4 py-2 bg-[#2c3224] text-white rounded-2xl hover:bg-[#3E4B2C] cursor-pointer"
            >
              Edit {selectedPerson.firstName}
            </button>

            {editingPerson && (
              <UpdatePersonForm
                person={editingPerson}
                onClose={() => setEditingPerson(null)}
              />
            )}

            {showMediaWindow && (
              <MediaView 
                uid={selectedPerson.id || ""}
                familyID={activeFamily?.id || ""}
                familyView={true}
                onClose={() => setShowMediaWindow(false)}
              />
            )}

          </div>

        )}
      </div>
    </div>
  );
}