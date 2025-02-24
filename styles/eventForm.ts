// styles/eventForm.ts
import { StyleSheet, Platform } from 'react-native';

// Color palette
export const colors = {
    primary: 'rgb(71, 25, 82)',
    primaryDark: 'rgb(51, 18, 59)',
    primaryLight: 'rgba(71, 25, 82, 0.05)',
    primaryBorder: 'rgba(71, 25, 82, 0.1)',
    error: '#ff4646',
    white: '#ffffff',
    black: '#000000',
    gray: {
        100: '#f8f9fa',
        200: '#f0f0f0',
        300: '#eee',
        400: '#999',
        500: '#767577',
        600: '#666',
    }
};

// Typography
export const typography = {
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.black,
    },
    subtitle: {
        fontSize: 16,
        color: colors.primaryDark,
    },
    body: {
        fontSize: 14,
        color: colors.gray[600],
    },
    small: {
        fontSize: 12,
        color: colors.gray[600],
    },
};

// Spacing
export const spacing = {
    xs: 5,
    sm: 8,
    md: 10,
    lg: 15,
    xl: 20,
};

// Common styles
export const commonStyles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.xl,
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: colors.white,
        borderRadius: spacing.md,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.primary,
        color: colors.black,
    },
    textArea: {
        height: Platform.OS === 'ios' ? 100 : undefined,
        minHeight: Platform.OS === 'android' ? 100 : undefined,
        ...Platform.select({
            ios: {
                paddingTop: spacing.lg,
                paddingBottom: spacing.lg,
            },
            android: {
                textAlignVertical: 'top',
                paddingTop: spacing.md,
            },
        }),
    },
    sectionTitle: {
        ...typography.title,
        marginBottom: spacing.md,
    },
    cardTitle: {
        ...typography.subtitle,
        marginBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.primaryBorder,
        paddingBottom: spacing.sm,
    },
    button: {
        backgroundColor: colors.primary,
        height: 50,
        paddingHorizontal: spacing.xl,
        borderRadius: spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    buttonText: {
        color: colors.white,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
});

export default {
    colors,
    typography,
    spacing,
    commonStyles,
};