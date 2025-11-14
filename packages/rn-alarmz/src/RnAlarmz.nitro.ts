import type { HybridObject } from 'react-native-nitro-modules';

export interface RnAlarmz
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  requestAlarmPermission(): Promise<boolean>;
  scheduleFixedAlarm(
    title: string,
    stopBtn: CustomizableAlarmButton,
    tintColor: string,
    secondaryBtn?: CustomizableAlarmButton,
    timestamp?: number,
    countdown?: AlarmCountdown,
    soundName?: string
  ): Promise<boolean>;
  scheduleRelativeAlarm(
    title: string,
    stopBtn: CustomizableAlarmButton,
    tintColor: string,
    hour: number,
    minute: number,
    repeats: AlarmWeekday[],
    secondaryBtn?: CustomizableAlarmButton,
    countdown?: AlarmCountdown,
    soundName?: string
  ): Promise<boolean>;
  getScheduledAlarms(): Promise<ScheduledAlarm[]>;
  cancelScheduledAlarm(id: string): Promise<boolean>;
}

export interface CustomizableAlarmButton {
  text: string;
  textColor: string;
  icon: string;
}

export interface AlarmCountdown {
  preAlert?: number | null;
  postAlert?: number | null;
}

export type AlarmWeekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface ScheduledAlarm {
  id: string;
  hour: number;
  minute: number;
  repeats: AlarmWeekday[];
  isRepeating: boolean;
}
