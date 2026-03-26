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
        <div className="flex min-h-screen justify-center bg-[#CAD7CA]">
            {/* Left side of screen */}
            <div className="w-1/2 flex flex-col justify-start pt-56 bg-[url('/tree2.jpg')] bg-cover bg-blend-darken">
            </div>

            {/* Right side of screen */}
            <div className="w-1/2 flex items-center justify-center bg-[#2c3224]">
                <div className="w-full max-w-md p-10">
                    
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

                    <h1 className="text-4xl font-bold mb-2 text-center">
                        Register
                    </h1>

                    <p className="text-center text-xl mb-8 text-[#bfcab2]">
                        Create an account to begin tracking your roots.
                    </p>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-white">
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

                        <div className="relative">
                            <label className="block text-sm font-medium mb-1 text-white">
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
                            <div className="absolute right-3 top-9">
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
                            <label className="block text-sm font-medium mb-1 white">
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
                            className="w-full bg-[#7b8b69] text-white py-2 my-1 rounded-3xl hover:opacity-90 transition disabled:opacity-50"
                        >
                                Create Account
                        </button>
                    </form>

                    <div>
                        <p className="mt-4 text-sm text-center text-white">
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