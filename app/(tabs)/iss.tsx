import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";

const ISS_URL = "https://api.wheretheiss.at/v1/satellites/25544";
const REFRESH_INTERVAL = 5000;
const MAX_TRACK_POINTS = 60;

interface ISSPosition {
    latitude: number;
    longitude: number;
}
interface ISSDetails {
    altitude: number;
    velocity: number;
    visibility: string;
}

const KNOWN_CREW = [
    { name: "Oleg Kononenko", craft: "ISS" },
    { name: "Nikolai Chub", craft: "ISS" },
    { name: "Tracy Dyson", craft: "ISS" },
    { name: "Butch Wilmore", craft: "ISS" },
    { name: "Suni Williams", craft: "ISS" },
];

function StatCard({
    icon,
    label,
    value,
    sub,
}: {
    icon: string;
    label: string;
    value: string;
    sub?: string;
}) {
    return (
        <View style={styles.statCard}>
            <Ionicons
                name={icon as any}
                size={18}
                color={theme.colors.accent}
                style={{ marginBottom: 6 }}
            />
            <Text style={styles.statValue}>{value}</Text>
            {sub && <Text style={styles.statSub}>{sub}</Text>}
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

export default function ISSScreen() {
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);
    const [position, setPosition] = useState<ISSPosition | null>(null);
    const [details, setDetails] = useState<ISSDetails | null>(null);
    const [track, setTrack] = useState<ISSPosition[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [following, setFollowing] = useState(true);

    const fetchISS = useCallback(async () => {
        try {
            const res = await fetch(ISS_URL);
            if (!res.ok) throw new Error("fetch failed");
            const data = await res.json();
            const newPos: ISSPosition = {
                latitude: parseFloat(data.latitude),
                longitude: parseFloat(data.longitude),
            };
            setPosition(newPos);
            setDetails({
                altitude: Math.round(data.altitude),
                velocity: Math.round(data.velocity),
                visibility: data.visibility ?? "unknown",
            });
            setTrack((prev) => {
                const next = [...prev, newPos];
                return next.length > MAX_TRACK_POINTS
                    ? next.slice(-MAX_TRACK_POINTS)
                    : next;
            });
            if (following) {
                mapRef.current?.animateToRegion(
                    {
                        latitude: newPos.latitude,
                        longitude: newPos.longitude,
                        latitudeDelta: 50,
                        longitudeDelta: 50,
                    },
                    800,
                );
            }
            setLoading(false);
            setError(false);
        } catch {
            setError(true);
            setLoading(false);
        }
    }, [following]);

    useEffect(() => {
        fetchISS();
        const interval = setInterval(fetchISS, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchISS]);

    const handleCenter = () => {
        setFollowing(true);
        if (position) {
            mapRef.current?.animateToRegion(
                {
                    latitude: position.latitude,
                    longitude: position.longitude,
                    latitudeDelta: 50,
                    longitudeDelta: 50,
                },
                600,
            );
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View>
                    <Text style={styles.headerSub}>LIVE TRACKER</Text>
                    <Text style={styles.headerTitle}>ISS Position</Text>
                </View>
                <View style={styles.livePill}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                <View style={styles.mapContainer}>
                    {loading ? (
                        <View style={styles.mapCenter}>
                            <ActivityIndicator
                                color={theme.colors.accent}
                                size="large"
                            />
                            <Text style={styles.loadingText}>
                                Locating ISS...
                            </Text>
                        </View>
                    ) : error ? (
                        <View style={styles.mapCenter}>
                            <Ionicons
                                name="cloud-offline-outline"
                                size={36}
                                color={theme.colors.textTertiary}
                            />
                            <Text style={styles.errorText}>Signal lost</Text>
                            <TouchableOpacity
                                onPress={fetchISS}
                                style={styles.retryBtn}
                            >
                                <Text style={styles.retryText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <MapView
                                ref={mapRef}
                                style={StyleSheet.absoluteFillObject}
                                provider={PROVIDER_DEFAULT}
                                customMapStyle={darkMapStyle}
                                initialRegion={{
                                    latitude: position?.latitude ?? 0,
                                    longitude: position?.longitude ?? 0,
                                    latitudeDelta: 50,
                                    longitudeDelta: 50,
                                }}
                                onPanDrag={() => setFollowing(false)}
                            >
                                {track.length > 1 && (
                                    <Polyline
                                        coordinates={track}
                                        strokeColor="rgba(139,92,246,0.55)"
                                        strokeWidth={2}
                                        lineDashPattern={[8, 5]}
                                    />
                                )}
                                {position && (
                                    <Marker
                                        coordinate={position}
                                        anchor={{ x: 0.5, y: 0.5 }}
                                        tracksViewChanges={false}
                                    >
                                        <View style={styles.issMarkerOuter}>
                                            <View
                                                style={styles.issMarkerInner}
                                            />
                                        </View>
                                    </Marker>
                                )}
                            </MapView>
                            {!following && (
                                <TouchableOpacity
                                    style={styles.centerBtn}
                                    onPress={handleCenter}
                                >
                                    <Ionicons
                                        name="locate-outline"
                                        size={18}
                                        color={theme.colors.textPrimary}
                                    />
                                </TouchableOpacity>
                            )}
                            {position && (
                                <View style={styles.coordsOverlay}>
                                    <Text style={styles.coordsText}>
                                        {Math.abs(position.latitude).toFixed(3)}
                                        °{position.latitude >= 0 ? "N" : "S"}{" "}
                                        {Math.abs(position.longitude).toFixed(
                                            3,
                                        )}
                                        °{position.longitude >= 0 ? "E" : "W"}
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </View>

                {details && (
                    <View style={styles.statsRow}>
                        <StatCard
                            icon="arrow-up-outline"
                            label="Altitude"
                            value={details.altitude.toLocaleString()}
                            sub="km"
                        />
                        <StatCard
                            icon="speedometer-outline"
                            label="Velocity"
                            value={details.velocity.toLocaleString()}
                            sub="km/h"
                        />
                        <StatCard
                            icon={
                                details.visibility === "daylight"
                                    ? "sunny-outline"
                                    : "moon-outline"
                            }
                            label="Visibility"
                            value={
                                details.visibility === "daylight"
                                    ? "Day"
                                    : "Night"
                            }
                        />
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Current ISS crew · {KNOWN_CREW.length} aboard
                    </Text>
                    {KNOWN_CREW.map((person, i) => (
                        <View
                            key={person.name}
                            style={[
                                styles.personRow,
                                i < KNOWN_CREW.length - 1 &&
                                    styles.personRowBorder,
                            ]}
                        >
                            <View style={styles.personAvatar}>
                                <Text style={styles.personAvatarText}>
                                    {person.name.charAt(0)}
                                </Text>
                            </View>
                            <View style={styles.personInfo}>
                                <Text style={styles.personName}>
                                    {person.name}
                                </Text>
                                <Text style={styles.personCraft}>
                                    {person.craft}
                                </Text>
                            </View>
                            <Ionicons
                                name="rocket-outline"
                                size={14}
                                color={theme.colors.textTertiary}
                            />
                        </View>
                    ))}
                </View>

                <View style={styles.factCard}>
                    <Ionicons
                        name="information-circle-outline"
                        size={16}
                        color={theme.colors.accent}
                    />
                    <Text style={styles.factText}>
                        The ISS travels at ~7.66 km/s - fast enough to orbit
                        Earth every 90 minutes and witness 16 sunrises per day.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const darkMapStyle = [
    // Background geometry
    { elementType: "geometry", stylers: [{ color: "#1a1a22" }] },
    { elementType: "geometry.stroke", stylers: [{ color: "#2a2a3a" }] },

    // Labels
    {
        elementType: "labels.text.fill",
        stylers: [{ color: "#a0a0b0" }, { lightness: 20 }],
    },
    {
        elementType: "labels.text.stroke",
        stylers: [{ color: "#0f0f1a" }, { weight: 2 }],
    },

    // Country borders
    {
        featureType: "administrative.country",
        elementType: "geometry.stroke",
        stylers: [{ color: "#3a3a4a " }, { weight: 1 }],
    },

    // Natural landscape
    { featureType: "landscape.natural", stylers: [{ color: "#1e1e26" }] },
    { featureType: "landscape.man_made", stylers: [{ color: "#222230" }] },

    // Hide most POIs but keep important ones subtle
    {
        featureType: "poi",
        elementType: "labels.text",
        stylers: [{ visibility: "off" }],
    },

    // Hide transit
    { featureType: "transit", stylers: [{ visibility: "off" }] },

    // Water
    {
        featureType: "water",
        elementType: "geometry.fill",
        stylers: [{ color: "#0d1a2a" }],
    },
    {
        featureType: "water",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1a3a50" }],
    },
];

const styles = StyleSheet.create({
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
    livePill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(239,68,68,0.12)",
        borderRadius: theme.radius.full,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 0.5,
        borderColor: "rgba(239,68,68,0.25)",
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#ef4444",
    },
    liveText: {
        color: "#ef4444",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1,
    },
    mapContainer: { height: 300, backgroundColor: "#03030f" },
    mapCenter: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    loadingText: { color: theme.colors.textTertiary, fontSize: 13 },
    errorText: { color: theme.colors.textSecondary, fontSize: 15 },
    retryBtn: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: theme.radius.full,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
    },
    retryText: { color: theme.colors.textPrimary, fontSize: 13 },
    issMarkerOuter: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "rgba(139,92,246,0.18)",
        borderWidth: 1.5,
        borderColor: theme.colors.accent,
        alignItems: "center",
        justifyContent: "center",
    },
    issMarkerInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.accent,
    },
    centerBtn: {
        position: "absolute",
        bottom: 12,
        right: 12,
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "rgba(0,0,0,0.85)",
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    coordsOverlay: {
        position: "absolute",
        bottom: 12,
        left: 12,
        backgroundColor: "rgba(0,0,0,0.82)",
        borderRadius: theme.radius.sm,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
    },
    coordsText: {
        color: theme.colors.textSecondary,
        fontSize: 11,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    },
    statsRow: {
        flexDirection: "row",
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.radius.md,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        padding: 14,
        alignItems: "center",
    },
    statValue: {
        color: theme.colors.textPrimary,
        fontSize: 17,
        fontWeight: "700",
        letterSpacing: -0.5,
    },
    statSub: { color: theme.colors.textTertiary, fontSize: 11, marginTop: 1 },
    statLabel: {
        color: theme.colors.textTertiary,
        fontSize: 11,
        marginTop: 4,
        textAlign: "center",
    },
    section: {
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.radius.lg,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        padding: 16,
    },
    sectionTitle: {
        color: theme.colors.textTertiary,
        fontSize: 11,
        letterSpacing: 1.2,
        fontWeight: "600",
        textTransform: "uppercase",
        marginBottom: 12,
    },
    personRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
    },
    personRowBorder: {
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.borderSubtle,
    },
    personAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.accentDim,
        borderWidth: 0.5,
        borderColor: theme.colors.accentBorder,
        alignItems: "center",
        justifyContent: "center",
    },
    personAvatarText: {
        color: theme.colors.accent,
        fontSize: 14,
        fontWeight: "600",
    },
    personInfo: { flex: 1, gap: 2 },
    personName: {
        color: theme.colors.textPrimary,
        fontSize: 14,
        fontWeight: "500",
    },
    personCraft: { color: theme.colors.textTertiary, fontSize: 12 },
    factCard: {
        flexDirection: "row",
        gap: 10,
        alignItems: "flex-start",
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.radius.md,
        borderWidth: 0.5,
        borderColor: theme.colors.accentBorder,
        padding: 14,
    },
    factText: {
        flex: 1,
        color: theme.colors.textSecondary,
        fontSize: 13,
        lineHeight: 20,
    },
});
