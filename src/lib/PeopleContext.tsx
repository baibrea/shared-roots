"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Person } from "@/types/person";
import {
  addDoc, arrayUnion, collection, doc,
  getDoc, onSnapshot, updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

type PeopleContextType = {
  people: Person[];
  addPerson: (person: Person, referencePerson?: Person, relationship?: string) => Promise<string | undefined>;
  updatePerson: (personId: string, updatedData: Partial<Person>) => Promise<void>;
};

const PeopleContext = createContext<PeopleContextType | null>(null);

export function PeopleProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [user, setUser]     = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    const unsubscribeUser = onSnapshot(userRef, userSnap => {
      if (!userSnap.exists()) return;

      const families = userSnap.data().families ?? [];
      if (families.length === 0) return;

      const familyId        = families[0].id;
      const peopleCollection = collection(db, "families", familyId, "people");

      const unsubscribePeople = onSnapshot(peopleCollection, snapshot => {
        const peopleData = snapshot.docs.map(d => {
          const data = d.data();

          // ── Backward compatibility ───────────────────────────────────────────
          // Firestore documents written before the spouses[] migration still have
          // spouse: string. Normalise on read so the rest of the app only ever
          // sees spouses: string[].
          if (!data.spouses) {
            data.spouses = data.spouse ? [data.spouse] : [];
          }
          // ────────────────────────────────────────────────────────────────────

          return { id: d.id, ...data } as Person;
        });
        setPeople(peopleData);
      });

      return () => unsubscribePeople();
    });

    return () => unsubscribeUser();
  }, [user]);

  async function addPerson(
    person: Person,
    referencePerson?: Person,
    relationship?: string
  ): Promise<string | undefined> {
    if (!user) return;

    const userRef  = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const families = userSnap.data().families ?? [];
    if (families.length === 0) return;

    const familyId        = families[0].id;
    const peopleCollection = collection(db, "families", familyId, "people");

    try {
      // ── Relationship pre-processing ────────────────────────────────────────
      if (relationship === "child" && referencePerson) {
        person.parents = [referencePerson.id];
        // Also link to the reference's spouses as co-parents
        if (referencePerson.spouses?.length) {
          person.parents.push(...referencePerson.spouses);
        }

      } else if (relationship === "parent" && referencePerson) {
        person.children = [referencePerson.id];
        // If the reference already has a parent, the new parent becomes their spouse
        if (referencePerson.parents?.length) {
          person.spouses = [referencePerson.parents[0]];
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
        const referenceRef = doc(db, "families", familyId, "people", referencePerson.id);

        if (relationship === "child") {
          await updateDoc(referenceRef, { children: arrayUnion(newId) });
          // Add child to every existing spouse too
          for (const spouseId of referencePerson.spouses ?? []) {
            const spouseRef = doc(db, "families", familyId, "people", spouseId);
            await updateDoc(spouseRef, { children: arrayUnion(newId) });
          }

        } else if (relationship === "parent") {
          await updateDoc(referenceRef, { parents: arrayUnion(newId) });
          // If the reference already had a parent, link the two parents as spouses
          if (referencePerson.parents?.length) {
            const existingParentRef = doc(db, "families", familyId, "people", referencePerson.parents[0]);
            await updateDoc(existingParentRef, { spouses: arrayUnion(newId) });
          }

        } else if (relationship === "spouse") {
          await updateDoc(referenceRef, { spouses: arrayUnion(newId) });
          // Give the new spouse access to all existing children
          for (const childId of referencePerson.children ?? []) {
            const childRef = doc(db, "families", familyId, "people", childId);
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
    if (!user) return;

    const userRef  = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const families = userSnap.data().families ?? [];
    if (families.length === 0) return;

    const personRef = doc(db, "families", families[0].id, "people", personId);
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