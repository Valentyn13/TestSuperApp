import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAddTaskMutation } from '../store/api/taskApi';
import { TaskPriority, TaskStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useNavigation } from '@react-navigation/native';
import { pickImage, uploadImageToStorage } from '../helpers';

const taskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.enum([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH]),
    deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format (YYYY-MM-DD)',
    }),
});

type TaskFormData = z.infer<typeof taskSchema>;

export const TaskCreateScreen = () => {
    const navigation = useNavigation();
    const [addTask, { isLoading }] = useAddTaskMutation();
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: '',
            description: '',
            priority: TaskPriority.LOW,
            deadline: new Date().toISOString().split('T')[0],
        },
    });

    const handlePickImage = async () => {
        const uri = await pickImage();
        if (uri) {
            setSelectedImageUri(uri);
        }
    };

    const onSubmit = async (data: TaskFormData) => {
        try {
            setIsUploading(true);
            const taskId = uuidv4();

            let imageUrl: string | undefined;
            if (selectedImageUri) {
                const uploadedUrl = await uploadImageToStorage(selectedImageUri, taskId);
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                }
            }

            const newTask = {
                id: taskId,
                title: data.title,
                titleLowercase: data.title.toLowerCase(),
                description: data.description,
                priority: data.priority,
                status: TaskStatus.UNCOMPLETED,
                deadline: new Date(data.deadline).toISOString(),
                imageUrl,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await addTask(newTask).unwrap();
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to create task');
            console.error(error);
        } finally {
            setIsUploading(false);
        }
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

            <Text style={styles.label}>Image (Optional)</Text>
            <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
                <Text style={styles.imageButtonText}>
                    {selectedImageUri ? 'Change Image' : 'Pick Image'}
                </Text>
            </TouchableOpacity>
            {selectedImageUri && (
                <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
            )}

            <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading || isUploading}
            >
                {isUploading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitButtonText}>
                        {isLoading ? 'Creating...' : 'Create Task'}
                    </Text>
                )}
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
    imageButton: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    imageButtonText: {
        color: '#333',
        fontWeight: '600',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginTop: 12,
    },
});
