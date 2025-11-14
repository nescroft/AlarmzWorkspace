import { NitroModules } from 'react-native-nitro-modules';
import type {
  AlarmCountdown,
  RnAlarmz,
  AlarmWeekday,
  CustomizableAlarmButton,
  ScheduledAlarm,
} from './RnAlarmz.nitro';

const RnAlarmzHybridObject =
  NitroModules.createHybridObject<RnAlarmz>('RnAlarmz');

// Re-export types
export type {
  ScheduledAlarm,
  AlarmWeekday,
  CustomizableAlarmButton,
  AlarmCountdown,
};

export async function requestAlarmPermission(): Promise<boolean> {
  return RnAlarmzHybridObject.requestAlarmPermission();
}

export async function scheduleFixedAlarm(
  title: string,
  stopBtn: CustomizableAlarmButton,
  tintColor: string,
  secondaryBtn?: CustomizableAlarmButton,
  timestamp?: number,
  countdown?: AlarmCountdown,
  soundName?: string
): Promise<boolean> {
  if (!timestamp && !countdown)
    throw new Error(
      'You need to specify when the alarm will trigger, use countdown for a timer and timestamp for an alarm.'
    );
  return RnAlarmzHybridObject.scheduleFixedAlarm(
    title,
    stopBtn,
    tintColor,
    secondaryBtn,
    timestamp,
    countdown,
    soundName
  );
}

export async function scheduleRelativeAlarm(
  title: string,
  stopBtn: CustomizableAlarmButton,
  tintColor: string,
  hour: number,
  minute: number,
  repeats: AlarmWeekday[],
  secondaryBtn?: CustomizableAlarmButton,
  countdown?: AlarmCountdown,
  soundName?: string
): Promise<boolean> {
  return RnAlarmzHybridObject.scheduleRelativeAlarm(
    title,
    stopBtn,
    tintColor,
    hour,
    minute,
    repeats,
    secondaryBtn,
    countdown,
    soundName
  );
}

export async function createAlarmButton(
  text: string,
  textColor: string,
  icon: string
): Promise<CustomizableAlarmButton> {
  return {
    text,
    textColor,
    icon,
  };
}

export async function createAlarmCountdown(
  preAlert: number | null,
  postAlert: number | null
): Promise<AlarmCountdown> {
  return {
    preAlert,
    postAlert,
  };
}

export async function getScheduledAlarms(): Promise<ScheduledAlarm[]> {
  return RnAlarmzHybridObject.getScheduledAlarms();
}

export async function cancelScheduledAlarm(id: string): Promise<boolean> {
  return RnAlarmzHybridObject.cancelScheduledAlarm(id);
}
