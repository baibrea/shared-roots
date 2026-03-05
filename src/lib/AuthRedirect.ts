"use client";
import { use, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";

export default function AuthRedirect() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user === null) {
            if (pathname.startsWith("/dashboard") || pathname.startsWith("/familytree") || pathname.startsWith("/testinput")) {
                router.push("/");
            }
        } else {
            if (pathname === "/") {
                router.push("/dashboard");
            }
        }
    }, [user, pathname, router]);

    return null;
}