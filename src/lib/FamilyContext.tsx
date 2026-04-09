"use client";
import { User, onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase";

type Family = {
    id: string;
    name: string;
};

type FamilyContextType = {
    activeFamily: Family | null;
    setActiveFamily: (f: Family | null) => void;
    user: User | null;
};

const FamilyContext = createContext<FamilyContextType | null>(null);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
    const [activeFamily, setActiveFamily] = useState<Family | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // Checks for login/logouts and updates the active family accordingly
    // Checks local storage for the last active family for that user and sets it on login
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currUser) => {
            setUser(currUser);

            if (!currUser) {
                setActiveFamily(null);
                return;
            }

            const stored = localStorage.getItem(`activeFamily_${currUser.uid}`);

            if (stored) {
                setActiveFamily(JSON.parse(stored));
            } else {
                setActiveFamily(null);
            }
        });
        return () => unsubscribe();
    }, []);

    // Updates local storage every time active family changes
    useEffect(() => {
        if (!user) {
            return;
        }

        if (activeFamily) {
            localStorage.setItem(`activeFamily_${user.uid}`, JSON.stringify(activeFamily));
        } else {
            localStorage.removeItem(`activeFamily_${user.uid}`);
        }
    }, [activeFamily, user]);

    return (
        <FamilyContext.Provider value={{ activeFamily, setActiveFamily, user }}>
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
