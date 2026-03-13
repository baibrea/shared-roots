"use client";

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = "Search members..." }: SearchBarProps) {
  return (
    <div className="relative w-full mb-6 group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors">
        <Search size={18} />
      </div>
      
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl 
                   focus:outline-none focus:ring-4 text-gray-700 focus:ring-gray-200 transition-all text-sm
                   group-focus-within:ring-gray-300 group-focus-within:border-gray-300
                   hover:bg-gray-50 hover:border-gray-300
                   transition-all text-sm"
      />

      {value && (
        <button 
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-all"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}