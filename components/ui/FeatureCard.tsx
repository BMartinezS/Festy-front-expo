import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { View, Text, StyleSheet } from "react-native"


function FeatureCard({ title, subtitle, icon }: { title: string, subtitle: string, icon: string }) {
    return (
        <View style={styles.featuredCard}>
            <LinearGradient
                colors={['#6a0dad', '#9b59b6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featuredCardGradient}
            >
                <View style={styles.featuredCardContent}>
                    <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={36} color="white" />
                    <View style={styles.featuredCardText}>
                        <Text style={styles.featuredCardTitle}>{title}</Text>
                        <Text style={styles.featuredCardSubtitle}>{subtitle}</Text>
                    </View>
                </View>
            </LinearGradient>
        </View>
    )
}

const styles = StyleSheet.create({
    featuredCard: {
        marginTop: 30,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
    },
    featuredCardGradient: {
        padding: 20,
    },
    featuredCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featuredCardText: {
        marginLeft: 15,
    },
    featuredCardTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    featuredCardSubtitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 14,
        marginTop: 5,
    },
})

export default FeatureCard;
