import { ConnectorWord, NameParts } from "./auth.types";
import { normalizeText } from "./normalizeText";

const CONNECTORS: ConnectorWord[] = [
  "da",
  "de",
  "do",
  "das",
  "dos",
  "di",
  "du",
  "del",
  "della",
];

export function getNameParts(fullName: string): NameParts {
  const normalizedName = normalizeText(fullName);
  const parts = normalizedName.split(/\s+/).filter(Boolean);

  if (parts.length < 2) {
    throw new Error("Informe pelo menos nome e sobrenome.");
  }

  const firstName = parts[0];

  let secondElement = parts[1];

  if (CONNECTORS.includes(parts[1] as ConnectorWord) && parts[2]) {
    secondElement = `${parts[1]}${parts[2]}`;
  }

  return {
    firstName,
    secondElement,
  };
}
