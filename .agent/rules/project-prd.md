---
trigger: always_on
---

This is a requiremets for the project:

1. State Management: Use the Redux Toolkit to manage the state of the application. The state should include:
    - Task list with fields: unique identifier, title, description (optional), execution status, priority (low, medium, high), category(optional), deadline (date and time).
    - Global application settings (e.g. selected filter).
    - Use RTK Query to manage API requests to Firestore
2. Integration with Firestore: Implement adding, deleting, updating and synchronizing tasks in Firestore DB in real time. Maintain offline mode with local data caching and synchronization on reconnection.
3. **Task List Screen**
    - Display tasks as a list with support for pagination or infinite scrolling (lazy loading).
    - Implement sorting of tasks by priority, deadline, or status.
    - Add the ability to group tasks by categories (e.g., Work, Personal) that the user can create.
    - Each task should display status, deadline (with a visual indicator if deadline is approaching), and have the ability to be marked as completed or deleted (with action confirmation).
4. **Add/Edit Task Screen**:
    - Implement a form to create and edit a task with field validation (e.g., title is required, deadline cannot be in the past).
    - Add the ability to attach an image to a task (upload to Firebase Storage).
    - Support autosave of task draft to local storage.
5. **Filtering and search**
    - Implement task filtering by status (completed/uncompleted), priority, category, or deadline.
    - Add full-text search by task title and description using Firestore or local indexes
    1. **Offline mode and local storage**
    - Use AsyncStorage to save tasks and drafts locally.
    - Implement a mechanism to resolve conflicts when synchronizing data after a connection is restored.