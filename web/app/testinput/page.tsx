// app/add-person/page.tsx
'use client'; // Required for interactive state

import { useState } from 'react';
import { Person } from '@/types/person';

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
    setFormData({ firstName: '', lastName: '', birthDate: '', birthLocation: '', title: '', bio: '' });
  };

  return (
    <main className="p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
        <input 
          placeholder="First Name"
          value={formData.firstName}
          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
          className="border p-2"
        />
        <input 
          placeholder="Last Name"
          value={formData.lastName}
          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
          className="border p-2"
        />
        <input 
          placeholder="Birth Location"
          value={formData.birthLocation}
          onChange={(e) => setFormData({...formData, birthLocation: e.target.value})}
          className="border p-2"
        />
        <input 
          type="date"
          value={formData.birthDate}
          onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
          className="border p-2"
        />
        <input 
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="border p-2"
        />
        <input 
          placeholder="Bio"
          value={formData.bio}
          onChange={(e) => setFormData({...formData, bio: e.target.value})}
          className="border p-2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2">Add Person</button>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-bold">Local Family Tree Members:</h2>
        <ul>
          {people.map(p => <li key={p.id}>{p.firstName} {p.lastName} (Birth Date: {p.birthDate}) (Birth Location: {p.birthLocation}) (Title: {p.title}) (Bio: {p.bio})</li>)}
        </ul>
      </div>
    </main>
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
