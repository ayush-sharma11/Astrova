import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

const PLANET_IMAGES: Record<string, string> = {
    Mercury: "https://images-assets.nasa.gov/image/PIA15160/PIA15160~orig.jpg",
    Venus: "https://images-assets.nasa.gov/image/PIA00104/PIA00104~orig.jpg",
    Earth: "https://images-assets.nasa.gov/image/as17-148-22727/as17-148-22727~orig.jpg",
    Mars: "https://images-assets.nasa.gov/image/PIA00407/PIA00407~orig.jpg",
    Jupiter: "https://images-assets.nasa.gov/image/PIA21775/PIA21775~orig.jpg",
    Saturn: "https://images-assets.nasa.gov/image/PIA06193/PIA06193~orig.jpg",
    Uranus: "https://images-assets.nasa.gov/image/PIA18182/PIA18182~orig.jpg",
    Neptune: "https://images-assets.nasa.gov/image/PIA01492/PIA01492~orig.jpg",
};
const MAX_RADIUS = Math.max(...PLANETS.map((p) => p.radius));
const MAX_DISTANCE = Math.max(...PLANETS.map((p) => p.distanceFromSun));

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

function PlanetImage({
    planet,
    size,
    style,
}: {
    planet: Planet;
    size: number;
    style?: any;
}) {
    const [imgError, setImgError] = useState(false);
    const uri = PLANET_IMAGES[planet.name];
    if (imgError || !uri) {
        return (
            <View
                style={[
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: planet.color,
                    },
                    style,
                ]}
            />
        );
    }
    return (
        <Image
            source={{ uri }}
            style={[
                { width: size, height: size, borderRadius: size / 2 },
                style,
            ]}
            resizeMode="cover"
            onError={() => setImgError(true)}
        />
    );
}

