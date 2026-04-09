"use client";
import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase";

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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, () => {
            setActiveFamily(null);
        });

        return () => unsubscribe();
    }, []);

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
