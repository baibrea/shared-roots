"use client";

import { useEffect, useState } from "react";
import AddPersonForm from "@/lib/AddPersonForm";
import { usePeople } from "@/lib/PeopleContext";
import { Person } from "@/types/person";
import VisualGraph from "@/components/VisualGraph";
import SearchBar from "@/components/SearchBar";
import UpdatePersonForm from "@/lib/UpdatePersonForm";
import { useFamily } from "@/lib/FamilyContext";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, doc, getDoc, onSnapshot, query, where } from "@firebase/firestore";
import FamilyDropdown from "@/components/FamilyDropdown";
import Sidebar from "@/components/Sidebar";
import MediaView from "@/components/MediaView";
import Image from "next/image";
import Inbox from "@/components/Inbox";
import { User } from "lucide-react";

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

  // Loading
  const [isLoading, setIsLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);

  // Inbox
  const [showInbox, setShowInbox] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [userId, setUserId] = useState("");
  const [inboxView, setInboxView] = useState<"pending" | "archived" | "invite">("pending");
  const openInbox = (viewType: "pending" | "archived" | "invite") => {
      setInboxView(viewType);
      setShowInbox(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        const data = docSnap.data();

        if (data) {
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setUserId(user.uid);

          const families = data.families || [];
          setUserFamilies(families);

          // Check for pending invites
          const inboxAlert = onSnapshot(
            query(collection(db, "users", user.uid, "inbox"), where("status", "==", "pending")),
              (snapshot) => {
                setHasPending(!snapshot.empty);
              },
              (error) => {
                console.error("Failed to retrieve pending invites:", error);
                setHasPending(false);
              }
          );
          return () => inboxAlert();
        }
      }
      setIsLoading(false);
    });
    const fallback = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      clearTimeout(fallback);
      unsubscribe();
    };
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

  if (isLoading && showLoader) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#2c3224]">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="tree-decidious-svgrepo-com.svg"
            alt="Loading..."
            width={60} 
            height={60}
            className="animate-pulse invert"
          />
          <p className="text-white text-lg">Loading your family tree...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        firstName={firstName}
        lastName={lastName}
        hasPending={hasPending}
        openInbox={openInbox}
        showInbox={true}
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
      <div className="w-3/10 flex flex-col overflow-y-auto py-4 bg-white text-black shadow-2xl">
        {/* UI when no family member is selected */}
        {!selectedPerson && (
          <div className="flex flex-col h-full py-6 pl-6">
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
                  className="p-3 rounded-xl border border-transparent hover:border-gray-100 hover:bg-gray-50 cursor-pointer transition-all flex flex-row"
                >
                  <div>
                    {p.avatar ? (
                      <div>
                        <img
                          src={p.avatar}
                          className="w-12 h-12 mr-4 rounded-full"
                        />
                      </div>
                    ) : (<User className="w-10 h-10 mr-4 text-gray-400" />)}
                  </div>
                
                  <div className="flex flex-col">
                    <div className="font-medium">{p.firstName} {p.lastName}</div>
                    <div className="text-xs text-gray-400">{p.birthDate?.split('-')[0] || "---"}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* UI when a family member is selected */}
        {selectedPerson && (
          <div className="h-full px-8">
            <button
              onClick={() => setSelectedPersonId(null)}
              className="mb-6 px-4 py-2 bg-[#2c3224] text-white rounded-2xl hover:bg-[#1a1a1a] cursor-pointer transition-all"
            >
              Back
            </button>

            <div className="text-center mb-8">

              <span className="relative">
                <div className="p-4 rounded-2xl mb-4 flex items-center justify-center">
                  {selectedPerson.avatar ? (
                    <img 
                      src={selectedPerson.avatar}
                      alt={`${selectedPerson.firstName} ${selectedPerson.lastName}`} 
                      className="w-50 h-50 rounded-2xl object-cover mx-auto"
                    />
                  ) : (
                    <User className="w-50 h-50 text-gray-400" />
                  )}
                </div>
                <button 
                  className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 rounded-full w-10 h-10 hover:bg-gray-300 cursor-pointer transition-all"
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
              className="my-6 px-4 py-2 bg-[#2c3224] text-white rounded-2xl hover:bg-[#1a1a1a] cursor-pointer transition-all"
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

      {showInbox && (
        <Inbox 
         docRef={doc(db, "users", userId)}
         uid={userId}
         families={userFamilies}
         firstName={firstName}
         lastName={lastName}
         viewType={inboxView}
         onClose={(returnValue: boolean) => {
         setShowInbox(false);

          // Hides alerts if pending invites are cleared
          if (returnValue) {
            setHasPending(true);
          } else {
              setHasPending(false);
          }
        }}
        onFamiliesUpdate={(newFamilies) => setUserFamilies(newFamilies)} 
        />
      )}             
    </div>
  );
}