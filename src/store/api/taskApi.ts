import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import firestore from '@react-native-firebase/firestore';
import { Task, TaskPriorityType, TaskStatusType } from '../../types';

export interface TaskQueryParams {
    priority?: TaskPriorityType;
    status?: TaskStatusType;
    categoryId?: string;
    sortBy?: 'deadline_asc' | 'deadline_desc';
    searchTitle?: string;
}

export const taskApi = createApi({
    reducerPath: 'taskApi',
    baseQuery: fakeBaseQuery(),
    tagTypes: ['Task'],
    endpoints: (builder) => ({
        getTasks: builder.query<Task[], TaskQueryParams | void>({
            queryFn: async (params) => {
                try {
                    let query = firestore().collection('tasks');

                    // Apply filters
                    if (params && params.priority) {
                        query = query.where('priority', '==', params.priority) as any;
                    }
                    if (params && params.status) {
                        query = query.where('status', '==', params.status) as any;
                    }
                    if (params && params.categoryId) {
                        query = query.where('categoryId', '==', params.categoryId) as any;
                    }

                    // Apply search by title (prefix search on lowercase field)
                    if (params && params.searchTitle) {
                        const searchLower = params.searchTitle.toLowerCase();
                        query = query
                            .orderBy('titleLowercase')
                            .startAt(searchLower)
                            .endAt(searchLower + '\uf8ff') as any;
                    } else if (params && params.sortBy) {
                        // Apply sorting only if no search (can't combine orderBy on different fields)
                        const direction = params.sortBy === 'deadline_asc' ? 'asc' : 'desc';
                        query = query.orderBy('deadline', direction) as any;
                    }

                    const snapshot = await query.get();
                    const tasks = snapshot.docs.map((doc) => doc.data() as Task);
                    return { data: tasks };
                } catch (error) {
                    return { error: error };
                }
            },
            providesTags: ['Task'],
        }),
        addTask: builder.mutation<null, Task>({
            queryFn: async (task) => {
                try {
                    // Convert to plain object and remove undefined values (Firestore doesn't support them)
                    const taskData: any = {
                        id: task.id,
                        title: task.title,
                        status: task.status,
                        priority: task.priority,
                        deadline: task.deadline,
                        createdAt: task.createdAt,
                        updatedAt: task.updatedAt,
                    };

                    // Only add optional fields if they are defined
                    if (task.titleLowercase !== undefined) taskData.titleLowercase = task.titleLowercase;
                    if (task.description !== undefined) taskData.description = task.description;
                    if (task.categoryId !== undefined) taskData.categoryId = task.categoryId;
                    if (task.imageUrl !== undefined) taskData.imageUrl = task.imageUrl;

                    await firestore().collection('tasks').doc(task.id).set(taskData);
                    return { data: null };
                } catch (error) {
                    return { error: error };
                }
            },
            invalidatesTags: ['Task'],
        }),
        updateTask: builder.mutation<null, Task>({
            queryFn: async (task) => {
                try {
                    // Convert to plain object and remove undefined values (Firestore doesn't support them)
                    const taskData: any = {
                        id: task.id,
                        title: task.title,
                        status: task.status,
                        priority: task.priority,
                        deadline: task.deadline,
                        createdAt: task.createdAt,
                        updatedAt: task.updatedAt,
                    };

                    // Only add optional fields if they are defined
                    if (task.titleLowercase !== undefined) taskData.titleLowercase = task.titleLowercase;
                    if (task.description !== undefined) taskData.description = task.description;
                    if (task.categoryId !== undefined) taskData.categoryId = task.categoryId;
                    if (task.imageUrl !== undefined) taskData.imageUrl = task.imageUrl;

                    await firestore().collection('tasks').doc(task.id).update(taskData);
                    return { data: null };
                } catch (error) {
                    return { error: error };
                }
            },
            invalidatesTags: ['Task'],
        }),
        deleteTask: builder.mutation<null, string>({
            queryFn: async (taskId) => {
                try {
                    await firestore().collection('tasks').doc(taskId).delete();
                    return { data: null };
                } catch (error) {
                    return { error: error };
                }
            },
            invalidatesTags: ['Task'],
        }),
    }),
});

export const {
    useGetTasksQuery,
    useAddTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
} = taskApi;
