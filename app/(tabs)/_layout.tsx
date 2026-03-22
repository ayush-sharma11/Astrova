import { Tabs } from "expo-router";
import {
    SafeAreaProvider,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import FloatingTabBar from "../../components/FloatingTabBar";

export default function TabsLayout() {
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaProvider>
            <Tabs
                tabBar={(props) => <FloatingTabBar {...props} />}
                screenOptions={{
                    headerShown: false,
                    sceneStyle: {
                        paddingBottom: insets.bottom,
                        backgroundColor: "#000000",
                    },
                }}
            >
                <Tabs.Screen name="index" />
                <Tabs.Screen name="iss" />
                <Tabs.Screen name="news" />
                <Tabs.Screen name="solar" />
                <Tabs.Screen name="saved" />
            </Tabs>
        </SafeAreaProvider>
    );
}
