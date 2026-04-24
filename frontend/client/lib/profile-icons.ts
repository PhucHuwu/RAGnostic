import { Bot } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

const LEGACY_ICON_MAP: Record<string, string> = {
  bot: "Bot",
  sparkles: "Sparkles",
  "user-round": "UserRound",
  briefcase: "Briefcase",
  "book-open-text": "BookOpenText",
  cpu: "Cpu",
  "graduation-cap": "GraduationCap",
  stethoscope: "Stethoscope",
  scale: "Scale",
  landmark: "Landmark",
  "flask-conical": "FlaskConical",
  "message-circle-heart": "MessageCircleHeart",
  "shield-check": "ShieldCheck",
};

function toPascalCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function normalizeProfileIconName(iconName?: string | null) {
  if (!iconName) {
    return "Bot";
  }

  const trimmed = iconName.trim();
  if (!trimmed) {
    return "Bot";
  }

  if (LEGACY_ICON_MAP[trimmed]) {
    return LEGACY_ICON_MAP[trimmed];
  }

  if (/^[A-Z][A-Za-z0-9]*$/.test(trimmed)) {
    return trimmed;
  }

  return toPascalCase(trimmed);
}

export function getProfileIconComponent(iconName?: string | null): LucideIcon {
  const key = normalizeProfileIconName(iconName);
  const candidate = (LucideIcons as Record<string, unknown>)[key];
  if (candidate && (typeof candidate === "function" || typeof candidate === "object")) {
    return candidate as LucideIcon;
  }
  return Bot;
}

export function getAllProfileIconNames() {
  return Object.entries(LucideIcons)
    .filter(
      ([name, value]) =>
        /^[A-Z]/.test(name) &&
        !name.endsWith("Icon") &&
        name !== "Icon" &&
        name !== "LucideIcon" &&
        (typeof value === "function" || typeof value === "object"),
    )
    .map(([name]) => name)
    .sort((a, b) => a.localeCompare(b));
}
