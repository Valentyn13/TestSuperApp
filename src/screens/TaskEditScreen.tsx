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
} from '../store/api/taskApi';
import { useGetCategoriesQuery } from '../store/api/categoryApi';
import { TaskPriority, Task } from '../types';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { pickImage, uploadImageToStorage, deleteImageFromStorage } from '../helpers';

const taskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.enum([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH]),
    deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format (YYYY-MM-DD)',
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
                description: data.description,
                priority: data.priority,
                status: task.status,
                categoryId: data.categoryId,
                deadline: new Date(data.deadline).toISOString(),
                imageUrl,
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
        <ScrollView contentContainerStyle={styles.container}>
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
                animationType="slide"
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

            <Text style={styles.label}>Deadline (YYYY-MM-DD)</Text>
            <Controller
                control={control}
                name="deadline"
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        style={styles.input}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder="YYYY-MM-DD"
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

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    error: {
        color: 'red',
        fontSize: 12,
        marginTop: 4,
    },
    priorityContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    priorityButton: {
        flex: 1,
        padding: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    priorityButtonSelected: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    priorityText: {
        color: '#000',
    },
    priorityTextSelected: {
        color: '#fff',
    },
    submitButton: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 32,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'red',
        marginTop: 16,
    },
    deleteButtonText: {
        color: 'red',
    },
    dropdownButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
    },
    dropdownButtonText: {
        fontSize: 16,
        color: '#000',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        maxHeight: '60%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalItemText: {
        fontSize: 16,
    },
    closeButton: {
        marginTop: 16,
        alignItems: 'center',
        padding: 12,
    },
    closeButtonText: {
        color: '#000',
        fontWeight: 'bold',
    },
    imageButton: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        marginTop: 8,
    },
    imageButtonText: {
        color: '#333',
        fontWeight: '600',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginTop: 8,
    },
});
