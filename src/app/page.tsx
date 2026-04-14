"use client";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "@firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {

    // Router for redirecting
    const router = useRouter();

    // Check if user is already logged in
    onAuthStateChanged(auth, (user) => {
        if (user) {
            router.push("/dashboard");
        } else {
            router.push("/login");
        }
    });

  return (
    <div>
      <h1 className="text-4xl font-bold text-center mt-20">Welcome to Shared Roots!</h1>
      <p className="text-center mt-4 text-lg">Please log in to access your family tree and health history.</p>

      <p className="mt-4 text-sm text-center">
        <Link href="/login" className="text-blue-600 hover:underline p-4 bg-white rounded-lg">
          Login
        </Link>
      </p>

      <p className="mt-4 text-sm text-center text-white">
        Don’t have an account?{" "}
        <Link href="/signup" className="text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
