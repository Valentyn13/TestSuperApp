import React from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { styles } from './TaskFilters.styles';
import { TaskPriority, TaskStatus, TaskPriorityType, TaskStatusType, Category } from '../../types';

type SortOption = 'deadline_asc' | 'deadline_desc' | null;

interface FilterState {
    priority: TaskPriorityType | null;
    status: TaskStatusType | null;
    categoryId: string | null;
}

interface TaskFiltersProps {
    initialFilters: FilterState;
    initialSortBy: SortOption;
    initialSearchTitle: string;
    categories: Category[] | undefined;
    onApply: (filters: FilterState, sortBy: SortOption, searchTitle: string) => void;
    onClose?: () => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
    initialFilters,
    initialSortBy,
    initialSearchTitle,
    categories,
    onApply,
    onClose,
}) => {
    const [filters, setFilters] = React.useState<FilterState>(initialFilters);
    const [sortBy, setSortBy] = React.useState<SortOption>(initialSortBy);
    const [searchTitle, setSearchTitle] = React.useState<string>(initialSearchTitle);

    const handleClear = () => {
        setFilters({ priority: null, status: null, categoryId: null });
        setSortBy(null);
        setSearchTitle('');
        onClose?.();
    };

    const handleApply = () => {
        onApply(filters, sortBy, searchTitle);
    };

    return (
        <View style={styles.modalContent}>
            <View>
                <Text style={styles.modalTitle}>Filter & Sort</Text>

                <Text style={styles.sectionTitle}>Search by Title</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Enter task title..."
                    value={searchTitle}
                    onChangeText={(text) => {
                        setSearchTitle(text);
                        if (text.length > 0) {
                            setFilters({ priority: null, status: null, categoryId: null });
                            setSortBy(null);
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
                                filters.priority === p && styles.filterChipSelected,
                            ]}
                            onPress={() =>
                                setFilters((prev) => {
                                    const newVal = prev.priority === p ? null : p;
                                    if (newVal) {
                                        setSearchTitle('');
                                        setSortBy(null);
                                        return { priority: newVal, status: null, categoryId: null };
                                    }
                                    return { ...prev, priority: null };
                                })
                            }
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    filters.priority === p && styles.filterChipTextSelected,
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
                                filters.status === s && styles.filterChipSelected,
                            ]}
                            onPress={() =>
                                setFilters((prev) => {
                                    const newVal = prev.status === s ? null : s;
                                    if (newVal) {
                                        setSearchTitle('');
                                        setSortBy(null);
                                        return { priority: null, status: newVal, categoryId: null };
                                    }
                                    return { ...prev, status: null };
                                })
                            }
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    filters.status === s && styles.filterChipTextSelected,
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
                                    filters.categoryId === c.id && styles.filterChipSelected,
                                ]}
                                onPress={() =>
                                    setFilters((prev) => {
                                        const newVal = prev.categoryId === c.id ? null : c.id;
                                        if (newVal) {
                                            setSearchTitle('');
                                            setSortBy(null);
                                            return { priority: null, status: null, categoryId: newVal };
                                        }
                                        return { ...prev, categoryId: null };
                                    })
                                }
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        filters.categoryId === c.id &&
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
                            sortBy === 'deadline_asc' && styles.filterChipSelected,
                        ]}
                        onPress={() => {
                            const newVal = sortBy === 'deadline_asc' ? null : 'deadline_asc';
                            setSortBy(newVal);
                            if (newVal) {
                                setFilters({ priority: null, status: null, categoryId: null });
                                setSearchTitle('');
                            }
                        }}
                    >
                        <Text
                            style={[
                                styles.filterChipText,
                                sortBy === 'deadline_asc' && styles.filterChipTextSelected,
                            ]}
                        >
                            Ascending
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            sortBy === 'deadline_desc' && styles.filterChipSelected,
                        ]}
                        onPress={() => {
                            const newVal = sortBy === 'deadline_desc' ? null : 'deadline_desc';
                            setSortBy(newVal);
                            if (newVal) {
                                setFilters({ priority: null, status: null, categoryId: null });
                                setSearchTitle('');
                            }
                        }}
                    >
                        <Text
                            style={[
                                styles.filterChipText,
                                sortBy === 'deadline_desc' && styles.filterChipTextSelected,
                            ]}
                        >
                            Descending
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.modalActions}>
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClear}
                >
                    <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.applyButton}
                    onPress={handleApply}
                >
                    <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
