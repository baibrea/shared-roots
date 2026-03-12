"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Person } from "@/types/person";
import { addDoc, collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

type PeopleContextType = {
  people: Person[];
  addPerson: (person: Person) => void;
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
  async function addPerson(person: Person) {
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
      await addDoc(collection(db, "families", familyId, "people"), person);
      console.log("Added person", person);
    } catch (error) {
      console.error("Error adding person", error);
    }
  }

  return (
    <PeopleContext.Provider value={{ people, addPerson }}>
      {children}
    </PeopleContext.Provider>
  );
}

export function usePeople() {
  const context = useContext(PeopleContext);
  if (!context) throw new Error("usePeople must be used inside PeopleProvider");
  return context;
}