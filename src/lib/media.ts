import { doc, addDoc, getDoc, setDoc, updateDoc, collection, arrayUnion, getDocs, deleteDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { uploadBytes, ref, getDownloadURL, deleteObject } from "@firebase/storage";
import { use, useEffect, useState } from "react";

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

    // Throws an error if file is [] or media type is unknown
    if (media.size === 0 || mediaType === "unknown") {
        throw new Error("No file selected or file type is unsupported");
    }
    
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
                uploader: uploaderName,
                uploadDate: new Date().getTime()
            });
        }
    }
}

export async function deleteMedia(
    userId: string,
    familyID: string,
    mediaId: string,
    familyView: boolean
): Promise<void> {

    // Storage location check
    if (familyView) {

        // Deletes media from family document
        const docRef = doc(db, "families", familyID, "media", mediaId);
        await deleteDoc(docRef);

        // Deletes media from family storage
        const storageRef = ref(storage, `families/${familyID}/media/${mediaId}`);
        await deleteObject(storageRef);

    } else {

        // Deletes media from user document
        const docRef = doc(db, "users", userId, "media", mediaId);
        await deleteDoc(docRef);

        // Deletes media from user storage
        const storageRef = ref(storage, `users/${userId}/media/${mediaId}`);
        await deleteObject(storageRef);
    } 
}

export async function changeImage(
    targetId: string,
    mediaURL: string,
    familyView: boolean,
    familyID?: string | ""
): Promise<void> {

    if (familyView) {
        
        // Updates avatar in family document
        const familyRef = doc(db, "families", familyID || "", "people", targetId);
        await updateDoc(familyRef, {
            avatar: mediaURL
        });

    } else {

        // Updates avatar in user document
        const userRef = doc(db, "users", targetId);
        await updateDoc(userRef, {
            avatar: mediaURL
        });

    }
}

type MediaFile = {
    url: string;
    description: string;
    mediaType: string;
    uploader: string;
    uploadDate: number;
}; 

const useMediaGallery = (familyID: string, uid: string, familyView: boolean): MediaFile[] => {
    const [mediaData, setMediaData] = useState<MediaFile[]>([]);

    // Determines which collection to reference
    const collectionRef = familyView ? collection(db, "families", familyID, "media") : collection(db, "users", uid, "media");

    // Real-time listener for media storage
    useEffect(() => {
        const collectionQuery = query(collectionRef, orderBy("uploadDate", "desc"));
        const unsubscribe = onSnapshot(collectionQuery, (snapshot) => {
            const mediaList: { url: string; description: string; mediaType: string; uploader: string; uploadDate: number }[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                mediaList.push({
                    url: data.mediaURL,
                    description: data.description,
                    mediaType: data.mediaType,
                    uploader: data.uploader,
                    uploadDate: data.uploadDate
                });
            });
            setMediaData(mediaList);
        });

        return () => unsubscribe();
    }, [familyID, uid, familyView]);

    return mediaData;
};

// Avatar Listener for Dashboard
const useAvatar = (uid: string): string | null => {
    const [avatarURL, setAvatarURL] = useState<string | null>(null);
    useEffect(() => {
        if (!uid) return;

        const userRef = doc(db, "users", uid);
        const unsubscribe = onSnapshot(userRef, (snapshot) => {
            const data = snapshot.data();
            if (data && data.avatar) {
                setAvatarURL(data.avatar);
            }
        });

        return () => unsubscribe();
    }, [uid]);

    return avatarURL;
};

export { useMediaGallery, useAvatar };