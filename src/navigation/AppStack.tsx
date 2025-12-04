import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/home-screen/HomeScreen';
import { TaskActionScreen } from '../screens/task-action-screen/TaskActionScreen';
import { TaskCreateScreen } from '../screens/create-task-screen/TaskCreateScreen';
import { TaskEditScreen } from '../screens/task-edit-screen/TaskEditScreen';
import { CategoryScreen } from '../screens/category-screen/CategoryScreen';

const Tab = createBottomTabNavigator();
const TasksStack = createNativeStackNavigator();

const TasksStackNavigator = () => {
    return (
        <TasksStack.Navigator screenOptions={{ headerShown: true }}>
            <TasksStack.Screen name="TaskAction" component={TaskActionScreen} options={{ title: 'Task Action' }} />
            <TasksStack.Screen name="TaskCreate" component={TaskCreateScreen} options={{ title: 'Create Task' }} />
            <TasksStack.Screen name="TaskEdit" component={TaskEditScreen} options={{ title: 'Edit Task' }} />
            <TasksStack.Screen name="Category" component={CategoryScreen} options={{ title: 'Categories' }} />
        </TasksStack.Navigator>
    );
};

export const AppStack = () => {
    return (
        <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Tasks" component={TasksStackNavigator} />
        </Tab.Navigator>
    );
};
