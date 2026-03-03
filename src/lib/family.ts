import { doc, addDoc, getDoc, setDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Function to create a new family. Returns family ID
export async function createFamily(
    familyName: string,
    firstName: string,
    lastName: string,
    uid: string
): Promise<string> {

    // Creates a new family document in "families" collection
    const family = await addDoc(collection(db, "families"), {
        familyName,
        createdAt: new Date(),
        owner: firstName + " " + lastName,
        ownerID: uid
    });

    // Creates a subcollection "members" and creates a user document
    await setDoc(doc(db, "families", family.id, "members", uid), {
        name: firstName + " " + lastName,
        role: "owner",
        joinDate: new Date()
    });

    return family.id;
}

// Function to join a family
export async function joinFamily(
    familyID: string,
    firstName: string,
    lastName: string,
    uid: string    
): Promise<void> {

    // Gets family document and checks if it exists
    const familyRef = doc(db, "families", familyID);
    const familySnap = await getDoc(familyRef);
    
    if (!familySnap.exists()) {
        throw new Error("Family does not exist");
    } else {

        // Joins a family using its id and adds the user to subcollection "members"
        await setDoc(doc(db, "families", familyID, "members", uid), {
            name: firstName + " " + lastName,
            role: "member",
            joinDate: new Date()
        });
        
    }
}