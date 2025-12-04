import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import firestore from '@react-native-firebase/firestore';
import { Category } from '../../types';

export const categoryApi = createApi({
    reducerPath: 'categoryApi',
    baseQuery: fakeBaseQuery(),
    tagTypes: ['Category'],
    endpoints: (builder) => ({
        getCategories: builder.query<Category[], void>({
            queryFn: async () => {
                try {
                    const snapshot = await firestore().collection('categories').get();
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
                    await firestore().collection('categories').doc(category.id).set(category);
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
                    await firestore().collection('categories').doc(categoryId).delete();
                    return { data: null };
                } catch (error) {
                    return { error: error };
                }
            },
            invalidatesTags: ['Category'],
        }),
    }),
});

export const {
    useGetCategoriesQuery,
    useAddCategoryMutation,
    useDeleteCategoryMutation,
} = categoryApi;
