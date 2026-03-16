import AsyncStorage from "@react-native-async-storage/async-storage";

const SAVED_KEY = "astrova_saved_apods";

export interface SavedAPOD {
    title: string;
    explanation: string;
    url: string;
    hdurl?: string;
    date: string;
    media_type: "image" | "video";
    copyright?: string;
    savedAt: number;
}

export async function getSavedAPODs(): Promise<SavedAPOD[]> {
    try {
        const raw = await AsyncStorage.getItem(SAVED_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as SavedAPOD[];
    } catch {
        return [];
    }
}

export async function saveAPOD(
    apod: Omit<SavedAPOD, "savedAt">,
): Promise<void> {
    try {
        const existing = await getSavedAPODs();
        const alreadySaved = existing.some((a) => a.date === apod.date);
        if (alreadySaved) return;
        const updated = [{ ...apod, savedAt: Date.now() }, ...existing];
        await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(updated));
    } catch {}
}

export async function unsaveAPOD(date: string): Promise<void> {
    try {
        const existing = await getSavedAPODs();
        const updated = existing.filter((a) => a.date !== date);
        await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(updated));
    } catch {}
}

export async function isAPODSaved(date: string): Promise<boolean> {
    try {
        const existing = await getSavedAPODs();
        return existing.some((a) => a.date === date);
    } catch {
        return false;
    }
}

const NEWS_CACHE_KEY = "astrova_news_cache";
const NEWS_TTL = 15 * 60 * 1000;

interface NewsCacheEntry {
    articles: any[];
    cachedAt: number;
}

export async function getCachedNews(): Promise<any[] | null> {
    try {
        const raw = await AsyncStorage.getItem(NEWS_CACHE_KEY);
        if (!raw) return null;
        const entry: NewsCacheEntry = JSON.parse(raw);
        if (Date.now() - entry.cachedAt > NEWS_TTL) return null;
        return entry.articles;
    } catch {
        return null;
    }
}

export async function cacheNews(articles: any[]): Promise<void> {
    try {
        const entry: NewsCacheEntry = { articles, cachedAt: Date.now() };
        await AsyncStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(entry));
    } catch {}
}
