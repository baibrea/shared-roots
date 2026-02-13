'use client'; // Required for client-side hooks like useState

import { SetStateAction, useState } from 'react';

export default function FamilyTree() {
  const [name, setName] = useState('');

   const handleChange = (event: { target: { value: SetStateAction<string>; }; }) => {
    setName(event.target.value);
  };

  return (
    // Pass the action function to the form's action prop
    <div className="flex flex-col items-center justify-center h-screen">
        <div><input type="text" value={name} onChange={handleChange} /></div>
        <div><button type="submit">Submit</button></div>
        <div>{name}</div>
    </div>
  );
}
