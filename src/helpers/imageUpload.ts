import storage from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { requestPhotoLibraryPermission } from './permissions';

export const pickImage = async (): Promise<string | null> => {
    try {
        const hasPermission = await requestPhotoLibraryPermission();
        if (!hasPermission) {
            return null;
        }

        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 1024,
            maxHeight: 1024,
        });

        if (result.didCancel || !result.assets || result.assets.length === 0) {
            return null;
        }

        return result.assets[0].uri || null;
    } catch (error) {
        console.error('Error picking image:', error);
        return null;
    }
};

export const uploadImageToStorage = async (
    imageUri: string,
    taskId: string
): Promise<string | null> => {
    try {
        const filename = `tasks/${taskId}_${Date.now()}.jpg`;
        const reference = storage().ref(filename);

        await reference.putFile(imageUri);
        const downloadURL = await reference.getDownloadURL();

        return downloadURL;
    } catch (error) {
        console.error('Error uploading image to storage:', error);
        return null;
    }
};

export const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
    try {
        const reference = storage().refFromURL(imageUrl);
        await reference.delete();
    } catch (error) {
        console.error('Error deleting image from storage:', error);
    }
};
