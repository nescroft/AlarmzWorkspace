/**
 * DailyAlarmsScreen - Recurring daily alarms
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
  scheduleRelativeAlarm,
  createAlarmButton,
  getScheduledAlarms,
  cancelScheduledAlarm,
  type ScheduledAlarm,
} from 'rn-alarmz';

interface DailyAlarmsScreenProps {
  hasPermission: boolean;
}

export default function DailyAlarmsScreen({ hasPermission }: DailyAlarmsScreenProps) {
  const [alarmTime, setAlarmTime] = useState({ hour: 7, minute: 0 });
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledAlarms, setScheduledAlarms] = useState<ScheduledAlarm[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAlarms = async () => {
    try {
      console.log('🔍 Fetching scheduled alarms...');
      const alarms = await getScheduledAlarms();
      console.log('📋 Fetched alarms:', alarms);
      // Filter only recurring alarms (daily alarms have weekdays)
      const dailyAlarms = alarms.filter(alarm => alarm.repeats && alarm.repeats.length > 0);
      setScheduledAlarms(dailyAlarms);
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

  const scheduleDailyAlarm = async () => {
    if (!hasPermission) {
      console.warn('⚠️ Permission required to schedule alarm');
      Alert.alert('Permission Required', 'Please grant alarm permission first');
      return;
    }

    // Check if alarm is at least 15 minutes in the future
    const now = new Date();
    const nextAlarmTime = new Date();
    nextAlarmTime.setHours(alarmTime.hour, alarmTime.minute, 0, 0);

    // If the alarm time has already passed today, it will ring tomorrow
    if (nextAlarmTime <= now) {
      nextAlarmTime.setDate(nextAlarmTime.getDate() + 1);
    }

    const minutesUntilAlarm = (nextAlarmTime.getTime() - now.getTime()) / (1000 * 60);

    if (minutesUntilAlarm < 15) {
      Alert.alert(
        'Too Soon',
        `Daily alarms must be scheduled at least 15 minutes in the future.\n\nThis alarm is only ${Math.floor(minutesUntilAlarm)} minutes away. One time alarms aka fixed alarms don't have this limitation. You can try a one time alarm on the test page.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsScheduling(true);
    try {
      console.log('🔔 Scheduling alarm for', `${alarmTime.hour}:${alarmTime.minute.toString().padStart(2, '0')}`);

      const stopButton = await createAlarmButton('Stop', '#00FF00', 'stop.circle');
      const snoozeButton = await createAlarmButton('Snooze', '#FFA500', 'moon.circle');

      console.log('📦 Buttons created:', { stopButton, snoozeButton });

      const success = await scheduleRelativeAlarm(
        'Daily Alarm',
        stopButton,
        '#00FF00',
        alarmTime.hour,
        alarmTime.minute,
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        undefined,
        undefined,
        'customAlarm.wav'
      );

      if (success) {
        console.log('✅ Alarm scheduled successfully');
        Alert.alert(
          'Alarm Scheduled!',
          `Daily alarm set for ${alarmTime.hour}:${alarmTime.minute.toString().padStart(2, '0')}`
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

  const adjustHour = (delta: number) => {
    setAlarmTime(prev => ({
      ...prev,
      hour: (prev.hour + delta + 24) % 24,
    }));
  };

  const adjustMinute = (delta: number) => {
    setAlarmTime(prev => ({
      ...prev,
      minute: (prev.minute + delta + 60) % 60,
    }));
  };

  const formatWeekdays = (weekdays: string[]) => {
    if (weekdays.length === 7) return 'Every day';
    if (weekdays.length === 0) return 'Once';
    const short = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const map: { [key: string]: string } = {
      monday: short[0],
      tuesday: short[1],
      wednesday: short[2],
      thursday: short[3],
      friday: short[4],
      saturday: short[5],
      sunday: short[6],
    };
    return weekdays.map(d => map[d]).join(', ');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#000000' }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#00FF00"
        />
      }
    >
      <View style={{ flex: 1, padding: 20 }}>
        {/* Time Picker Section */}
        <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, marginBottom: 20, marginTop: 20 }}>
          <Text style={{ fontSize: 18, color: '#FFFFFF', marginBottom: 20 }}>
            Set Alarm Time
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
            {/* Hour Picker */}
            <View style={{ alignItems: 'center', marginHorizontal: 20 }}>
              <TouchableOpacity
                onPress={() => adjustHour(1)}
                style={{ backgroundColor: '#00FF00', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}
              >
                <Text style={{ color: '#000000', fontSize: 24, fontWeight: 'bold' }}>+</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 48, color: '#FFFFFF', fontWeight: 'bold', width: 80, textAlign: 'center' }}>
                {alarmTime.hour.toString().padStart(2, '0')}
              </Text>

              <TouchableOpacity
                onPress={() => adjustHour(-1)}
                style={{ backgroundColor: '#00FF00', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 10 }}
              >
                <Text style={{ color: '#000000', fontSize: 24, fontWeight: 'bold' }}>-</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 48, color: '#808080', fontWeight: 'bold' }}>:</Text>

            {/* Minute Picker */}
            <View style={{ alignItems: 'center', marginHorizontal: 20 }}>
              <TouchableOpacity
                onPress={() => adjustMinute(5)}
                style={{ backgroundColor: '#00FF00', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}
              >
                <Text style={{ color: '#000000', fontSize: 24, fontWeight: 'bold' }}>+</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 48, color: '#FFFFFF', fontWeight: 'bold', width: 80, textAlign: 'center' }}>
                {alarmTime.minute.toString().padStart(2, '0')}
              </Text>

              <TouchableOpacity
                onPress={() => adjustMinute(-5)}
                style={{ backgroundColor: '#00FF00', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 10 }}
              >
                <Text style={{ color: '#000000', fontSize: 24, fontWeight: 'bold' }}>-</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={{ color: '#808080', textAlign: 'center', fontSize: 14 }}>
            Daily alarm • Every day
          </Text>
        </View>

        {/* Schedule Button */}
        <TouchableOpacity
          onPress={scheduleDailyAlarm}
          disabled={!hasPermission || isScheduling}
          style={{
            backgroundColor: !hasPermission || isScheduling ? '#333333' : '#FFA500',
            padding: 20,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: !hasPermission || isScheduling ? '#666666' : '#000000', fontSize: 18, fontWeight: 'bold' }}>
            {isScheduling ? 'Scheduling...' : 'Schedule Daily Alarm'}
          </Text>
        </TouchableOpacity>

        {/* Scheduled Alarms List */}
        {scheduledAlarms.length > 0 && (
          <View style={{ marginTop: 40 }}>
            <Text style={{ fontSize: 18, color: '#FFFFFF', marginBottom: 16, fontWeight: 'bold' }}>
              Scheduled Alarms ({scheduledAlarms.length})
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
                  borderLeftColor: '#00FF00',
                }}
              >
                <Text style={{ fontSize: 32, color: '#FFFFFF', fontWeight: 'bold' }}>
                  {alarm.hour.toString().padStart(2, '0')}:{alarm.minute.toString().padStart(2, '0')}
                </Text>
                <Text style={{ fontSize: 14, color: '#808080', marginTop: 4 }}>
                  {formatWeekdays(alarm.repeats)}
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
                    {cancellingId === alarm.id ? 'Removing...' : 'Remove Alarm'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Info Section */}
        <View style={{ marginTop: 40, marginBottom: 40, padding: 20, backgroundColor: '#1a1a1a', borderRadius: 12 }}>
          <Text style={{ color: '#00FF00', fontSize: 14, lineHeight: 20 }}>
            ℹ️ Pull down to refresh the alarm list
          </Text>
          <Text style={{ color: '#808080', fontSize: 12, marginTop: 8, lineHeight: 18 }}>
            Daily alarms repeat every day at the set time.{'\n'}
            Stop button (green) dismisses the alarm.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
