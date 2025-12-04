import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        flexDirection: 'row',
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        minHeight: 80,
    },
    statusStrip: {
        width: 6,
        height: '100%',
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textContainer: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    deadline: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    checkboxInner: {
        width: 10,
        height: 10,
        backgroundColor: '#fff',
        borderRadius: 2,
    },
    chevron: {
        padding: 4,
    },
    chevronText: {
        fontSize: 18,
        color: '#666',
    },
    expandedImage: {
        width: '100%',
        height: 200,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        marginTop: -12,
    },
});
