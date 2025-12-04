import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/home-screen/HomeScreen';
import { TaskActionScreen } from '../screens/task-action-screen/TaskActionScreen';
import { TaskCreateScreen } from '../screens/create-task-screen/TaskCreateScreen';
import { TaskEditScreen } from '../screens/task-edit-screen/TaskEditScreen';
import { CategoryScreen } from '../screens/category-screen/CategoryScreen';
import { IconHomeTab, IconTasksTab } from '../assets/icons';

const Tab = createBottomTabNavigator();
const TasksStack = createNativeStackNavigator();

const ACTIVE_COLOR = '#000000';
const INACTIVE_COLOR = '#999999';

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
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: ACTIVE_COLOR,
                tabBarInactiveTintColor: INACTIVE_COLOR,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <IconHomeTab
                            fill={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
                            width={24}
                            height={24}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Tasks"
                component={TasksStackNavigator}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <IconTasksTab
                            stroke={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
                            width={24}
                            height={24}
                        />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};
