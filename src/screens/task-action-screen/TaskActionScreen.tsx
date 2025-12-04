import React, { useState } from 'react';
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
import { useGetTasksQuery, useUpdateTaskMutation } from '../../store/api/taskApi';
import { useGetCategoriesQuery } from '../../store/api/categoryApi';
import { Task, TaskStatus, TaskPriority, TaskPriorityType, TaskStatusType } from '../../types';
import { useNavigation } from '@react-navigation/native';
import { styles } from './TaskActionScreen.styles';

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

    // Query with applied filters
    const { data: tasks, isLoading, error } = useGetTasksQuery({
        priority: appliedFilters.priority || undefined,
        status: appliedFilters.status || undefined,
        categoryId: appliedFilters.categoryId || undefined,
        sortBy: appliedSortBy || undefined,
        searchTitle: appliedSearchTitle || undefined,
    });

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
                    style={styles.card}
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
                data={tasks}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
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
                                onChangeText={setTempSearchTitle}
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
                                            setTempFilters((prev) => ({
                                                ...prev,
                                                priority: prev.priority === p ? null : p,
                                            }))
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
                                            setTempFilters((prev) => ({
                                                ...prev,
                                                status: prev.status === s ? null : s,
                                            }))
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
                                                setTempFilters((prev) => ({
                                                    ...prev,
                                                    categoryId: prev.categoryId === c.id ? null : c.id,
                                                }))
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
                                    onPress={() =>
                                        setTempSortBy(tempSortBy === 'deadline_asc' ? null : 'deadline_asc')
                                    }
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
                                    onPress={() =>
                                        setTempSortBy(tempSortBy === 'deadline_desc' ? null : 'deadline_desc')
                                    }
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
