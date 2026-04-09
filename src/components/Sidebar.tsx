"use client"

import Image from "next/image";
import Link from "next/link";
import { logOut } from "@/lib/auth";
import { useRouter } from "next/navigation";

type SidebarProps = {
    firstName: string;
    lastName: string;
    hasPending?: boolean;
    openInbox?: (view: "pending" | "archived" | "invite") => void;
    showInbox?: boolean;
};

export default function Sidebar({
    firstName,
    lastName,
    hasPending = false,
    openInbox,
    showInbox = false,
}: SidebarProps) {
    const router = useRouter();

    return (
      <aside className="flex flex-col min-h-screen items-center w-1/5 bg-[#2c3224] py-10">
        <div className="flex flex-col w-full items-center">
          <Link href="/dashboard" className="mb-10">
            <Image
              src="/WebLogoImage.png"
              alt="Next.js logo"
              width={130}
              height={20}
              priority
            />
            <Image
              className="invert"
              src="/WebLogoText.png"
              alt="Next.js logo"
              width={130}
              height={20}
              priority
            />
          </Link>

          <Link href="/dashboard" className="flex h-12 py-10 w-full items-center justify-center text-white transition-colors hover:bg-[#1a1a1a]">
            Dashboard
          </Link>

          <Link href="/familytree" className="flex h-12 py-10 w-full items-center justify-center text-white transition-colors hover:bg-[#1a1a1a]">
            Family Tree
          </Link>

          <Link href="/dashboard" className="flex h-12 py-10 w-full items-center justify-center text-white transition-colors hover:bg-[#1a1a1a]">
            Timeline
          </Link>
        </div>


        <div className="flex flex-col w-full items-center mt-auto">
          {/*TODO: Add Dropdown View Profile*/}
          {showInbox && openInbox && (
            <button 
              className="flex w-full items-center justify-center text-white py-6 px-9 transition-colors hover:bg-[#1a1a1a] disabled:opacity-50"
              onClick={async () => openInbox("pending")}
            >
                <Image
                  className="invert shrink-0"
                  src="/mail-svgrepo-com.svg"
                  alt="Inbox"
                  width={40}
                  height={40}
                  priority
                />
                {hasPending && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 bg-red-600 rounded-full h-5 w-5"/>
                )}
            </button>
          )}
          <button
            type="submit"
            className="w-full text-white py-6 transition-colors hover:bg-[#1a1a1a]"
            onClick={() => logOut(router)}
          >
              Sign Out
          </button>
          <div className="flex flex-col justify-left items-center text-center p-4 lg:flex-row">
            {/*TODO: Implement avatar retrievel from database*/}
            <Image
              src="/avatar-girl-svgrepo-com.svg"
              alt="avatar image"
              width={80}
              height={80}
              priority
            />
            <p className="max-w-md text-lg leading-20 text-white pl-5">
              <strong>{firstName} {lastName}</strong>
            </p>
            
          </div>
        </div>
      </aside>
    );
}
