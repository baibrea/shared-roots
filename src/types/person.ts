export interface Person {
  id: string;

  firstName: string;
  lastName: string;

  birthDate?: string;
  birthLocation?: string;

  title?: string;
  bio?: string;
  
  healthDetails?: string;

  parents: string[];
  children: string[];
  spouse: string;
}
