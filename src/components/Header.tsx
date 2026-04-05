"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Header() {
    const pathname = usePathname();

    // Hide header on login and signup pages
    if (pathname === "/login" || pathname === "/signup" || pathname === "/dashboard") {
        return null;
    }

    return (
        <header className="h-16 shrink-0 flex items-center px-6 bg-[#CAD7CA]">
            <Link
                href="/dashboard"
                className="text-[#374426] text-xl font-bold"
            >
                Shared Roots
            </Link>
        </header>
    )
}