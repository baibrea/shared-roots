"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { logOut } from "@/lib/auth";
import { auth, db } from "@/lib/firebase";
import { createFamily } from "@/lib/family";
import { sendInvite, acceptInvite, retrievePending, retrieveAccepted } from "@/lib/inbox";

export default function Dashboard() {
    // Declares User Information Variables
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [userID, setUserID] = useState("");
    const [inputText, setInputText] = useState("");
    const [userFamilies, setUserFamilies] = useState([]);

    // Family Booleans
    const [familyCreated, setFamilyCreated] = useState(false);
    const [familyJoined, setFamilyJoined] = useState(false);
    const [familyJoinFailed, setFamilyJoinFailed] = useState(false);

    // Router for redirecting
    const router = useRouter();

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        // User is signed in
        if (user) {
            // Get user's document from Firestore
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            const data = docSnap.data();
            
            // Assign User Information Variables
            if (data) {
                setFirstName(data.firstName);
                setLastName(data.lastName);
                setUserID(data.uid);
                setUserFamilies(data.families);
            }
        }
      });

      return () => unsubscribe();

    }, []);

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-[#FFFFFF]">
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <aside className="flex flex-col min-h-screen w-60 bg-[#657B97] items-center justify-center gap-4 justify-start py-10">
        <Image
          className="dark:invert "
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
      </aside>
      <main className="flex min-h-screen w-full max-w-7xl flex-col items-center justify-between py-32 px-16 bg-[#DDE7F4] sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">

          {/*Conditional Family creation/join success/fail messages*/}
          {familyCreated && (
            <p className="bg-green-200 text-green-800 p-2 rounded mb-4">
              <b>{inputText} Family created successfully!</b>
            </p>
          )}
          {familyJoined && (
            <p className="bg-green-200 text-green-800 p-2 rounded mb-4">
              <b>{inputText} Family joined successfully!</b>
            </p>
          )}
          {familyJoinFailed && (
            <p className="bg-red-200 text-red-800 p-2 rounded mb-4">
              <b>Failed to join {inputText} family.</b>
            </p>
          )}
          {/*End Conditional Family Messages*/}

          <h1 className="max-w-s text-3xl font-semibold leading-10 tracking-tight text-black">
            Welcome to Shared Roots.
          </h1> 
          <p className="max-w-md text-lg leading-8 text-black">
            Greetings {firstName} {lastName}!
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Link href="/familytree" className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#657B97] px-5 text-white transition-colors dark:hover:bg-[#556880] md:w-[158px]">
            Family Tree
          </Link>
          <button
              type="submit"
              className="w-full bg-[#657B97] text-white py-2 my-1 rounded-3xl transition-colors dark:hover:bg-[#556880]"
              onClick={() => logOut(router)}
              >
              Sign Out
          </button>          
        </div>
        <div className="flex flex-col gap-4 w-full">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text here"
            className="w-full px-4 py-2 border border-solid border-black/[.08] rounded-full dark:border-white/[.145] dark:bg-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#698b6a]"
          />
          <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
            <button
              className="flex h-12 w-full items-center bg-[#657B97] justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
              onClick={async () => {
                try {
                  const family = await createFamily(inputText, firstName, lastName, userID);
                  console.log("Succesfully created family:", inputText);
                  setFamilyCreated(true);
                } catch (error) {
                  console.error("Failed to create family:", error);
                  setFamilyCreated(false);
                }
              }}
            >
              Create Family
            </button>
            <button
              className="flex h-12 w-full items-center bg-[#657B97] justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
              onClick={async () => {
                try {
                  await sendInvite("Join my family", "3g6N2Wnu7HfBFe1MVnMd", "TestFamily", firstName, lastName, inputText);
                  console.log("Invite sent to:", inputText);
                } catch (error) {
                  console.error("Failed to send invite:", error);
                }
              }}
            >
              Send Invite
            </button>
            <button
              className="flex h-12 w-full items-center bg-[#657B97] justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
              onClick={async () => {
                try {
                  const invites = await retrievePending(userID);
                  console.log("Pending invites:", invites);
                } catch (error) {
                  console.error("Failed to retrieve invites:", error);
                }
              }}
            >
              View Invites
            </button>
            <button
              className="flex h-12 w-full items-center bg-[#657B97] justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
              onClick={async () => {
                try {
                  await acceptInvite(inputText, "3g6N2Wnu7HfBFe1MVnMd", firstName, lastName, userID);
                  setFamilyJoined(true);
                  setFamilyJoinFailed(false);
                  console.log("Accepted invite:", inputText);
                } catch (error) {
                  setFamilyJoined(false);
                  setFamilyJoinFailed(true);
                  console.error("Failed to accept invite:", error);
                }
              }}
            >
              Accept Invite
            </button>
            <button
              className="flex h-12 w-full items-center bg-[#657B97] justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
              onClick={async () => {
                try {
                  const invites = await retrieveAccepted(userID);
                  console.log("Accepted invites:", invites);
                } catch (error) {
                  console.error("Failed to retrieve invites:", error);
                }
              }}
            >
              View Archived
            </button>
          </div>
          <button
            className="flex h-12 w-full items-center bg-[#657B97] justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            onClick={async () => {
              console.log(userFamilies);
            }}
          >
            View Families
          </button>
        </div>
      </main>
      {/*Aside on the right bar (white space)*/}
      <aside className="flex min-h-screen w-120 bg-[white] items-center justify-center">
        <button className="bg-[#657B97] text-white py-2 px-4 rounded-3xl transition-colors dark:hover:bg-[#556880] disabled:opacity-50 w-[120px] z-10"
          onClick={async () => {
            try {
              console.log("opened inbox")
            } catch (error) {
              console.log("Inbox error", error);
            }
          }}>
          Inbox
        </button>
        <p className="text-black">Right</p>
      </aside>
    </div>
  );
}
