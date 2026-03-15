import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { theme } from "../constants/theme";

export default function RootLayout() {
    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }} />
        </View>
    );
}
