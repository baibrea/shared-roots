"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Person } from "@/types/person";
import { addDoc, arrayUnion, collection, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

type PeopleContextType = {
  people: Person[];
  addPerson: (
    person: Person,
    referencePerson?: Person,
    relationship?: string
  ) => Promise<string | undefined>;
  updatePerson: (
    personId: string, 
    updatedData: Partial<Person>
  ) => Promise<void>;
};

const PeopleContext = createContext<PeopleContextType | null>(null);

export function PeopleProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  // Tracks the logged-in user
  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => unsubscribeAuth();
  }, []);

  // 
  useEffect(() => {
    // Check if a user is currently logged in
    if (!user) return;

    // Get the user's document from Firestore
    const userRef = doc(db, "users", user.uid);

    // Listen for changes in "people" subcollection
    const unsubscribeUser = onSnapshot(userRef, (userSnap) => {
      if (!userSnap.exists()) return;

      const userData = userSnap.data();
      const families = userData.families || [];
      if (families.length === 0) return;

      const familyId = families[0].id; // Use the first family temporarily

      const peopleCollection = collection(db, "families", familyId, "people");

      const unsubscribePeople = onSnapshot(peopleCollection, (snapshot) => {
        const peopleData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as Person[];

        setPeople(peopleData);
      });

      // Unsubscribes from "people" listener
      return () => unsubscribePeople();
    });

    return () => unsubscribeUser();
  }, [user]);

  // Add a new family member to the "people" subcollection
  async function addPerson(
    person: Person,
    referencePerson?: Person,
    relationship?: string
  ): Promise<string | undefined> {

    if (!user) {
      return;
    }

    // Get the user's document from Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return;
    }

    // Get the user's family ID(s)
    const userData = userSnap.data();
    const families = userData.families || [];
    if (families.length === 0) {
      return;
    }

    const familyId = families[0].id; // Use the first family temporarily

    try {
      const peopleCollection = collection(db, "families", familyId, "people");

      // If a person is a child of the reference person, set the parents field to reference that person
      if (relationship === "child" && referencePerson) {
        person.parents = [referencePerson.id];
        // If the reference person has a spouse, set that spouse as a parent for the new child
        if(referencePerson.spouse) {
          person.parents.push(referencePerson.spouse);
        }
      }
      // Else if a person is a parent of the reference person, set the children field to reference that person
      else if (relationship === "parent" && referencePerson) {
        person.children = [referencePerson.id];
        // If the reference person has existing parents, assume new parent is spouse and link them together
        if(referencePerson.parents && referencePerson.parents.length > 0) {
          person.spouse = referencePerson.parents[0]; // Assume the first parent is the spouse for simplicity
        }
      }
      // Else if a person is a spouse of the reference person, set the spouse field to reference that person and link their children if they have any
      else if (relationship === "spouse" && referencePerson) {
        person.spouse = referencePerson.id;
        person.children = referencePerson.children || [];
      }

      const docRef = await addDoc(peopleCollection, person);
      console.log("Added person", person);
      const newId = docRef.id;

      if (referencePerson) {
        const referenceRef = doc(db, "families", familyId, "people", referencePerson.id);
        // If the new person is a child, update the reference person to add this new child.
        if (relationship === "child") {
          await updateDoc(referenceRef, {
            children: arrayUnion(newId),
          });
          // If the reference person has a spouse, also update the spouse to add this new child
          if(referencePerson.spouse) {
            const spouseRef = doc(db, "families", familyId, "people", referencePerson.spouse);
            await updateDoc(spouseRef, { children: arrayUnion(newId) });
          }
        }
        // Else if the new person is a parent, update the reference person to add this new parent. 
        else if (relationship === "parent") {
          // Update the reference person to add this new parent
          await updateDoc(referenceRef, {
            parents: arrayUnion(newId),
          });
          // If the reference person has existing parents, assume new parent is spouse 
          // and update the existing parent to link to the new spouse
          if(referencePerson.parents && referencePerson.parents.length > 0) {
            const existingParentRef = doc(db, "families", familyId, "people", referencePerson.parents[0]);
            await updateDoc(existingParentRef, { spouse: newId });
          }
        }
        // Else if the new person is a spouse, update the reference person to add this new spouse.
        else if (relationship === "spouse") {
          // Update the reference person to add this new spouse
          await updateDoc(referenceRef, {
            spouse: newId,
          });
            // If the reference person has children, update the new spouse to link to those children
          if(referencePerson.children && referencePerson.children.length > 0) {
            for (const childId of referencePerson.children) {
              const childRef = doc(db, "families", familyId, "people", childId);
              await updateDoc(childRef, { parents: arrayUnion(newId) });
            }
          }
        }
      }
      return newId;
    } catch (error) {
      console.error("Error adding person and/or updating relationships: ", error);
    }
  }

  async function updatePerson(personId: string, updatedData: Partial<Person>) {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const families = userSnap.data().families || [];
    if (families.length === 0) return;

    const familyId = families[0].id; // Use the first family temporarily

    const personRef = doc(db, "families", familyId, "people", personId);

    await updateDoc(personRef, updatedData);
  }

  return (
    <PeopleContext.Provider value={{ people, addPerson, updatePerson }}>
      {children}
    </PeopleContext.Provider>
  );
}

export function usePeople() {
  const context = useContext(PeopleContext);
  if (!context) throw new Error("usePeople must be used inside PeopleProvider");
  return context;
}