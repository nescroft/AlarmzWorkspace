/**
 * AlarmzDemo - Daily Alarm Scheduler with Bottom Tabs
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  requestAlarmPermission,
} from 'rn-alarmz';
import DailyAlarmsScreen from './src/screens/DailyAlarmsScreen';
import OneTimeAlarmsScreen from './src/screens/OneTimeAlarmsScreen';

const Tab = createBottomTabNavigator();

function PermissionScreen({ onPermissionGranted }: { onPermissionGranted: () => void }) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestAlarmPermission();
      if (granted) {
        console.log('✅ Alarm permission granted');
        Alert.alert('Success', 'Alarm permission granted!');
        onPermissionGranted();
      } else {
        console.error('❌ Permission denied');
        Alert.alert('Permission Denied', 'Cannot schedule alarms without permission');
      }
    } catch (error) {
      console.error('❌ Permission error:', error);
      Alert.alert('Error', `Failed to request permission: ${error}`);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#00FF00', textAlign: 'center', marginBottom: 16 }}>
        AlarmzDemo
      </Text>
      <Text style={{ fontSize: 16, color: '#808080', textAlign: 'center', marginBottom: 40 }}>
        Schedule alarms with custom sounds
      </Text>

      <View style={{ width: '100%', maxWidth: 400 }}>
        <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, color: '#FFFFFF', marginBottom: 16, textAlign: 'center' }}>
            Permission Required
          </Text>
          <Text style={{ fontSize: 14, color: '#808080', marginBottom: 24, textAlign: 'center', lineHeight: 20 }}>
            AlarmKit requires permission to schedule alarms on your device.
          </Text>
          <TouchableOpacity
            onPress={handleRequestPermission}
            disabled={isRequesting}
            style={{
              backgroundColor: isRequesting ? '#666666' : '#FFA500',
              padding: 16,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#000000', fontSize: 16, fontWeight: 'bold' }}>
              {isRequesting ? 'Requesting...' : 'Grant Permission'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20 }}>
          <Text style={{ color: '#00FF00', fontSize: 14, lineHeight: 20, marginBottom: 8 }}>
            Features:
          </Text>
          <Text style={{ color: '#808080', fontSize: 12, lineHeight: 18 }}>
            • Daily recurring alarms{'\n'}
            • Quick test timers (10s - 5min){'\n'}
            • Custom alarm sounds{'\n'}
            • System-level alarm integration
          </Text>
        </View>
      </View>
    </View>
  );
}

function TabNavigator({ hasPermission }: { hasPermission: boolean }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333333',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#00FF00',
        tabBarInactiveTintColor: '#808080',
        headerStyle: {
          backgroundColor: '#000000',
          borderBottomColor: '#333333',
          borderBottomWidth: 1,
        },
        headerTintColor: '#00FF00',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Daily Alarms"
        options={{
          tabBarLabel: 'Daily',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🔔</Text>
          ),
        }}
      >
        {() => <DailyAlarmsScreen hasPermission={hasPermission} />}
      </Tab.Screen>
      <Tab.Screen
        name="Quick Test"
        options={{
          tabBarLabel: 'Test',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>⚡</Text>
          ),
        }}
      >
        {() => <OneTimeAlarmsScreen hasPermission={hasPermission} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function App() {
  const [hasPermission, setHasPermission] = useState(false);

  const handlePermissionGranted = () => {
    setHasPermission(true);
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <NavigationContainer>
        {!hasPermission ? (
          <PermissionScreen onPermissionGranted={handlePermissionGranted} />
        ) : (
          <TabNavigator hasPermission={hasPermission} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
