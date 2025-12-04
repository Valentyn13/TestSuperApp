import React, { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useAppDispatch } from '../store';
import { taskApi } from '../store/api/taskApi';
import { categoryApi } from '../store/api/categoryApi';

type NetworkContextType = {
    isConnected: boolean | null;
    netInfoState: NetInfoState | null;
};

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

type NetworkProviderProps = {
    children: ReactNode;
};

export const NetworkProvider = ({ children }: NetworkProviderProps) => {
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [netInfoState, setNetInfoState] = useState<NetInfoState | null>(null);
    const dispatch = useAppDispatch();
    const previousConnectionState = useRef<boolean | null>(null);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            const isInternetReachable = state.isInternetReachable ?? false;
            const isNetworkConnected = state.isConnected ?? false;
            const currentlyConnected = isNetworkConnected && isInternetReachable;

            setIsConnected(currentlyConnected);
            setNetInfoState(state);

            // Sync when coming back online
            if (previousConnectionState.current === false && currentlyConnected) {
                dispatch(taskApi.util.invalidateTags(['Task']));
                dispatch(categoryApi.util.invalidateTags(['Category']));
            }

            previousConnectionState.current = currentlyConnected;
        });

        return () => {
            unsubscribe();
        };
    }, [dispatch]);

    return (
        <NetworkContext.Provider value={{ isConnected, netInfoState }}>
            {children}
        </NetworkContext.Provider>
    );
};

export const useNetwork = () => {
    const context = useContext(NetworkContext);
    if (context === undefined) {
        throw new Error('useNetwork must be used within a NetworkProvider');
    }
    return context;
};
