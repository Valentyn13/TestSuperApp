export const TaskPriority = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
} as const;

export type TaskPriorityType = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskStatus = {
    COMPLETED: 'completed',
    UNCOMPLETED: 'uncompleted',
} as const;

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

export interface Task {
    id: string;
    title: string;
    titleLowercase?: string; // For case-insensitive search
    description?: string;
    status: TaskStatusType;
    priority: TaskPriorityType;
    categoryId?: string;
    deadline: string;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
}
