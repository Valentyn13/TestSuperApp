import React, { useEffect } from 'react';
import { View, Alert, Platform } from 'react-native';
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication';
import auth from '@react-native-firebase/auth';
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { styles } from './LoginScreen.styles';

export const LoginScreen = () => {

    async function onGoogleButtonPress() {
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const response = await GoogleSignin.signIn();
            const idToken = response.data?.idToken;
            if (!idToken) {
                throw new Error('Google Sign-In failed - no id token returned');
            }

            const googleCredential = auth.GoogleAuthProvider.credential(idToken);

            await auth().signInWithCredential(googleCredential);
        } catch (error: any) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                console.log('User canceled Google Sign-In');
            } else if (error.code === statusCodes.IN_PROGRESS) {
                console.log('Google Sign-In is in progress');
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert('Error', 'Play services not available or outdated');
            } else {
                console.error(error);
                Alert.alert('Login Error', error.message);
            }
        }
    }

    async function onAppleButtonPress() {
        try {
            const appleAuthRequestResponse = await appleAuth.performRequest({
                requestedOperation: appleAuth.Operation.LOGIN,
                requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
            });
            if (!appleAuthRequestResponse.identityToken) {
                throw new Error('Apple Sign-In failed - no identify token returned');
            }

            const { identityToken, nonce } = appleAuthRequestResponse;
            const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

            await auth().signInWithCredential(appleCredential);
        } catch (error: any) {
            if (error.code === appleAuth.Error.CANCELED) {
                console.log('User canceled Apple Sign-In');
            } else {
                console.error(error);
                Alert.alert('Login Error', error.message);
            }
        }
    }

    return (
        <View style={styles.container}>
            {Platform.OS === 'ios' && (
                <AppleButton
                    buttonStyle={AppleButton.Style.WHITE}
                    buttonType={AppleButton.Type.SIGN_IN}
                    style={styles.appleButton}
                    onPress={() => onAppleButtonPress()}
                />
            )}

            <GoogleSigninButton
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
                onPress={onGoogleButtonPress}
                style={styles.googleButton}
            />
        </View>
    );
};

