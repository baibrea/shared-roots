import { useFamily } from "@/lib/FamilyContext";
import { useState } from "react";

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

  return (
		<div className="relative w-1/3 min-w-40 max-w-60">
			<button
				onClick={() => setIsActive(!isActive)}
				className="bg-white w-full border-2 border-gray-300 rounded-md text-black px-5 py-3 text-left"
			>
				{activeFamily?.name || "Select Family"}
			</button>

			{isActive && (
				<div className="absolute w-full mt-3 rounded-md shadow-lg z-50">
					<ul className="w-full bg-white text-black rounded-md border-2 border-gray-300">

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