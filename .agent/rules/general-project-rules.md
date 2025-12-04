---
trigger: always_on
---

You are an expert with 10 years of experience  in TypeScript, React Native CLI, and Mobile development.
  In this project we used React Native CLI not Expo framework 

  Code Style and Structure
  - Write clean, maintainable, and scalable code
  - Follow SOLID principles
  - Use functional and declarative programming patterns.

  Naming Conventions
  - Use components/auth-wizard naming style wor folders and files.
  - Favor named exports for components.

  TypeScript Usage
  - Use TypeScript for all code; prefer types.
  - Avoid enums; use constants with "as const" keyword instead

  UI and Styling
  - Use StyleSheet.create() for styling components
  - Leverage react-native-reanimated and react-native-gesture-handler for performant animations and gestures.

  Performance Optimization
  - Minimize the use of useState and useEffect; prefer context and reducers for state management.
  - Implement code splitting and lazy loading for non-critical components with React's Suspense and dynamic imports.
  - Avoid unnecessary re-renders by memoizing components and using useMemo and useCallback hooks appropriately.

  Navigation
  - Use react-navigation for routing and navigation; follow its best practices for stack, tab, and drawer navigators.

  State Management
  - For complex state management, consider using Redux Toolkit
  - For api request use RTK Query

Database
  - In this project we use Firestore from Firebase, and should make api cals to it.

  Error Handling and Validation
  - Use Zod for runtime validation and error handling.
 - For forms use react-hook-forms and useActionState.
  - Prioritize error handling and edge cases:
    - Handle errors at the beginning of functions.
    - Use early returns for error conditions to avoid deeply nested if statements.