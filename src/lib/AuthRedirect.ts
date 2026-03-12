"use client";
import { use, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";

export default function AuthRedirect() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Wait until auth state is known before redirecting
        if (loading) return;

        // Prevent non-logged-in users from accessing certain pages
        if (user === null) {
            if (pathname.startsWith("/dashboard") || pathname.startsWith("/familytree") || pathname.startsWith("/testinput")) {
                router.push("/");
            }
        } else {
            if (pathname === "/") {
                router.push("/dashboard");
            }
        }
    }, [user, loading, pathname, router]);

    return null;
}