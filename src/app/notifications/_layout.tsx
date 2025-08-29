/* eslint-disable react-native/no-inline-styles */
/* eslint-disable max-lines-per-function */
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, Easing, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useGetNotifications, useMarkAllNotificationsAsRead } from '@/api/notifications';
import { HeaderLeft } from '@/components/back-button';
import { HeaderTitle } from '@/components/header-title';
import { colors, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import type { Notification } from '@/interfaces';

const NotificationItem: React.FC<{ notification: Notification; onPress?: (notification: Notification) => void }> = ({ notification, onPress }) => {
  const { t } = useTranslation();

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
      return t('notifications.just_now');
    } else if (diffInHours < 24) {
      return t('notifications.hours_ago', { count: diffInHours });
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return t('notifications.days_ago', { count: diffInDays });
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
    <Animated.View style={{ transform: [{ scale: scaleAnim }, { translateX: shakeAnim }] }}>
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

const NotificationsHeaderTitle = () => {
  const { t } = useTranslation();
  return <HeaderTitle title={t('notifications.title')} />;
};

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const { mutate: getNotifications, isPending: fetchingNotifications } = useGetNotifications();
  const { mutate: markAllNotificationsAsRead, isPending: markingAllAsRead } = useMarkAllNotificationsAsRead();

  const loadNotifications = React.useCallback(async () => {
    try {
      getNotifications(
        {},
        {
          onSuccess: (response) => {
            setNotifications(response);
          },
          onError: (error) => {
            console.error('Error fetching notifications:', error);
          },
          onSettled: () => {
            setLoading(false);
          },
        },
      );
    } catch (error) {
      console.error('Error: failed to load notifications', error);
    }
  }, [getNotifications]);

  const markAllAsRead = async () => {
    try {
      markAllNotificationsAsRead(
        {},
        {
          onSuccess: () => {
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
          },
          onError: (error) => {
            console.error('Error marking notifications as read:', error);
          },
        },
      );
    } catch (error) {
      console.error('Error: failed to mark all notifications as read');
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const hasUnreadNotifications = notifications.some((n) => !n.isRead);

  return (
    <SafeAreaProvider>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <Stack.Screen
            options={{
              headerTitleAlign: 'center',
              headerTitle: NotificationsHeaderTitle,
              headerShown: true,
              headerShadowVisible: false,
              headerLeft: HeaderLeft,
            }}
          />
          <FocusAwareStatusBar style="dark" />

          <View className="flex h-full">
            {loading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="small" color={colors.primary[600]} />
                <Text className="text-base text-gray-500">{t('notifications.loading')}</Text>
              </View>
            ) : notifications.length === 0 ? (
              <View className="flex-1 items-center justify-center px-6">
                <Ionicons name="notifications-outline" size={60} color="#9CA3AF" className="mb-4" />
                <Text className="text-normal mb-2 text-center font-medium text-gray-700">{t('notifications.no_notifications')}</Text>
                <Text className="text-center text-xs text-gray-500">{t('notifications.no_notifications_subtext')}</Text>
              </View>
            ) : (
              <View className="flex-1">
                {hasUnreadNotifications && !fetchingNotifications && (
                  <TouchableOpacity onPress={markAllAsRead} disabled={markingAllAsRead} className="my-6">
                    {markingAllAsRead && <ActivityIndicator size="small" color={colors.primary[600]} />}
                    {!markingAllAsRead && <Text className="text-center text-xs font-medium text-primary-600">{t('notifications.mark_all_as_read')}</Text>}
                  </TouchableOpacity>
                )}
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                  {notifications.map((notification) => (
                    <NotificationItem key={notification.id.toString()} notification={notification} />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </SafeAreaProvider>
  );
}
