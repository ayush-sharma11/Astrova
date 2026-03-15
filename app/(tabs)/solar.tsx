import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";

interface Planet {
    name: string;
    color: string;
    radius: number;
    mass: string;
    gravity: number;
    avgTemp: number;
    orbitDays: number;
    rotationHours: number;
    distanceFromSun: number;
    moons: number;
    moonNames: string[];
    description: string;
    funFact: string;
}

const PLANETS: Planet[] = [
    {
        name: "Mercury",
        color: "#9a9a9a",
        radius: 2439.7,
        mass: "3.30 × 10^23 kg",
        gravity: 3.7,
        avgTemp: 440,
        orbitDays: 88,
        rotationHours: 1407.6,
        distanceFromSun: 57.9,
        moons: 0,
        moonNames: [],
        description:
            "The smallest planet in our solar system and closest to the Sun, Mercury has a thin atmosphere and extreme temperature swings.",
        funFact:
            "A day on Mercury (sunrise to sunrise) lasts 176 Earth days - longer than its year.",
    },
    {
        name: "Venus",
        color: "#c8a96e",
        radius: 6051.8,
        mass: "4.87 × 10^24 kg",
        gravity: 8.87,
        avgTemp: 737,
        orbitDays: 225,
        rotationHours: -5832.5,
        distanceFromSun: 108.2,
        moons: 0,
        moonNames: [],
        description:
            "The hottest planet in the solar system, Venus has a thick toxic atmosphere of carbon dioxide with clouds of sulfuric acid.",
        funFact:
            "Venus rotates backwards compared to most planets - the Sun rises in the west there.",
    },
    {
        name: "Earth",
        color: "#4a9eda",
        radius: 6371,
        mass: "5.97 × 10^24 kg",
        gravity: 9.81,
        avgTemp: 288,
        orbitDays: 365,
        rotationHours: 23.9,
        distanceFromSun: 149.6,
        moons: 1,
        moonNames: ["Moon"],
        description:
            "Our home planet is the only known place in the universe confirmed to host life. About 71% of its surface is covered in water.",
        funFact: "Earth is the densest planet in the solar system.",
    },
    {
        name: "Mars",
        color: "#c1440e",
        radius: 3389.5,
        mass: "6.42 × 10^23 kg",
        gravity: 3.72,
        avgTemp: 210,
        orbitDays: 687,
        rotationHours: 24.6,
        distanceFromSun: 227.9,
        moons: 2,
        moonNames: ["Phobos", "Deimos"],
        description:
            "The Red Planet has the tallest volcano and deepest canyon in the solar system. Evidence suggests liquid water once flowed here.",
        funFact: "Olympus Mons on Mars is 3× the height of Mount Everest.",
    },
    {
        name: "Jupiter",
        color: "#c88b3a",
        radius: 69911,
        mass: "1.90 × 10^27 kg",
        gravity: 24.79,
        avgTemp: 165,
        orbitDays: 4333,
        rotationHours: 9.9,
        distanceFromSun: 778.5,
        moons: 95,
        moonNames: [
            "Io",
            "Europa",
            "Ganymede",
            "Callisto",
            "Amalthea",
            "Himalia",
            "Elara",
            "Pasiphae",
            "Sinope",
            "Lysithea",
        ],
        description:
            "The largest planet in our solar system, Jupiter is a gas giant with the iconic Great Red Spot - a storm larger than Earth that has raged for centuries.",
        funFact:
            "Jupiter's Great Red Spot storm has been raging for over 350 years.",
    },
    {
        name: "Saturn",
        color: "#e4d191",
        radius: 58232,
        mass: "5.68 × 10^26 kg",
        gravity: 10.44,
        avgTemp: 134,
        orbitDays: 10759,
        rotationHours: 10.7,
        distanceFromSun: 1432,
        moons: 146,
        moonNames: [
            "Titan",
            "Enceladus",
            "Mimas",
            "Tethys",
            "Dione",
            "Rhea",
            "Hyperion",
            "Iapetus",
            "Phoebe",
            "Janus",
        ],
        description:
            "Known for its stunning ring system made of ice and rock, Saturn is a gas giant less dense than water - it would float in a large enough ocean.",
        funFact:
            "Saturn's rings stretch up to 282,000 km from the planet but are only ~10 meters thick.",
    },
    {
        name: "Uranus",
        color: "#7de8e8",
        radius: 25362,
        mass: "8.68 × 10^25 kg",
        gravity: 8.87,
        avgTemp: 76,
        orbitDays: 30687,
        rotationHours: -17.2,
        distanceFromSun: 2867,
        moons: 27,
        moonNames: [
            "Miranda",
            "Ariel",
            "Umbriel",
            "Titania",
            "Oberon",
            "Caliban",
            "Sycorax",
            "Prospero",
            "Setebos",
            "Stephano",
        ],
        description:
            "An ice giant that rotates on its side, Uranus has a unique tilt of 98 degrees. Its faint rings were only discovered in 1977.",
        funFact:
            "Uranus rotates on its side - its poles experience 42 years of continuous sunlight followed by 42 years of darkness.",
    },
    {
        name: "Neptune",
        color: "#3f54ba",
        radius: 24622,
        mass: "1.02 × 10^26 kg",
        gravity: 11.15,
        avgTemp: 72,
        orbitDays: 60190,
        rotationHours: 16.1,
        distanceFromSun: 4515,
        moons: 16,
        moonNames: [
            "Triton",
            "Nereid",
            "Naiad",
            "Thalassa",
            "Despina",
            "Galatea",
            "Larissa",
            "Proteus",
            "Halimede",
            "Sao",
        ],
        description:
            "The windiest planet in the solar system, Neptune has supersonic winds reaching 2,100 km/h. It takes 165 Earth years to complete one orbit.",
        funFact:
            "Neptune's moon Triton orbits backwards and is slowly spiraling inward - it will eventually be torn apart.",
    },
];

