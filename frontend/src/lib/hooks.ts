import { useEffect, useState } from "react";

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/** Mismo corte que el diseño: las pantallas de celular son de 390px. */
export function useIsMobile() {
  return useMediaQuery("(max-width: 767px)");
}

const WORDS = ["obra", "losa", "muro", "viga", "loza", "patio", "techo", "plano", "nivel", "obrador"];

/** Contraseña inicial legible para dictar, al estilo "obra-sauces-4821". */
export function generatePassword(seed?: string) {
  const slug = (seed ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z]+/)
    .find((w) => w.length >= 4);
  const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)];
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return `${pick()}-${slug ?? pick()}-${digits}`;
}

export function apiErrorMessage(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (Array.isArray(data) && typeof data[0] === "string") return data[0];
  const errors = (data as { errors?: Record<string, string[]> } | undefined)?.errors;
  if (errors) {
    const first = Object.values(errors)[0]?.[0];
    if (first) return first;
  }
  return fallback;
}
