"use client";
import { createContext, useContext, useState } from "react";

type Family = {
    id: string;
    name: string;
};

type FamilyContextType = {
    activeFamily: Family | null;
    setActiveFamily: (f: Family | null) => void;
};

const FamilyContext = createContext<FamilyContextType | null>(null);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
    const [activeFamily, setActiveFamily] = useState<Family | null>(null);

    return (
        <FamilyContext.Provider value={{ activeFamily, setActiveFamily }}>
            {children}
        </FamilyContext.Provider>
    );
}

export function useFamily() {
    const context = useContext(FamilyContext);
    if (!context) {
        throw new Error("useFamily must be used within a FamilyProvider");
    }
    return context;
}
