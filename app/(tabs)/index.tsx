import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Linking,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";
import { APOD } from "../../types/apod";
import {
    cacheAPOD,
    getCachedAPOD,
    isAPODSaved,
    saveAPOD,
    unsaveAPOD,
} from "../../utils/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NASA_KEY = process.env.EXPO_PUBLIC_NASA_KEY ?? "DEMO_KEY";

if (__DEV__ && NASA_KEY === "DEMO_KEY") {
    console.warn(
        "[Astrova] EXPO_PUBLIC_NASA_KEY not set - using DEMO_KEY (rate limited)",
    );
}

const APOD_START = "1995-06-16";

function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

function getTodayDate() {
    return new Date().toISOString().split("T")[0];
}

function offsetDate(dateStr: string, days: number): string {
    const d = new Date(dateStr + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().split("T")[0];
}

function getRandomPastDate() {
    const start = new Date(APOD_START + "T12:00:00Z").getTime();
    const end = new Date().getTime() - 86400000;
    const d = new Date(start + Math.random() * (end - start));
    return d.toISOString().split("T")[0];
}

function isToday(dateStr: string) {
    return dateStr === getTodayDate();
}

function isBeforeStart(dateStr: string) {
    return dateStr < APOD_START;
}

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const [apod, setApod] = useState<APOD | null>(null);
    const [currentDate, setCurrentDate] = useState<string>(getTodayDate());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [saved, setSaved] = useState(false);

    const fetchAPOD = useCallback(async (date?: string) => {
        const targetDate = date ?? getTodayDate();
        setLoading(true);
        setError(false);
        setExpanded(false);
        try {
            const cached = await getCachedAPOD(targetDate);
            if (cached) {
                if (__DEV__) console.log("[Cache HIT]", targetDate);
                setApod(cached);
                setCurrentDate(cached.date);
                setSaved(await isAPODSaved(cached.date));
                setLoading(false);
                return;
            }
            if (__DEV__) console.log("[Cache MISS]", targetDate);
            const params = new URLSearchParams({ api_key: NASA_KEY });
            if (date) params.append("date", date);
            const res = await fetch(
                `https://api.nasa.gov/planetary/apod?${params}`,
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: APOD = await res.json();
            if (data.code && data.code !== 200)
                throw new Error(data.msg ?? "NASA API error");
            await cacheAPOD(data);
            setApod(data);
            setCurrentDate(data.date ?? targetDate);
            setSaved(await isAPODSaved(data.date));
        } catch (e) {
            if (__DEV__) console.error("[APOD fetch error]", e);
            setError(true);
            setCurrentDate(targetDate);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAPOD();
    }, [fetchAPOD]);

    const handleSaveToggle = async () => {
        if (!apod) return;
        if (saved) {
            await unsaveAPOD(apod.date);
            setSaved(false);
        } else {
            await saveAPOD({
                title: apod.title,
                explanation: apod.explanation,
                url: apod.url,
                hdurl: apod.hdurl,
                date: apod.date,
                media_type: apod.media_type,
                copyright: apod.copyright,
            });
            setSaved(true);
        }
    };

    const handleShare = async () => {
        if (!apod) return;
        await Share.share({ message: `${apod.title}\n\n${apod.url}` });
    };

    const handleViewHD = () => {
        if (apod?.hdurl) Linking.openURL(apod.hdurl);
    };

    const goPrev = () => {
        const base = apod?.date ?? currentDate;
        const prev = offsetDate(base, -1);
        if (!isBeforeStart(prev)) fetchAPOD(prev);
    };

    const goNext = () => {
        const base = apod?.date ?? currentDate;
        const next = offsetDate(base, 1);
        fetchAPOD(next);
    };

    const goToday = () => fetchAPOD();

    if (loading) {
        return (
            <View
                style={[
                    styles.centered,
                    {
                        backgroundColor: theme.colors.bg,
                        paddingTop: insets.top,
                    },
                ]}
            >
                <ActivityIndicator color={theme.colors.accent} size="large" />
                <Text style={styles.loadingText}>Loading cosmos...</Text>
            </View>
        );
    }

    if (error || !apod) {
        return (
            <View
                style={[
                    styles.centered,
                    {
                        backgroundColor: theme.colors.bg,
                        paddingTop: insets.top,
                    },
                ]}
            >
                <Ionicons
                    name="cloud-offline-outline"
                    size={36}
                    color={theme.colors.textTertiary}
                />
                <Text style={styles.errorText}>
                    {currentDate
                        ? `No image for ${formatDate(currentDate)}`
                        : "Connection lost"}
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                    <TouchableOpacity
                        onPress={() => fetchAPOD(offsetDate(currentDate, -1))}
                        style={styles.retryBtn}
                    >
                        <Text style={styles.retryText}>← Prev</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => fetchAPOD()}
                        style={styles.retryBtn}
                    >
                        <Text style={styles.retryText}>Today</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => fetchAPOD(offsetDate(currentDate, 1))}
                        style={styles.retryBtn}
                    >
                        <Text style={styles.retryText}>Next →</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const shortExplanation =
        apod.explanation.length > 240
            ? apod.explanation.slice(0, 240).trimEnd() + "..."
            : apod.explanation;

    const atStart = isBeforeStart(offsetDate(currentDate, -1));
    const atToday = isToday(currentDate);

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Hero */}
                <View style={{ position: "relative" }}>
                    {apod.media_type === "image" ? (
                        <Image
                            source={{ uri: apod.url }}
                            style={[
                                styles.heroImage,
                                {
                                    width: SCREEN_WIDTH,
                                    height: SCREEN_WIDTH * 1.05,
                                },
                            ]}
                            resizeMode="cover"
                        />
                    ) : (
                        <View
                            style={[
                                styles.videoPlaceholder,
                                {
                                    width: SCREEN_WIDTH,
                                    height: SCREEN_WIDTH * 0.7,
                                },
                            ]}
                        >
                            <Ionicons
                                name="videocam-outline"
                                size={36}
                                color={theme.colors.textTertiary}
                            />
                            <Text style={styles.videoText}>
                                Video - tap to open
                            </Text>
                            <TouchableOpacity
                                style={styles.openVideoBtn}
                                onPress={() => Linking.openURL(apod.url)}
                            >
                                <Text style={styles.openVideoBtnText}>
                                    Open on NASA
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View
                        style={[styles.fadeTop, { height: insets.top + 80 }]}
                    />

                    <View
                        style={[styles.topBar, { paddingTop: insets.top + 12 }]}
                    >
                        <View>
                            <Text style={styles.appName}>Astrova</Text>
                            <Text style={styles.topDate}>
                                {formatDate(apod.date)}
                            </Text>
                        </View>
                        <View style={styles.topActions}>
                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={handleSaveToggle}
                            >
                                <Ionicons
                                    name={
                                        saved ? "bookmark" : "bookmark-outline"
                                    }
                                    size={17}
                                    color={
                                        saved
                                            ? theme.colors.accent
                                            : "rgba(255,255,255,0.8)"
                                    }
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.iconBtn}
                                onPress={handleShare}
                            >
                                <Ionicons
                                    name="share-outline"
                                    size={17}
                                    color="rgba(255,255,255,0.8)"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.fadeBottom} />
                </View>

                {/* Body */}
                <View style={styles.body}>
                    <Text style={styles.title}>{apod.title}</Text>
                    {apod.copyright && (
                        <Text style={styles.copyright}>
                            Photo © {apod.copyright.trim()}
                        </Text>
                    )}
                    <View style={styles.divider} />
                    <Text style={styles.explanation}>
                        {expanded ? apod.explanation : shortExplanation}
                    </Text>
                    {apod.explanation.length > 240 && (
                        <TouchableOpacity
                            onPress={() => setExpanded((e) => !e)}
                            style={styles.expandBtn}
                        >
                            <Text style={styles.expandBtnText}>
                                {expanded ? "Show less" : "Continue reading"}
                            </Text>
                            <Ionicons
                                name={expanded ? "chevron-up" : "chevron-down"}
                                size={13}
                                color={theme.colors.accent}
                            />
                        </TouchableOpacity>
                    )}
                    <View style={styles.actions}>
                        {apod.hdurl && (
                            <TouchableOpacity
                                style={styles.btnPrimary}
                                onPress={handleViewHD}
                            >
                                <Ionicons
                                    name="expand-outline"
                                    size={15}
                                    color={theme.colors.accent}
                                />
                                <Text style={styles.btnPrimaryText}>
                                    View HD
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.btnSecondary}
                            onPress={handleShare}
                        >
                            <Ionicons
                                name="share-social-outline"
                                size={15}
                                color={theme.colors.textSecondary}
                            />
                            <Text style={styles.btnSecondaryText}>Share</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Nav strip */}
                <View style={styles.navStrip}>
                    <TouchableOpacity
                        style={[
                            styles.navBtn,
                            atStart && styles.navBtnDisabled,
                        ]}
                        onPress={goPrev}
                        disabled={atStart}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={15}
                            color={
                                atStart
                                    ? theme.colors.textTertiary
                                    : theme.colors.textSecondary
                            }
                        />
                        <Text
                            style={[
                                styles.navBtnText,
                                atStart && { color: theme.colors.textTertiary },
                            ]}
                        >
                            Prev
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.navBtn}
                        onPress={() => fetchAPOD(getRandomPastDate())}
                    >
                        <Ionicons
                            name="shuffle-outline"
                            size={15}
                            color={theme.colors.textSecondary}
                        />
                        <Text style={styles.navBtnText}>Random</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.navBtn,
                            atToday && styles.navBtnDisabled,
                        ]}
                        onPress={goNext}
                        disabled={atToday}
                    >
                        <Text
                            style={[
                                styles.navBtnText,
                                atToday && { color: theme.colors.textTertiary },
                            ]}
                        >
                            Next
                        </Text>
                        <Ionicons
                            name="chevron-forward"
                            size={15}
                            color={
                                atToday
                                    ? theme.colors.textTertiary
                                    : theme.colors.textSecondary
                            }
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.navBtn,
                            atToday && styles.navBtnDisabled,
                        ]}
                        onPress={goToday}
                        disabled={atToday}
                    >
                        <Ionicons
                            name="today-outline"
                            size={15}
                            color={
                                atToday
                                    ? theme.colors.textTertiary
                                    : theme.colors.textSecondary
                            }
                        />
                        <Text
                            style={[
                                styles.navBtnText,
                                atToday && { color: theme.colors.textTertiary },
                            ]}
                        >
                            Today
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    loadingText: {
        color: theme.colors.textTertiary,
        fontSize: 13,
        marginTop: 4,
        letterSpacing: 0.5,
    },
    errorText: { color: theme.colors.textSecondary, fontSize: 15 },
    retryBtn: {
        marginTop: 4,
        paddingHorizontal: 20,
        paddingVertical: 9,
        borderRadius: theme.radius.full,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
    },
    retryText: { color: theme.colors.textPrimary, fontSize: 13 },
    heroImage: { backgroundColor: "#050505" },
    videoPlaceholder: {
        backgroundColor: theme.colors.bgCard,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    videoText: { color: theme.colors.textSecondary, fontSize: 13 },
    openVideoBtn: {
        marginTop: 4,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.accentDim,
        borderWidth: 0.5,
        borderColor: theme.colors.accentBorder,
    },
    openVideoBtnText: {
        color: theme.colors.accent,
        fontSize: 13,
        fontWeight: "600",
    },
    fadeTop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0,0,0,0.55)",
    },
    fadeBottom: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: "rgba(0,0,0,0.45)",
    },
    topBar: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 18,
    },
    appName: {
        color: "rgba(255,255,255,0.9)",
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: -0.5,
    },
    topDate: {
        color: "rgba(255,255,255,0.45)",
        fontSize: 12,
        marginTop: 2,
        letterSpacing: 0.2,
    },
    topActions: { flexDirection: "row", gap: 8, marginTop: 2 },
    iconBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "rgba(0,0,0,0.4)",
        borderWidth: 0.5,
        borderColor: "rgba(255,255,255,0.12)",
        alignItems: "center",
        justifyContent: "center",
    },
    body: { paddingHorizontal: 20, paddingTop: 22 },
    title: {
        color: theme.colors.textPrimary,
        fontSize: 22,
        fontWeight: "700",
        lineHeight: 30,
        letterSpacing: -0.4,
    },
    copyright: { color: theme.colors.textTertiary, fontSize: 12, marginTop: 6 },
    divider: {
        height: 0.5,
        backgroundColor: theme.colors.borderSubtle,
        marginVertical: 18,
    },
    explanation: {
        color: theme.colors.textSecondary,
        fontSize: 15,
        lineHeight: 25,
        letterSpacing: 0.1,
    },
    expandBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 12,
        alignSelf: "flex-start",
    },
    expandBtnText: {
        color: theme.colors.accent,
        fontSize: 13,
        fontWeight: "500",
    },
    actions: { flexDirection: "row", gap: 10, marginTop: 24 },
    btnPrimary: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        paddingVertical: 12,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.accentDim,
        borderWidth: 0.5,
        borderColor: theme.colors.accentBorder,
    },
    btnPrimaryText: {
        color: theme.colors.accent,
        fontSize: 14,
        fontWeight: "600",
    },
    btnSecondary: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        paddingVertical: 12,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.bgElevated,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
    },
    btnSecondaryText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: "500",
    },
    navStrip: {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 20,
        marginTop: 16,
    },
    navBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        paddingVertical: 11,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.bgCard,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
    },
    navBtnAccent: {
        backgroundColor: theme.colors.accentDim,
        borderColor: theme.colors.accentBorder,
    },
    navBtnDisabled: { opacity: 0.35 },
    navBtnText: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: "500",
    },
});
