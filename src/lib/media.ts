import { doc, addDoc, getDoc, setDoc, updateDoc, collection, arrayUnion, getDocs } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { uploadBytes, ref, getDownloadURL } from "@firebase/storage";

// Function to upload media file to family's cloud
export async function uploadMedia(
    familyID: string,
    media: File,
    mediaType: string,
    description: string,
    uploader: string,
    familyView: boolean
): Promise<void> { 
    // Gets family document and checks if it exists
    const familyRef = doc(db, "families", familyID);
    const familySnap = await getDoc(familyRef);

    const userRef = doc(db, "users", uploader);
    const userSnap = await getDoc(userRef);
    const uploaderName = userSnap.data()?.firstName + " " + userSnap.data()?.lastName;

    // Uploads to family storage if on the family tree page
    if (familyView) {
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
    } else {

        // Uploads to user storage if on the dashboard page
        if (!userSnap.exists()) {
            throw new Error("User does not exist");
        } else {
            // Uploads the media to the cloud
            const fileName = media.name + "-" + crypto.randomUUID();
            const storageRef = ref(storage, `users/${uploader}/media/${fileName}`);
            await uploadBytes(storageRef, media);

            await addDoc(collection(db, "users", uploader, "media"), {
                mediaURL: await getDownloadURL(storageRef),
                mediaType,
                description,
                uploadDate: new Date().getTime()
            });
        }
    }
}

export async function retrieveMedia(
    familyID: string,
    uid: string,
    familyView: boolean
): Promise<{ url: string; description: string; mediaType: string; uploader: string; uploadDate: number }[]> {
    let mediaData: { url: string; description: string; mediaType: string; uploader: string; uploadDate: number }[] = [];

    // Checks what page the function is called in
    if (familyView) {

        // Retrieves media from family storage
        const mediaQuerySnapshot = await getDocs(collection(db, "families", familyID, "media"));
        mediaData = mediaQuerySnapshot.docs.map((doc) => ({
            url: doc.data().mediaURL,
            description: doc.data().description,
            mediaType: doc.data().mediaType,
            uploader: doc.data().uploader,
            uploadDate: doc.data().uploadDate
        }));

    } else {

        // Retrieves media from user storage
        const mediaQuerySnapshot = await getDocs(collection(db, "users", uid, "media"));
        mediaData = mediaQuerySnapshot.docs.map((doc) => ({
            url: doc.data().mediaURL,
            description: doc.data().description,
            mediaType: doc.data().mediaType,
            uploader: doc.data().uploader,
            uploadDate: doc.data().uploadDate
        }));

    }
    return mediaData;
}