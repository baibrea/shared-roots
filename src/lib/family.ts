import { doc, addDoc, getDoc, setDoc, updateDoc, collection, arrayUnion, getDocs } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { uploadBytes, ref, getDownloadURL } from "@firebase/storage";
import { get } from "http";

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

    // Creates a subcollection "people" and creates a document with the owner's information
    await addDoc(collection(db, "families", family.id, "people"), {
        firstName: firstName,
        lastName: lastName,
        birthDate: '',
        birthLocation: '',
        title: '',
        bio: '',
        healthDetails: '',
        parents: [],
        children: [],
        spouse: null
    });

    // Add family to user's families array
    await updateDoc(doc(db, "users", uid), {
        families: arrayUnion({ 
            id: family.id, 
            name: familyName 
        })
    });

    return family.id;
};

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

        // Adds the family to user's families array
        await updateDoc(doc(db, "users", uid), {
            families: arrayUnion({ 
                id: familyID, 
                name: familySnap.data().familyName 
            })
        });
        
    }
}

// Function to upload media file to family's cloud
export async function uploadMedia(
    familyID: string,
    media: File,
    mediaType: string,
    description: string,
    uploader: string
): Promise<void> { 
    // Gets family document and checks if it exists
    const familyRef = doc(db, "families", familyID);
    const familySnap = await getDoc(familyRef);

    const userRef = doc(db, "users", uploader);
    const userSnap = await getDoc(userRef);
    const uploaderName = userSnap.data()?.firstName + " " + userSnap.data()?.lastName;

    if (!familySnap.exists()) {
        throw new Error("Family does not exist");
    } else {

        // Uploads the media to the cloud
        const fileName = media.name + "-" + crypto.randomUUID();
        const storageRef = ref(storage, `families/${familyID}/media/${fileName}`);
        await uploadBytes(storageRef, media);

        // Adds media information to "media" subcollection
        await addDoc(collection(db, "families", familyID, "media"), {
            mediaURL: await getDownloadURL(storageRef),
            mediaType,
            description,
            uploader: uploaderName,
            uploadDate: new Date().getTime()
        });

    }
}

