import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import {
    useGetCategoriesQuery,
    useAddCategoryMutation,
    useDeleteCategoryMutation,
} from '../../store/api/categoryApi';
import { Category } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { styles } from './CategoryScreen.styles';

export const CategoryScreen = () => {
    const { data: categories, isLoading, error } = useGetCategoriesQuery();
    const [addCategory, { isLoading: isAdding }] = useAddCategoryMutation();
    const [deleteCategory] = useDeleteCategoryMutation();

    const [newCategoryName, setNewCategoryName] = useState('');

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            Alert.alert('Validation', 'Category name is required');
            return;
        }

        try {
            const newCategory: Category = {
                id: uuidv4(),
                name: newCategoryName.trim(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await addCategory(newCategory).unwrap();
            setNewCategoryName('');
        } catch (error) {
            Alert.alert('Error', 'Failed to add category');
            console.error(error);
        }
    };

    const handleDeleteCategory = (id: string) => {
        Alert.alert(
            'Delete Category',
            'Are you sure you want to delete this category?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCategory(id).unwrap();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete category');
                            console.error(error);
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: Category }) => (
        <View style={styles.item}>
            <Text style={styles.itemText}>{item.name}</Text>
            <TouchableOpacity
                onPress={() => handleDeleteCategory(item.id)}
                style={styles.deleteButton}
            >
                <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

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
                <Text>Error loading categories</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="New Category Name"
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                />
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddCategory}
                    disabled={isAdding}
                >
                    <Text style={styles.addButtonText}>
                        {isAdding ? 'Adding...' : 'Add'}
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={categories}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

