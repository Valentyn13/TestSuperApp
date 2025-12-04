import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

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

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsConnected(state.isConnected);
            setNetInfoState(state);
            console.log('Network state changed:', {
                isConnected: state.isConnected,
                type: state.type,
                isInternetReachable: state.isInternetReachable,
            });
        });

        return () => {
            unsubscribe();
        };
    }, []);

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
