"use client";
import Link from "next/link";
import { useState } from "react";
import { loginUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";

export default function LoginPage() {
    // Login Variables
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Variables for failed login
    const [loginFailed, setLoginFailed] = useState(false);
    const [failMessage, setFailMessage] = useState("");

    // Router for redirecting
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        // Prevents page refresh/timeout
        e.preventDefault();

        try {
            // Firebase user login
            const user = await loginUser(email, password);
            console.log("Logged in user:", user.uid, user.email);
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
                }
            }
            else {
                // Handles Generic Errors with Login
                console.error("Login Error:", err)
                setFailMessage("Error Logging In. Please Try Again.");
            }
            setLoginFailed(true);          
        }
    };

  return (
    <div className="relative min-h-screen bg-[#CAD7CA]">
        <Link href="/" className="absolute top-4 left-4 text-[#374426] text-xl font-bold">
            Shared Roots
        </Link>
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-12 rounded-4xl bg-[#f9f8f4] shadow-2xl shadow-">

                {/*The following code only executes on if login is unsuccessful*/}
                {loginFailed && (
                    // Login failed message
                    <p className="bg-red-200 text-red-800 p-2 rounded mb-4">
                        <b>{failMessage}</b>
                    </p>
                )}
                {/*End login failure code*/}

                <h1 className="text-2xl font-bold mb-2 text-center text-[#3A433A]">
                    Welcome!
                </h1>
                <p className="text-center mb-8 text-[#3A433A]">
                    Login to track your roots.
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
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full border border-[#6E6E6E] rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black bg-[#dde4dd]
                            placeholder: text-black"
                            placeholder="Password"
                        />
                    </div>
                    {/* might implement */}
                    <div className="text-right mr-2">
                        <p className="text-sm text-[#3A433A]">
                            Forgot password?
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#698b6a] text-white py-2 my-1 rounded-3xl hover:opacity-90 transition disabled:opacity-50"
                    >
                            Login
                    </button>
                </form>

                <div>
                    <p className="mt-4 text-sm text-center text-black">
                        Don’t have an account?{" "}
                        <Link href="/signup" className="text-blue-600 hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
}
