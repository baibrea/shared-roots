"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged} from "firebase/auth";
import { doc, DocumentData, DocumentReference, getDoc } from "firebase/firestore";
import { logOut } from "@/lib/auth";
import { auth, db } from "@/lib/firebase";
import { createFamily } from "@/lib/family";
import { sendInvite, acceptInvite, retrievePending, retrieveAccepted } from "@/lib/inbox";
import Inbox from "@/components/Inbox";

export default function Dashboard() {
    // Declares User Information Variables
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [userID, setUserID] = useState("");
    const [inputText, setInputText] = useState("");
    const [familyId, setFamilyId] = useState("");
    const [familyName, setFamilyName] = useState("");
    const [userFamilies, setUserFamilies] = useState<DocumentData[]>();

    // Family Booleans
    const [familyCreated, setFamilyCreated] = useState(false);
    const [familyJoined, setFamilyJoined] = useState(false);
    const [familyJoinFailed, setFamilyJoinFailed] = useState(false);

    // Inbox
    const [showInbox, setShowInbox] = useState(false);
    const [hasPending, setHasPending] = useState(false);

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

                // Check for pending invites
                try {
                  const pendingInvites = await retrievePending(data.uid);
                  if (pendingInvites.length > 0) {
                    setHasPending(true);
                  } else {
                    setHasPending(false);
                  }
                } catch (error) {
                  console.error("Failed to retrieve pending invites:", error);
                  setHasPending(false);
                }
            }
        }
      });

      return () => unsubscribe();

    }, []);

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-[#FFFFFF]">
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <aside className="flex flex-col min-h-screen w-60 bg-[#657B97] items-center justify-center gap-4 justify-start py-10">
        {/*TODO: Add Shared Roots Logo*/}
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
          {
            showInbox && (
            <Inbox 
              docRef={doc(db, "users", userID)}
              uid={userID}
              families={userFamilies?.map(family => ({ id: family.id, name: family.name })) || []}
              firstName={firstName}
              lastName={lastName}
              onClose={(returnValue: boolean) => {
                setShowInbox(false);

                // Hides alerts if pending invites are cleared
                if (returnValue) {
                  setHasPending(true);
                } else {
                  setHasPending(false);
                }
              }}
              onFamiliesUpdate={(newFamilies) => setUserFamilies(newFamilies)} 
            />
          )}

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

          {/*Greeting card*/}
          <div className="flex max-w-2xl flex-col gap-4 bg-[#657B97] p-10 rounded-lg justify-center items-center ml-90">
            <div className="flex flex-row items-center gap-4">
              <h1 className="max-w-s text-3xl font-semibold leading-10 tracking-tight text-black">
                Welcome to Shared Roots.
              </h1>
              <Image
              src="/avatar-girl-svgrepo-com.svg"
              alt="avatar image"
              width={200}
              height={200}
              priority
              />
            </div>
              <p className="max-w-md text-lg leading-8 text-black">
                Greetings {firstName} {lastName}!
              </p>
          </div>

        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Link href="/familytree" className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#657B97] px-5 text-white transition-colors dark:hover:bg-[#556880] md:w-[158px]">
            Family Tree
          </Link>   
        </div>
        <div className="flex flex-col gap-4 w-full">
          {/*Input Bars*/}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text here - Destination Email or Invitation Id"
            className="w-full px-4 py-2 border border-solid border-black/[.08] rounded-full dark:border-white/[.145] dark:bg-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#698b6a]"
          />
          <input
            type="text"
            value={familyId}
            onChange={(e) => setFamilyId(e.target.value)}
            placeholder="Enter family id - Only for invitation acceptance"
            className="w-full px-4 py-2 border border-solid border-black/[.08] rounded-full dark:border-white/[.145] dark:bg-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#698b6a]"
          />
          <input
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="Enter family name"
            className="w-full px-4 py-2 border border-solid border-black/[.08] rounded-full dark:border-white/[.145] dark:bg-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#698b6a]"
          />
          <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
            <button
              className="flex h-12 w-full items-center bg-[#657B97] justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
              onClick={async () => {
                try {
                  const family = await createFamily(familyName, firstName, lastName, userID);
                  console.log("Succesfully created family:", familyName);
                  setFamilyCreated(true);

                  // Update userFamilies state to include the newly created family
                  setUserFamilies(families => [...(families || []), { id: family, name: familyName }]);
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
                  await sendInvite("Join my family", familyId, familyName, firstName, lastName, inputText);
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
                  await acceptInvite(inputText, familyName, firstName, lastName, userID);
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
      
      <aside className="flex flex-col min-h-screen w-120 bg-[white] items-center pt-10 pb-10">
          <div className="flex flex-row items-center gap-4">
            {/*TODO: Implement avatar retrievel from database*/}
            <Image
              src="/avatar-girl-svgrepo-com.svg"
              alt="avatar image"
              width={80}
              height={80}
              priority
            />
            <p className="max-w-md text-lg leading-20 text-black">
              <strong>{firstName} {lastName}</strong>
            </p>
            {/*TODO: Add Dropdown View Profile*/}
            <button className="bg-[#657B97] text-white py-2 px-9 rounded-3xl transition-colors dark:hover:bg-[#556880] disabled:opacity-50 w-[110px] h-[50px]"
              onClick={async () => {
                try {
                  console.log("opened inbox")
                  setShowInbox(true);
                } catch (error) {
                  console.log("Inbox error", error);
                  setShowInbox(false);
                }
              }}>
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
          </div>

          <button
              type="submit"
              className="mt-auto w-[160px] bg-[#657B97] text-white py-2 rounded-3xl transition-colors dark:hover:bg-[#556880]"
              onClick={() => logOut(router)}
              >
              Sign Out
          </button>
      </aside>
    </div>
  );
}
