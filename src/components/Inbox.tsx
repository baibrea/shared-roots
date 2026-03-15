import { useState } from "react";
import { sendInvite, acceptInvite, retrievePending, retrieveAccepted } from "@/lib/inbox";
import { Invitation } from "@/lib/inbox";

export default function Inbox({
    uid,
    onClose
}: {
    uid: string;
    onClose: () => void;
}) {
    const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
    const [acceptedInvites, setAcceptedInvites] = useState<Invitation[]>([]);

    return (

        <div className="flex min-h-screen fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="flex flex-col w-full max-w-md p-8 rounded-3xl bg-[#f9f8f4] shadow-xl text-[#3A433A] gap-4">
                <h1 className="text-2xl font-bold mb-4">Inbox</h1>
                <div className="flex flex-row items-center gap-4">
                    <div id="accepted-invites" className="flex flex-col gap-2"></div>
                    <button
                    className="flex h-12 w-full items-center bg-[#657B97] justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
                    onClick={async () => {
                        try {
                        const invites = await retrievePending(uid);
                        console.log("Pending invites:", invites);
                        invites.forEach(invite => {
                            <div>
                                <p>Family Name: {invite.familyName}</p>
                                <p>Message: {invite.message}</p>
                                <p>From: {invite.name}</p>
                            </div>
                        });
                        
                        } catch (error) {
                        console.error("Failed to retrieve invites:", error);
                        }
                    }}
                    >
                    View Pending
                    </button>
                    <button
                    className="flex h-12 w-full items-center bg-[#657B97] justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
                    onClick={async () => {
                        try {
                        const invites = await retrieveAccepted(uid);
                        console.log("Accepted invites:", invites);
                        setAcceptedInvites(invites);
                        } catch (error) {
                        console.error("Failed to retrieve invites:", error);
                        }
                    }}
                    >
                    View Archived
                    </button>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-12 w-full items-center bg-[#657B97] justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
                >
                    Close Inbox
                </button>
            </div>
        </div>
    );    
}
