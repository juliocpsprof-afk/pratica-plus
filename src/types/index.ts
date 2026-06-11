export type UserRole = "professor" | "aluno";

export type CourseModule = "telemarketing" | "vendas";

export type StudentProfile = {
  id: string;
  fullName: string;
  username: string;
  course: string;
  className: string;
  createdAt: string;
};

export type TeacherProfile = {
  id: string;
  fullName: string;
  username: string;
  createdAt: string;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export type GeneratedAccess = {
  fullName: string;
  username: string;
  password: string;
};

export type ScenarioType = "oficial" | "personalizado";

export type Scenario = {
  id: string;
  title: string;
  description: string;
  module: CourseModule;
  type: ScenarioType;
  difficulty: "facil" | "medio" | "dificil";
};

export type Competency = {
  id: string;
  name: string;
  description?: string;
};
