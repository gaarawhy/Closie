import { loadAccounts } from "@/lib/account/storage";
import { loadSocial, updateSocial } from "./storage";
import type { Person } from "./types";

// Todas as pessoas conhecidas (contas locais com @ e pessoas extras), sem repetir.
export function listPeople(): Person[] {
  const people = new Map<string, Person>();
  for (const account of loadAccounts()) {
    const person = getPerson(account.id);
    if (person && person.username) people.set(person.id, person);
  }
  for (const person of loadSocial().people) {
    if (!people.has(person.id)) people.set(person.id, person);
  }
  return [...people.values()];
}

// Quem é quem: contas locais primeiro (são as pessoas de verdade deste navegador),
// depois as pessoas extras guardadas no módulo social.
export function getPerson(id: string): Person | null {
  const account = loadAccounts().find((item) => item.id === id);
  if (account) {
    return {
      id: account.id,
      username: account.profile.username ?? "",
      displayName: account.profile.displayName,
      avatar: account.profile.avatar,
      privacy: account.profile.privacy,
      bio: account.profile.bio,
    };
  }
  return loadSocial().people.find((person) => person.id === id) ?? null;
}

// Cadastra (ou atualiza) uma pessoa extra, sem login. Usado em testes e em demonstração.
export function addPerson(person: Person): void {
  updateSocial((state) => ({
    ...state,
    people: [...state.people.filter((item) => item.id !== person.id), person],
  }));
}
