import { getNameParts } from "./getNameParts";

export function generatePassword(fullName: string): string {
  const { firstName } = getNameParts(fullName);

  return `${firstName}123`;
}
