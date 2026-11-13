"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "sakan_favorites";

export function getStoredFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isPropertyFavorite(propertyId: string): boolean {
  const favs = getStoredFavorites();
  return favs.includes(propertyId);
}

export function togglePropertyFavorite(propertyId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const favs = getStoredFavorites();
    let updated: string[];
    let added = false;

    if (favs.includes(propertyId)) {
      updated = favs.filter((id) => id !== propertyId);
      added = false;
    } else {
      updated = [...favs, propertyId];
      added = true;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("sakan:favorites-updated", { detail: { favorites: updated } }));
    return added;
  } catch {
    return false;
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setFavorites(getStoredFavorites());
    setMounted(true);

    const handleUpdate = () => {
      setFavorites(getStoredFavorites());
    };

    window.addEventListener("sakan:favorites-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("sakan:favorites-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const toggle = (id: string) => {
    return togglePropertyFavorite(id);
  };

  const isFav = (id: string) => {
    return favorites.includes(id);
  };

  return { favorites, isFav, toggle, count: favorites.length, mounted };
}
