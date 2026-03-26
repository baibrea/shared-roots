"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {

  // Immediately pushes to login.
  const router = useRouter();
  useEffect(() => {
    router.push("/login");
  }, [router]);
}
