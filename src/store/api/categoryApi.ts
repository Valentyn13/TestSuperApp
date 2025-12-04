import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import firestore from '@react-native-firebase/firestore';
import { Category } from '../../types';
import NetInfo from '@react-native-community/netinfo';

export const categoryApi = createApi({
    reducerPath: 'categoryApi',
    baseQuery: fakeBaseQuery(),
    tagTypes: ['Category', 'Task'],
    endpoints: (builder) => ({
        getCategories: builder.query<Category[], void>({
            queryFn: async () => {
                try {
                    const netInfo = await NetInfo.fetch();
                    const isConnected = netInfo.isConnected && netInfo.isInternetReachable;

                    const snapshot = await firestore()
                        .collection('categories')
                        .get({ source: isConnected ? 'default' : 'cache' });
                    const categories = snapshot.docs.map((doc) => doc.data() as Category);
                    return { data: categories };
                } catch (error) {
                    return { error: error };
                }
            },
            providesTags: ['Category'],
        }),
        addCategory: builder.mutation<null, Category>({
            queryFn: async (category) => {
                try {
                    const netInfo = await NetInfo.fetch();
                    const isConnected = netInfo.isConnected && netInfo.isInternetReachable;

                    const promise = firestore().collection('categories').doc(category.id).set(category);

                    if (isConnected) {
                        await promise;
                    }

                    return { data: null };
                } catch (error) {
                    return { error: error };
                }
            },
            invalidatesTags: ['Category'],
        }),
        deleteCategory: builder.mutation<null, string>({
            queryFn: async (categoryId) => {
                try {
                    const netInfo = await NetInfo.fetch();
                    const isConnected = netInfo.isConnected && netInfo.isInternetReachable;

                    // Find all tasks with category
                    const tasksSnapshot = await firestore()
                        .collection('tasks')
                        .where('categoryId', '==', categoryId)
                        .get({ source: isConnected ? 'default' : 'cache' });

                    // Remove category id from tasks
                    const batch = firestore().batch();
                    tasksSnapshot.docs.forEach((doc) => {
                        batch.update(doc.ref, { categoryId: firestore.FieldValue.delete() });
                    });

                    // Delete the category
                    const categoryRef = firestore().collection('categories').doc(categoryId);
                    batch.delete(categoryRef);

                    const batchPromise = batch.commit();

                    if (isConnected) {
                        await batchPromise;
                    }

                    return { data: null };
                } catch (error) {
                    return { error: error };
                }
            },
            invalidatesTags: ['Category', 'Task'],
        }),
    }),
});

export const {
    useGetCategoriesQuery,
    useAddCategoryMutation,
    useDeleteCategoryMutation,
} = categoryApi;
