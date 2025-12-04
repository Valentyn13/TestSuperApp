import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import firestore from '@react-native-firebase/firestore';
import { Task, TaskPriorityType, TaskStatusType } from '../../types';
import NetInfo from '@react-native-community/netinfo';

export interface TaskQueryParams {
    priority?: TaskPriorityType;
    status?: TaskStatusType;
    categoryId?: string;
    sortBy?: 'deadline_asc' | 'deadline_desc';
    searchTitle?: string;
    limit?: number;
    lastDocId?: string; // Serializable cursor - document ID
    lastDocValue?: any; // Serializable cursor - the field value we're sorting by
}

export interface PaginatedTasksResponse {
    tasks: Task[];
    lastDocId: string | null;
    lastDocValue: any;
    hasMore: boolean;
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

                    // Filters
                    if (params && params.priority) {
                        query = query.where('priority', '==', params.priority) as any;
                    }
                    if (params && params.status) {
                        query = query.where('status', '==', params.status) as any;
                    }
                    if (params && params.categoryId) {
                        query = query.where('categoryId', '==', params.categoryId) as any;
                    }

                    // Prefix search on lowercase field
                    if (params && params.searchTitle) {
                        const searchLower = params.searchTitle.toLowerCase();
                        query = query
                            .orderBy('titleLowercase')
                            .startAt(searchLower)
                            .endAt(searchLower + '\uf8ff') as any;
                    } else if (params && params.sortBy) {
                        // Sorting only if no search (can't combine orderBy on different fields)
                        const direction = params.sortBy === 'deadline_asc' ? 'asc' : 'desc';
                        query = query.orderBy('deadline', direction) as any;
                    }

                    const netInfo = await NetInfo.fetch();
                    const isConnected = netInfo.isConnected && netInfo.isInternetReachable;

