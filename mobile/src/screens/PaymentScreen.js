import React, { useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, Alert, Linking,
    StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getUserPayments, getGroups, initiatePayment } from '../services/api';
import PaymentCard from '../components/PaymentCard';

export default function PaymentScreen() {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const [paymentsRes, groupsRes] = await Promise.all([
                getUserPayments(user._id),
                getGroups(),
            ]);
            setPayments(paymentsRes.data.payments || []);
            setGroups(groupsRes.data.groups || []);
        } catch (err) {
            console.log('Error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleUPIPay = (group, amount, month) => {
        // UPI Deep Link format
        const upiUrl = `upi://pay?pa=admin@upi&pn=EMI+Group&am=${amount}&tn=EMI+Month+${month}+${group.name}&cu=INR`;

        Alert.alert(
            'Pay via UPI',
            `Pay ₹${amount.toLocaleString()} for ${group.name} (Month ${month})`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Open UPI App',
                    onPress: async () => {
                        try {
                            const supported = await Linking.canOpenURL(upiUrl);
                            if (supported) {
                                await Linking.openURL(upiUrl);
                                // Record payment intent
                                await initiatePayment({
                                    groupId: group._id,
                                    month,
                                    amount,
                                });
                                loadData();
                            } else {
                                Alert.alert('Error', 'No UPI app found. Please install Google Pay, PhonePe, or Paytm.');
                            }
                        } catch (err) {
                            Alert.alert('Error', 'Failed to open UPI app');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#e94560" />
            </View>
        );
    }

    // Pending payments grouped by group
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const completedPayments = payments.filter(p => p.status !== 'pending');

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e94560" />}
        >
            <Text style={styles.header}>Payments</Text>

            {/* UPI Payment Info */}
            <View style={styles.upiCard}>
                <View style={styles.upiHeader}>
                    <Ionicons name="card" size={24} color="#00b894" />
                    <Text style={styles.upiTitle}>UPI Payment</Text>
                </View>
                <Text style={styles.upiDesc}>
                    Tap the Pay button next to pending EMIs to pay via any UPI app
                </Text>
            </View>

            {/* Pending EMIs */}
            {pendingPayments.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>
                        Pending ({pendingPayments.length})
                    </Text>
                    {pendingPayments.map((payment) => {
                        const group = groups.find(g => g._id === (payment.group?._id || payment.group));
                        return (
                            <View key={payment._id} style={styles.pendingRow}>
                                <View style={styles.pendingInfo}>
                                    <PaymentCard payment={payment} />
                                </View>
                                {group && (
                                    <TouchableOpacity
                                        style={styles.payBtn}
                                        onPress={() => handleUPIPay(group, payment.amount, payment.month)}
                                    >
                                        <Ionicons name="wallet" size={16} color="#fff" />
                                        <Text style={styles.payBtnText}>PAY</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                </>
            )}

            {/* Completed Payments */}
            <Text style={styles.sectionTitle}>Payment History</Text>
            {completedPayments.length > 0 ? (
                completedPayments.map((payment) => (
                    <PaymentCard key={payment._id} payment={payment} />
                ))
            ) : (
                <View style={styles.empty}>
                    <Ionicons name="receipt-outline" size={48} color="#334455" />
                    <Text style={styles.emptyText}>No payment history yet</Text>
                </View>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1a1a2e', paddingHorizontal: 20 },
    center: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
    header: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
        paddingTop: 60,
        paddingBottom: 16,
    },
    upiCard: {
        backgroundColor: '#00b89415',
        borderWidth: 1,
        borderColor: '#00b894',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    upiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    upiTitle: { color: '#00b894', fontSize: 16, fontWeight: '700', marginLeft: 8 },
    upiDesc: { color: '#8899aa', fontSize: 13, lineHeight: 18 },
    sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 8 },
    pendingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    pendingInfo: { flex: 1 },
    payBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e94560',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginLeft: 8,
    },
    payBtnText: { color: '#fff', fontSize: 12, fontWeight: '800', marginLeft: 4 },
    empty: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { color: '#556677', fontSize: 14, marginTop: 12 },
});
