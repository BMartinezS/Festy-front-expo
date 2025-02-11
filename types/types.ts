import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
};

export type LoginScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'Login'
>;

export type RegisterScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'Register'
>;