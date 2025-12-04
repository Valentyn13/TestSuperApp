import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Pressable,
    Modal,
    ScrollView,
    Image,
} from 'react-native';
import { useGetTasksPaginatedQuery, useUpdateTaskMutation } from '../../store/api/taskApi';
import { useGetCategoriesQuery } from '../../store/api/categoryApi';
import { Task, TaskStatus, TaskPriority, TaskPriorityType, TaskStatusType } from '../../types';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { styles } from './TaskActionScreen.styles';
import { useNetwork } from '../../contexts/network-context';

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
    const { isConnected } = useNetwork();

    // Applied filters - used for the actual query
    const [appliedFilters, setAppliedFilters] = useState<FilterState>({
        priority: null,
        status: null,
        categoryId: null,
    });
    const [appliedSortBy, setAppliedSortBy] = useState<SortOption>(null);
    const [appliedSearchTitle, setAppliedSearchTitle] = useState('');

    // Temporary filters - only in the modal
    const [tempFilters, setTempFilters] = useState<FilterState>({
        priority: null,
        status: null,
        categoryId: null,
    });
    const [tempSortBy, setTempSortBy] = useState<SortOption>(null);
    const [tempSearchTitle, setTempSearchTitle] = useState('');

    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

    // Pagination state - using serializable cursor data
    const [allTasks, setAllTasks] = useState<Task[]>([]);
    const [currentCursor, setCurrentCursor] = useState<{ id: string; value: any } | null>(null);
    const [nextCursor, setNextCursor] = useState<{ id: string; value: any } | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const lastFetchedCursorRef = useRef<{ id: string; value: any } | null>(null);

    useEffect(() => {
        console.log('TaskActionScreen - Network connection status:', isConnected);
    }, [isConnected]);

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
        // Sync temp filters with applied filters when opening modal
        setTempFilters(appliedFilters);
        setTempSortBy(appliedSortBy);
        setTempSearchTitle(appliedSearchTitle);
        setFilterModalVisible(true);
    };

    const handleApplyFilters = () => {
        // Apply temp filters to actual query
        setAppliedFilters(tempFilters);
        setAppliedSortBy(tempSortBy);
        setAppliedSearchTitle(tempSearchTitle);
        setFilterModalVisible(false);
    };

    const handleClearFilters = () => {
        setTempFilters({ priority: null, status: null, categoryId: null });
        setTempSortBy(null);
        setTempSearchTitle('');
    };

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

    const renderItem = ({ item }: { item: Task }) => {
        const statusColor = getStatusColor(item);
        const isCompleted = item.status === TaskStatus.COMPLETED;
        const isExpanded = expandedTaskId === item.id;
        const hasImage = !!item.imageUrl;

        return (
            <View style={styles.cardWrapper}>
                <TouchableOpacity
                    style={[styles.card, isExpanded && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginBottom: 12 }]}
                    onPress={() => handleEditTask(item)}
                    activeOpacity={0.9}
                >
                    <View style={[styles.statusStrip, { backgroundColor: statusColor }]} />
                    <View style={styles.cardContent}>
                        <View style={styles.textContainer}>
                            <Text style={[styles.title, isCompleted && styles.completedText]}>
                                {item.title}
                            </Text>
                            {item.description ? (
                                <Text style={styles.description} numberOfLines={2}>
                                    {item.description}
                                </Text>
                            ) : null}
                            <Text style={styles.deadline}>
                                {new Date(item.deadline).toLocaleDateString()}
                            </Text>
                        </View>
                        <View style={styles.actionsContainer}>
                            <Pressable
                                style={[styles.checkbox, isCompleted && styles.checkboxChecked]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleToggleStatus(item);
                                }}
                                hitSlop={10}
                            >
                                {isCompleted && <View style={styles.checkboxInner} />}
                            </Pressable>
                            {hasImage && (
                                <Pressable
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        setExpandedTaskId(isExpanded ? null : item.id);
                                    }}
                                    hitSlop={10}
                                    style={styles.chevron}
                                >
                                    <Text style={styles.chevronText}>
                                        {isExpanded ? '▲' : '▼'}
                                    </Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
                {isExpanded && hasImage && (
                    <Image source={{ uri: item.imageUrl }} style={styles.expandedImage} />
                )}
            </View>
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

            <Modal
                visible={isFilterModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalTitle}>Filter & Sort</Text>

                            <Text style={styles.sectionTitle}>Search by Title</Text>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Enter task title..."
                                value={tempSearchTitle}
                                onChangeText={(text) => {
                                    setTempSearchTitle(text);
                                    if (text.length > 0) {
                                        setTempFilters({ priority: null, status: null, categoryId: null });
                                        setTempSortBy(null);
                                    }
                                }}
                            />

                            <Text style={styles.sectionTitle}>Priority</Text>
                            <View style={styles.filterRow}>
                                {Object.values(TaskPriority).map((p) => (
                                    <TouchableOpacity
                                        key={p}
                                        style={[
                                            styles.filterChip,
                                            tempFilters.priority === p && styles.filterChipSelected,
                                        ]}
                                        onPress={() =>
                                            setTempFilters((prev) => {
                                                const newVal = prev.priority === p ? null : p;
                                                if (newVal) {
                                                    setTempSearchTitle('');
                                                    setTempSortBy(null);
                                                    return { priority: newVal, status: null, categoryId: null };
                                                }
                                                return { ...prev, priority: null };
                                            })
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.filterChipText,
                                                tempFilters.priority === p && styles.filterChipTextSelected,
                                            ]}
                                        >
                                            {p.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.sectionTitle}>Status</Text>
                            <View style={styles.filterRow}>
                                {Object.values(TaskStatus).map((s) => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[
                                            styles.filterChip,
                                            tempFilters.status === s && styles.filterChipSelected,
                                        ]}
                                        onPress={() =>
                                            setTempFilters((prev) => {
                                                const newVal = prev.status === s ? null : s;
                                                if (newVal) {
                                                    setTempSearchTitle('');
                                                    setTempSortBy(null);
                                                    return { priority: null, status: newVal, categoryId: null };
                                                }
                                                return { ...prev, status: null };
                                            })
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.filterChipText,
                                                tempFilters.status === s && styles.filterChipTextSelected,
                                            ]}
                                        >
                                            {s.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.sectionTitle}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.filterRow}>
                                    {categories?.map((c) => (
                                        <TouchableOpacity
                                            key={c.id}
                                            style={[
                                                styles.filterChip,
                                                tempFilters.categoryId === c.id && styles.filterChipSelected,
                                            ]}
                                            onPress={() =>
                                                setTempFilters((prev) => {
                                                    const newVal = prev.categoryId === c.id ? null : c.id;
                                                    if (newVal) {
                                                        setTempSearchTitle('');
                                                        setTempSortBy(null);
                                                        return { priority: null, status: null, categoryId: newVal };
                                                    }
                                                    return { ...prev, categoryId: null };
                                                })
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.filterChipText,
                                                    tempFilters.categoryId === c.id &&
                                                    styles.filterChipTextSelected,
                                                ]}
                                            >
                                                {c.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>

                            <Text style={styles.sectionTitle}>Sort By Deadline</Text>
                            <View style={styles.filterRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.filterChip,
                                        tempSortBy === 'deadline_asc' && styles.filterChipSelected,
                                    ]}
                                    onPress={() => {
                                        const newVal = tempSortBy === 'deadline_asc' ? null : 'deadline_asc';
                                        setTempSortBy(newVal);
                                        if (newVal) {
                                            setTempFilters({ priority: null, status: null, categoryId: null });
                                            setTempSearchTitle('');
                                        }
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            tempSortBy === 'deadline_asc' && styles.filterChipTextSelected,
                                        ]}
                                    >
                                        Ascending
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.filterChip,
                                        tempSortBy === 'deadline_desc' && styles.filterChipSelected,
                                    ]}
                                    onPress={() => {
                                        const newVal = tempSortBy === 'deadline_desc' ? null : 'deadline_desc';
                                        setTempSortBy(newVal);
                                        if (newVal) {
                                            setTempFilters({ priority: null, status: null, categoryId: null });
                                            setTempSearchTitle('');
                                        }
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            tempSortBy === 'deadline_desc' && styles.filterChipTextSelected,
                                        ]}
                                    >
                                        Descending
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={handleClearFilters}
                            >
                                <Text style={styles.clearButtonText}>Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={handleApplyFilters}
                            >
                                <Text style={styles.applyButtonText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
