/* eslint-disable react-native/no-inline-styles */
/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, FlatList, RefreshControl, TouchableOpacity } from 'react-native';

import { HeaderLeft } from '@/components/back-button';
import { FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import type { Notification } from '@/interfaces';

const mockNotifications: Notification[] = [
  {
    id: 'a1b2c3d4-e5f6-11ee-be56-0242ac120001',
    type: 'TRANSACTION',
    title: 'Transfert reçu',
    message: 'Vous avez reçu 5 000 XAF de Jean Dupont. Votre nouveau solde est de 4 933,63 XAF.',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // Il y a 30 minutes
  },
  {
    id: 'b2c3d4e5-f6a7-11ee-be56-0242ac120002',
    type: 'PROMOTION',
    title: 'XAF en feu ! 🔥',
    message: 'Profitez du taux avantageux : $1 = 672 XAF. Ne laissez pas votre argent refroidir - envoyez, échangez rapidement avec Eversend !',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2 heures
  },
  {
    id: 'c3d4e5f6-a7b8-11ee-be56-0242ac120003',
    type: 'REMINDER',
    title: 'Maintenance programmée ⚠️',
    message: 'Nous effectuerons une maintenance le mardi 22 avril à 20h GMT (23h EAT) pendant 2 heures. Veuillez terminer vos transactions importantes avant.',
    isRead: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // Il y a 4 heures
  },
  {
    id: 'd4e5f6a7-b8c9-11ee-be56-0242ac120004',
    type: 'TRANSACTION',
    title: 'Échange effectué',
    message: 'Vous avez échangé 7,19 USD contre 4 603,04 XAF avec succès.',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Il y a 1 jour
  },
  {
    id: 'e5f6a7b8-c9d0-11ee-be56-0242ac120005',
    type: 'SECURITY',
    title: 'Connexion détectée',
    message: "Une nouvelle connexion à votre compte a été détectée depuis Yaoundé, Cameroun. Si ce n'était pas vous, contactez-nous immédiatement.",
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
  },
  {
    id: 'f6a7b8c9-d0e1-11ee-be56-0242ac120006',
    type: 'PROMOTION',
    title: 'USDT ou USDC ? On vous a ! 💰',
    message: 'Recevez, rechargez votre portefeuille, échangez, chargez votre carte virtuelle ou envoyez facilement vos cryptomonnaies.',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
  },
  {
    id: 'a7b8c9d0-e1f2-11ee-be56-0242ac120007',
    type: 'WELCOME',
    title: 'Bienvenue sur Eversend ! 🎉',
    message: "Félicitations ! Votre compte a été créé avec succès. Découvrez toutes nos fonctionnalités : envois d'argent, cartes virtuelles, épargne et bien plus.",
    isRead: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Il y a 7 jours
  },
  {
    id: 'b8c9d0e1-f2a3-11ee-be56-0242ac120008',
    type: 'CARD',
    title: 'Carte virtuelle créée',
    message: "Votre nouvelle carte virtuelle Visa a été créée avec succès. Vous pouvez maintenant l'utiliser pour vos achats en ligne.",
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Il y a 5 jours
  },
  {
    id: 'c9d0e1f2-a3b4-11ee-be56-0242ac120009',
    type: 'LIMIT',
    title: 'Limite mensuelle atteinte',
    message: "Vous avez atteint 80% de votre limite mensuelle d'envoi. Vérifiez votre compte pour augmenter vos limites.",
    isRead: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Il y a 10 jours
  },
  {
    id: 'd0e1f2a3-b4c5-11ee-be56-0242ac120010',
    type: 'SAVINGS',
    title: "Objectif d'épargne atteint ! 🎯",
    message: "Bravo ! Vous avez atteint votre objectif d'épargne de 100 000 XAF. Continuez sur cette lancée !",
    isRead: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Il y a 14 jours
  },
];

// Configuration pour tester différents cas
const MOCK_CONFIG = {
  // Changez ces valeurs pour tester différents scénarios
  SHOW_EMPTY_STATE: false, // true pour tester l'état vide
  SIMULATE_LOADING: false, // true pour tester l'état de chargement
  SIMULATE_ERROR: false, // true pour tester les erreurs
  LOADING_DELAY: 1500, // Délai en ms pour simuler le chargement
};

// Service API pour les notifications avec données de mock
const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    // Simuler un délai de chargement
    if (MOCK_CONFIG.SIMULATE_LOADING) {
      await new Promise((resolve) => setTimeout(resolve, MOCK_CONFIG.LOADING_DELAY));
    }

    // Simuler une erreur
    if (MOCK_CONFIG.SIMULATE_ERROR) {
      throw new Error('Erreur de connexion au serveur');
    }

    // Retourner un tableau vide pour tester l'état vide
    if (MOCK_CONFIG.SHOW_EMPTY_STATE) {
      return [];
    }

    // Retourner les données de mock
    return mockNotifications;
  },

  async markAllAsRead(): Promise<void> {
    // Simuler un délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simuler une erreur occasionnelle
    if (Math.random() < 0.1) {
      // 10% de chance d'erreur
      throw new Error('Erreur lors de la mise à jour des notifications');
    }

    // Marquer toutes les notifications comme lues dans les données mock
    mockNotifications.forEach((notification) => {
      notification.isRead = true;
    });
  },
};

