import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    Linking,
    Modal,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";
import { getSavedAPODs, SavedAPOD, unsaveAPOD } from "../../utils/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

function formatSavedAt(ts: number) {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function APODDetailModal({
    apod,
    onClose,
    onUnsave,
}: {
    apod: SavedAPOD;
    onClose: () => void;
    onUnsave: () => void;
}) {
    const insets = useSafeAreaInsets();
    const [expanded, setExpanded] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const shortExplanation =
        apod.explanation.length > 280
            ? apod.explanation.slice(0, 280).trimEnd() + "..."
            : apod.explanation;

    const handleShare = async () => {
        await Share.share({ message: `${apod.title}\n\n${apod.url}` });
    };

    return (
        <Modal
            visible
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View
                style={[
                    modalStyles.container,
                    { backgroundColor: theme.colors.bg },
                ]}
            >
                {/* Custom confirm overlay */}
                {showConfirm && (
                    <View style={modalStyles.confirmOverlay}>
                        <View style={modalStyles.confirmBox}>
                            <View style={modalStyles.confirmIconWrap}>
                                <Ionicons
                                    name="bookmark"
                                    size={22}
                                    color={theme.colors.accent}
                                />
                            </View>
                            <Text style={modalStyles.confirmTitle}>
                                Remove from saved?
                            </Text>
                            <Text
                                style={modalStyles.confirmSub}
                                numberOfLines={2}
                            >
                                {apod.title}
                            </Text>
                            <View style={modalStyles.confirmActions}>
                                <TouchableOpacity
                                    style={modalStyles.confirmCancelBtn}
                                    onPress={() => setShowConfirm(false)}
                                >
                                    <Text style={modalStyles.confirmCancelText}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={modalStyles.confirmRemoveBtn}
                                    onPress={() => {
                                        setShowConfirm(false);
                                        onUnsave();
                                    }}
                                >
                                    <Text style={modalStyles.confirmRemoveText}>
                                        Remove
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
                <View
                    style={[modalStyles.header, { paddingTop: insets.top + 8 }]}
                >
                    <TouchableOpacity
                        onPress={onClose}
                        style={modalStyles.closeBtn}
                    >
                        <Ionicons
                            name="close"
                            size={20}
                            color={theme.colors.textSecondary}
                        />
                    </TouchableOpacity>
                    <View style={modalStyles.headerActions}>
                        <TouchableOpacity
                            onPress={() => setShowConfirm(true)}
                            style={modalStyles.unsaveBtn}
                        >
                            <Ionicons
                                name="bookmark"
                                size={16}
                                color={theme.colors.accent}
                            />
                            <Text style={modalStyles.unsaveBtnText}>Saved</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleShare}
                            style={modalStyles.shareBtn}
                        >
                            <Ionicons
                                name="share-outline"
                                size={16}
                                color={theme.colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 60 }}
                >
                    {apod.media_type === "image" ? (
                        <Image
                            source={{ uri: apod.url }}
                            style={{
                                width: SCREEN_WIDTH,
                                height: SCREEN_WIDTH * 0.75,
                            }}
                            resizeMode="cover"
                        />
                    ) : (
                        <View
                            style={[
                                modalStyles.videoPlaceholder,
                                {
                                    width: SCREEN_WIDTH,
                                    height: SCREEN_WIDTH * 0.6,
                                },
                            ]}
                        >
                            <Ionicons
                                name="videocam-outline"
                                size={32}
                                color={theme.colors.textTertiary}
                            />
                            <TouchableOpacity
                                style={modalStyles.openVideoBtn}
                                onPress={() => Linking.openURL(apod.url)}
                            >
                                <Text style={modalStyles.openVideoBtnText}>
                                    Open on NASA
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={modalStyles.body}>
                        <Text style={modalStyles.dateLabel}>
                            {formatDate(apod.date)}
                        </Text>
                        <Text style={modalStyles.title}>{apod.title}</Text>
                        {apod.copyright && (
                            <Text style={modalStyles.copyright}>
                                Photo © {apod.copyright.trim()}
                            </Text>
                        )}
                        <View style={modalStyles.divider} />
                        <Text style={modalStyles.explanation}>
                            {expanded ? apod.explanation : shortExplanation}
                        </Text>
                        {apod.explanation.length > 280 && (
                            <TouchableOpacity
                                onPress={() => setExpanded((e) => !e)}
                                style={modalStyles.expandBtn}
                            >
                                <Text style={modalStyles.expandBtnText}>
                                    {expanded
                                        ? "Show less"
                                        : "Continue reading"}
                                </Text>
                                <Ionicons
                                    name={
                                        expanded ? "chevron-up" : "chevron-down"
                                    }
                                    size={13}
                                    color={theme.colors.accent}
                                />
                            </TouchableOpacity>
                        )}
                        {apod.hdurl && (
                            <TouchableOpacity
                                style={modalStyles.hdBtn}
                                onPress={() => Linking.openURL(apod.hdurl!)}
                            >
                                <Ionicons
                                    name="expand-outline"
                                    size={15}
                                    color={theme.colors.accent}
                                />
                                <Text style={modalStyles.hdBtnText}>
                                    View HD image
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

export default function SavedScreen() {
    const insets = useSafeAreaInsets();
    const [saved, setSaved] = useState<SavedAPOD[]>([]);
    const [selected, setSelected] = useState<SavedAPOD | null>(null);

    const loadSaved = useCallback(async () => {
        const data = await getSavedAPODs();
        setSaved(data);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadSaved();
        }, [loadSaved]),
    );

    const handleUnsave = async (date: string) => {
        await unsaveAPOD(date);
        setSelected(null);
        loadSaved();
    };

    if (saved.length === 0) {
        return (
            <View
                style={[styles.container, { backgroundColor: theme.colors.bg }]}
            >
                <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                    <Text style={styles.headerSub}>COLLECTION</Text>
                    <Text style={styles.headerTitle}>Saved</Text>
                </View>
                <View style={styles.empty}>
                    <Ionicons
                        name="bookmark-outline"
                        size={40}
                        color={theme.colors.textTertiary}
                    />
                    <Text style={styles.emptyTitle}>Nothing saved yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Tap the bookmark icon on any APOD to save it here
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View>
                    <Text style={styles.headerSub}>COLLECTION</Text>
                    <Text style={styles.headerTitle}>Saved</Text>
                </View>
                <View style={styles.countPill}>
                    <Text style={styles.countText}>{saved.length}</Text>
                </View>
            </View>

            <FlatList
                data={saved}
                keyExtractor={(item) => item.date}
                numColumns={2}
                columnWrapperStyle={{ gap: 10 }}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingBottom: 120,
                    paddingTop: 12,
                    gap: 10,
                }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.8}
                        onPress={() => setSelected(item)}
                    >
                        {item.media_type === "image" ? (
                            <Image
                                source={{ uri: item.url }}
                                style={styles.cardImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.cardVideoPlaceholder}>
                                <Ionicons
                                    name="videocam-outline"
                                    size={24}
                                    color={theme.colors.textTertiary}
                                />
                            </View>
                        )}
                        <View style={styles.cardBody}>
                            <Text style={styles.cardDate}>
                                {formatDate(item.date)}
                            </Text>
                            <Text style={styles.cardTitle} numberOfLines={2}>
                                {item.title}
                            </Text>
                            <Text style={styles.cardSavedAt}>
                                Saved {formatSavedAt(item.savedAt)}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />

            {selected && (
                <APODDetailModal
                    apod={selected}
                    onClose={() => setSelected(null)}
                    onUnsave={() => handleUnsave(selected.date)}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.borderSubtle,
    },
    headerSub: {
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
    countPill: {
        backgroundColor: theme.colors.accentDim,
        borderRadius: theme.radius.full,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderWidth: 0.5,
        borderColor: theme.colors.accentBorder,
    },
    countText: { color: theme.colors.accent, fontSize: 13, fontWeight: "700" },
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        color: theme.colors.textSecondary,
        fontSize: 18,
        fontWeight: "600",
    },
    emptySubtitle: {
        color: theme.colors.textTertiary,
        fontSize: 14,
        textAlign: "center",
        lineHeight: 22,
    },
    card: {
        flex: 1,
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.radius.lg,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        overflow: "hidden",
    },
    cardImage: { width: "100%", height: 130 },
    cardVideoPlaceholder: {
        width: "100%",
        height: 100,
        backgroundColor: theme.colors.bgElevated,
        alignItems: "center",
        justifyContent: "center",
    },
    cardBody: { padding: 10, gap: 4 },
    cardDate: {
        color: theme.colors.accent,
        fontSize: 10,
        fontWeight: "600",
        letterSpacing: 0.5,
    },
    cardTitle: {
        color: theme.colors.textPrimary,
        fontSize: 13,
        fontWeight: "600",
        lineHeight: 18,
    },
    cardSavedAt: {
        color: theme.colors.textTertiary,
        fontSize: 11,
        marginTop: 2,
    },
});

const modalStyles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.bgElevated,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    headerActions: { flexDirection: "row", gap: 8 },
    unsaveBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.accentDim,
        borderWidth: 0.5,
        borderColor: theme.colors.accentBorder,
    },
    unsaveBtnText: {
        color: theme.colors.accent,
        fontSize: 13,
        fontWeight: "600",
    },
    shareBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: theme.colors.bgElevated,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    videoPlaceholder: {
        backgroundColor: theme.colors.bgCard,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    openVideoBtn: {
        paddingHorizontal: 18,
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
    body: { paddingHorizontal: 20, paddingTop: 20 },
    dateLabel: {
        color: theme.colors.accent,
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.5,
        marginBottom: 6,
    },
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
        marginVertical: 16,
    },
    explanation: {
        color: theme.colors.textSecondary,
        fontSize: 15,
        lineHeight: 25,
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
    hdBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 20,
        paddingVertical: 12,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.accentDim,
        borderWidth: 0.5,
        borderColor: theme.colors.accentBorder,
    },
    hdBtnText: { color: theme.colors.accent, fontSize: 14, fontWeight: "600" },
    confirmOverlay: {
        position: "absolute",
        inset: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.75)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        paddingHorizontal: 32,
    },
    confirmBox: {
        width: "100%",
        backgroundColor: "#000000",
        borderRadius: theme.radius.xl,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        padding: 24,
        alignItems: "center",
        gap: 8,
    },
    confirmIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.accentDim,
        borderWidth: 0.5,
        borderColor: theme.colors.accentBorder,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },
    confirmTitle: {
        color: theme.colors.textPrimary,
        fontSize: 17,
        fontWeight: "700",
        letterSpacing: -0.3,
    },
    confirmSub: {
        color: theme.colors.textTertiary,
        fontSize: 13,
        textAlign: "center",
        lineHeight: 18,
        marginBottom: 8,
    },
    confirmActions: {
        flexDirection: "row",
        gap: 10,
        width: "100%",
        marginTop: 4,
    },
    confirmCancelBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.bgElevated,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        alignItems: "center",
    },
    confirmCancelText: {
        color: theme.colors.textSecondary,
        fontSize: 15,
        fontWeight: "600",
    },
    confirmRemoveBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: theme.radius.full,
        backgroundColor: "rgba(239,68,68,0.12)",
        borderWidth: 0.5,
        borderColor: "rgba(239,68,68,0.3)",
        alignItems: "center",
    },
    confirmRemoveText: {
        color: "#ef4444",
        fontSize: 15,
        fontWeight: "600",
    },
});
