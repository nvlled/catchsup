export const iconNames = {
  "due-now": "/icons/due-now.png",
  "due-later": "/icons/due-later.png",
  "was-due": "/icons/was-due.png",
  "time-up": "/icons/time-up.png",
  ongoing: "/icons/ongoing.png",
  blank: "/logo.png",
} as const;

export type IconName = keyof typeof iconNames;

export function getIconPath(name: string | IconName) {
  return (iconNames as Record<string, string>)[name];
}
