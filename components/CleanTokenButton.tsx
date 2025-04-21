import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Pressable, StyleSheet, View, Text } from "react-native";



export function CleanTokenButton() {

    const reiniciarToken = async() => {
        try {
            await AsyncStorage.removeItem('userToken');
            router.push('/auth/login');
        } catch (error) {
            alert(`Error reiniciando token: ${error}`)
        }
    }


    return (
        <View>
            <Pressable style={styles.button} onPress={reiniciarToken}>
                <Text style={styles.buttonLabel}>Click para reiniciar el token</Text>
            </Pressable>
        </View>
    )
}
// mobile first
const styles = StyleSheet.create({
    button: {
        backgroundColor: '#fe3f2e',
        borderRadius: 10,
        padding: 10,
        margin: 10,
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    buttonLabel: {
        color: '#fff',
        fontSize: 16,
    },
})