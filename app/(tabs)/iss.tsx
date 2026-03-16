import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { theme } from "../../constants/theme";

const ISS_URL = "https://api.wheretheiss.at/v1/satellites/25544";
const REFRESH_INTERVAL = 5000;

interface ISSPosition {
    latitude: number;
    longitude: number;
}
interface ISSDetails {
    altitude: number;
    velocity: number;
    visibility: string;
    footprint: number;
    solar_lat: number;
    solar_lon: number;
}

const STATIC_MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #03030f; }
    #map { width: 100%; height: 100%; background: #03030f; }
    .leaflet-control-attribution { display: none; }
    .leaflet-control-zoom { display: none; }
    .leaflet-tile-pane { background: #03030f; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: true,
      minZoom: 2,
      maxZoom: 10,
      maxBounds: [[-90, -Infinity], [90, Infinity]],
      maxBoundsViscosity: 1.0,
    }).setView([0, 0], 2);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      maxZoom: 10,
      minZoom: 2,
    }).addTo(map);

    var userPanning = false;
    var panTimeout = null;

    map.on('dragstart', function() {
      userPanning = true;
      if (panTimeout) clearTimeout(panTimeout);
    });

    map.on('dragend', function() {
      panTimeout = setTimeout(function() { userPanning = false; }, 10000);
    });

    var pulseIcon = L.divIcon({
      className: '',
      html: '<div style="width:14px;height:14px;background:#8B5CF6;border-radius:50%;border:2px solid rgba(139,92,246,0.6);box-shadow:0 0 0 5px rgba(139,92,246,0.2);"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    var marker = null;
    var trackPoints = [];
    var polyline = L.polyline([], { color: 'rgba(139,92,246,0.5)', weight: 2, dashArray: '6 4' }).addTo(map);
    var initialized = false;
    var ready = false;
    var pendingPos = null;

    function applyPosition(lat, lng) {
      var latlng = [lat, lng];
      if (!marker) {
        marker = L.marker(latlng, { icon: pulseIcon }).addTo(map);
      } else {
        marker.setLatLng(latlng);
      }
      trackPoints.push(latlng);
      if (trackPoints.length > 60) trackPoints = trackPoints.slice(-60);
      polyline.setLatLngs(trackPoints);
      if (!initialized) {
        map.setView(latlng, 2, { animate: false });
        initialized = true;
      } else if (!userPanning) {
        map.panTo(latlng, { animate: true, duration: 1 });
      }
    }

    map.whenReady(function() {
      setTimeout(function() {
        map.invalidateSize();
        ready = true;
        if (pendingPos) {
          applyPosition(pendingPos.lat, pendingPos.lng);
          pendingPos = null;
        }
      }, 200);
    });

    function onMessage(e) {
      try {
        var data = JSON.parse(e.data);
        if (data.type === 'UPDATE_POSITION') {
          if (ready) {
            applyPosition(data.lat, data.lng);
          } else {
            pendingPos = { lat: data.lat, lng: data.lng };
          }
        }
      } catch(err) {}
    }

    document.addEventListener('message', onMessage);
    window.addEventListener('message', onMessage);
  </script>
</body>
</html>
`;

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
    const webViewRef = useRef<WebView>(null);
    const [position, setPosition] = useState<ISSPosition | null>(null);
    const [details, setDetails] = useState<ISSDetails | null>(null);
    const [location, setLocation] = useState<string>("-");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const mapSource = useMemo(() => ({ html: STATIC_MAP_HTML }), []);
    const geocodeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fetchCountRef = useRef(0);

    const fetchLocation = useCallback(async (lat: number, lng: number) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}&zoom=5`,
                { headers: { "User-Agent": "Astrova/1.0" } },
            );
            const data = await res.json();
            if (data.error) {
                setLocation("Over the ocean");
                return;
            }
            const addr = data.address ?? {};
            const parts = [
                addr.city || addr.town || addr.village || addr.county,
                addr.state || addr.province,
                addr.country,
            ].filter(Boolean);
            setLocation(parts.length ? parts.join(", ") : "Over the ocean");
        } catch {
            setLocation("-");
        }
    }, []);

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
                footprint: Math.round(data.footprint ?? 0),
                solar_lat: parseFloat((data.solar_lat ?? 0).toFixed(2)),
                solar_lon: parseFloat((data.solar_lon ?? 0).toFixed(2)),
            });

            webViewRef.current?.postMessage(
                JSON.stringify({
                    type: "UPDATE_POSITION",
                    lat: newPos.latitude,
                    lng: newPos.longitude,
                }),
            );

            fetchCountRef.current += 1;
            if (fetchCountRef.current % 6 === 1) {
                if (geocodeRef.current) clearTimeout(geocodeRef.current);
                geocodeRef.current = setTimeout(
                    () => fetchLocation(newPos.latitude, newPos.longitude),
                    500,
                );
            }

            setLoading(false);
            setError(false);
        } catch {
            setError(true);
            setLoading(false);
        }
    }, [fetchLocation]);

    useEffect(() => {
        fetchISS();
        const interval = setInterval(fetchISS, REFRESH_INTERVAL);
        return () => {
            clearInterval(interval);
            if (geocodeRef.current) clearTimeout(geocodeRef.current);
        };
    }, [fetchISS]);

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

            <View style={styles.mapContainer}>
                <WebView
                    ref={webViewRef}
                    style={styles.webview}
                    source={mapSource}
                    scrollEnabled={false}
                    javaScriptEnabled
                    originWhitelist={["*"]}
                    onError={() => setError(true)}
                    androidLayerType="hardware"
                />

                {position && (
                    <View style={styles.coordsOverlay}>
                        <Text style={styles.coordsText}>
                            {Math.abs(position.latitude).toFixed(3)}°
                            {position.latitude >= 0 ? "N" : "S"}{" "}
                            {Math.abs(position.longitude).toFixed(3)}°
                            {position.longitude >= 0 ? "E" : "W"}
                        </Text>
                    </View>
                )}

                {loading && (
                    <View
                        style={[
                            StyleSheet.absoluteFillObject,
                            styles.mapOverlay,
                        ]}
                    >
                        <ActivityIndicator
                            color={theme.colors.accent}
                            size="large"
                        />
                        <Text style={styles.loadingText}>Locating ISS...</Text>
                    </View>
                )}

                {!loading && error && (
                    <View
                        style={[
                            StyleSheet.absoluteFillObject,
                            styles.mapOverlay,
                        ]}
                    >
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
                )}
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {details && (
                    <>
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

                        <View style={styles.locationCard}>
                            <Ionicons
                                name="location-outline"
                                size={15}
                                color={theme.colors.accent}
                            />
                            <Text style={styles.locationText} numberOfLines={1}>
                                {location}
                            </Text>
                        </View>

                        <View style={styles.detailsCard}>
                            <Text style={styles.detailsTitle}>
                                Orbital data
                            </Text>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>
                                    Coverage footprint
                                </Text>
                                <Text style={styles.detailValue}>
                                    {details.footprint.toLocaleString()} km
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>
                                    Solar latitude
                                </Text>
                                <Text style={styles.detailValue}>
                                    {details.solar_lat}°
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.detailRow,
                                    { borderBottomWidth: 0 },
                                ]}
                            >
                                <Text style={styles.detailLabel}>
                                    Solar longitude
                                </Text>
                                <Text style={styles.detailValue}>
                                    {details.solar_lon}°
                                </Text>
                            </View>
                        </View>
                    </>
                )}

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
    mapContainer: {
        height: 300,
        backgroundColor: "#03030f",
        position: "relative",
    },
    webview: { flex: 1, backgroundColor: "#03030f" },
    mapOverlay: {
        backgroundColor: "#03030f",
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
        zIndex: 10,
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
    locationCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginHorizontal: 16,
        marginTop: 10,
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.radius.md,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    locationText: { color: theme.colors.textSecondary, fontSize: 13, flex: 1 },
    detailsCard: {
        marginHorizontal: 16,
        marginTop: 10,
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.radius.lg,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        padding: 16,
    },
    detailsTitle: {
        color: theme.colors.textTertiary,
        fontSize: 11,
        letterSpacing: 1.2,
        fontWeight: "600",
        textTransform: "uppercase",
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 9,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.borderSubtle,
    },
    detailLabel: { color: theme.colors.textSecondary, fontSize: 14 },
    detailValue: {
        color: theme.colors.textPrimary,
        fontSize: 14,
        fontWeight: "500",
    },
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
