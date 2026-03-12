import { Person } from "@/types/person";
import type { Datum } from "family-chart";

export function convertPeopleToFamilyChart(people: Person[]): Datum[] {
    return people.map((p) => ({
        id: String(p.id),

        data: {
            "gender": "M", // Placeholder
            "first name": p.firstName,
            "last name": p.lastName,
            "birth date": p.birthDate || "",
            "avatar": p.avatar || ""
        },

        rels: {
            parents: p.parents?.map(String) || [],
            children: p.children?.map(String) || [],
            spouses: p.spouse ? [String(p.spouse)] : []
        }
    }));
}
