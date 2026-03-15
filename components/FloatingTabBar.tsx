import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { theme } from "../constants/theme";

const TABS = [
    { name: "index", icon: "planet-outline", iconActive: "planet" },
    { name: "iss", icon: "radio-outline", iconActive: "radio" },
    { name: "news", icon: "newspaper-outline", iconActive: "newspaper" },
    { name: "solar", icon: "sunny-outline", iconActive: "sunny" },
    { name: "saved", icon: "bookmark-outline", iconActive: "bookmark" },
];

export default function FloatingTabBar({
    state,
    navigation,
}: BottomTabBarProps) {
    return (
        <View style={styles.wrapper}>
            <View style={styles.container}>
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;

                    const tab = TABS.find((t) => t.name === route.name);
                    if (!tab) {
                        return null;
                    }

                    const onPress = () => {
                        const event = navigation.emit({
                            type: "tabPress",
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            activeOpacity={0.7}
                            style={[styles.tab, isFocused && styles.tabActive]}
                        >
                            <Ionicons
                                name={
                                    (isFocused
                                        ? tab.iconActive
                                        : tab.icon) as any
                                }
                                size={22}
                                color={
                                    isFocused
                                        ? theme.colors.accent
                                        : theme.colors.textTertiary
                                }
                            />
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: "absolute",
        bottom: Platform.OS === "ios" ? 32 : 20,
        left: 0,
        right: 0,
        alignItems: "center",
        pointerEvents: "box-none",
    },
    container: {
        flexDirection: "row",
        backgroundColor: "#0e0e0e",
        borderRadius: theme.radius.full,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        paddingHorizontal: 8,
        paddingVertical: 8,
        gap: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
        elevation: 20,
    },
    tab: {
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: theme.radius.full,
        alignItems: "center",
        justifyContent: "center",
    },
    tabActive: {
        backgroundColor: theme.colors.accentDim,
    },
});
