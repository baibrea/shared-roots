export interface Person {
  id: string;

  firstName: string;
  lastName: string;

  avatar?: string;

  birthDate?: string;
  birthLocation?: string;

  title?: string;
  bio?: string;
  
  healthDetails?: string;

  parents: string[];
  children: string[];
  spouse: string;
}

// export interface FamilyChartNode {
//   id: string;
//   data: {
//     gender: "M" | "F"; // Placeholder
//     "first name": string;
//     "last name": string;
//     "birth date": string;
//     "avatar"?: string;
//     }
//     rels: {
//         parents?: string[];
//         children?: string[];
//         spouses?: string[];
//     }
// }