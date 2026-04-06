"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged} from "firebase/auth";
import { collection, doc, DocumentData, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { logOut } from "@/lib/auth";
import { auth, db } from "@/lib/firebase";
import { createFamily } from "@/lib/family";
import Inbox from "@/components/Inbox";
import FamilyDropdown from "@/components/FamilyDropdown";
import { useFamily } from "@/lib/FamilyContext";

export default function Dashboard() {

  type Family = {
    id: string;
    name: string;
  };

  type FamilyMember = {
    name: string;
  }

  // Declares User Information Variables
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userID, setUserID] = useState("");
  const [userFamilies, setUserFamilies] = useState<Family[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  // Family Booleans
  const [familyCreated, setFamilyCreated] = useState(false);

  // Inbox
  const [showInbox, setShowInbox] = useState(false);
  const [hasPending, setHasPending] = useState(false);

  const [inboxView, setInboxView] = useState<"pending" | "archived" | "invite">("pending");
  const openInbox = (viewType: "pending" | "archived" | "invite") => {
      setInboxView(viewType);
      setShowInbox(true);
  };

  // Family Creation/Selection
  const [showCreateFamily, setShowCreateFamily] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");
  const { activeFamily, setActiveFamily } = useFamily();

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

              const families = data.families || [];
              setUserFamilies(families);

              // Check for pending invites
              const inboxAlert = onSnapshot(
                query(collection(db, "users", user.uid, "inbox"), where("status", "==", "pending")),
                (snapshot) => {
                  setHasPending(!snapshot.empty);
                },
                (error) => {
                  console.error("Failed to retrieve pending invites:", error);
                  setHasPending(false);
                }
              );
              return () => inboxAlert();
          }
      }
    });

    return () => unsubscribe();

  }, []);

  useEffect(() => {
    if (!activeFamily?.id) {
      return;
    }

    const membersRef = collection(db, "families", activeFamily.id, "members");

    const unsubscribeMembers = onSnapshot(membersRef, (snapshot) => {
      const membersData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as FamilyMember[];

      setFamilyMembers(membersData);  
    });

    return () => {
      setFamilyMembers([]);
      unsubscribeMembers();
    };
  }, [activeFamily]);

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-[#FFFFFF]">
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
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

        {/*TODO: Add Dropdown View Profile*/}
        <button className="mt-auto bg-[#657B97] text-white py-2 px-9 rounded-3xl transition-colors dark:hover:bg-[#556880] disabled:opacity-50 w-[110px] h-[50px]"
          onClick={async () => {
            try {
              openInbox("pending");
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
      </aside>
      
      <main className="flex min-h-screen w-full flex-row gap-10 py-20 px-16 bg-[#DDE7F4] sm:items-start">
        {/* Left side of the main area */}
        <div className="flex flex-col w-1/2 gap-6 bg-amber-50">
          <div className="flex flex-col w-full h-1/3 items-center bg-[#657B97] p-8 rounded-4xl justify-center gap-6 text-center sm:items-start sm:text-left">

            {/*Greeting card*/}
            <div className="flex flex-col w-full justify-between items-center gap-4 lg:flex-row">
              <h1 className="max-w-s text-3xl font-semibold leading-10 tracking-tight text-black">
                Welcome to Shared Roots.
              </h1>
              <Image
              src="/avatar-girl-svgrepo-com.svg"
              alt="avatar image"
              width={150}
              height={150}
              priority
              className="rounded-full bg-white p-1"
              />
            </div>
            <p className="max-w-md text-lg leading-8 text-black">
              Greetings {firstName} {lastName}!
            </p>
          </div>

          {/* Timeline */}
          <div className="bg-[#657B97] rounded-4xl p-8 text-center text-black">
            <p>Timeline stuff</p>
          </div>
        </div>

        {/* Right side of the main area */}
        {/* Family Tree */}
        <div className="flex flex-col w-1/2 h-full rounded-4xl gap-4 p-4 text-base bg-red-200">
          <div className="flex flex-row items-center justify-between w-full gap-4">
            
            {userFamilies.length > 0 ? (
              <FamilyDropdown 
                families={userFamilies}
                onCreateFamily={() => {
                  setShowCreateFamily(true);
                }}
                showCreate={true}
              />
            ) : (
              <button
                className="w-1/3 min-w-40 max-w-60 py-3 px-5 text-left bg-white hover:bg-gray-100 rounded-md font-semibold text-black"
                onClick={() => setShowCreateFamily(true)}
              >
                + Create Family
              </button>
            )}

            <button className="bg-[#657B97] text-white py-2 px-9 rounded-md transition-colors dark:hover:bg-[#556880] disabled:opacity-50 w-[110px] h-[50px]"
              onClick={async () => {
                try {
                  openInbox("invite");
                } catch (error) {
                  console.log("Inbox error", error);
                  setShowInbox(false);
                }
              }}>
              <span className="relative inline-block">
                <p>
                  Invite
                </p>
              </span>
            </button>
          </div>

          <div className="flex flex-col w-full h-full text-center text-black bg-blue">
            <ul className="gap-4 flex flex-col">      
              {familyMembers.length === 0 ? (
                <li>
                  Create a family to get started!
                </li>
              ) : (    
                <>
                  <Link href="/familytree" className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-white px-5 text-black transition-colors dark:hover:bg-[#556880]">
                    Go to Family Tree
                  </Link>
                  <h3 className="py-2 font-bold text-xl"> Users </h3>
                  {familyMembers.map((member) => (
                    <li key={member.name}
                    className="bg-white rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <button className="w-full h-full p-3 text-black text-left">
                        {member.name}
                      </button>
                    </li>
                  ))}
                </>
              )}
            </ul>

          </div>

        </div>
      </main>

      {showInbox && (
        <Inbox 
          docRef={doc(db, "users", userID)}
          uid={userID}
          families={userFamilies}
          firstName={firstName}
          lastName={lastName}
          viewType={inboxView}
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

      {showCreateFamily && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96">
            
            <h2 className="text-lg font-semibold mb-4 text-black">
              Create Family
            </h2>

            <input
              className="w-full border p-2 rounded mb-4 text-black"
              placeholder="Family Name"
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-400 rounded-md"
                onClick={() => setShowCreateFamily(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-[#657B97] text-white rounded-md"
                onClick={async () => {
                  if (!newFamilyName) return;

                  try {
                  const familyId = await createFamily(
                    newFamilyName,
                    firstName,
                    lastName,
                    userID
                  );
                    console.log("Succesfully created family:", newFamilyName);
                    setFamilyCreated(true);


                  // Update userFamilies state to include the newly created family
                  const newFamily = { id: familyId, name: newFamilyName };

                  setUserFamilies(prev => [...prev, newFamily]);

                  setActiveFamily(newFamily);

                  setShowCreateFamily(false);

                  } catch (error) {
                    console.error("Failed to create family:", error);
                    setFamilyCreated(false);
                  }
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
