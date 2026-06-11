import { getNameParts } from "./getNameParts";

export function generateUsername(fullName: string): string {
  const { firstName, secondElement } = getNameParts(fullName);

  return `${firstName}${secondElement}`;
}
