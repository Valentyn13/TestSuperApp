import { Platform, Alert } from 'react-native';
import { PERMISSIONS, request, check, RESULTS } from 'react-native-permissions';

export const requestPhotoLibraryPermission = async (): Promise<boolean> => {
    try {
        const permission =
            Platform.OS === 'ios'
                ? PERMISSIONS.IOS.PHOTO_LIBRARY
                : Number(Platform.Version) >= 33
                    ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
                    : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

        const result = await check(permission);

        if (result === RESULTS.GRANTED) {
            return true;
        }

        if (result === RESULTS.DENIED) {
            const requestResult = await request(permission);
            return requestResult === RESULTS.GRANTED;
        }

        if (result === RESULTS.BLOCKED) {
            Alert.alert(
                'Permission Required',
                'Photo library access is required. Please enable it in settings.',
                [{ text: 'OK' }]
            );
            return false;
        }

        return false;
    } catch (error) {
        console.error('Error requesting photo library permission:', error);
        return false;
    }
};