                    const snapshot = await query.get({ source: isConnected ? 'default' : 'cache' });
                    const tasks = snapshot.docs.map((doc) => doc.data() as Task);
                    return { data: tasks };
                } catch (error: any) {
                    return {
                        error: {
                            message: error.message,
                            code: error.code
                        }
                    };
                }
            },
            providesTags: ['Task'],
        }),
        addTask: builder.mutation<null, Task>({
            queryFn: async (task) => {
                try {
                    // TODO REFACTOR
                    const taskData: any = {
                        id: task.id,
                        title: task.title,
                        status: task.status,
                        priority: task.priority,
                        deadline: task.deadline,
                        createdAt: task.createdAt,
                        updatedAt: task.updatedAt,
                    };

                    if (task.titleLowercase !== undefined) taskData.titleLowercase = task.titleLowercase;
                    if (task.description !== undefined) taskData.description = task.description;
                    if (task.categoryId !== undefined) taskData.categoryId = task.categoryId;
                    if (task.imageUrl !== undefined) taskData.imageUrl = task.imageUrl;

                    const netInfo = await NetInfo.fetch();
                    const isConnected = netInfo.isConnected && netInfo.isInternetReachable;

                    const promise = firestore().collection('tasks').doc(task.id).set(taskData);

                    if (isConnected) {
                        await promise;
                    }

                    return { data: null };
                } catch (error: any) {
                    return {
                        error: {
                            message: error.message,
                            code: error.code
                        }
                    };
                }
            },
            invalidatesTags: ['Task'],
        }),
        updateTask: builder.mutation<null, Task>({
            queryFn: async (task) => {
                try {
                    // TODO REFACTOR
                    const taskData: any = {
                        id: task.id,
                        title: task.title,
                        status: task.status,
                        priority: task.priority,
                        deadline: task.deadline,
                        createdAt: task.createdAt,
                        updatedAt: task.updatedAt,
                    };

                    // TODO REFACTOR
                    if (task.titleLowercase !== undefined) taskData.titleLowercase = task.titleLowercase;
                    if (task.description !== undefined) taskData.description = task.description;
                    if (task.categoryId !== undefined) taskData.categoryId = task.categoryId;
                    if (task.imageUrl !== undefined) taskData.imageUrl = task.imageUrl;

                    const netInfo = await NetInfo.fetch();
                    const isConnected = netInfo.isConnected && netInfo.isInternetReachable;

                    const promise = firestore().collection('tasks').doc(task.id).update(taskData);

                    if (isConnected) {
                        await promise;
                    }

                    return { data: null };
                } catch (error: any) {
                    return {
                        error: {
                            message: error.message,
                            code: error.code
                        }
                    };
                }
            },
            invalidatesTags: ['Task'],
        }),
        deleteTask: builder.mutation<null, string>({
            queryFn: async (taskId) => {
                try {
                    const netInfo = await NetInfo.fetch();
                    const isConnected = netInfo.isConnected && netInfo.isInternetReachable;

                    const promise = firestore().collection('tasks').doc(taskId).delete();

                    if (isConnected) {
                        await promise;
                    }

                    return { data: null };
                } catch (error: any) {
                    return {
                        error: {
                            message: error.message,
                            code: error.code
                        }
                    };
                }
            },
            invalidatesTags: ['Task'],
        }),
        getTasksPaginated: builder.query<PaginatedTasksResponse, TaskQueryParams | void>({
            queryFn: async (params) => {
                try {
                    const limit = params?.limit || 10; // Default page size
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
                        // Apply sorting only if no search
                        const direction = params.sortBy === 'deadline_asc' ? 'asc' : 'desc';
                        query = query.orderBy('deadline', direction) as any;
                    } else if (!params?.priority && !params?.status && !params?.categoryId) {
                        // Default ordering by createdAt ONLY if no filters are active
                        // This avoids creating composite indexes for every filter+sort combination
                        query = query.orderBy('createdAt', 'desc') as any;
                    }

                    // Pagination cursor
                    if (params && params.lastDocId) {
                        if (params.lastDocValue !== undefined && params.lastDocValue !== null) {
                            query = query.startAfter(params.lastDocValue, params.lastDocId) as any;
                        } else {
                            // If no value (e.g. filtered view without sort), just use ID
                            query = query.startAfter(params.lastDocId) as any;
                        }
                    }

                    query = query.limit(limit + 1) as any; // One extra to check if there's more

                    const netInfo = await NetInfo.fetch();
                    const isConnected = netInfo.isConnected && netInfo.isInternetReachable;

                    const snapshot = await query.get({ source: isConnected ? 'default' : 'cache' });

                    const hasMore = snapshot.docs.length > limit;
                    const tasks = snapshot.docs
                        .slice(0, limit)
                        .map((doc) => doc.data() as Task);

                    // Get cursor data for last document
                    let lastDocId: string | null = null;
                    let lastDocValue: any = null;

                    if (tasks.length > 0) {
                        const lastDocSnapshot = snapshot.docs[tasks.length - 1];
                        lastDocId = lastDocSnapshot.id;

                        if (params && params.searchTitle) {
                            lastDocValue = lastDocSnapshot.get('titleLowercase');
                        } else if (params && params.sortBy) {
                            lastDocValue = lastDocSnapshot.get('deadline');
                        } else if (!params?.priority && !params?.status && !params?.categoryId) {
                            // Only get createdAt if we are using the default sort
                            lastDocValue = lastDocSnapshot.get('createdAt');
                        }
                    }

                    return {
                        data: {
                            tasks,
                            lastDocId,
                            lastDocValue,
                            hasMore,
                        }
                    };
                } catch (error: any) {
                    console.error('TaskApi Error:', error);
                    // Firebase index errors have a message property with the URL
                    if (error?.message?.includes('index')) {
                        console.error(error.message);
                    }
                    return {
                        error: {
                            message: error.message,
                            code: error.code
                        }
                    };
                }
            },
            providesTags: ['Task'],
        }),
    }),
});

export const {
    useGetTasksQuery,
    useGetTasksPaginatedQuery,
    useAddTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
} = taskApi;
