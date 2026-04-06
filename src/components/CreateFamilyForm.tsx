"use client";

import { useState } from "react";
import { createFamily } from "@/lib/family";


type Props = {
    userId: string;
    firstName: string;
    lastName: string;
    onClose: () => void;
    onFamilyCreated: (family: { id: string; name: string }) => void;
}

export default function CreateFamilyForm({ userId, firstName, lastName, onClose, onFamilyCreated }: Props) {
    const [familyName, setFamilyName] = useState("");

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl w-96">
            
            <h2 className="text-lg font-semibold mb-4 text-black">
                Create Family
            </h2>

            <input
                className="w-full border p-2 rounded mb-4 text-black"
                placeholder="Family Name"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
            />

            <div className="flex justify-end gap-2">
                <button
                className="px-4 py-2 bg-gray-400 rounded-md"
                onClick={() => setShowCreateFamily(false)}
                >
                Cancel
                </button>

                <button
                className="px-4 py-2 bg-[#657B97] text-white rounded-md"
                onClick={async () => {
                    if (!newFamilyName) return;

                    try {
                    const familyId = await createFamily(
                    newFamilyName,
                    firstName,
                    lastName,
                    userID
                    );
                    console.log("Succesfully created family:", newFamilyName);
                    setFamilyCreated(true);


                    // Update userFamilies state to include the newly created family
                    const newFamily = { id: familyId, name: newFamilyName };

                    setUserFamilies(prev => [...prev, newFamily]);

                    setActiveFamily(newFamily);

                    setShowCreateFamily(false);

                    } catch (error) {
                    console.error("Failed to create family:", error);
                    setFamilyCreated(false);
                    }
                }}
                >
                Create
                </button>
            </div>
            </div>
        </div>
    );
}

