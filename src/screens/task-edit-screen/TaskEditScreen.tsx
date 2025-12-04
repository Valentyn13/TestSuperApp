import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Modal,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    useUpdateTaskMutation,
    useDeleteTaskMutation,
} from '../../store/api/taskApi';
import { useGetCategoriesQuery } from '../../store/api/categoryApi';
import { TaskPriority, Task } from '../../types';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { pickImage, uploadImageToStorage, deleteImageFromStorage } from '../../helpers';
import { styles } from './TaskEditScreen.styles';
import { Calendar } from 'react-native-calendars';

const taskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.enum([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH]),
    deadline: z.string()
        .refine((val) => !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        })
        .refine((val) => {
            const selectedDate = new Date(val);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return selectedDate >= today;
        }, {
            message: 'Deadline cannot be in the past',
        }),
    categoryId: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

type RootStackParamList = {
    TaskEdit: { task: Task };
};

type TaskEditScreenRouteProp = RouteProp<RootStackParamList, 'TaskEdit'>;

export const TaskEditScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<TaskEditScreenRouteProp>();
    const { task } = route.params;

    const { data: categories } = useGetCategoriesQuery();
    const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
    const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
    const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: task.title,
            description: task.description,
            priority: task.priority,
            deadline: new Date(task.deadline).toISOString().split('T')[0],
            categoryId: task.categoryId,
        },
    });

    const selectedCategoryId = watch('categoryId');
    const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);

    const handlePickImage = async () => {
        const uri = await pickImage();
        if (uri) {
            setSelectedImageUri(uri);
        }
    };

    const onUpdate = async (data: TaskFormData) => {
        try {
            setIsUploading(true);

            let imageUrl = task.imageUrl;

            // If user selected a new image
            if (selectedImageUri) {
                // Delete old image if exists
                if (task.imageUrl) {
                    await deleteImageFromStorage(task.imageUrl);
                }
                // Upload new image
                const uploadedUrl = await uploadImageToStorage(selectedImageUri, task.id);
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                }
            }

            const updatedTask: Task = {
                ...task,
                title: data.title,
                titleLowercase: data.title.toLowerCase(),
                description: data.description || undefined,
                priority: data.priority,
                status: task.status,
                categoryId: data.categoryId || undefined,
                deadline: new Date(data.deadline).toISOString(),
                imageUrl: imageUrl || undefined,
                updatedAt: new Date().toISOString(),
            };

            await updateTask(updatedTask).unwrap();
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to update task');
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const onDelete = async () => {
        Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteTask(task.id).unwrap();
                        navigation.goBack();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete task');
                        console.error(error);
                    }
                },
            },
        ]);
    };

    return (
        <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
            <Text style={styles.label}>Title</Text>
            <Controller
                control={control}
                name="title"
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        style={styles.input}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder="Task Title"
                    />
                )}
            />
            {errors.title && <Text style={styles.error}>{errors.title.message}</Text>}

            <Text style={styles.label}>Description</Text>
            <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder="Description"
                        multiline
                    />
                )}
            />

            <Text style={styles.label}>Priority</Text>
            <Controller
                control={control}
                name="priority"
                render={({ field: { onChange, value } }) => (
                    <View style={styles.priorityContainer}>
                        {Object.values(TaskPriority).map((priority) => (
                            <TouchableOpacity
                                key={priority}
                                style={[
                                    styles.priorityButton,
                                    value === priority && styles.priorityButtonSelected,
                                ]}
                                onPress={() => onChange(priority)}
                            >
                                <Text
                                    style={[
                                        styles.priorityText,
                                        value === priority && styles.priorityTextSelected,
                                    ]}
                                >
                                    {priority.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            />

            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setCategoryModalVisible(true)}
            >
                <Text style={styles.dropdownButtonText}>
                    {selectedCategory ? selectedCategory.name : 'Select Category'}
                </Text>
            </TouchableOpacity>

            <Modal
                visible={isCategoryModalVisible}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Category</Text>
                        <ScrollView>
                            <TouchableOpacity
                                style={styles.modalItem}
                                onPress={() => {
                                    setValue('categoryId', undefined);
                                    setCategoryModalVisible(false);
                                }}
                            >
                                <Text style={styles.modalItemText}>None</Text>
                            </TouchableOpacity>
                            {categories?.map((category) => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setValue('categoryId', category.id);
                                        setCategoryModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.modalItemText}>{category.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setCategoryModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>


            <Text style={styles.label}>Deadline</Text>
            <Controller
                control={control}
                name="deadline"
                render={({ field: { onChange, value } }) => (
                    <Calendar
                        onDayPress={(day) => {
                            onChange(day.dateString);
                        }}
                        markedDates={
                            value ? {
                                [value]: { selected: true, selectedColor: '#000' },
                            } : {}
                        }
                        minDate={new Date().toISOString().split('T')[0]}
                        theme={{
                            selectedDayBackgroundColor: '#000',
                            todayTextColor: '#000',
                            arrowColor: '#000',
                        }}
                    />
                )}
            />
            {errors.deadline && (
                <Text style={styles.error}>{errors.deadline.message}</Text>
            )}



            <Text style={styles.label}>Image</Text>
            {task.imageUrl && !selectedImageUri && (
                <Image source={{ uri: task.imageUrl }} style={styles.imagePreview} />
            )}
            {selectedImageUri && (
                <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
            )}
            <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
                <Text style={styles.imageButtonText}>
                    {task.imageUrl || selectedImageUri ? 'Change Image' : 'Add Image'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit(onUpdate)}
                disabled={isUpdating || isUploading}
            >
                {isUploading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitButtonText}>
                        {isUpdating ? 'Updating...' : 'Update Task'}
                    </Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.submitButton, styles.deleteButton]}
                onPress={onDelete}
                disabled={isDeleting}
            >
                <Text style={[styles.submitButtonText, styles.deleteButtonText]}>
                    {isDeleting ? 'Deleting...' : 'Delete Task'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

