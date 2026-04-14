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
import MediaView from "@/components/MediaView";
import useInvites from "@/lib/inbox";
import { useAvatar } from "@/lib/media";
import { useFamily } from "@/lib/FamilyContext";
import Sidebar from "@/components/Sidebar";

export default function Dashboard() {

  type Family = {
    id: string;
    name: string;
  };

  type FamilyMember = {
    name: string;
    role: string;
  }

  // Declares User Information Variables
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userID, setUserID] = useState("");
  const [userFamilies, setUserFamilies] = useState<Family[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [avatarURL, setAvatarURL] = useState("/avatar-girl-svgrepo-com.svg");
  const currentAvatar = useAvatar(userID);
  //const inbox = useInvites(userID);

  // Media Handling Variables
  const [showMediaWindow, setShowMediaWindow] = useState(false);
  const [familyView, setFamilyView] = useState(false); // Indicates for media upload/retrieval that it is the dashboard page

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
    <div className="flex min-h-screen font-sans">
      <meta name="viewport" content="width=device-width, initial-scale=1"/>

      {/* Left Header */}
      <Sidebar
        firstName={firstName}
        lastName={lastName}
        hasPending={hasPending}
        openInbox={openInbox}
        showInbox={true}
      />
      
      <main className="flex min-h-screen w-full flex-row gap-10 py-12 px-6 sm:px-10 lg:px-20 xl:px-36 bg-[#b9c4b9] sm:items-start">
        <div className="flex flex-col w-full h-full gap-10">
          {/* Top of the main area */}
          <div className="flex flex-col w-full h-1/3 items-center bg-[#2c3224] p-8 rounded-2xl justify-center gap-6 text-center sm:items-start sm:text-left shadow-lg">

            {/*Greeting card*/}
            <div className="flex flex-row w-full justify-between items-center lg:flex-row">
              <div className="ml-10">
                <h1 className="max-w-s text-3xl font-semibold leading-10 tracking-tight text-white">
                  Welcome to Shared Roots.
                </h1>
                <p className="max-w-md text-lg mt-4 text-[#bfcab2]">
                  Greetings {firstName} {lastName}!
                </p>
              </div>
              <button 
                className="hover:brightness-75 transition-all duration-150 rounded-full"
                onClick ={() => {setShowMediaWindow(true);}}
              >
                <Image
                src={currentAvatar || avatarURL}
                alt="avatar image"
                width={150}
                height={150}
                priority
                className="rounded-full bg-white p-1 mr-10"
                />
              </button>
            </div>
          </div>

          {/* Bottom of main area */}
          <div className="flex flex-row w-full h-2/3 gap-10">
            {/* Timeline */}
            <div className="bg-white w-1/2 min-w-0 rounded-2xl p-8 text-center text-black shadow-lg">
              <p>Timeline</p>
            </div>

            {/* Family Tree */}
            <div className="flex flex-col w-1/2 min-w-0 h-full rounded-2xl gap-4 p-4 text-base bg-white shadow-lg">
              <div className="flex flex-row items-center justify-between w-full gap-4 flex-wrap">
                
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

                <button className="bg-[#7b8b69] hover:bg-[#5e6e4b] text-white py-2 px-9 rounded-md transition-colors disabled:opacity-50 w-[110px] h-[50px] shadow-md"
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

              <div className="flex flex-col w-full h-full px-4 items-center text-center text-black bg-blue">
                <ul className="gap-6 w-full flex flex-col items-center">      
                  {familyMembers.length === 0 ? (
                    <li className="w-full">
                      Create a family to get started!
                    </li>
                  ) : (    
                    <>
                      <h3 className="w-full text-left pt-2 font-bold text-xl"> Users </h3>
                      <div className="grid grid-cols-[2fr_1fr_100px] w-full text-left border-b-2 border-gray-300 pb-4 justify-items-start">
                        <p className="truncate">Username</p>
                        <p className="truncate text-left">Role</p>
                        <p className="truncate">Modify</p>
                      </div>

                      {familyMembers.map((member) => (
                        <li key={member.name}
                        className="w-full rounded-md transition-colors"
                        >
                          <div className="grid grid-cols-[2fr_1fr_100px] w-full items-center">
                            <p className="text-left text-black truncate">
                              {member.name}
                            </p>

                            <p className="text-left truncate">
                              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </p>

                            <div className="flex flex-row gap-2 text-left whitespace-nowrap">
                              <button>
                                <Image
                                  src="edit-svgrepo-com.svg"
                                  alt="Edit"
                                  width={30}
                                  height={30}
                                  className="opacity-75 cursor-pointer"
                                />
                              </button>
                              <button>
                                <Image
                                  src="close-1511-svgrepo-com.svg"
                                  alt="Remove"
                                  width={20}
                                  height={20}
                                  className="opacity-75 cursor-pointer"
                                />
                              </button>
                            </div>
                          </div>
                          
                        </li>

                      ))}
                      <Link href="/familytree" className="flex w-1/2 bg-[#2c3224] hover:bg-[#1a1a1a] text-white items-center justify-center gap-2 rounded-md px-5 py-4 transition-colors shadow-lg">
                        View Family Tree
                      </Link>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Inbox Button */}
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

      {/* Form to create family */}
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
                className="px-4 py-2 bg-gray-300 rounded-md text-black"
                onClick={() => setShowCreateFamily(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-[#2c3224] text-white rounded-md"
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

      {showMediaWindow && (
        <MediaView
          uid={userID}
          familyID={activeFamily ? activeFamily.id : ""}
          familyView={familyView}
          onClose={(returnValue: boolean) => {
            setShowMediaWindow(false);
          }}
        />
      )}

    </div>
  );
}
