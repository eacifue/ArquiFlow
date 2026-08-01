export type InternalRole = "Admin" | "ProjectManager" | "Supervisor";

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface CreateUserInput {
  email: string;
  fullName: string;
  password: string;
  role: InternalRole;
}
