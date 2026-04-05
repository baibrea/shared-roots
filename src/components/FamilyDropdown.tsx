import { useState } from "react";

type Family = {
	id: string;
	name: string;
};

export default function FamilyDropdown({
	families,
	activeFamilyId,
	onSelectFamily,
	onCreateFamily
}: {
	families: Family[];
	activeFamilyId: string | null;
	onSelectFamily: (family : Family) => void;
	onCreateFamily: () => void;
}) {

  const [isActive, setIsActive] = useState(false);

  return (
		<div className="relative w-1/3 min-w-40 max-w-60">
			<button
				onClick={() => setIsActive(!isActive)}
				className="bg-white w-full rounded-md text-black px-5 py-3 text-left"
			>
				{families.find(f => f.id === activeFamilyId)?.name || "Select Family"}
			</button>

			{isActive && (
				<div className="absolute w-full mt-3 rounded-md shadow-lg">
					<ul className="w-full bg-white text-black rounded-md">

						{families.map(family => (
							<button
								key={family.id}
								onClick={() => {
									onSelectFamily(family);
									setIsActive(false);
								}}
								className="w-full py-3 px-5 text-left hover:bg-gray-200 rounded-md"
							>
								{family.name}
							</button>
						))}

						<button
							onClick={() => {
								onCreateFamily();
								setIsActive(false);
							}}
							className="w-full py-3 px-5 text-left hover:bg-gray-200 rounded-md"
						>
							+ Create Family
						</button>
					</ul>
				</div>
			)}
		</div>
  )
}