const NotificationItem: React.FC<{
  notification: Notification;
  onPress?: (notification: Notification) => void;
}> = ({ notification, onPress }) => {
  // Références pour les animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'WELCOME':
        return 'person-add-outline';
      case 'REMINDER':
        return 'alarm-outline';
      case 'TRANSACTION':
        return 'card-outline';
      case 'PROMOTION':
        return 'gift-outline';
      case 'SECURITY':
        return 'shield-checkmark-outline';
      case 'CARD':
        return 'card-outline';
      case 'LIMIT':
        return 'warning-outline';
      case 'SAVINGS':
        return 'wallet-outline';
      default:
        return 'notifications-outline';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return "À l'instant";
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Il y a ${diffInDays}j`;
    }
  };

  const startShakeAnimation = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const startCombinedAnimation = () => {
    scaleAnim.setValue(1);
    shakeAnim.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.01,
          duration: 120,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 2, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -2, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const handlePress = () => {
    if (!notification.isRead) {
      startShakeAnimation();
    } else {
      startCombinedAnimation();
    }
    setTimeout(() => {
      onPress?.(notification);
    }, 150);
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }, { translateX: shakeAnim }],
      }}
    >
      <TouchableOpacity onPress={handlePress} className={`flex-row items-start border-b border-gray-100 p-4 ${!notification.isRead ? 'bg-blue-50' : 'bg-white'}`} activeOpacity={0.7}>
        <View className="mr-3 mt-1">{!notification.isRead && <View className="size-2 rounded-full bg-blue-500" />}</View>
        <View className="mr-3 mt-1">
          <Ionicons name={getNotificationIcon(notification.type) as any} size={24} color={!notification.isRead ? '#3B82F6' : '#6B7280'} />
        </View>
        <View className="flex-1">
          <Text className={`mb-1 text-base font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>{notification.title}</Text>
          <Text className="mb-2 text-sm leading-5 text-gray-600">{notification.message}</Text>
          <Text className="text-xs text-gray-400">{formatDate(notification.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les notifications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      setMarkingAllAsRead(true);
      await notificationService.markAllAsRead();

      // Mettre à jour l'état local
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de marquer les notifications comme lues');
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  // Charger les notifications au montage du composant
  useEffect(() => {
    loadNotifications();
  }, []);

  // Vérifier s'il y a des notifications non lues
  const hasUnreadNotifications = notifications.some((n) => !n.isRead);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerTitleAlign: 'center',
          title: 'Notifications',
          headerShown: true,
          headerShadowVisible: false,
          headerLeft: HeaderLeft,
        }}
      />
      <FocusAwareStatusBar style="dark" />

      <View className="flex h-full">
        {loading ? (
          // État de chargement
          <View className="flex-1 items-center justify-center">
            <Text className="text-base text-gray-500">Chargement...</Text>
          </View>
        ) : notifications.length === 0 ? (
          // État vide
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="notifications-outline" size={60} color="#9CA3AF" className="mb-4" />
            <Text className="mb-2 text-center text-lg font-medium text-gray-900">Aucune notification</Text>
            <Text className="text-center text-base text-gray-500">Vous n'avez encore reçu aucune notification</Text>
          </View>
        ) : (
          // Liste des notifications
          <View className="flex-1">
            {hasUnreadNotifications && !refreshing && (
              <TouchableOpacity onPress={markAllAsRead} disabled={markingAllAsRead} className="my-6">
                <Text className={`text-center text-sm font-medium ${markingAllAsRead ? 'text-gray-400' : 'text-blue-600'}`}>{markingAllAsRead ? 'Chargement...' : 'Tout marquer comme lu'}</Text>
              </TouchableOpacity>
            )}

            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <NotificationItem notification={item} />}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
              showsVerticalScrollIndicator={false}
              className="flex-1"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
