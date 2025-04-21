import { eventService } from "@/services/event.service";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";

export default function AcceptInvitationScreen() {
    const [idEvento, setIdEvento] = useState<string | null>(null);
    const [idAnfitrion, setIdAnfitrion] = useState<string | null>(null);
    const [informacionEvento, setInformacionEvento] = useState<any>(null);
    const [informacionAnfitrion, setInformacionAnfitrion] = useState<any>(null);

    // Obtener parámetros de la URL
    const { id, hostId } = useLocalSearchParams();

    useEffect(() => {
        const id_evento = id as string;
        const id_anfitrion = hostId as string;
        console.log('id_evento', id_evento);
        console.log('id_anfitrion', id_anfitrion);

        if (!id_evento || !id_anfitrion) {
            console.error("ID del evento o anfitrión no proporcionado");
            return;
        }

        setIdAnfitrion(id_anfitrion);
        setIdEvento(id_evento);
        obtenerInformacionEvento(id_anfitrion, id_evento);
    }, [id, hostId]);

    const obtenerInformacionEvento = async (id_anfitrion: string, id_evento: string) => {
        // Aquí implementa tu lógica para obtener información del evento desde una API
        try {

            if (!id_evento) {
                console.error("ID del evento no proporcionado");
                return;
            }

            const data: any = await eventService.getEventById(id_anfitrion, id_evento);

            if (!data) {
                console.error("No se encontró información del evento");
                return;
            }

            console.log("data", data);

            // Ejemplo:
            // const response = await fetch(`https://tuapi.com/eventos/${id_evento}`);
            // const data = await response.json();
            // setInformacionEvento(data);
            // setIdAnfitrion(data.idAnfitrion);
            // obtenerInformacionAnfitrion(data.idAnfitrion);

            // Código de ejemplo para pruebas:
            setInformacionEvento({
                nombre: "Evento de Prueba",
                fecha: "2025-05-15"
            });
            setIdAnfitrion("anfitrion123");
            obtenerInformacionAnfitrion("anfitrion123");
        } catch (error) {
            console.error("Error al obtener información del evento:", error);
        }
    };

    const obtenerInformacionAnfitrion = async (id_anfitrion: string) => {
        // Aquí implementa tu lógica para obtener información del anfitrión
        try {
            // Ejemplo:
            // const response = await fetch(`https://tuapi.com/anfitriones/${id_anfitrion}`);
            // const data = await response.json();
            // setInformacionAnfitrion(data);

            // Código de ejemplo para pruebas:
            setInformacionAnfitrion({
                nombre: "Juan Pérez",
                email: "juan@ejemplo.com"
            });
        } catch (error) {
            console.error("Error al obtener información del anfitrión:", error);
        }
    };

    const renderWelcomeCard = () => {
        return (
            <View style={styles.welcomeCard}>
                <Text style={styles.title}>
                    Has sido invitado al evento de {informacionAnfitrion?.nombre || "NOMBRE ANFITRION"}
                </Text>
                <Text style={styles.description}>
                    Para confirmar debes crear una cuenta, así podrás acceder a toda la información del evento!
                </Text>

                <View style={styles.buttonsContainer}>
                    <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptInvitation()}>
                        <Text style={styles.buttonText}>Aceptar invitación</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.declineButton} onPress={() => handleDeclineInvitation()}>
                        <Text style={styles.buttonText}>Rechazar invitación</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const handleAcceptInvitation = () => {
        // Implementa la lógica para aceptar la invitación
        console.log(`Aceptando invitación para evento: ${idEvento}`);
    };

    const handleDeclineInvitation = () => {
        // Implementa la lógica para rechazar la invitación
        console.log(`Rechazando invitación para evento: ${idEvento}`);
    };

    return (
        <View style={styles.container}>
            {renderWelcomeCard()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
        padding: 20,
    },
    welcomeCard: {
        padding: 20,
        borderRadius: 10,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        width: "100%",
        maxWidth: 500,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },
    description: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 20,
    },
    buttonsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
    },
    acceptButton: {
        backgroundColor: "#4CAF50",
        padding: 15,
        borderRadius: 5,
        flex: 1,
        marginRight: 10,
        alignItems: "center",
    },
    declineButton: {
        backgroundColor: "#f44336",
        padding: 15,
        borderRadius: 5,
        flex: 1,
        marginLeft: 10,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },
});