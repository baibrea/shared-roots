"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Person } from "@/types/person";
import {
  addDoc, arrayUnion, collection, doc,
  getDoc, onSnapshot, updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useFamily } from "./FamilyContext";

type PeopleContextType = {
  people: Person[];
  addPerson: (person: Person, referencePerson?: Person, relationship?: string) => Promise<string | undefined>;
  updatePerson: (personId: string, updatedData: Partial<Person>) => Promise<void>;
};

const PeopleContext = createContext<PeopleContextType | null>(null);

export function PeopleProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const { activeFamily } = useFamily();

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {

    setPeople([]);

    // Check if a user is currently logged in and get their family ID(s)
    if (!user || !activeFamily?.id) return;

    const peopleRef = collection(db, "families", activeFamily.id, "people");

    const unsubscribePeople = onSnapshot(peopleRef, (snapshot) => {
      const peopleData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Person[];

      setPeople(peopleData);
      });

    // Unsubscribes from "people" listener
    return () => unsubscribePeople();
  }, [user, activeFamily?.id]); 

  async function addPerson(
    person: Person,
    referencePerson?: Person,
    relationship?: string
  ): Promise<string | undefined> {

    if (!user || !activeFamily?.id) return;

    const peopleCollection = collection(db, "families", activeFamily.id, "people");

    try {
      // If a person is a child of the reference person, set the parents field to reference that person
      if (relationship === "child" && referencePerson) {
        person.parents = [referencePerson.id];
        // Also link to the reference's spouses as co-parents
        if (referencePerson.spouses?.length) {
          person.parents.push(...referencePerson.spouses);
        }

      } else if (relationship === "parent" && referencePerson) {
        person.children = [referencePerson.id];
        // If the reference already has parent(s), they become spouses of the new parent
        if (referencePerson.parents?.length) {
          person.spouses = referencePerson.parents;
        }

      } else if (relationship === "spouse" && referencePerson) {
        person.spouses   = [referencePerson.id];
        person.children  = referencePerson.children ?? [];
      }

      // Ensure spouses is always an array
      person.spouses ??= [];

      const docRef = await addDoc(peopleCollection, person);
      const newId  = docRef.id;

      // ── Back-link updates ──────────────────────────────────────────────────
      if (referencePerson) {
        const referenceRef = doc(db, "families", activeFamily.id, "people", referencePerson.id);
        // If the new person is a child, update the reference person to add this new child.
        if (relationship === "child") {
          await updateDoc(referenceRef, { children: arrayUnion(newId) });
          // Add child to every existing spouse too
          for (const spouseId of referencePerson.spouses ?? []) {
            const spouseRef = doc(db, "families", activeFamily.id, "people", spouseId);
            await updateDoc(spouseRef, { children: arrayUnion(newId) });
          }
          // If the reference person has a spouse, also update the spouse to add this new child
        } else if (relationship === "parent") {
          await updateDoc(referenceRef, { parents: arrayUnion(newId) });
          // If the reference already had a parent, link the two parents as spouses
          for(const parentId of referencePerson.parents ?? []) {
            const parentRef = doc(db, "families", activeFamily.id, "people", parentId);
            await updateDoc(parentRef, { spouses: arrayUnion(newId) });
          }

        } else if (relationship === "spouse") {
          await updateDoc(referenceRef, { spouses: arrayUnion(newId) });
          // Give the new spouse access to all existing children
          for (const childId of referencePerson.children ?? []) {
            const childRef = doc(db, "families", activeFamily.id, "people", childId);
            await updateDoc(childRef, { parents: arrayUnion(newId) });
          }
        }
      }

      return newId;
    } catch (error) {
      console.error("Error adding person and/or updating relationships:", error);
    }
  }

  async function updatePerson(personId: string, updatedData: Partial<Person>) {
    if (!user || !activeFamily?.id) return;

    const personRef = doc(db, "families", activeFamily.id, "people", personId);

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