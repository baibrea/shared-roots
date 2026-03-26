"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { loginUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
    // Login Variables
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);

    // Variables for failed login
    const [loginFailed, setLoginFailed] = useState(false);
    const [failMessage, setFailMessage] = useState("");

    // Router for redirecting
    const router = useRouter();

    // Check if user is already logged in
    onAuthStateChanged(auth, (user) => {
        if (user) {
            router.push("/dashboard");
        }
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        // Prevents page refresh/timeout
        e.preventDefault();

        try {
            // Firebase user login
            const user = await loginUser(email, password);
            setLoginSuccess(true);
            setLoginFailed(false);
            router.push("/dashboard");

        } catch (err: unknown) {
            // Handles Specific Login Errors
            if (err instanceof FirebaseError) {
                if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
                    setFailMessage("Incorrect email address or password. Please try again.");
                } else if (err.code === "auth/user-disabled") {
                    setFailMessage("Account has been disabled.");
                } else if (err.code === "auth/too-many-requests") {
                    setFailMessage("Login failed: Too many requests. Try again later.");
                } else if (err.code === "auth/network-request-failed") {
                    setFailMessage("Network Request Failed. Try again later.");
                } else if (err.code === "auth/invalid-email") {
                    setFailMessage("No account associated with this email. Please try again.");
                } else {
                    setFailMessage("Login failed. Please try again.");
                }
            }
            else {
                // Handles Generic Errors with Login
                console.error("Login Error:", err)
                setFailMessage("Login failed. Please try again.");
            }
            setLoginFailed(true);
            setLoginSuccess(false);          
        }
    };

  return (
    <div className="flex min-h-screen justify-center bg-[#CAD7CA]">
        {/* Left side of screen */}
        <div className="w-1/2 flex flex-col justify-start pt-56 bg-[url('/tree2.jpg')] bg-cover bg-blend-darken">
        </div>

        {/* Right side of screen */}
        <div className="w-1/2 flex items-center justify-center bg-[#2c3224]">
            <div className="w-full max-w-md p-10">
                
                {/*The following code only executes on if login is unsuccessful*/}
                {loginFailed && (
                    // Login failed message
                    <p className="bg-red-200 text-red-800 p-2 rounded mb-4">
                        <b>{failMessage}</b>
                    </p>
                )}
                {/*End login failure code*/}

                <h1 className="text-4xl font-bold mb-2 text-center">
                    Welcome!
                </h1>
                <p className="text-center text-xl mb-8 text-[#bfcab2]">
                    Login to track your roots.
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
                                className="cursor-pointer"
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
                    {/* might implement */}
                    <div className="text-right mr-2">
                        <p className="text-sm text-white">
                            Forgot password?
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#7b8b69] text-white py-2 my-1 rounded-3xl hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
                    >
                            Login
                    </button>
                </form>

                <p className="mt-4 text-sm text-center text-white">
                    Don’t have an account?{" "}
                    <Link href="/signup" className="text-blue-600 hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    </div>
  );
}
