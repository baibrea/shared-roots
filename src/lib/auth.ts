import { createUserWithEmailAndPassword,signInWithEmailAndPassword, User } from "firebase/auth";
import { signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export async function registerUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string
): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
    );

    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        firstName,
        lastName,
        createdAt: new Date(),
        role: "user",
    });

    return user;
}

export async function loginUser(
    email: string,
    password: string
): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
    );

    return userCredential.user;
}

export async function logOut(router : AppRouterInstance) {
    try {
        await signOut(auth);
        console.log("User signed out.");
        router.push("/login");
    } catch (error) {
        console.log("Sign out failed:", error);
    }
}