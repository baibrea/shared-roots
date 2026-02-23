export interface Person {
  id: string;

  firstName: string;
  lastName: string;

  birthDate?: string;
  birthLocation?: string;
  title?: string;
  bio?: string;

  parentIds: string[];
  childIds: string[];
  spouseIds: string[];
}
