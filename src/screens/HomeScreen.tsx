import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import auth from '@react-native-firebase/auth';
import { requestPhotoLibraryPermission } from '../helpers';

export const HomeScreen = () => {
    const user = auth().currentUser;


    useEffect(() => {
        requestPhotoLibraryPermission();
    }, []);
    return (
        <View style={styles.container}>
            <Text style={styles.greeting}>Hello, User!</Text>
            {user?.email && <Text style={styles.info}>Email: {user.email}</Text>}
            {user?.displayName && <Text style={styles.info}>Name: {user.displayName}</Text>}
            <Text style={styles.info}>UID: {user?.uid}</Text>

            <View style={styles.buttonContainer}>
                <Button title="Sign Out" onPress={() => auth().signOut()} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    info: {
        fontSize: 16,
        marginBottom: 10,
    },
    buttonContainer: {
        marginTop: 30,
    },
});
