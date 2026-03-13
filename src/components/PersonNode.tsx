import { Person } from "@/types/person"

interface PersonNodeProps {
  person: Person
}

export default function PersonNode({ person }: PersonNodeProps) {
  return (
    <div className="bg-white border rounded-lg shadow p-3 w-40 text-center">
      <div className="font-semibold">
        {person.firstName} {person.lastName}
      </div>

      <div className="text-xs text-gray-500">
        {person.birthDate}
      </div>
    </div>
  )
}