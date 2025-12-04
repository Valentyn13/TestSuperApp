import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Pressable,
    Image,
} from 'react-native';
import { useGetTasksPaginatedQuery, useUpdateTaskMutation } from '../../store/api/taskApi';
import { useGetCategoriesQuery } from '../../store/api/categoryApi';
import { Task, TaskStatus, TaskPriorityType, TaskStatusType } from '../../types';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { styles } from './TaskActionScreen.styles';
import { useBottomSheet } from '../../contexts/bottom-sheet-context';
import { TaskFilters } from '../../components/task-filters/TaskFilters';
import { TaskItem } from '../../components/task-item/TaskItem';

type SortOption = 'deadline_asc' | 'deadline_desc' | null;

interface FilterState {
    priority: TaskPriorityType | null;
    status: TaskStatusType | null;
    categoryId: string | null;
}

export const TaskActionScreen = () => {
    const navigation = useNavigation<any>();
    const [updateTask] = useUpdateTaskMutation();
    const { data: categories } = useGetCategoriesQuery();

    // Applied filters - used for the actual query
    const [appliedFilters, setAppliedFilters] = useState<FilterState>({
        priority: null,
        status: null,
        categoryId: null,
    });
    const [appliedSortBy, setAppliedSortBy] = useState<SortOption>(null);
    const [appliedSearchTitle, setAppliedSearchTitle] = useState('');




    const { openBottomSheet, closeBottomSheet } = useBottomSheet();

    // Pagination state - using serializable cursor data
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [currentCursor, setCurrentCursor] = useState<{ id: string; value: any } | null>(null);
    const [nextCursor, setNextCursor] = useState<{ id: string; value: any } | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const lastFetchedCursorRef = useRef<{ id: string; value: any } | null>(null);

    // Query with applied filters and pagination
    const { data: paginatedData, isLoading, isFetching, error, refetch } = useGetTasksPaginatedQuery({
        priority: appliedFilters.priority || undefined,
        status: appliedFilters.status || undefined,
        categoryId: appliedFilters.categoryId || undefined,
        sortBy: appliedSortBy || undefined,
        searchTitle: appliedSearchTitle || undefined,
        limit: 20,
        lastDocId: currentCursor?.id,
        lastDocValue: currentCursor?.value,
    }, {
        refetchOnMountOrArgChange: true, // Always refetch on mount or when args change
    });

    // Debug query state
    useEffect(() => {
        console.log('TaskActionScreen - Query state:', {
            isLoading,
            isFetching,
            hasData: !!paginatedData,
            hasError: !!error,
            taskCount: paginatedData?.tasks?.length,
        });
    }, [isLoading, isFetching, paginatedData, error]);

    // Update tasks when data changes OR when fetching completes
    useEffect(() => {
        console.log('TaskActionScreen - paginatedData/fetch changed:', {
            hasData: !!paginatedData,
            taskCount: paginatedData?.tasks?.length,
            currentCursor,
            lastFetchedCursor: lastFetchedCursorRef.current,
            isFetching,
            isLoading
        });

        // Wait until fetch is complete
        if (isFetching || isLoading) {
            console.log('Still fetching/loading, waiting...');
            return;
        }

        if (!paginatedData || !paginatedData.tasks) {
            console.log('No data to process');
            return;
        }

        // Determine if we should replace or append based on the last cursor we fetched with
        const shouldAppend = lastFetchedCursorRef.current !== null &&
            lastFetchedCursorRef.current?.id !== currentCursor?.id;

        if (shouldAppend) {
            // Pagination - append new tasks
            console.log('Appending tasks:', paginatedData.tasks.length);
            setAllTasks(prev => [...prev, ...paginatedData.tasks]);
        } else {
            // First page or refresh - replace all tasks
            console.log('Setting/Refreshing all tasks:', paginatedData.tasks.length);
            setAllTasks(paginatedData.tasks);
        }

        // Update the ref to track what cursor was used for this fetch
        lastFetchedCursorRef.current = currentCursor;

        // Store cursor for next page
        if (paginatedData.lastDocId && paginatedData.lastDocValue !== undefined) {
            setNextCursor({ id: paginatedData.lastDocId, value: paginatedData.lastDocValue });
        } else {
            setNextCursor(null);
        }

        setHasMore(paginatedData.hasMore);
        setIsLoadingMore(false);
    }, [paginatedData, isFetching, isLoading]); // Depend on fetching state too

    // Reset pagination when filters change
    useEffect(() => {
        lastFetchedCursorRef.current = null; // Reset ref first
        setAllTasks([]);
        setCurrentCursor(null);
        setNextCursor(null);
        setHasMore(true);
        setIsLoadingMore(false);
    }, [appliedFilters, appliedSortBy, appliedSearchTitle]);

    // Debug allTasks state
    useEffect(() => {
        console.log('TaskActionScreen - allTasks state changed:', {
            count: allTasks.length,
            tasks: allTasks
        });
    }, [allTasks]);

    // Refetch when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    const handleCreateTask = () => {
        navigation.navigate('TaskCreate');
    };

    const handleCategories = () => {
        navigation.navigate('Category');
    };

    const handleEditTask = (task: Task) => {
        navigation.navigate('TaskEdit', { task });
    };

    const handleToggleStatus = async (task: Task) => {
        const newStatus =
            task.status === TaskStatus.COMPLETED
                ? TaskStatus.UNCOMPLETED
                : TaskStatus.COMPLETED;

        await updateTask({
            ...task,
            status: newStatus,
            updatedAt: new Date().toISOString(),
        });
    };



    const handleOpenFilterModal = () => {
        handleOpenBottomSheet();
    };

    const handleApplyFilters = useCallback((newFilters: FilterState, newSortBy: SortOption, newSearchTitle: string) => {
        // Apply temp filters to actual query
        setAppliedFilters(newFilters);
        setAppliedSortBy(newSortBy);
        setAppliedSearchTitle(newSearchTitle);
        closeBottomSheet();
    }, [closeBottomSheet]);



    const handleLoadMore = useCallback(() => {
        if (!isFetching && !isLoadingMore && hasMore && nextCursor) {
            setIsLoadingMore(true);
            setCurrentCursor(nextCursor);
        }
    }, [isFetching, isLoadingMore, hasMore, nextCursor]);

    const getStatusColor = (task: Task) => {
        if (task.status === TaskStatus.COMPLETED) return '#4CAF50';
        const deadline = new Date(task.deadline).getTime();
        const now = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        if (deadline < now) return '#F44336';
        if (deadline - now < oneDay) return '#FF9800';
        return '#000000';
    };

    const handleOpenBottomSheet = useCallback(() => {
        openBottomSheet(<TaskFilters
            initialFilters={appliedFilters}
            initialSortBy={appliedSortBy}
            initialSearchTitle={appliedSearchTitle}
            categories={categories}
            onApply={handleApplyFilters}
            onClose={closeBottomSheet}
        />, '80%');
    }, [openBottomSheet, appliedFilters, appliedSortBy, appliedSearchTitle, categories, handleApplyFilters, closeBottomSheet]);

    const renderItem = ({ item }: { item: Task }) => {
        const statusColor = getStatusColor(item);

        return (
            <TaskItem
                item={item}
                onPress={handleEditTask}
                onToggleStatus={handleToggleStatus}
                statusColor={statusColor}
            />
        );
    };

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text>Error loading tasks</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleCategories}>
                    <Text style={styles.headerButtonText}>Manage Categories</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleOpenFilterModal}
                >
                    <Text style={styles.headerButtonText}>Filters</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={allTasks}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    isLoadingMore ? (
                        <View style={styles.loadingFooter}>
                            <ActivityIndicator size="small" color="#000" />
                        </View>
                    ) : null
                }
            />

            <TouchableOpacity style={styles.fab} onPress={handleCreateTask}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
};
