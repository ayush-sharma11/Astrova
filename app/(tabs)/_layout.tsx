import { Tabs } from "expo-router";
import FloatingTabBar from "../../components/FloatingTabBar";

export default function TabsLayout() {
    return (
        <Tabs
            tabBar={(props) => <FloatingTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="iss" />
            <Tabs.Screen name="news" />
            <Tabs.Screen name="solar" />
            <Tabs.Screen name="saved" />
        </Tabs>
    );
}
