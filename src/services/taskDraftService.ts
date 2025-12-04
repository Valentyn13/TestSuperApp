import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY = '@task_draft';

export interface TaskDraft {
    title: string;
    description?: string;
    priority: string;
    deadline: string;
    imageUri?: string;
    savedAt: string;
}

export const taskDraftService = {
    saveDraft: async (draft: TaskDraft): Promise<void> => {
        try {
            const draftWithTimestamp = {
                ...draft,
                savedAt: new Date().toISOString(),
            };
            await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draftWithTimestamp));
            console.log('Draft saved successfully');
        } catch (error) {
            console.error('Error saving draft:', error);
        }
    },

    loadDraft: async (): Promise<TaskDraft | null> => {
        try {
            const draftString = await AsyncStorage.getItem(DRAFT_KEY);
            if (draftString) {
                const draft = JSON.parse(draftString);
                console.log('Draft loaded successfully');
                return draft;
            }
            return null;
        } catch (error) {
            console.error('Error loading draft:', error);
            return null;
        }
    },

    clearDraft: async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem(DRAFT_KEY);
            console.log('Draft cleared successfully');
        } catch (error) {
            console.error('Error clearing draft:', error);
        }
    },

    hasDraft: async (): Promise<boolean> => {
        try {
            const draftString = await AsyncStorage.getItem(DRAFT_KEY);
            return draftString !== null;
        } catch (error) {
            console.error('Error checking draft:', error);
            return false;
        }
    },
};
