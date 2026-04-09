import { useFamily } from "@/lib/FamilyContext";
import { useEffect, useRef, useState } from "react";

type Family = {
	id: string;
	name: string;
};

export default function FamilyDropdown({
	families,
	onCreateFamily,
	showCreate = true
}: {
	families: Family[];
	onCreateFamily: () => void;
	showCreate?: boolean;
}) {

    const [isActive, setIsActive] = useState(false);
	const { activeFamily, setActiveFamily } = useFamily();

	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
	  const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Escape") {
		  setIsActive(false);
		}
	  };

	  window.addEventListener("keydown", handleKeyDown);

	  return () => window.removeEventListener("keydown", handleKeyDown);
	  }, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsActive(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);


  return (
		<div ref={dropdownRef} className="relative w-1/2 min-w-40 max-w-60">
			<button
				onClick={() => setIsActive(!isActive)}
				className="bg-gray-100 hover:bg-gray-200 transition-colors w-full border-2 border-[#2c3224] rounded-md text-black px-5 py-3 text-left focus:outline-none shadow-md"
			>
				{activeFamily?.name || "Select Family"}
			</button>

			{isActive && (
				<div className="absolute w-full mt-3 rounded-md shadow-lg z-50">
					<ul className="w-full bg-white text-black rounded-md border-2 border-gray-300 shadow-xl max-h-64 overflow-y-auto">

						{/* Dropdown List of families the user belongs to */}
						{families.map(family => (
							<button
								key={family.id}
								onClick={() => {
									setActiveFamily(family);
									setIsActive(false);
								}}
								className="w-full py-3 px-5 text-left hover:bg-gray-200 rounded-md"
							>
								{family.name}
							</button>
						))}

						{/* Option to create a new family */}
						{showCreate && (
							<button
								onClick={() => {
									onCreateFamily();
									setIsActive(false);
								}}
								className="w-full py-3 px-5 text-left hover:bg-gray-200 rounded-md font-semibold"
							>
								+ Create Family
							</button>
						)}
					</ul>
				</div>
			)}
		</div>
  )
}