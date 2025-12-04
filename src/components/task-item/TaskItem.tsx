import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, Image } from 'react-native';
import { Task, TaskStatus } from '../../types';
import { styles } from './TaskItem.styles';

interface TaskItemProps {
    item: Task;
    onPress: (task: Task) => void;
    onToggleStatus: (task: Task) => void;
    statusColor: string;
}

export const TaskItem: React.FC<TaskItemProps> = ({
    item,
    onPress,
    onToggleStatus,
    statusColor,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isCompleted = item.status === TaskStatus.COMPLETED;
    const hasImage = !!item.imageUrl;

    return (
        <View style={styles.cardWrapper}>
            <TouchableOpacity
                style={[
                    styles.card,
                    isExpanded && {
                        borderBottomLeftRadius: 0,
                        borderBottomRightRadius: 0,
                        marginBottom: 12,
                    },
                ]}
                onPress={() => onPress(item)}
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
                                onToggleStatus(item);
                            }}
                            hitSlop={10}
                        >
                            {isCompleted && <View style={styles.checkboxInner} />}
                        </Pressable>
                        {hasImage && (
                            <Pressable
                                onPress={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(!isExpanded);
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
