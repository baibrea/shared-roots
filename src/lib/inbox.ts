import { doc, addDoc, updateDoc, getDocs, collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { joinFamily } from "@/lib/family";
import { useEffect, useState } from "react";

// Interface to act as a struct for invites
export interface Invitation {
    inviteId: string;
    familyName: string;
    familyID: string;
    message: string;
    name: string;
    status: string;
    received: Date; 
    accepted?: Date; 
}

// Function to send a family invitation
export async function sendInvite(
    message: string,
    familyID: string,
    familyName: string,
    firstName: string,
    lastName: string,
    email: string,
): Promise<string> {
    
    // Checks if an account with the associated email exists
    const usersRef = collection(db, "users");
    const userDoc = query(usersRef, where("email", "==", email)); 
    const userSnap = await getDocs(userDoc);

    if (userSnap.empty) {
        throw new Error("No account is associted with the provided email.");
    }

    // User information 
    const user = userSnap.docs[0];

    // Creates a new invitation document in user subcollection "inbox"
    const inviteRef = await addDoc(collection(db, "users", user.id, "inbox"), {
        familyName: familyName,
        familyID: familyID,
        message: message,
        name: firstName + " " + lastName,
        status: "pending",
        received: new Date()
    });

    return inviteRef.id;
}

// Function to accept invites
export async function acceptInvite(
    inviteID: string,
    familyID: string,
    firstName: string,
    lastName: string,
    uid: string    
): Promise<void> {
    
    // Tries accepting invitation
    try {
        // Success
        // Changes the status of the invitation doc to be accepted and acknowledges the timestamp
        await updateDoc(doc(db, "users", uid, "inbox", inviteID), {
            status: "accepted", 
            accepted: new Date()   
        });

        // Joins the family
        await joinFamily(familyID, firstName, lastName, uid);

    } catch (error) {
        // Failure
        console.log("Error accepting invite", error);
    }
}

// Function to retrieve archived invites
export async function retrieveAccepted(
    uid: string
): Promise<Invitation[]> {
    
    // Finds all invites in the user inbox with a "accepted" status
    const userInboxRef = collection(db, "users", uid, "inbox");
    const userInboxDoc = query(userInboxRef, where("status", "==", "accepted"), orderBy("received", "desc")); 
    const userInboxSnap = await getDocs(userInboxDoc);

    // Maps documents to array
    return userInboxSnap.docs.map(doc => ({
        ...doc.data() as Invitation,
        inviteId: doc.id
    }));
}

// Listener Hook for Invites - Yet to be tested
const useInvites = (uid: string) => {
    const [invites, setInvites] = useState<Invitation[]>([]);
    const [hasPending, setHasPending] = useState(false);

    // Real-time listener for invites
    useEffect(() => {
        const userInboxRef = collection(db, "users", uid, "inbox");
        const userInboxDoc = query(userInboxRef, orderBy("received", "desc")); 
        const unsubscribe = onSnapshot(userInboxDoc, (snapshot) => {
            const inviteList: Invitation[] = [];
            let pendingExists = false;
            snapshot.forEach((doc) => {
                const data = doc.data();
                const invite: Invitation = {
                    inviteId: doc.id,
                    familyName: data.familyName,
                    familyID: data.familyID,
                    message: data.message,
                    name: data.name,
                    status: data.status,
                    received: data.received.toDate(),
                    accepted: data.accepted ? data.accepted.toDate() : undefined
                };
                inviteList.push(invite);
                if (data.status === "pending") {
                    pendingExists = true;
                } 
            });
            setInvites(inviteList);
            setHasPending(pendingExists);
        });
        return () => unsubscribe();
     }, [uid]);

    return { invites, hasPending };
}

export { useInvites };