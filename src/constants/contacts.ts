import { Ionicons } from "@expo/vector-icons";
import type { Tint } from "../components/ui";

export type IconName = keyof typeof Ionicons.glyphMap;

export type Contact = {
  id: string;
  name: string;
  about?: string;
  online?: boolean;
  tint: Tint;
  group?: boolean;
  members?: number;
  icon?: IconName;
};

export const CONTACTS: Contact[] = [
  {
    id: "10",
    name: "Ankit Sharma",
    about: "Busy",
    tint: ["#DBEAFE", "#1D4ED8"],
  },
  {
    id: "6",
    name: "Amit Kumar",
    about: "Hey there! I'm using Chatty",
    tint: ["#FEF3C7", "#B45309"],
  },
  {
    id: "11",
    name: "Karan Mehta",
    about: "At the gym",
    online: true,
    tint: ["#D1FAE5", "#047857"],
  },
  {
    id: "7",
    name: "Neha Verma",
    about: "Available",
    online: true,
    tint: ["#CFFAFE", "#0E7490"],
  },
  {
    id: "4",
    name: "Priya Singh",
    about: "Coding all night",
    online: true,
    tint: ["#FCE7F3", "#BE185D"],
  },
  {
    id: "12",
    name: "Rahul Verma",
    about: "In a meeting",
    tint: ["#EDE9FE", "#6D28D9"],
  },
  {
    id: "1",
    name: "Rohit Sharma",
    about: "Available",
    online: true,
    tint: ["#FFE8D6", "#C2410C"],
  },
  {
    id: "13",
    name: "Sneha Patel",
    about: "Hey there! I'm using Chatty",
    tint: ["#FFE4E6", "#BE123C"],
  },
  {
    id: "2",
    name: "Family Group",
    group: true,
    members: 6,
    icon: "home",
    about: "Family members",
    tint: ["#DBEAFE", "#1D4ED8"],
  },
  {
    id: "3",
    name: "Work Team",
    group: true,
    members: 8,
    icon: "briefcase",
    about: "Work and project discussions",
    tint: ["#EDE9FE", "#6D28D9"],
  },
  {
    id: "5",
    name: "Study Group",
    group: true,
    members: 12,
    icon: "book",
    about: "Study together",
    tint: ["#D1FAE5", "#047857"],
  },
];

export const findContact = (id?: string | string[]): Contact => {
  const key = Array.isArray(id) ? id[0] : id;

  return (
    CONTACTS.find((contact) => contact.id === key) ?? {
      id: key ?? "0",
      name: "Unknown",
      about: "",
      tint: ["#E0E7FF", "#4338CA"],
    }
  );
};

export const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

export function groupByLetter(list: Contact[]) {
  const sorted = list
    .filter((contact) => !contact.group)
    .sort((a, b) => a.name.localeCompare(b.name));

  const letters = Array.from(
    new Set(sorted.map((contact) => contact.name.charAt(0).toUpperCase())),
  );

  return letters.map((letter) => ({
    title: letter,
    data: sorted.filter(
      (contact) => contact.name.charAt(0).toUpperCase() === letter,
    ),
  }));
}
