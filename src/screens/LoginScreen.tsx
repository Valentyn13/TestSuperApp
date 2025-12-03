import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication';
import auth from '@react-native-firebase/auth';

export const LoginScreen = () => {
    async function onAppleButtonPress() {
        try {
            // Start the sign-in request
            const appleAuthRequestResponse = await appleAuth.performRequest({
                requestedOperation: appleAuth.Operation.LOGIN,
                requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
            });

            // Ensure Apple returned a user identityToken
            if (!appleAuthRequestResponse.identityToken) {
                throw new Error('Apple Sign-In failed - no identify token returned');
            }

            // Create a Firebase credential from the response
            const { identityToken, nonce } = appleAuthRequestResponse;
            const googleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

            // Sign the user in with the credential
            await auth().signInWithCredential(googleCredential);
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
            <AppleButton
                buttonStyle={AppleButton.Style.WHITE}
                buttonType={AppleButton.Type.SIGN_IN}
                style={styles.appleButton}
                onPress={() => onAppleButtonPress()}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000', // Dark background for contrast
    },
    appleButton: {
        width: 200,
        height: 45,
    },
});
