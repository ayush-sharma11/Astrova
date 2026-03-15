export interface APOD {
    title: string;
    explanation: string;
    url: string;
    hdurl?: string;
    date: string;
    media_type: "image" | "video";
    copyright?: string;
    code?: number;
    msg?: string;
}

export interface CachedEntry {
    data: APOD;
    cachedAt: number;
}
