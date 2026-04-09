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
        <aside className="flex flex-col min-h-screen items-center w-1/6 bg-[#657B97] py-10">
        <div className="flex flex-col w-full items-center gap-4">
          {/*TODO: Add Shared Roots Logo*/}
          <Image
            className="dark:invert pb-10"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />

          <Link href="/dashboard" className="flex h-12 w-full items-center justify-center gap-2 px-5 text-white transition-colors dark:hover:bg-[#1a1a1a]">
            Dashboard
          </Link>

          <Link href="/familytree" className="flex h-12 w-full items-center justify-center gap-2 px-5 text-white transition-colors dark:hover:bg-[#1a1a1a]">
            Family Tree
          </Link>

          <Link href="/dashboard" className="flex h-12 w-full items-center justify-center gap-2 px-5 text-white transition-colors dark:hover:bg-[#1a1a1a]">
            Timeline
          </Link>
        </div>

        <div className="flex flex-col items-center gap-4 mt-auto">
          {/*TODO: Add Dropdown View Profile*/}
          {showInbox && openInbox && (
            <button 
              className="bg-[#657B97] text-white py-2 px-9 rounded-3xl transition-colors dark:hover:bg-[#556880] disabled:opacity-50 w-[110px] h-[50px]"
              onClick={async () => openInbox("pending")}
            >
              <span className="relative inline-block">
                <Image
                  className="dark:invert"
                  src="/mail-svgrepo-com.svg"
                  alt="Inbox"
                  width={50}
                  height={50}
                  priority
                />
                {hasPending && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 bg-red-600 rounded-full h-5 w-5"/>
                )}
              </span>
            </button>
          )}
          <button
            type="submit"
            className="w-[160px] bg-[#657B97] text-white py-2 rounded-3xl transition-colors dark:hover:bg-[#556880]"
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
            <p className="max-w-md text-lg leading-20 text-black pl-5">
              <strong>{firstName} {lastName}</strong>
            </p>
            
          </div>
        </div>
      </aside>
    );
}
