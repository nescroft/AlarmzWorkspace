# 📱 rn-alarmz

> [!WARNING]
> This library is still under development. Use at your own risk.

This library provides a simple and modern interface for working with alarms in your React Native app using Apple’s latest AlarmKit framework.

## ⚙️ Installation

### React Native
> [!NOTE]  
> ``react-native-nitro-modules`` is required because this library leverages [Nitro Modules](https://nitro.margelo.com/).
```sh
npm install rn-alarmz react-native-nitro-modules
```
### Expo
```sh
npx expo add rn-alarmz react-native-nitro-modules
npx expo prebuild
```

## 🚀 Usage


```js
import { createAlarmButton, createAlarmCountdown, requestAlarmPermission, scheduleFixedAlarm, scheduleRelativeAlarm } from 'rn-alarmz';

// Ask for permission to schedule alarms
await requestAlarmPermission();

// Alarm Buttons and Countdown
const secondBtn = await createAlarmButton("repeat", "#000000", "play.circle")
const stopBtn = await createAlarmButton("stop", "#FF0000", "stop.circle")
const countdown = await createAlarmCountdown(3, 15)

// Set up a timer that will trigger in 3 seconds and repeat after 15 seconds
scheduleFixedAlarm("super alarme", stopBtn, "#FFFFFF", secondBtn, undefined, countdown)

// Set up a relative alarm that will trigger at 10:00 on Monday, Thursday, and Friday
scheduleRelativeAlarm("amazing relative alarm", stopBtn, "#FFFFFF", 10, 0, ["monday", "friday", "thursday"])

// Set up an alarm with custom sound
scheduleRelativeAlarm(
  "alarm with sound",
  stopBtn,
  "#FFFFFF",
  7,
  30,
  ["monday", "tuesday", "wednesday", "thursday", "friday"],
  undefined,
  undefined,
  "alarmSound.caf"  // Sound file name WITH extension
)
```

## 🔊 Custom Alarm Sounds

You can use custom sounds for your alarms by passing a sound file name to the `scheduleFixedAlarm` or `scheduleRelativeAlarm` functions.

### Requirements

To ensure your custom alarm sounds work correctly with iOS AlarmKit, they must meet these specifications:

**File Format:**
- Supported formats: `.aiff`, `.wav`, or `.caf`
- **Recommended:** `.caf` (Core Audio Format) - Apple's native format

**Audio Data Format:**
- Linear PCM (recommended)
- MA4 (IMA/ADPCM)
- µLaw
- aLaw

**Audio Specifications:**
- **Duration:** MUST be under 30 seconds (if longer, iOS will silently use the default system sound)
- **Sample Rate:** 44.1 kHz or 48 kHz
- **Bit Depth:** 16-bit recommended
- **Channels:** Mono or Stereo (both work - stereo confirmed working)

**File Location:**
- Sound files **MUST** be placed in your app's main bundle directory
- For React Native: Place files in `ios/YourAppName/YourAppName/` (e.g., `ios/AlarmzDemo/AlarmzDemo/`)
- Then add them to your Xcode project:
  1. Open your `.xcodeproj` or `.xcworkspace` in Xcode
  2. Drag the sound file into the file navigator
  3. **IMPORTANT:** Check "Copy items if needed" and select your app target
  4. Verify the file appears in Build Phases → Copy Bundle Resources
- If the file is not in the app bundle, alarms will schedule but won't trigger

### Converting Audio Files

Use the `afconvert` command-line tool to convert audio files to the correct format:

```bash
# Convert to CAF with Linear PCM, 16-bit, 48kHz, Mono
afconvert -f caff -d LEI16@48000 -c 1 input.wav output.caf

# Convert to CAF with Linear PCM, 16-bit, 44.1kHz, Mono
afconvert -f caff -d LEI16@44100 -c 1 input.mp3 output.caf
```

### Important Notes

- **Always include the file extension** when passing the sound name (e.g., `"alarmSound.caf"`, not `"alarmSound"`)
- If the sound file doesn't meet requirements or can't be found, the alarm will still schedule but may use the default system sound
- Test your alarm sounds to ensure they trigger properly

### ⚠️ Custom Sound Limitation (iOS 26.0.1)

**KNOWN ISSUE:** Custom sounds currently have a critical limitation on iOS 26.0.1:

- ✅ **Custom sounds work with `scheduleFixedAlarm` (one-time/countdown alarms)**
- ❌ **Custom sounds DO NOT work reliably with `scheduleRelativeAlarm` (daily/recurring alarms)**
- When using custom sounds with relative alarms:
  - Alarm only triggers when app is in foreground
  - No notification/full-screen alarm appears in background
  - Alarm silently fails when app is closed
- ✅ **Workaround:** Use `undefined` for the sound parameter on relative alarms (uses default system sound)

**Example:**
```typescript
// ✅ Works - Fixed alarm with custom sound
scheduleFixedAlarm('Timer', stopBtn, '#FFF', snoozeBtn, undefined, countdown, 'alarm.caf');

// ❌ Broken - Relative alarm with custom sound (only works in foreground)
scheduleRelativeAlarm('Daily', stopBtn, '#FFF', 7, 30, days, undefined, undefined, 'alarm.caf');

// ✅ Works - Relative alarm with default sound
scheduleRelativeAlarm('Daily', stopBtn, '#FFF', 7, 30, days, undefined, undefined, undefined);
```

**Status:** This appears to be an iOS 26.0.1 bug or limitation. Testing ongoing to determine root cause.

## 🔊 Alarm Volume Behavior

Understanding how iOS handles alarm volume is critical for setting user expectations:

**Default Behavior (System Design):**
- ✅ AlarmKit alarms **DO break through Silent mode and Focus modes** (unlike notifications)
- ❌ **BUT** volume is tied to your **Ringer Volume**, NOT media volume
- ❌ There's **NO programmatic way** to force max volume - it's a system limitation

**Important:** If your device's ringer volume is set low (Settings → Sounds & Haptics → Ringer and Alerts), your alarms will be quiet. This is the same behavior as Apple's native Clock app - there is no API to override or programmatically control alarm volume in iOS.

**User Guidance:**
- Alarms will play at the current ringer volume level
- Silent mode and Focus modes will NOT silence alarms (they will still play)
- Users should check their ringer volume if alarms are too quiet or too loud
- This is a system-level limitation, not a library issue

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to learn how to get started, report issues, or suggest improvements.

## 📄 License

This project is licensed under the [MIT License](LICENSE.md).
