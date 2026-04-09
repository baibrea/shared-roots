import { useState, useEffect } from "react";
import { sendInvite, acceptInvite, retrieveAccepted } from "@/lib/inbox";
import { Invitation } from "@/lib/inbox";
import { collection, getDoc, DocumentReference, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Send } from "lucide-react";
import Image from "next/image";

export default function Inbox({
    docRef,
    uid,
    families,
    firstName,
    lastName,
    onClose,
    onFamiliesUpdate,
    viewType = "pending"
}: {
    docRef: DocumentReference;
    uid: string;
    families: { id: string; name: string }[];
    firstName: string;
    lastName: string;
    onClose: (returnValue: boolean) => void;
    onFamiliesUpdate: (families: { id: string; name: string }[]) => void;
    viewType: "pending" | "archived" | "invite";
}) {
    const [inboxView, setInboxView] = useState<"pending" | "archived" | "invite">(viewType);
    const [inviteMessage, setInviteMessage] = useState("");
    const [familyName, setFamilyName] = useState("");
    const [email, setEmail] = useState("");
    const [familyID, setFamilyID] = useState("");
    const [invites, setInvites] = useState<Invitation[]>([]);
    const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(false);
    const [acceptedInvite, setAcceptedInvite] = useState(false);

    // Listener for setting the view type
    useEffect(() => {
        setInboxView(viewType);
    }, [viewType]);

    // Real-time listener for pending invites
    useEffect(() => {
        const q = query(
            collection(db, "users", uid, "inbox"),
            where("status", "==", "pending"),
            orderBy("received", "desc")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const pending = snapshot.docs.map(doc => ({
                ...doc.data() as Invitation,
                inviteId: doc.id
            }));
            setPendingInvites(pending);
        }, (error) => {
            console.error("Failed to listen for pending invites:", error);
        });
        return () => unsubscribe();
    }, [uid]);

    // Sending Invitation Logic
    const handleSendInvite = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        try {
            await sendInvite(inviteMessage, familyID, familyName, firstName, lastName, email);
            setSuccess(true);
            setError(false);
        } catch (error) {
            console.error("Failed to send invite:", error);
            setError(true);
            setSuccess(false);
        }
    }

    return (
        <div className="flex min-h-screen fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="flex flex-col w-full h-150 max-w-md p-8 rounded-3xl bg-[#f9f8f4] shadow-xl text-[#3A433A] gap-4 overflow-y-auto
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-thumb]:bg-gray-400
                [&::-webkit-scrollbar-thumb:hover]:bg-gray-500"
            >
                <div className="flex flex-row justify-end gap-40">
                    <h1 className="text-2xl font-bold mb-4">Inbox</h1>    
                    <button
                        type="button"
                        onClick={() => onClose(pendingInvites.length > 0)}
                        className="flex h-10 w-10 items-center bg-[#657B97] justify-center rounded-full border border-solid border-black/[.08] transition-colors hover:border-transparent hover:bg-black/[.01] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
                    >
                        <Image 
                            src="../close-1511-svgrepo-com.svg" 
                            alt="Close Inbox"
                            width={20}
                            height={20}
                        />
                    </button>
                </div>
                <hr></hr>
                <div className="flex flex-row items-center gap-4">
                    <button
                    className="flex h-12 w-full items-center bg-[#657B97] justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] dark:text-white md:w-[158px]"
                    onClick={() => {
                        setInboxView("pending");
                        setSuccess(false);
                        setError(false);
                    }}
                    >
                    View Pending
                    </button>
                    <button
                    className="flex h-12 w-full items-center bg-[#657B97] justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] dark:text-white md:w-[158px]"
                    onClick={async () => {
                        try {
                            const accepted = await retrieveAccepted(uid);
                            setInvites(accepted);
                            setInboxView("archived");
                            setSuccess(false);
                            setError(false);
                        } catch (error) {
                            console.error("Failed to retrieve archived invites:", error);
                        }
                    }}
                    >
                    View Archived
                    </button>
                    <button
                    className="flex h-12 w-full items-center bg-[#657B97] justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] dark:text-white md:w-[158px]"
                    onClick={async () => {
                        try {
                            setInboxView("invite");
                            setSuccess(false);
                            setError(false);
                        } catch (error) {
                            console.error("Failed to send invite:", error);
                        }
                    }}
                    >
                    Invite
                    </button>
                </div>
                {/* Inbox Window Display Behavior*/}

                {/*Succeess and Fail Messages*/}
                {success && inboxView === "pending" &&(
                    <p className="bg-green-200 text-green-800 p-2 rounded mb-4">
                    <b>Invitation accepted.</b>
                    </p>
                )}

                {success && inboxView === "invite" &&(
                    <p className="bg-green-200 text-green-800 p-2 rounded mb-4">
                    <b>Invitation sent.</b>
                    </p>
                )}

                {error && inboxView === "pending" && !acceptedInvite &&(
                    <p className="bg-red-200 text-red-800 p-2 rounded mb-4">
                    <b>Failed to load pending invites.</b>
                    </p>
                )}

                {error && inboxView === "archived" &&(
                    <p className="bg-red-200 text-red-800 p-2 rounded mb-4">
                    <b>Failed to load archived invites.</b>
                    </p>
                )}

                {error && inboxView === "pending" && acceptedInvite &&(
                    <p className="bg-red-200 text-red-800 p-2 rounded mb-4">
                    <b>Failed to accept invite.</b>
                    </p>
                )}
                
                {error && inboxView === "invite" &&(
                    <p className="bg-red-200 text-red-800 p-2 rounded mb-4">
                    <b>Failed to send invite.</b>
                    </p>
                )}

                {/* Pending Invites Window */}
                {inboxView === "pending" && (
                    <div className="flex flex-col gap-2">
                        <p><strong>Pending Invitations</strong></p><hr></hr>
                        {pendingInvites.length === 0 ? (
                            <p>No pending invitations.</p>
                        ) : (
                            pendingInvites.map((invite) => (
                                <div key={invite.inviteId} className="flex flex-col gap-1 p-2 border rounded">
                                    <p><strong>Family:</strong> {invite.familyName}</p>
                                    <p><strong>From:</strong> {invite.name}</p>
                                    <p><strong>Message:</strong> {invite.message}</p>
                                    <p><strong>Status:</strong> {invite.status}</p>
                                    <button
                                    className="flex h-12 w-full items-center bg-[#657B97] justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] dark:text-white md:w-[158px]"
                                    onClick={async () => {
                                        try {
                                            await acceptInvite(invite.inviteId, invite.familyID, firstName, lastName, uid);
                                            setAcceptedInvite(true);
                                            setSuccess(true);
                                            setError(false);
                                            
                                            // Updates families in parent
                                            const docSnap = await getDoc(docRef);
                                            const data = docSnap.data();
                                            if (data) {
                                                onFamiliesUpdate(data.families.map((f: { id: string; name: string }) => ({ id: f.id, name: f.name })));
                                            }

                                        } catch (error) {
                                            console.error("Failed to accept invite:", error);
                                            setAcceptedInvite(true);
                                            setSuccess(false);
                                            setError(true);
                                        }
                                    }}
                                    >
                                    Accept Invite
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Archived Invites Window */}
                {inboxView === "archived" && (
                    <div className="flex flex-col gap-2">
                        <p><strong>Archived Invitations</strong></p><hr></hr>
                        {invites.length === 0 ? (
                            <p>No archived invitations.</p>
                        ) : (
                            invites.map((invite) => (
                                <div key={invite.inviteId} className="flex flex-col gap-1 p-2 border rounded overflow-y-auto">
                                    <p><strong>Family:</strong> {invite.familyName}</p>
                                    <p><strong>From:</strong> {invite.name}</p>
                                    <p><strong>Message:</strong> {invite.message}</p>
                                    <p><strong>Status:</strong> {invite.status}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Send Invites Window */}
                {inboxView === "invite" && (
                    <div className="flex flex-col gap-2">
                        <p><strong>Invite a User</strong></p><hr></hr>
                        <form onSubmit={handleSendInvite} className="flex flex-col gap-4">
                            <select 
                                id="select-family" 
                                className="p-2 border rounded"
                                onChange={(e) => { setFamilyID(e.target.value); setFamilyName(e.target.options[e.target.selectedIndex].text); }}
                                required
                            >
                                <option>Select a family</option>
                                {families.map((family) => (
                                    <option key={family.id} value={family.id}>
                                        {family.name}
                                    </option>
                                ))}
                            </select>
                            <input 
                                type="text" 
                                id="destination-email" 
                                placeholder="To" 
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="p-2 border rounded mt-2 w-full" 
                            />
                            <textarea 
                                id="message" 
                                placeholder="Message" 
                                onChange={(e) => setInviteMessage(e.target.value)}
                                className="p-2 border rounded mt-2 w-full"
                            />
                            <button
                            className="flex h-12 w-full items-center bg-[#657B97] justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:text-white dark:hover:bg-[#1a1a1a] md:w-[158px]"
                            type="submit"  
                            >
                            Send Invite
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );    
}
