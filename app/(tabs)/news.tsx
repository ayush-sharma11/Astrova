import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";
import { cacheNews, getCachedNews } from "../../utils/storage";

const NEWS_API =
    "https://api.spaceflightnewsapi.net/v4/articles?limit=20&ordering=-published_at";

interface Article {
    id: number;
    title: string;
    summary: string;
    url: string;
    image_url: string;
    news_site: string;
    published_at: string;
}

function timeAgo(dateStr: string) {
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function NewsCard({ item }: { item: Article }) {
    const [imgError, setImgError] = useState(false);

    return (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(item.url)}
        >
            {item.image_url && !imgError ? (
                <Image
                    source={{ uri: item.image_url }}
                    style={styles.cardImage}
                    resizeMode="cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                <View style={styles.cardImageFallback}>
                    <Ionicons
                        name="rocket-outline"
                        size={24}
                        color={theme.colors.textTertiary}
                    />
                </View>
            )}
            <View style={styles.cardContent}>
                <View style={styles.cardMeta}>
                    <View style={styles.sourcePill}>
                        <Text style={styles.sourceText}>{item.news_site}</Text>
                    </View>
                    <Text style={styles.timeText}>
                        {timeAgo(item.published_at)}
                    </Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={styles.cardSummary} numberOfLines={2}>
                    {item.summary}
                </Text>
                <View style={styles.cardFooter}>
                    <Text style={styles.readLink}>Read article</Text>
                    <Ionicons
                        name="arrow-forward"
                        size={13}
                        color={theme.colors.accent}
                    />
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function NewsScreen() {
    const insets = useSafeAreaInsets();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);

    const fetchNews = useCallback(async (isRefresh = false) => {
        if (!isRefresh) {
            const cached = await getCachedNews();
            if (cached) {
                setArticles(cached);
                setLoading(false);
                return;
            }
        }
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(false);
        try {
            const res = await fetch(NEWS_API);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const articles = data.results ?? [];
            setArticles(articles);
            await cacheNews(articles);
        } catch (e) {
            if (__DEV__) console.error("[News fetch error]", e);
            setError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View>
                    <Text style={styles.headerLabel}>LATEST</Text>
                    <Text style={styles.headerTitle}>Space News</Text>
                </View>
                <TouchableOpacity
                    style={styles.refreshBtn}
                    onPress={() => fetchNews(true)}
                >
                    <Ionicons
                        name="refresh-outline"
                        size={18}
                        color={theme.colors.textSecondary}
                    />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator
                        color={theme.colors.accent}
                        size="large"
                    />
                    <Text style={styles.loadingText}>
                        Fetching transmissions...
                    </Text>
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Ionicons
                        name="cloud-offline-outline"
                        size={40}
                        color={theme.colors.textTertiary}
                    />
                    <Text style={styles.errorText}>No signal</Text>
                    <TouchableOpacity
                        onPress={() => fetchNews()}
                        style={styles.retryBtn}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={articles}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <NewsCard item={item} />}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingBottom: 120,
                        paddingTop: 8,
                    }}
                    showsVerticalScrollIndicator={false}
                    onRefresh={() => fetchNews(true)}
                    refreshing={refreshing}
                    ItemSeparatorComponent={() => (
                        <View style={{ height: 10 }} />
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.borderSubtle,
    },
    headerLabel: {
        color: theme.colors.accent,
        fontSize: 10,
        letterSpacing: 2,
        fontWeight: "600",
    },
    headerTitle: {
        color: theme.colors.textPrimary,
        fontSize: 26,
        fontWeight: "700",
        letterSpacing: -0.5,
        marginTop: 2,
    },
    refreshBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.bgCard,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    loadingText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        marginTop: 8,
    },
    errorText: {
        color: theme.colors.textSecondary,
        fontSize: 16,
    },
    retryBtn: {
        marginTop: 8,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: theme.radius.full,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
    },
    retryText: {
        color: theme.colors.textPrimary,
        fontSize: 14,
    },
    card: {
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.radius.lg,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        overflow: "hidden",
    },
    cardImage: {
        width: "100%",
        height: 180,
    },
    cardImageFallback: {
        width: "100%",
        height: 120,
        backgroundColor: theme.colors.bgElevated,
        alignItems: "center",
        justifyContent: "center",
    },
    cardContent: {
        padding: 14,
        gap: 8,
    },
    cardMeta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    sourcePill: {
        backgroundColor: theme.colors.tag,
        borderRadius: theme.radius.full,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderWidth: 0.5,
        borderColor: theme.colors.accentBorder,
    },
    sourceText: {
        color: theme.colors.tagText,
        fontSize: 11,
        fontWeight: "600",
    },
    timeText: {
        color: theme.colors.textTertiary,
        fontSize: 12,
    },
    cardTitle: {
        color: theme.colors.textPrimary,
        fontSize: 16,
        fontWeight: "600",
        lineHeight: 22,
        letterSpacing: -0.2,
    },
    cardSummary: {
        color: theme.colors.textSecondary,
        fontSize: 13,
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2,
    },
    readLink: {
        color: theme.colors.accent,
        fontSize: 13,
        fontWeight: "600",
    },
});
