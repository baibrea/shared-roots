import { doc, addDoc, updateDoc, getDocs, collection, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { joinFamily } from "@/lib/family";

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

// Function to retrieve pending invites
export async function retrievePending(
    uid: string
): Promise<Invitation[]> {
    // Finds all invites in the user inbox with a "pending" status
    const userInboxRef = collection(db, "users", uid, "inbox");
    const userInboxDoc = query(userInboxRef, where("status", "==", "pending"), orderBy("received", "desc")); 
    const userInboxSnap = await getDocs(userInboxDoc);
    
    // Maps documents to array
    return userInboxSnap.docs.map(doc => ({
        ...doc.data() as Invitation,
        inviteId: doc.id
    }));
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