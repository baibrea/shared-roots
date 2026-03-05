'use client';

import { useState } from 'react';
import { Person } from '@/types/person';
import { usePeople } from "@/lib/PeopleContext";
import { useRouter } from 'next/navigation';


export default function AddPersonPage() {
  const { addPerson } = usePeople();
  const router = useRouter();

  const [formData, setFormData] = useState<Partial<Person>>({
    firstName: '',
    lastName: '',
    birthDate: '',
    birthLocation: '',
    title: '',
    bio: '',
    healthDetails: '',
  });

  const isFormValid = formData.firstName?.trim() && formData.lastName?.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create the "instance" of the person to add
    const newPerson: Person = {
      ...formData,
    } as Person;

    addPerson(newPerson);
    router.push("/familytree");

    // Reset form
    setFormData({ firstName: '', lastName: '', birthDate: '', birthLocation: '', title: '', bio: '', healthDetails: '' });
  };

  return (
    <div className="flex justify-center py-12 bg-[#CAD7CA]">
        <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md p-12 rounded-4xl bg-[#f9f8f4] shadow-2xl shadow-">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center text-[#3A433A]">
                    Add New Family Member
        </h1>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-left text-[#3A433A]">
          Name
        </h2>
        <input 
          required
          className="w-full border border-[#6E6E6E] rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black bg-[#dde4dd]
                            placeholder: text-black"
          placeholder="First Name"
          value={formData.firstName}
          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
        />
        <input 
          required
          className="w-full border border-[#6E6E6E] rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black bg-[#dde4dd]
                            placeholder: text-black"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
        />
        </div>
        
        <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-left text-[#3A433A]">
          Birth Information
        </h2>
        <input 
        className="w-full border border-[#6E6E6E] rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black bg-[#dde4dd]
                            placeholder: text-black"
          placeholder="Birth Location"
          value={formData.birthLocation}
          onChange={(e) => setFormData({...formData, birthLocation: e.target.value})}
        />
        <input 
          type="date"
          value={formData.birthDate}
          onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
          className="w-full border border-[#6E6E6E] rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black bg-[#dde4dd]
                            placeholder: text-black"
        />
        </div>

        <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-left text-[#3A433A]">
          Additional Information
        </h2>
        <input 
          className="w-full border border-[#6E6E6E] rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black bg-[#dde4dd]
                            placeholder: text-black"
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          
        />
        <textarea 
          placeholder="Bio"
          value={formData.bio}
          onChange={(e) => setFormData({...formData, bio: e.target.value})}
          className="w-full border border-[#6E6E6E] rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black bg-[#dde4dd]
                            placeholder: text-black"
        />
        </div>

        <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-left text-[#3A433A]">
          Health Information
        </h2>
        <textarea 
          placeholder="Health Details"
          value={formData.healthDetails}
          onChange={(e) => setFormData({...formData, healthDetails: e.target.value})}
          className="w-full border border-[#6E6E6E] rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black bg-[#dde4dd]
                            placeholder: text-black"
        />
        </div>
        <button 
          type="submit" 
          disabled={!isFormValid}
          className={`p-2 rounded-xl text-white transition
            ${isFormValid ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"}
          `}>
            Add Person
        </button>
      </form>

      {/* <div className="mt-8">
        <h2 className="text-xl font-bold  placeholder: text-black" >Local Family Tree Members:</h2>
        <ul>
          {people.map(p => <li key={p.id}>{p.firstName} {p.lastName} (Birth Date: {p.birthDate}) (Birth Location: {p.birthLocation}) (Title: {p.title}) (Bio: {p.bio})</li>)}
        </ul>
      </div> */}
      </div>
      </div>
    </div>
  );
}