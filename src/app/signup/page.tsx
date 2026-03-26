"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { registerUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { sign } from "crypto";

export default function CreateAccountPage() {
    // Registration Information
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Checks if account is successfully created or already exists
    const registeredRef = useRef(false);
    const [exists, setExists] = useState(false);
    const [invalidPass, setInvalidPass] = useState(false);
    const [invalidEmail, setInvalidEmail] = useState(false);
    const [success, setSuccess] = useState(false);

    // Router for redirecting
    const router = useRouter();

    // Check if user is already logged in
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && !registeredRef.current) {
                router.push("/dashboard");
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        // Prevents page refresh/timeout
        e.preventDefault();
        
        // User Registration
        try {
            // Registers user to Firebase
            registeredRef.current = true;
            await registerUser(email, password, firstName, lastName);

            // Shows registration message and redirects to login
            setSuccess(true);
            router.push("/login");
        } catch (err: unknown) {
            // Handles Error if the Email is already in use.
            if (err instanceof FirebaseError) {
                if (err.code === "auth/email-already-in-use") {
                    setExists(true);
                } else if (err.code === "auth/weak-password") {
                    setInvalidPass(true);    
                } else if (err.code === "auth/invalid-email") {
                    setInvalidEmail(true);
                }
            }
            else {
                // Handles Generic Errors with Registration
                console.error("Registration Error:", err)
                setExists(false);
            }
            registeredRef.current = false;
            setSuccess(false);
        }
    };

    // Front-End
    return (
        <div className="relative min-h-screen bg-[#CAD7CA]">
            <Link href="/" className="absolute top-4 left-4 text-[#374426] text-xl font-bold">
                Shared Roots
            </Link>
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-full max-w-md p-12 rounded-4xl bg-[#f9f8f4] shadow-2xl shadow-">
                    
                    {/*The following code only executes on successful account creation*/}
                    {success && (
                    // Account creation message
                    <p className="bg-green-200 text-green-800 p-2 rounded mb-4">
                        <b>Account created. Redirecting to login. . .</b>
                    </p>
                    )}
                    {/*End successful account creation code*/}

                    {/*The following code only executes on if an email is already tied to an account*/}
                    {exists && (
                    // Account already exists message
                    <p className="bg-red-200 text-red-800 p-2 rounded mb-4">
                        <b>Email already in use. Please try logging in or use another email.</b>
                    </p>
                    )}

                    {/*The following code only executes if password is too short*/}
                    {invalidPass && (
                    // Invalid password
                    <p className="bg-red-200 text-red-800 p-2 rounded mb-4">
                        <b>Password must be at least 6 characters in length.</b>
                    </p>
                    )}

                    {/*The following code only executes on invalid email*/}
                    {invalidEmail && (
                    // Invalid Email
                    <p className="bg-red-200 text-red-800 p-2 rounded mb-4">
                        <b>Invalid email, please try again.</b>
                    </p>
                    )}
                    {/*End account creation failure code*/}

                    <h1 className="text-2xl font-bold mb-2 text-center text-[#3A433A]">
                        Register
                    </h1>

                    <p className="text-center mb-8 text-[#3A433A]">
                        Create an account to begin tracking your roots.
                    </p>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-[#3A433A]">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full border border-[#6E6E6E] rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black bg-[#dde4dd]
                                placeholder: text-black"
                                placeholder="Email"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-[#3A433A]">
                                Password
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full border border-[#6E6E6E] rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black bg-[#dde4dd]
                                placeholder: text-black"
                                placeholder="Password"
                            />
                            <div className="flex items-center position-relative -translate-y-7 translate-x-[90%]">
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                <Image
                                    src="../eye-off-svgrepo-com.svg"
                                    alt="Show Password"
                                    width={16}
                                    height={16}
                                />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1 text-[#3A433A]">
                                Name
                            </label>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    className="w-full border border-[#6E6E6E] rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black bg-[#dde4dd]
                                    placeholder: text-black"
                                    placeholder="First Name"
                                />

                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    className="w-full border border-[#6E6E6E] rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black bg-[#dde4dd]
                                    placeholder: text-black"
                                    placeholder="Last Name"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-[#698b6a] text-white py-2 my-1 rounded-3xl hover:opacity-90 transition disabled:opacity-50"
                        >
                                Create Account
                        </button>
                    </form>

                    <div>
                        <p className="mt-4 text-sm text-center text-black">
                            Already have an account?{" "}
                            <Link href="/login" className="text-blue-600 hover:underline">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}