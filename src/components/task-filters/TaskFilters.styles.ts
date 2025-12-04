import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        marginRight: 8,
        marginBottom: 8,
    },
    filterChipSelected: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    filterChipText: {
        color: '#333',
    },
    filterChipTextSelected: {
        color: '#fff',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
    },
    clearButton: {
        padding: 16,
        flex: 1,
        alignItems: 'center',
    },
    clearButtonText: {
        color: 'red',
        fontWeight: '600',
    },
    applyButton: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
        marginLeft: 12,
    },
    applyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 8,
    },
});
