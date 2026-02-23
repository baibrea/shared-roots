// app/add-person/page.tsx
'use client'; // Required for interactive state

import { useState } from 'react';
import { Person } from '@/types/person';
import Link from 'next/link';

export default function AddPersonPage() {
  // 1. Setup local state for a list of people
  const [people, setPeople] = useState<Person[]>([]);

  // 2. Setup state for the form inputs
  const [formData, setFormData] = useState<Partial<Person>>({
    firstName: '',
    lastName: '',
    birthDate: '',
    birthLocation: '',
    bio: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create the "instance" with a temporary ID
    const newPerson: Person = {
      ...formData,
      id: crypto.randomUUID(), // Temp ID until Firebase provides one
    } as Person;

    // Add to local list (in-memory only)
    setPeople([...people, newPerson]);

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
          className="w-full border border-[#6E6E6E] rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black bg-[#dde4dd]
                            placeholder: text-black"
          placeholder="First Name"
          value={formData.firstName}
          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
        />
        <input 
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
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="w-full border border-[#6E6E6E] rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black bg-[#dde4dd]
                            placeholder: text-black"
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
        <button type="submit" className="bg-blue-500 text-white p-2">Add Person</button>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-bold  placeholder: text-black" >Local Family Tree Members:</h2>
        <ul>
          {people.map(p => <li key={p.id}>{p.firstName} {p.lastName} (Birth Date: {p.birthDate}) (Birth Location: {p.birthLocation}) (Title: {p.title}) (Bio: {p.bio})</li>)}
        </ul>
      </div>
      </div>
      </div>
    </div>
  );
}


// 'use client'; // Required for client-side hooks like useState

// import { SetStateAction, useState } from 'react';

// export default function FamilyTree() {
//   const [name, setName] = useState('');

//    const handleChange = (event: { target: { value: SetStateAction<string>; }; }) => {
//     setName(event.target.value);
//   };

//   return (
//     // Pass the action function to the form's action prop
//     <div className="flex flex-col items-center justify-center h-screen">
//         <div><input type="text" value={name} onChange={handleChange} /></div>
//         <div><button type="submit">Submit</button></div>
//         <div>{name}</div>
//     </div>
//   );
// }
