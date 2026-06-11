export type AppUserRole = "professor" | "aluno";

export type AppSession = {
  profileId: string;
  fullName: string;
  username: string;
  role: AppUserRole;
  mustResetPassword: boolean;
};
