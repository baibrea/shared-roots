import { useState, useEffect } from "react";
import { collection, getDoc, DocumentReference, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { changeImage, deleteMedia, uploadMedia } from "@/lib/media";
import { useMediaGallery } from "@/lib/media";
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
    const media = useMediaGallery(familyID, uid, familyView);
    const [uploadMessage, setUploadMessage] = useState<string>("");
    const [fileName, setFileName] = useState<string>("No file selected");
    const [uploadResult, setUploadResult] = useState<string>("");
    const [resultColor, setResultColor] = useState<string>("text-red-600");

    const handleMediaUpload = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const mediaFile = formData.get("mediaFile") as File;
        const description = formData.get("description") as string;
        const mediaType = mediaFile.type;

        // Checks if empty file [] is uploaded or media type is unknown
        if (mediaFile.size === 0 || mediaType === "unknown") {
            setUploadResult("No file selected or file type is unsupported");
            setResultColor("text-red-600");
            return;
        }

        try {
            await uploadMedia(familyID, mediaFile, mediaType, description, uid, familyView);
            console.log("Media uploaded successfully");
            setUploadResult("Media uploaded successfully");
            setResultColor("text-green-600");
        } catch (error) {
            console.error("Error uploading media:", error);
            setUploadResult("Error uploading media. Please try again.");
            setResultColor("text-red-600");
        }
    };

    return (
        <div className="flex min-h-screen fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="flex flex-col w-full h-200 max-w-6xl p-8 rounded-3xl bg-[#f9f8f4] shadow-xl text-[#3A433A] gap-4 overflow-y-auto
                [&::-webkit-scrollbar]:w-2
                [&::-webkit-scrollbar-thumb]:bg-gray-400
                [&::-webkit-scrollbar-thumb:hover]:bg-gray-500"
            >
                <div className="flex flex-row justify-end absolute gap-40 bg-[#f9f8f4] p-4 rounded-tl-lg rounded-tr-lg top-18 left-1/2 -translate-x-1/2 w-full max-w-6xl border-b border-gray-300">
                    <h1 className="text-3xl font-bold mr-60">Media Gallery</h1>    
                    <button
                        type="button"
                        onClick={() => onClose(false)}
                        className="flex h-10 w-10 items-center bg-[#2c3224] hover:bg-[#1a1a1a] justify-center rounded-full border border-solid transition-colors hover:border-transparent dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
                    >
                        <Image 
                            className="invert"
                            src="../close-1511-svgrepo-com.svg" 
                            alt="Close"
                            width={20}
                            height={20}
                        />
                    </button>
                </div>
                <hr className="my-4"></hr>
                <div className="grid grid-cols-3 gap-6 mt-4">
                    {media.map((mediaFile, index) => (
                        <div key={index} className="flex flex-col items-center gap-2">
                            {mediaFile.mediaType.startsWith("image/") && (
                                <span className="relative">
                                <button
                                    type="button"
                                    onClick = {
                                        familyView ? () => changeImage(uid, mediaFile.url, true, familyID) : () => changeImage(uid, mediaFile.url, false)
                                    }
                                    className="translate-x-20 flex h-5 w-5 items-center justify-center rounded-full border border-solid transition-colors hover:bg-[#657B97] dark:border-white/[.145] "
                                >
                                    <Image 
                                        src="../edit-svgrepo-com.svg" 
                                        alt="Change"
                                        width={20}
                                        height={20}
                                    />
                                </button>
                                </span>
                            )}
                            {mediaFile.mediaType === "image/svg+xml" ? (
                                // Uses img tag for SVGs since Image does not support them
                                <img
                                    src={mediaFile.url}
                                    alt={mediaFile.description || "Image file"}
                                    className="object-cover rounded-lg w-[150px] h-[150px]"
                                />
                            ) : mediaFile.mediaType.startsWith("image/") ? (
                                <Image 
                                    src={mediaFile.url}
                                    alt={mediaFile.description || "Image file"}
                                    width={200}
                                    height={200}
                                    className="object-cover rounded-lg"
                                />
                            ) : (
                                <video controls className="rounded-lg">
                                    <source src={mediaFile.url} type={mediaFile.mediaType} />
                                    Your browser does not support the video tag.
                                </video>
                            )}
                            <p className="text-sm text-gray-600">{mediaFile.description || "No description"}</p>
                            <p className="text-xs text-gray-400">Uploaded by {mediaFile.uploader || "Unknown"} on {new Date(mediaFile.uploadDate).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
                <hr className="my-4"></hr>
                {uploadResult && <p className={`text-sm ${resultColor}`}>{uploadResult}</p>}
                <div className="flex flex-row items-center gap-4 absolute bg-[#f9f8f4] p-4 rounded-lg max-w-6xl bottom-8 w-full justify-center left-1/2 -translate-x-1/2 border-t border-gray-300">
                    {/* Upload form for media files: Covers the length of the above div */}
                    <form onSubmit={handleMediaUpload} className="flex flex-row justify-center items-center gap-4 border border-gray-300 rounded-lg p-4 w-full max-w-3xl">
                        <input
                            type="text"
                            placeholder="Enter description"
                            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#657B97] max-w-lg"
                            name="description"
                            onChange ={(e) => setUploadMessage(e.target.value)}
                        />

                        <label htmlFor="mediaFile" className="px-4 py-2 bg-[#7b8b69] hover:bg-[#5e6e4b] text-white rounded-2xl cursor-pointer transition-all">
                            Choose File
                        </label>                    
                        <input 
                            type="file" id="mediaFile" name="mediaFile" className="hidden" 
                            onChange={(e) => setFileName(e.target.files?.[0]?.name || "No file chosen")} />
                        <label htmlFor="mediaFile" className="text-lg text-gray-600">{fileName}</label>
                        
                        <button 
                            className="ml-4 px-4 py-2 bg-[#2c3224] text-white rounded-2xl hover:bg-[#1a1a1a] cursor-pointer transition-all"
                            type ="submit"
                            >Upload
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}