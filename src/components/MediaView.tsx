import { useState, useEffect } from "react";
import { sendInvite, acceptInvite, retrieveAccepted } from "@/lib/inbox";
import { Invitation } from "@/lib/inbox";
import { collection, getDoc, DocumentReference, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { retrieveMedia } from "@/lib/media";
import Image from "next/image";

export default function MediaView ({
    uid,
    familyID,
    familyView,
    onClose
}: {
    uid: string;
    familyID: string;
    familyView: boolean;
    onClose: (returnValue: boolean) => void;
}) {
    const [media, setMedia] = useState<{ url: string; description: string; mediaType: string; uploader: string; uploadDate: number }[]>([]);

    useEffect(() => {

        const fetchMedia = async () => {
            const mediaData = await retrieveMedia(familyID, uid, familyView);
            setMedia(mediaData);
        };

        fetchMedia();

    }, [uid, familyID, familyView]);


    return (
        <div className="flex min-h-screen fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="flex flex-col w-full h-200 max-w-6xl p-8 rounded-3xl bg-[#f9f8f4] shadow-xl text-[#3A433A] gap-4 overflow-y-auto
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-thumb]:bg-gray-400
                [&::-webkit-scrollbar-thumb:hover]:bg-gray-500"
            >
                <div className="flex flex-row justify-end gap-40">
                    <h1 className="text-3xl font-bold mr-60">Media Gallery</h1>    
                    <button
                        type="button"
                        onClick={() => onClose(false)}
                        className="flex h-10 w-10 items-center bg-[#657B97] justify-center rounded-full border border-solid border-black/[.08] transition-colors hover:border-transparent hover:bg-black/[.01] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
                    >
                        <Image 
                            src="../close-1511-svgrepo-com.svg" 
                            alt="Close"
                            width={20}
                            height={20}
                        />
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {media.map((mediaFile, index) => (
                        <div key={index} className="flex flex-col items-center gap-2">
                            {mediaFile.mediaType.startsWith("image/") ? (
                                <Image 
                                    src={mediaFile.url}
                                    alt={mediaFile.description}
                                    width={200}
                                    height={200}
                                    className="object-cover rounded-lg"
                                />
                            ) : (
                                <video controls className="w-full rounded-lg">
                                    <source src={mediaFile.url} type={mediaFile.mediaType} />
                                    Your browser does not support the video tag.
                                </video>
                            )}
                            <p className="text-sm text-gray-600">{mediaFile.description}</p>
                            <p className="text-xs text-gray-400">Uploaded by {mediaFile.uploader} on {new Date(mediaFile.uploadDate).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}