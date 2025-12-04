import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import languageReducer from './slices/language-slice';

import { taskApi } from './api/taskApi';
import { categoryApi } from './api/categoryApi';

const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
    whitelist: ['language', 'taskApi', 'categoryApi'],
};

const rootReducer = combineReducers({
    language: languageReducer,
    [taskApi.reducerPath]: taskApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }).concat(taskApi.middleware, categoryApi.middleware),
    devTools: true,
    enhancers: (getDefaultEnhancers) => {
        if (__DEV__) {
            const Reactotron = require('../../ReactotronConfig').default;
            return getDefaultEnhancers().concat(Reactotron.createEnhancer());
        }
        return getDefaultEnhancers();
    },
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