function kelvinToCelsius(k: number) {
    return (k - 273.15).toFixed(0);
}

function StatRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.statRow}>
            <Text style={styles.statRowLabel}>{label}</Text>
            <Text style={styles.statRowValue}>{value}</Text>
        </View>
    );
}

function PlanetModal({
    planet,
    onClose,
}: {
    planet: Planet;
    onClose: () => void;
}) {
    const insets = useSafeAreaInsets();
    const planetIndex = PLANETS.indexOf(planet) + 1;

    return (
        <Modal
            visible
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View
                style={[styles.modalContainer, { paddingTop: insets.top + 8 }]}
            >
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons
                            name="close"
                            size={20}
                            color={theme.colors.textSecondary}
                        />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 60 }}
                >
                    <View style={styles.planetHero}>
                        <View
                            style={[
                                styles.planetCircleLarge,
                                {
                                    backgroundColor: planet.color,
                                    shadowColor: planet.color,
                                },
                            ]}
                        />
                        <Text style={styles.modalName}>{planet.name}</Text>
                        <Text style={styles.modalSub}>
                            Planet {planetIndex} from the Sun ·{" "}
                            {planet.moons === 0
                                ? "No moons"
                                : `${planet.moons} moon${planet.moons !== 1 ? "s" : ""}`}
                        </Text>
                    </View>

                    <View style={styles.descCard}>
                        <Text style={styles.descText}>
                            {planet.description}
                        </Text>
                    </View>

                    <View style={styles.statsCard}>
                        <Text style={styles.statsCardTitle}>Physical data</Text>
                        <StatRow
                            label="Radius"
                            value={`${planet.radius.toLocaleString()} km`}
                        />
                        <StatRow label="Mass" value={planet.mass} />
                        <StatRow
                            label="Gravity"
                            value={`${planet.gravity} m/s²`}
                        />
                        <StatRow
                            label="Avg temperature"
                            value={`${planet.avgTemp} K (${kelvinToCelsius(planet.avgTemp)}°C)`}
                        />
                    </View>

                    <View style={styles.statsCard}>
                        <Text style={styles.statsCardTitle}>Orbital data</Text>
                        <StatRow
                            label="Orbit period"
                            value={`${planet.orbitDays.toLocaleString()} days`}
                        />
                        <StatRow
                            label="Rotation period"
                            value={`${Math.abs(planet.rotationHours).toLocaleString()} hours${planet.rotationHours < 0 ? " (retrograde)" : ""}`}
                        />
                        <StatRow
                            label="Distance from Sun"
                            value={`${planet.distanceFromSun.toLocaleString()} million km`}
                        />
                    </View>

                    {planet.moonNames.length > 0 && (
                        <View style={styles.statsCard}>
                            <Text style={styles.statsCardTitle}>
                                Notable moons ({planet.moons} total)
                            </Text>
                            <View style={styles.moonsWrap}>
                                {planet.moonNames.map((m) => (
                                    <View key={m} style={styles.moonPill}>
                                        <Text style={styles.moonPillText}>
                                            {m}
                                        </Text>
                                    </View>
                                ))}
                                {planet.moons > planet.moonNames.length && (
                                    <View style={styles.moonPill}>
                                        <Text style={styles.moonPillText}>
                                            +
                                            {planet.moons -
                                                planet.moonNames.length}{" "}
                                            more
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    <View style={styles.factCard}>
                        <Ionicons
                            name="bulb-outline"
                            size={16}
                            color={theme.colors.accent}
                        />
                        <Text style={styles.factText}>{planet.funFact}</Text>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}

export default function SolarScreen() {
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState<Planet | null>(null);

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <Text style={styles.headerSub}>OUR NEIGHBOURHOOD</Text>
                <Text style={styles.headerTitle}>Solar System</Text>
            </View>

            <FlatList
                data={PLANETS}
                keyExtractor={(item) => item.name}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingBottom: 120,
                    paddingTop: 8,
                }}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => (
                    <View
                        style={{
                            height: 0.5,
                            backgroundColor: theme.colors.borderSubtle,
                            marginLeft: 68,
                        }}
                    />
                )}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.planetRow}
                        activeOpacity={0.7}
                        onPress={() => setSelected(item)}
                    >
                        <View
                            style={[
                                styles.planetCircle,
                                {
                                    backgroundColor: item.color,
                                    shadowColor: item.color,
                                },
                            ]}
                        />
                        <View style={styles.planetInfo}>
                            <Text style={styles.planetName}>{item.name}</Text>
                            <Text style={styles.planetMeta}>
                                {item.moons === 0
                                    ? "No moons"
                                    : `${item.moons} moon${item.moons !== 1 ? "s" : ""}`}{" "}
                                · {item.orbitDays.toLocaleString()} day orbit
                            </Text>
                        </View>
                        <View style={styles.planetRight}>
                            <Text style={styles.planetRadius}>
                                {item.radius.toLocaleString()}
                            </Text>
                            <Text style={styles.planetRadiusLabel}>
                                km radius
                            </Text>
                        </View>
                        <Ionicons
                            name="chevron-forward"
                            size={14}
                            color={theme.colors.textTertiary}
                            style={{ marginLeft: 6 }}
                        />
                    </TouchableOpacity>
                )}
            />

            {selected && (
                <PlanetModal
                    planet={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
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
    planetRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        gap: 14,
    },
    planetCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 6,
    },
    planetInfo: { flex: 1, gap: 3 },
    planetName: {
        color: theme.colors.textPrimary,
        fontSize: 16,
        fontWeight: "600",
    },
    planetMeta: { color: theme.colors.textTertiary, fontSize: 12 },
    planetRight: { alignItems: "flex-end", gap: 2 },
    planetRadius: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        fontWeight: "500",
    },
    planetRadiusLabel: { color: theme.colors.textTertiary, fontSize: 11 },
    modalContainer: { flex: 1, backgroundColor: theme.colors.bg },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingHorizontal: 16,
        paddingBottom: 8,
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
    planetHero: { alignItems: "center", paddingVertical: 32, gap: 12 },
    planetCircleLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 30,
        elevation: 12,
    },
    modalName: {
        color: theme.colors.textPrimary,
        fontSize: 30,
        fontWeight: "700",
        letterSpacing: -0.5,
    },
    modalSub: { color: theme.colors.textTertiary, fontSize: 14 },
    descCard: {
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.radius.lg,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        padding: 16,
    },
    descText: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        lineHeight: 22,
    },
    statsCard: {
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.radius.lg,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        padding: 16,
    },
    statsCardTitle: {
        color: theme.colors.textTertiary,
        fontSize: 11,
        letterSpacing: 1.2,
        fontWeight: "600",
        textTransform: "uppercase",
        marginBottom: 10,
    },
    statRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.borderSubtle,
    },
    statRowLabel: { color: theme.colors.textSecondary, fontSize: 14 },
    statRowValue: {
        color: theme.colors.textPrimary,
        fontSize: 14,
        fontWeight: "500",
        maxWidth: "55%",
        textAlign: "right",
    },
    moonsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
    moonPill: {
        backgroundColor: theme.colors.bgElevated,
        borderRadius: theme.radius.full,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
    },
    moonPillText: { color: theme.colors.textSecondary, fontSize: 12 },
    factCard: {
        flexDirection: "row",
        gap: 10,
        alignItems: "flex-start",
        marginHorizontal: 16,
        marginBottom: 12,
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
