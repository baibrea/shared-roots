"use client"

import { useState } from "react";
import { Person } from "@/types/person";
import { usePeople } from "./PeopleContext";
import { db } from "./firebase";
import { doc } from "firebase/firestore";

export default function AddPersonForm({ 
  onClose,
  referencePerson,
  onPersonAdded
 }: {
  onClose : () => void;
  referencePerson: Person;
  onPersonAdded: (personId: string) => void;
}) {
    const { addPerson } = usePeople();

    const [relationship, setRelationship] = useState("child");

    const [formData, setFormData] = useState<Partial<Person>>({
        firstName: '',
        lastName: '',
        birthDate: '',
        birthLocation: '',
        title: '',
        bio: '',
        healthDetails: '',
        parents: [],
        children: [],
        spouses: []
    });

    const isFormValid = formData.firstName?.trim() && formData.lastName?.trim();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newPerson: Person = {
            ...formData,
        } as Person;

        const newId = await addPerson(newPerson, referencePerson, relationship);

        if (newId) {
            onPersonAdded(newId);
        }

        setFormData({ firstName: '', 
            lastName: '', 
            birthDate: '', 
            birthLocation: '', 
            title: '', 
            bio: '', 
            healthDetails: '', 
            parents: [], 
            children: [], 
            spouses: []
        });

        onClose();
    };

    return (
<div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="w-full max-w-md p-8 rounded-3xl bg-[#f9f8f4] shadow-xl text-[#3A433A]">

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <h1 className="text-xl font-bold text-center">
            Add New Family Member
          </h1>

          <p>Relationship to 
            <strong> {referencePerson.firstName} {referencePerson.lastName}:</strong>
          </p>
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="border rounded-xl px-3 py-2"
          >
            <option value="child">Child</option>
            <option value="parent">Parent</option>
            <option value="spouse">Spouse</option>
          </select>

          <input
            required
            placeholder="First Name"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            className="border rounded-xl px-3 py-2"
          />

          <input
            required
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            className="border rounded-xl px-3 py-2"
          />

          <input
            placeholder="Birth Location"
            value={formData.birthLocation}
            onChange={(e) =>
              setFormData({ ...formData, birthLocation: e.target.value })
            }
            className="border rounded-xl px-3 py-2"
          />

          <input
            type="date"
            value={formData.birthDate}
            onChange={(e) =>
              setFormData({ ...formData, birthDate: e.target.value })
            }
            className="border rounded-xl px-3 py-2"
          />

          <textarea
            placeholder="Bio"
            value={formData.bio}
            onChange={(e) =>
              setFormData({ ...formData, bio: e.target.value })
            }
            className="border rounded-xl px-3 py-2"
          />

          <textarea
            placeholder="Health Details"
            value={formData.healthDetails}
            onChange={(e) =>
              setFormData({ ...formData, healthDetails: e.target.value })
            }
            className="border rounded-xl px-3 py-2"
          />

          <div className="flex gap-3">

            <button
              type="submit"
              disabled={!isFormValid}
              className={`flex-1 p-2 rounded-xl text-white ${
                isFormValid
                  ? "bg-[#698b6a] hover:bg-[#456646]"
                  : "bg-gray-400"
              }`}
            >
              Add Person
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-2 rounded-xl bg-gray-200"
            >
              Cancel
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}