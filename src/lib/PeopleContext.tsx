"use client";

import { createContext, useContext, useState } from "react";
import { Person } from "@/types/person";

type PeopleContextType = {
  people: Person[];
  addPerson: (person: Person) => void;
};

const PeopleContext = createContext<PeopleContextType | null>(null);

export function PeopleProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);

  function addPerson(person: Person) {
    setPeople((prev) => [...prev, person]);
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