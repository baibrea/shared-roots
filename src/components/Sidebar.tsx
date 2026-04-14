"use client"

import Image from "next/image";
import Link from "next/link";
import { logOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import MediaView from "@/components/MediaView";
import { useAvatar } from "@/lib/media";
import { auth } from "@/lib/firebase";
import { useState } from "react";

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

    // Avatar
    const [avatarURL, setAvatarURL] = useState("/avatar-girl-svgrepo-com.svg");
    const currentAvatar = useAvatar(auth.currentUser?.uid || "");
    const [showMediaWindow, setShowMediaWindow] = useState(false);
    const familyView = false;
    const userId = auth.currentUser?.uid || "";
    const familyId = ""; //Does not matter since we're not using it in the sidebar

    return (
      <aside className="flex flex-col min-h-screen items-center w-1/5 bg-[#2c3224] py-10">
        <div className="flex flex-col w-full items-center">
          <Link href="/dashboard" className="mb-10 flex flex-col items-center">
            <Image
              className=""
              src="color-tree-decidious-svgrepo-com.svg"
              alt="Next.js logo"
              width={80}
              height={15}
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
          {showInbox && openInbox && (
            <button 
              className="flex w-full items-center justify-center text-white py-6 px-9 transition-colors hover:bg-[#1a1a1a] disabled:opacity-50"
              onClick={async () => openInbox("pending")}
            >
                <div className="relative shrink-0">
                    <Image
                    className="invert"
                    src="/mail-svgrepo-com.svg"
                    alt="Inbox"
                    width={40}
                    height={40}
                    priority
                    />
                    {hasPending && (
                    <span className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/8 inline-flex items-center justify-center px-2 py-1 bg-red-600 rounded-full h-5 w-5"/>
                    )}
                </div>
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
            <button 
                className="hover:brightness-75 transition-all duration-150 rounded-full"
                onClick ={() => {setShowMediaWindow(true);}}
            >
              <Image
                src={currentAvatar || "/avatar-girl-svgrepo-com.svg"}
                alt="avatar image"
                width={80}
                height={80}
                className="rounded-full bg-white p-1"
                priority
              />
            </button>
            <p className="max-w-md text-lg leading-normal text-white pl-5">
              <strong>{firstName} {lastName}</strong>
            </p>
            
          </div>
        </div>
          {showMediaWindow && (
            <MediaView
              uid={userId}
              familyID={familyId}
              familyView={familyView}
              onClose={(returnValue: boolean) => {
              setShowMediaWindow(false);
              }}
            />
          )}
      </aside>
    );
}
