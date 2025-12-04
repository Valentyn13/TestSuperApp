import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAddTaskMutation } from '../../store/api/taskApi';
import { TaskPriority, TaskStatus } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { pickImage, uploadImageToStorage } from '../../helpers';
import { styles } from './CreateTaskScreen.styles';
import { Calendar } from 'react-native-calendars';
import { taskDraftService } from '../../services/taskDraftService';

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
});

type TaskFormData = z.infer<typeof taskSchema>;

export const TaskCreateScreen = () => {
    const navigation = useNavigation();
    const [addTask, { isLoading }] = useAddTaskMutation();
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDraftLoaded, setIsDraftLoaded] = useState(false);
    const isSubmittingRef = useRef(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
        reset,
    } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: '',
            description: '',
            priority: TaskPriority.LOW,
            deadline: new Date().toISOString().split('T')[0],
        },
    });

    const formValues = watch();

    useEffect(() => {
        const loadDraft = async () => {
            try {
                const draft = await taskDraftService.loadDraft();
                if (draft) {
                    Alert.alert(
                        'Draft Found',
                        'You have an unsaved draft. Would you like to continue editing it?',
                        [
                            {
                                text: 'Discard',
                                style: 'destructive',
                                onPress: async () => {
                                    await taskDraftService.clearDraft();
                                    setIsDraftLoaded(true);
                                },
                            },
                            {
                                text: 'Continue',
                                onPress: () => {
                                    setValue('title', draft.title);
                                    setValue('description', draft.description || '');
                                    setValue('priority', draft.priority as any);
                                    setValue('deadline', draft.deadline);
                                    if (draft.imageUri) {
                                        setSelectedImageUri(draft.imageUri);
                                    }
                                    setIsDraftLoaded(true);
                                },
                            },
                        ]
                    );
                } else {
                    setIsDraftLoaded(true);
                }
            } catch (error) {
                console.error('Error loading draft:', error);
                setIsDraftLoaded(true);
            }
        };

        loadDraft();
    }, [setValue]);

    useEffect(() => {
        const saveDraftOnBlur = async () => {
            if (!isDraftLoaded || isSubmittingRef.current) {
                return;
            }

            const hasContent = formValues.title.trim().length > 0 ||
                (formValues.description && formValues.description.trim().length > 0) ||
                selectedImageUri !== null;

            if (hasContent) {
                try {
                    await taskDraftService.saveDraft({
                        title: formValues.title,
                        description: formValues.description,
                        priority: formValues.priority,
                        deadline: formValues.deadline,
                        imageUri: selectedImageUri || undefined,
                        savedAt: new Date().toISOString(),
                    });
                    console.log('Draft saved on screen blur');
                } catch (error) {
                    console.error('Error saving draft on blur:', error);
                }
            }
        };

        return () => {
            saveDraftOnBlur();
        };
    }, [formValues, selectedImageUri, isDraftLoaded]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', async (e) => {
            if (isSubmittingRef.current) {
                return;
            }

            const hasContent = formValues.title.trim().length > 0 ||
                (formValues.description && formValues.description.trim().length > 0) ||
                selectedImageUri !== null;

            if (hasContent && isDraftLoaded) {
                try {
                    await taskDraftService.saveDraft({
                        title: formValues.title,
                        description: formValues.description,
                        priority: formValues.priority,
                        deadline: formValues.deadline,
                        imageUri: selectedImageUri || undefined,
                        savedAt: new Date().toISOString(),
                    });
                    console.log('Draft saved before navigation');
                } catch (error) {
                    console.error('Error saving draft before navigation:', error);
                }
            }
        });

        return unsubscribe;
    }, [navigation, formValues, selectedImageUri, isDraftLoaded]);

    const handlePickImage = async () => {
        const uri = await pickImage();
        if (uri) {
            setSelectedImageUri(uri);
        }
    };

    const onSubmit = async (data: TaskFormData) => {
        try {
            isSubmittingRef.current = true;
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

            await taskDraftService.clearDraft();

            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to create task');
            console.error(error);
            isSubmittingRef.current = false;
        } finally {
            setIsUploading(false);
        }
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

