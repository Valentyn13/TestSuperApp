import { useContext } from 'react';
import {
    createContext,
    FC,
    ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { BackHandler, Keyboard, StyleSheet, View } from 'react-native';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetModalProvider,
    BottomSheetView,
} from '@gorhom/bottom-sheet';
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types';


export interface BottomSheetContextProps {
    isOpen: boolean;
    openBottomSheet: (
        content: ReactNode | FC,
        size: number | string,
        height?: number,
    ) => void;
    closeBottomSheet: () => void;
    setContent: (content: ReactNode | FC) => void;
}


export const BottomSheetContext = createContext<
    BottomSheetContextProps | undefined
>(undefined);

const BottomSheetProvider: FC<{ children: ReactNode }> = ({ children }) => {

    const modalRef = useRef<BottomSheetModalMethods>(null);

    const [bottomSheetContent, setBottomSheetContentState] =
        useState<ReactNode | null>(null);
    const [isOverlayVisible, setOverlayVisible] = useState(false);
    const [pendingContent, setPendingContent] = useState<ReactNode | null>(null);
    const [size, setSize] = useState<(number | string)[]>(['50%']);

    useEffect(() => {
        if (pendingContent) {
            const timer = setTimeout(() => {
                setBottomSheetContentState(pendingContent);
                setPendingContent(null);
            }, 200);

            return () => clearTimeout(timer);
        }
    }, [pendingContent]);

    const onBackPress = () => {
        if (isOverlayVisible) {
            closeBottomSheet();
            return true;
        }
        return false;
    };

    const openBottomSheet = useCallback(
        (content: ReactNode | FC, size: number | string = '50%') => {
            if (Keyboard.isVisible()) {
                Keyboard.dismiss();
            }
            setSize([size]);
            setPendingContent(content as ReactNode);
            modalRef.current?.present();

            BackHandler.addEventListener('hardwareBackPress', onBackPress);
            setOverlayVisible(true);
        },
        [],
    );

    const closeBottomSheet = useCallback(() => {
        modalRef.current?.dismiss();
        setBottomSheetContentState(null);
        setPendingContent(null);

        setOverlayVisible(false);
    }, []);

    const setContent = useCallback((content: ReactNode | FC) => {
        setBottomSheetContentState(content as ReactNode);
    }, []);

    const renderBackdrop = useCallback(
        (props: BottomSheetDefaultBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.2}
                pressBehavior="close"
            />
        ),
        [],
    );

    const renderHandle = useCallback(
        () => (
            <View style={styles.header}>
            </View>
        ),
        [],
    );

    return (
        <BottomSheetContext.Provider
            value={{
                openBottomSheet,
                closeBottomSheet,
                setContent,
                isOpen: isOverlayVisible,
            }}>
            <BottomSheetModalProvider>
                <View style={styles.contentContainer}>
                    {children}
                    <BottomSheetModal
                        ref={modalRef}
                        index={0}
                        snapPoints={size}
                        enableDynamicSizing={false}
                        enableContentPanningGesture={false}
                        enableHandlePanningGesture={true}
                        android_keyboardInputMode={'adjustResize'}
                        keyboardBehavior={'interactive'}
                        enablePanDownToClose={true}
                        onDismiss={closeBottomSheet}
                        handleComponent={renderHandle}
                        style={styles.modal}
                        backdropComponent={renderBackdrop}
                        detached={false}>
                        <BottomSheetView style={styles.bottomSheetContent}>
                            {bottomSheetContent}
                        </BottomSheetView>
                    </BottomSheetModal>
                </View>
            </BottomSheetModalProvider>
        </BottomSheetContext.Provider>
    );
};

export default BottomSheetProvider;

export const useBottomSheet = () => {
    const context = useContext(BottomSheetContext);
    if (!context) {
        throw new Error('useBottomSheet must be used within a BottomSheetProvider');
    }
    return context;
};

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'black',
        opacity: 0.5,
    },
    modal: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    header: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    bottomSheetContent: {
        height: '100%',
        paddingBottom: 30,
    },
});
