/**
 * OneTimeAlarmsScreen - One-time alarms with countdown for testing
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  scheduleFixedAlarm,
  createAlarmButton,
  createAlarmCountdown,
  getScheduledAlarms,
  cancelScheduledAlarm,
  type ScheduledAlarm,
} from 'rn-alarmz';

interface OneTimeAlarmsScreenProps {
  hasPermission: boolean;
}

export default function OneTimeAlarmsScreen({ hasPermission }: OneTimeAlarmsScreenProps) {
  const [countdownSeconds, setCountdownSeconds] = useState(30);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledAlarms, setScheduledAlarms] = useState<ScheduledAlarm[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAlarms = async () => {
    try {
      console.log('🔍 Fetching scheduled alarms...');
      const alarms = await getScheduledAlarms();
      console.log('📋 Fetched alarms:', alarms);
      // Filter only one-time alarms (no repeating weekdays)
      const oneTimeAlarms = alarms.filter(alarm => !alarm.repeats || alarm.repeats.length === 0);
      setScheduledAlarms(oneTimeAlarms);
    } catch (error) {
      console.error('❌ Failed to fetch alarms:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchAlarms();
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (hasPermission) {
      fetchAlarms();
    }
  }, [hasPermission]);

  const scheduleQuickAlarm = async () => {
    if (!hasPermission) {
      console.warn('⚠️ Permission required to schedule alarm');
      Alert.alert('Permission Required', 'Please grant alarm permission first');
      return;
    }

    setIsScheduling(true);
    try {
      console.log(`🔔 Scheduling countdown alarm for ${countdownSeconds} seconds`);

      const stopButton = await createAlarmButton('Stop', '#FF0000', 'stop.circle');
      const snoozeButton = await createAlarmButton('Snooze 60s', '#FFA500', 'moon.circle');

      // Create countdown: triggers in countdownSeconds, snooze repeats after 60 seconds
      const countdown = await createAlarmCountdown(countdownSeconds, 60);

      console.log('📦 Buttons and countdown created');

      const success = await scheduleFixedAlarm(
        'Test Alarm',
        stopButton,
        '#FF0000',
        snoozeButton,
        undefined,           // No timestamp needed with countdown
        countdown,           // Use countdown instead
        'customAlarm.wav'    // Custom sound
      );

      if (success) {
        console.log('✅ Alarm scheduled successfully');
        Alert.alert(
          'Alarm Scheduled!',
          `Alarm will trigger in ${countdownSeconds} seconds`
        );
        await fetchAlarms(); // Refresh the alarm list
      } else {
        console.error('❌ Alarm scheduling returned false');
        Alert.alert('Failed', 'Could not schedule alarm');
      }
    } catch (error) {
      console.error('❌ Alarm scheduling error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Error', `Failed to schedule alarm: ${error}`);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelAlarm = async (alarmId: string) => {
    const runCancellation = async () => {
      setCancellingId(alarmId);
      try {
        const success = await cancelScheduledAlarm(alarmId);
        if (success) {
          console.log(`✅ Alarm ${alarmId} cancelled`);
          Alert.alert('Alarm Removed', 'The alarm was cancelled successfully.');
          await fetchAlarms();
        } else {
          console.warn(`⚠️ cancelScheduledAlarm returned false for ${alarmId}`);
          Alert.alert('Failed', 'Could not cancel this alarm.');
        }
      } catch (error) {
        console.error('❌ Failed to cancel alarm:', error);
        Alert.alert('Error', `Unable to cancel alarm: ${error}`);
      } finally {
        setCancellingId(current => (current === alarmId ? null : current));
      }
    };

    Alert.alert(
      'Remove Alarm',
      'Are you sure you want to cancel this alarm?',
      [
        { text: 'Keep', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: runCancellation },
      ]
    );
  };

  const adjustCountdown = (delta: number) => {
    setCountdownSeconds(prev => Math.max(10, Math.min(300, prev + delta)));
  };

  const formatCountdown = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#000000' }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#FFA500"
        />
      }
    >
      <View style={{ flex: 1, padding: 20 }}>
        {/* Countdown Picker Section */}
        <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, marginBottom: 20, marginTop: 20 }}>
          <Text style={{ fontSize: 18, color: '#FFFFFF', marginBottom: 20 }}>
            Set Countdown Timer
          </Text>

          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => adjustCountdown(10)}
              style={{ backgroundColor: '#FFA500', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 15 }}
            >
              <Text style={{ color: '#000000', fontSize: 24, fontWeight: 'bold' }}>+10</Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center', marginVertical: 10 }}>
              <Text style={{ fontSize: 48, color: '#FFFFFF', fontWeight: 'bold' }}>
                {formatCountdown(countdownSeconds)}
              </Text>
              <Text style={{ fontSize: 14, color: '#808080', marginTop: 4 }}>
                {countdownSeconds} seconds
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => adjustCountdown(-10)}
              style={{ backgroundColor: '#FFA500', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginTop: 15 }}
            >
              <Text style={{ color: '#000000', fontSize: 24, fontWeight: 'bold' }}>-10</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => setCountdownSeconds(10)}
              style={{ backgroundColor: '#333333', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12 }}>10s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCountdownSeconds(30)}
              style={{ backgroundColor: '#333333', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12 }}>30s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCountdownSeconds(60)}
              style={{ backgroundColor: '#333333', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12 }}>1m</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCountdownSeconds(120)}
              style={{ backgroundColor: '#333333', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12 }}>2m</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: '#808080', textAlign: 'center', fontSize: 14, marginTop: 15 }}>
            One-time alarm • For quick testing
          </Text>
        </View>

        {/* Schedule Button */}
        <TouchableOpacity
          onPress={scheduleQuickAlarm}
          disabled={!hasPermission || isScheduling}
          style={{
            backgroundColor: !hasPermission || isScheduling ? '#333333' : '#FFA500',
            padding: 20,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: !hasPermission || isScheduling ? '#666666' : '#000000', fontSize: 18, fontWeight: 'bold' }}>
            {isScheduling ? 'Scheduling...' : `Start ${formatCountdown(countdownSeconds)} Timer`}
          </Text>
        </TouchableOpacity>

        {/* Scheduled Alarms List */}
        {scheduledAlarms.length > 0 && (
          <View style={{ marginTop: 40 }}>
            <Text style={{ fontSize: 18, color: '#FFFFFF', marginBottom: 16, fontWeight: 'bold' }}>
              Active Timers ({scheduledAlarms.length})
            </Text>
            {scheduledAlarms.map((alarm) => (
              <View
                key={alarm.id}
                style={{
                  backgroundColor: '#1a1a1a',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: '#FFA500',
                }}
              >
                <Text style={{ fontSize: 24, color: '#FFFFFF', fontWeight: 'bold' }}>
                  One-Time Alarm
                </Text>
                <Text style={{ fontSize: 14, color: '#808080', marginTop: 4 }}>
                  Countdown timer
                </Text>
                <Text style={{ fontSize: 10, color: '#333333', marginTop: 8, fontFamily: 'monospace' }}>
                  ID: {alarm.id}
                </Text>
                <TouchableOpacity
                  onPress={() => handleCancelAlarm(alarm.id)}
                  disabled={cancellingId === alarm.id}
                  style={{
                    marginTop: 12,
                    backgroundColor: cancellingId === alarm.id ? '#333333' : '#FF4D4D',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#000000', fontSize: 14, fontWeight: 'bold' }}>
                    {cancellingId === alarm.id ? 'Removing...' : 'Remove Timer'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Info Section */}
        <View style={{ marginTop: 40, marginBottom: 40, padding: 20, backgroundColor: '#1a1a1a', borderRadius: 12 }}>
          <Text style={{ color: '#FFA500', fontSize: 14, lineHeight: 20 }}>
            ⚡ Perfect for quick testing!
          </Text>
          <Text style={{ color: '#808080', fontSize: 12, marginTop: 8, lineHeight: 18 }}>
            Set a short countdown to test your alarm sound quickly.{'\n'}
            Minimum: 10 seconds • Maximum: 5 minutes
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