function SizeComparisonModal({
    planets,
    onClose,
}: {
    planets: Planet[];
    onClose: () => void;
}) {
    const insets = useSafeAreaInsets();
    const [planetA, setPlanetA] = useState<Planet>(planets[2]);
    const [planetB, setPlanetB] = useState<Planet>(planets[4]);
    const [selecting, setSelecting] = useState<"A" | "B" | null>(null);

    const maxR = Math.max(planetA.radius, planetB.radius);
    const MAX_DISPLAY = 120;

    const sizeA = Math.max(20, (planetA.radius / maxR) * MAX_DISPLAY);
    const sizeB = Math.max(20, (planetB.radius / maxR) * MAX_DISPLAY);

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
                    <Text style={styles.modalHeaderTitle}>Size Comparison</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons
                            name="close"
                            size={20}
                            color={theme.colors.textSecondary}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.compareContainer}>
                    <View style={styles.comparePlanet}>
                        <View style={styles.compareSphere}>
                            <PlanetImage
                                planet={planetA}
                                size={sizeA}
                                style={{
                                    shadowColor: planetA.color,
                                    shadowOpacity: 0.6,
                                    shadowRadius: 12,
                                    shadowOffset: { width: 0, height: 0 },
                                }}
                            />
                        </View>
                        <Text style={styles.compareName}>{planetA.name}</Text>
                        <Text style={styles.compareRadius}>
                            {planetA.radius.toLocaleString()} km
                        </Text>
                        <TouchableOpacity
                            style={styles.changeBtn}
                            onPress={() => setSelecting("A")}
                        >
                            <Text style={styles.changeBtnText}>Change</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.compareVs}>
                        <Text style={styles.compareVsText}>vs</Text>
                        {planetA.radius !== planetB.radius && (
                            <Text style={styles.compareRatio}>
                                {(
                                    Math.max(planetA.radius, planetB.radius) /
                                    Math.min(planetA.radius, planetB.radius)
                                ).toFixed(1)}
                                × larger
                            </Text>
                        )}
                    </View>

                    <View style={styles.comparePlanet}>
                        <View style={styles.compareSphere}>
                            <PlanetImage
                                planet={planetB}
                                size={sizeB}
                                style={{
                                    shadowColor: planetB.color,
                                    shadowOpacity: 0.6,
                                    shadowRadius: 12,
                                    shadowOffset: { width: 0, height: 0 },
                                }}
                            />
                        </View>
                        <Text style={styles.compareName}>{planetB.name}</Text>
                        <Text style={styles.compareRadius}>
                            {planetB.radius.toLocaleString()} km
                        </Text>
                        <TouchableOpacity
                            style={styles.changeBtn}
                            onPress={() => setSelecting("B")}
                        >
                            <Text style={styles.changeBtnText}>Change</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {selecting && (
                    <View style={styles.selectorContainer}>
                        <Text style={styles.selectorTitle}>Select planet</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{
                                gap: 10,
                                paddingHorizontal: 16,
                            }}
                        >
                            {planets.map((p) => (
                                <TouchableOpacity
                                    key={p.name}
                                    style={[
                                        styles.selectorPill,
                                        (selecting === "A" ? planetA : planetB)
                                            .name === p.name &&
                                            styles.selectorPillActive,
                                    ]}
                                    onPress={() => {
                                        if (selecting === "A") setPlanetA(p);
                                        else setPlanetB(p);
                                        setSelecting(null);
                                    }}
                                >
                                    <PlanetImage planet={p} size={24} />
                                    <Text style={styles.selectorPillText}>
                                        {p.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        </Modal>
    );
}

function OrbitModal({
    planets,
    onClose,
}: {
    planets: Planet[];
    onClose: () => void;
}) {
    const insets = useSafeAreaInsets();
    const [selected, setSelected] = useState<Planet | null>(null);
    const size = SCREEN_WIDTH - 32;
    const center = size / 2;
    const SUN_R = 14;
    const MIN_ORBIT_R = 20;
    const MAX_ORBIT_R = center - 20;

    const logMin = Math.log(PLANETS[0].distanceFromSun);
    const logMax = Math.log(MAX_DISTANCE);

    function orbitR(dist: number) {
        return (
            MIN_ORBIT_R +
            ((Math.log(dist) - logMin) / (logMax - logMin)) *
                (MAX_ORBIT_R - MIN_ORBIT_R)
        );
    }

    function planetDisplaySize(radius: number) {
        return Math.max(6, Math.min(18, 6 + (radius / MAX_RADIUS) * 14));
    }

    const angles = [0, 45, 90, 135, 180, 225, 270, 315];

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
                    <Text style={styles.modalHeaderTitle}>Orbital Map</Text>
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
                    <Text style={styles.orbitNote}>
                        Distances are logarithmic. Tap a planet to see details.
                    </Text>

                    <View
                        style={[
                            styles.orbitCanvas,
                            { width: size, height: size },
                        ]}
                    >
                        {planets.map((p, i) => {
                            const r = orbitR(p.distanceFromSun);
                            return (
                                <View
                                    key={p.name + "-orbit"}
                                    style={{
                                        position: "absolute",
                                        width: r * 2,
                                        height: r * 2,
                                        borderRadius: r,
                                        borderWidth: 0.5,
                                        borderColor: "rgba(255,255,255,0.08)",
                                        left: center - r,
                                        top: center - r,
                                    }}
                                />
                            );
                        })}

                        <View
                            style={[
                                styles.sun,
                                {
                                    left: center - SUN_R,
                                    top: center - SUN_R,
                                    width: SUN_R * 2,
                                    height: SUN_R * 2,
                                    borderRadius: SUN_R,
                                },
                            ]}
                        />

                        {planets.map((p, i) => {
                            const r = orbitR(p.distanceFromSun);
                            const angle = (angles[i] * Math.PI) / 180;
                            const ps = planetDisplaySize(p.radius);
                            const x = center + r * Math.cos(angle) - ps / 2;
                            const y = center + r * Math.sin(angle) - ps / 2;
                            const isSelected = selected?.name === p.name;
                            return (
                                <TouchableOpacity
                                    key={p.name}
                                    style={{
                                        position: "absolute",
                                        left: x,
                                        top: y,
                                    }}
                                    onPress={() =>
                                        setSelected(isSelected ? null : p)
                                    }
                                    hitSlop={{
                                        top: 10,
                                        bottom: 10,
                                        left: 10,
                                        right: 10,
                                    }}
                                >
                                    <PlanetImage
                                        planet={p}
                                        size={ps}
                                        style={
                                            isSelected
                                                ? {
                                                      borderWidth: 1.5,
                                                      borderColor:
                                                          theme.colors.accent,
                                                  }
                                                : undefined
                                        }
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {selected && (
                        <View style={styles.orbitDetail}>
                            <PlanetImage
                                planet={selected}
                                size={48}
                                style={{
                                    shadowColor: selected.color,
                                    shadowOpacity: 0.5,
                                    shadowRadius: 10,
                                    shadowOffset: { width: 0, height: 0 },
                                }}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.orbitDetailName}>
                                    {selected.name}
                                </Text>
                                <Text style={styles.orbitDetailDist}>
                                    {selected.distanceFromSun.toLocaleString()}{" "}
                                    million km from Sun
                                </Text>
                                <Text style={styles.orbitDetailOrbit}>
                                    {selected.orbitDays.toLocaleString()} day
                                    orbit
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelected(null)}>
                                <Ionicons
                                    name="close-circle"
                                    size={20}
                                    color={theme.colors.textTertiary}
                                />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.orbitLegend}>
                        {planets.map((p) => (
                            <View key={p.name} style={styles.orbitLegendItem}>
                                <PlanetImage planet={p} size={14} />
                                <Text style={styles.orbitLegendText}>
                                    {p.name}
                                </Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </Modal>
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
                        <PlanetImage
                            planet={planet}
                            size={120}
                            style={{
                                shadowColor: planet.color,
                                shadowOpacity: 0.7,
                                shadowRadius: 30,
                                shadowOffset: { width: 0, height: 0 },
                                elevation: 12,
                            }}
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
    const [showCompare, setShowCompare] = useState(false);
    const [showOrbit, setShowOrbit] = useState(false);

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View>
                    <Text style={styles.headerSub}>OUR NEIGHBOURHOOD</Text>
                    <Text style={styles.headerTitle}>Solar System</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.headerBtn}
                        onPress={() => setShowCompare(true)}
                    >
                        <Ionicons
                            name="resize-outline"
                            size={16}
                            color={theme.colors.accent}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerBtn}
                        onPress={() => setShowOrbit(true)}
                    >
                        <Ionicons
                            name="planet-outline"
                            size={16}
                            color={theme.colors.accent}
                        />
                    </TouchableOpacity>
                </View>
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
                        <PlanetImage
                            planet={item}
                            size={44}
                            style={{
                                shadowColor: item.color,
                                shadowOpacity: 0.5,
                                shadowRadius: 8,
                                shadowOffset: { width: 0, height: 0 },
                                elevation: 6,
                            }}
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
            {showCompare && (
                <SizeComparisonModal
                    planets={PLANETS}
                    onClose={() => setShowCompare(false)}
                />
            )}
            {showOrbit && (
                <OrbitModal
                    planets={PLANETS}
                    onClose={() => setShowOrbit(false)}
                />
            )}
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
    headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
    headerBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.accentDim,
        borderWidth: 0.5,
        borderColor: theme.colors.accentBorder,
        alignItems: "center",
        justifyContent: "center",
    },
    planetRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        gap: 14,
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
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    modalHeaderTitle: {
        color: theme.colors.textPrimary,
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: -0.3,
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
    compareContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 32,
        gap: 8,
    },
    comparePlanet: { flex: 1, alignItems: "center", gap: 8 },
    compareSphere: {
        height: 140,
        alignItems: "center",
        justifyContent: "center",
    },
    compareName: {
        color: theme.colors.textPrimary,
        fontSize: 15,
        fontWeight: "600",
    },
    compareRadius: { color: theme.colors.textTertiary, fontSize: 12 },
    changeBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.bgElevated,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
    },
    changeBtnText: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: "500",
    },
    compareVs: { alignItems: "center", gap: 4, width: 50 },
    compareVsText: {
        color: theme.colors.textTertiary,
        fontSize: 16,
        fontWeight: "600",
    },
    compareRatio: {
        color: theme.colors.accent,
        fontSize: 11,
        fontWeight: "600",
        textAlign: "center",
    },
    selectorContainer: {
        borderTopWidth: 0.5,
        borderTopColor: theme.colors.border,
        paddingTop: 16,
        paddingBottom: 16,
    },
    selectorTitle: {
        color: theme.colors.textTertiary,
        fontSize: 11,
        letterSpacing: 1.2,
        fontWeight: "600",
        textTransform: "uppercase",
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    selectorPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.bgCard,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
    },
    selectorPillActive: {
        backgroundColor: theme.colors.accentDim,
        borderColor: theme.colors.accentBorder,
    },
    selectorPillText: {
        color: theme.colors.textSecondary,
        fontSize: 13,
        fontWeight: "500",
    },
    orbitCanvas: {
        alignSelf: "center",
        position: "relative",
        marginVertical: 16,
    },
    sun: {
        position: "absolute",
        backgroundColor: "#FDB813",
        shadowColor: "#FDB813",
        shadowOpacity: 0.8,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 0 },
        elevation: 8,
    },
    orbitNote: {
        color: theme.colors.textTertiary,
        fontSize: 12,
        textAlign: "center",
        paddingHorizontal: 32,
        marginTop: 8,
    },
    orbitDetail: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginHorizontal: 16,
        marginTop: 8,
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.radius.lg,
        borderWidth: 0.5,
        borderColor: theme.colors.accentBorder,
        padding: 14,
    },
    orbitDetailName: {
        color: theme.colors.textPrimary,
        fontSize: 16,
        fontWeight: "700",
    },
    orbitDetailDist: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    orbitDetailOrbit: {
        color: theme.colors.textTertiary,
        fontSize: 12,
        marginTop: 1,
    },
    orbitLegend: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        paddingHorizontal: 16,
        marginTop: 16,
    },
    orbitLegendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    orbitLegendText: { color: theme.colors.textTertiary, fontSize: 12 },
});
