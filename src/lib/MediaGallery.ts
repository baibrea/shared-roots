import { doc, addDoc, getDoc, setDoc, updateDoc, collection, arrayUnion, getDocs, deleteDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { uploadBytes, ref, getDownloadURL, deleteObject } from "@firebase/storage";
import { use, useEffect, useState } from "react";

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

export default useMediaGallery;