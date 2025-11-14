import AlarmKit
import SwiftUI
import NitroModules
import ActivityKit

class RnAlarmz: HybridRnAlarmzSpec {
    @available(iOS 15.1, *)
    public func requestAlarmPermission() throws -> NitroModules.Promise<Bool> {
        return NitroModules.Promise.async {
            if #available(iOS 26.0, *) {
                let manager = AlarmManager.shared
                let state: AlarmManager.AuthorizationState
                do {
                    state = try await manager.requestAuthorization()
                } catch {
                    print("Error in requestAuthorization: \(error)")
                    throw error
                }
                return state == .authorized
            } else {
                throw NSError(
                    domain: "AlarmKitError",
                    code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "AlarmKit requires iOS 26.0 or later"]
                )
            }
        }
    }
    
    @available(iOS 15.1, *)
    public func scheduleFixedAlarm(title: String, stopBtn: CustomizableAlarmButton, tintColor: String, secondaryBtn: CustomizableAlarmButton?, timestamp: Double?, countdown: AlarmCountdown?, soundName: String?) throws -> NitroModules.Promise<Bool> {
        return NitroModules.Promise.async {
            if #available(iOS 26.0, *) {
                let manager = AlarmManager.shared
                
                let stopButton = AlarmButton(
                    text: LocalizedStringResource(stringLiteral: stopBtn.text),
                    textColor: Color(StringToColor(hex: stopBtn.textColor)),
                    systemImageName: stopBtn.icon
                )
                let alertPresentationAlert: AlarmPresentation.Alert

                if let btn = secondaryBtn {
                    let secondaryButton = AlarmButton(
                        text: LocalizedStringResource(stringLiteral: btn.text),
                        textColor: Color(StringToColor(hex: btn.textColor)),
                        systemImageName: btn.icon
                    )
                    
                    alertPresentationAlert = AlarmPresentation.Alert(
                        title: LocalizedStringResource(stringLiteral: title),
                        stopButton: stopButton,
                        secondaryButton: secondaryButton,
                        secondaryButtonBehavior: .countdown
                    )
                } else {
                    alertPresentationAlert = AlarmPresentation.Alert(
                        title: LocalizedStringResource(stringLiteral: title),
                        stopButton: stopButton
                    )
                }

                let presentation = AlarmPresentation(alert: alertPresentationAlert)

                nonisolated struct EmptyMetadata: AlarmMetadata {}

                let attributes = AlarmAttributes<EmptyMetadata>(
                    presentation: presentation,
                    tintColor: Color(StringToColor(hex: tintColor))
                )

                var schedule: Alarm.Schedule? = nil

                if let timestamp = timestamp {
                    let date = Date(timeIntervalSince1970: timestamp)
                    schedule = Alarm.Schedule.fixed(date)
                }

                // Create configuration based on countdown and sound parameters
                let configuration: AlarmManager.AlarmConfiguration<EmptyMetadata>

                if let countdownParam = countdown,
                   let preAlert = countdownParam.preAlert,
                   let postAlert = countdownParam.postAlert {
                    let countdownDuration = Alarm.CountdownDuration(preAlert: preAlert, postAlert: postAlert)

                    if let soundName = soundName {
                        print("📢 [RnAlarmz] Attempting to load sound: \(soundName)")

                        // Check if file exists in bundle
                        let soundNameWithoutExt = soundName.replacingOccurrences(of: ".caf", with: "").replacingOccurrences(of: ".wav", with: "")
                        if let soundPath = Bundle.main.path(forResource: soundNameWithoutExt, ofType: nil) {
                            print("✅ [RnAlarmz] Sound file found in bundle: \(soundPath)")
                        } else if let soundPathCaf = Bundle.main.path(forResource: soundNameWithoutExt, ofType: "caf") {
                            print("✅ [RnAlarmz] Sound file found as CAF: \(soundPathCaf)")
                        } else if let soundPathWav = Bundle.main.path(forResource: soundNameWithoutExt, ofType: "wav") {
                            print("✅ [RnAlarmz] Sound file found as WAV: \(soundPathWav)")
                        } else {
                            print("❌ [RnAlarmz] Sound file NOT found in bundle!")
                            print("❌ [RnAlarmz] Searched for: \(soundNameWithoutExt)")
                        }

                        // Use the exact soundName as provided (with extension)
                        let alertSound = AlertConfiguration.AlertSound.named(soundName)
                        print("📢 [RnAlarmz] Alert sound created with name: \(soundName)")
                        configuration = AlarmManager.AlarmConfiguration(
                            countdownDuration: countdownDuration,
                            schedule: schedule,
                            attributes: attributes,
                            sound: alertSound
                        )
                    } else {
                        configuration = AlarmManager.AlarmConfiguration(
                            countdownDuration: countdownDuration,
                            schedule: schedule,
                            attributes: attributes
                        )
                    }
                } else {
                    if let soundName = soundName {
                        print("📢 [RnAlarmz] Attempting to load sound: \(soundName)")
                        let alertSound = AlertConfiguration.AlertSound.named(soundName)
                        print("📢 [RnAlarmz] Alert sound created successfully")
                        configuration = AlarmManager.AlarmConfiguration(
                            schedule: schedule,
                            attributes: attributes,
                            sound: alertSound
                        )
                    } else {
                        configuration = AlarmManager.AlarmConfiguration(
                            schedule: schedule,
                            attributes: attributes
                        )
                    }
                }

                let uuid = UUID()
                do {
                    print("🔔 [RnAlarmz] ========== SCHEDULING FIXED ALARM ==========")
                    print("🔔 [RnAlarmz] Timestamp: \(timestamp ?? 0)")
                    print("🔔 [RnAlarmz] Has countdown: \(countdown != nil)")
                    print("🔔 [RnAlarmz] Has secondaryBtn: \(secondaryBtn != nil)")
                    print("🔔 [RnAlarmz] Title: \(title)")
                    print("🔔 [RnAlarmz] TintColor: \(tintColor)")
                    print("🔔 [RnAlarmz] Stop button text: \(stopBtn.text)")
                    print("🔔 [RnAlarmz] Sound name: \(soundName ?? "nil (using default)")")
                    print("🔔 [RnAlarmz] Configuration created, attempting to schedule...")

                    _ = try await manager.schedule(id: uuid, configuration: configuration)

                    print("✅ [RnAlarmz] Alarm scheduled successfully with ID: \(uuid)")
                    return true
                } catch let error as NSError {
                    print("❌ [RnAlarmz] ========== SCHEDULING FAILED ==========")
                    print("❌ [RnAlarmz] Error domain: \(error.domain)")
                    print("❌ [RnAlarmz] Error code: \(error.code)")
                    print("❌ [RnAlarmz] Error description: \(error.localizedDescription)")
                    print("❌ [RnAlarmz] Error userInfo: \(error.userInfo)")
                    throw error
                }
            } else {
                print("error")
                throw NSError(
                    domain: "AlarmKitError",
                    code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "AlarmKit requires iOS 26.0 or later"]
                )
            }
        }
    }

    @available(iOS 15.1, *)
    public func scheduleRelativeAlarm(
        title: String,
        stopBtn: CustomizableAlarmButton,
        tintColor: String,
        hour: Double,
        minute: Double,
        repeats: [AlarmWeekday],
        secondaryBtn: CustomizableAlarmButton?,
        countdown: AlarmCountdown?,
        soundName: String?
    ) throws -> NitroModules.Promise<Bool> {
        NSLog("🔔🔔🔔 [RnAlarmz] scheduleRelativeAlarm CALLED")
        return NitroModules.Promise.async {
            NSLog("🔔🔔🔔 [RnAlarmz] Inside async block")
            if #available(iOS 26.0, *) {
                NSLog("🔔🔔🔔 [RnAlarmz] iOS 26.0+ check passed")
                let manager = AlarmManager.shared

                let stopButton = AlarmButton(
                    text: LocalizedStringResource(stringLiteral: stopBtn.text),
                    textColor: Color(StringToColor(hex: stopBtn.textColor)),
                    systemImageName: stopBtn.icon
                )

                let alertPresentationAlert: AlarmPresentation.Alert

                if let btn = secondaryBtn {
                    let secondaryButton = AlarmButton(
                        text: LocalizedStringResource(stringLiteral: btn.text),
                        textColor: Color(StringToColor(hex: btn.textColor)),
                        systemImageName: btn.icon
                    )

                    alertPresentationAlert = AlarmPresentation.Alert(
                        title: LocalizedStringResource(stringLiteral: title),
                        stopButton: stopButton,
                        secondaryButton: secondaryButton,
                        secondaryButtonBehavior: .countdown
                    )
                } else {
                    alertPresentationAlert = AlarmPresentation.Alert(
                        title: LocalizedStringResource(stringLiteral: title),
                        stopButton: stopButton
                    )
                }

                let presentation = AlarmPresentation(alert: alertPresentationAlert)

                nonisolated struct EmptyMetadata: AlarmMetadata {}

                let attributes = AlarmAttributes<EmptyMetadata>(
                    presentation: presentation,
                    tintColor: Color(StringToColor(hex: tintColor))
                )

                let time = Alarm.Schedule.Relative.Time(hour: Int(hour), minute: Int(minute))

                let localeWeekdays: [Locale.Weekday] = repeats.map { alarmWeekday in
                  switch alarmWeekday {
                  case .monday: return .monday
                  case .tuesday: return .tuesday
                  case .wednesday: return .wednesday
                  case .thursday: return .thursday
                  case .friday: return .friday
                  case .saturday: return .saturday
                  case .sunday: return .sunday
                  }
                }
                // Use Apple's pattern: .relative(.init(time:repeats:))
                let schedule = Alarm.Schedule.relative(.init(
                    time: time,
                    repeats: localeWeekdays.isEmpty ? .never : .weekly(localeWeekdays)
                ))

                // Create configuration based on countdown and sound parameters
                let configuration: AlarmManager.AlarmConfiguration<EmptyMetadata>

                if let countdownParam = countdown,
                   let preAlert = countdownParam.preAlert,
                   let postAlert = countdownParam.postAlert {
                    let countdownDuration = Alarm.CountdownDuration(preAlert: preAlert, postAlert: postAlert)

                    if let soundName = soundName {
                        print("📢 [RnAlarmz] Attempting to load sound: \(soundName)")

                        // Check if file exists in bundle
                        let soundNameWithoutExt = soundName.replacingOccurrences(of: ".caf", with: "").replacingOccurrences(of: ".wav", with: "")
                        if let soundPath = Bundle.main.path(forResource: soundNameWithoutExt, ofType: nil) {
                            print("✅ [RnAlarmz] Sound file found in bundle: \(soundPath)")
                        } else if let soundPathCaf = Bundle.main.path(forResource: soundNameWithoutExt, ofType: "caf") {
                            print("✅ [RnAlarmz] Sound file found as CAF: \(soundPathCaf)")
                        } else if let soundPathWav = Bundle.main.path(forResource: soundNameWithoutExt, ofType: "wav") {
                            print("✅ [RnAlarmz] Sound file found as WAV: \(soundPathWav)")
                        } else {
                            print("❌ [RnAlarmz] Sound file NOT found in bundle!")
                            print("❌ [RnAlarmz] Searched for: \(soundNameWithoutExt)")
                        }

                        // Use the exact soundName as provided (with extension)
                        let alertSound = AlertConfiguration.AlertSound.named(soundName)
                        print("📢 [RnAlarmz] Alert sound created with name: \(soundName)")
                        configuration = AlarmManager.AlarmConfiguration(
                            countdownDuration: countdownDuration,
                            schedule: schedule,
                            attributes: attributes,
                            sound: alertSound
                        )
                    } else {
                        configuration = AlarmManager.AlarmConfiguration(
                            countdownDuration: countdownDuration,
                            schedule: schedule,
                            attributes: attributes
                        )
                    }
                } else {
                    if let soundName = soundName {
                        print("📢 [RnAlarmz] Attempting to load sound: \(soundName)")
                        let alertSound = AlertConfiguration.AlertSound.named(soundName)
                        print("📢 [RnAlarmz] Alert sound created successfully")
                        configuration = AlarmManager.AlarmConfiguration(
                            schedule: schedule,
                            attributes: attributes,
                            sound: alertSound
                        )
                    } else {
                        configuration = AlarmManager.AlarmConfiguration(
                            schedule: schedule,
                            attributes: attributes
                        )
                    }
                }

                let uuid = UUID()
                do {
                    print("🔔 [RnAlarmz] ========== SCHEDULING ALARM ==========")
                    print("🔔 [RnAlarmz] Time: \(hour):\(minute)")
                    print("🔔 [RnAlarmz] Days count: \(repeats.count)")
                    print("🔔 [RnAlarmz] Days: \(repeats)")
                    print("🔔 [RnAlarmz] Locale weekdays: \(localeWeekdays)")
                    print("🔔 [RnAlarmz] Has countdown: \(countdown != nil)")
                    print("🔔 [RnAlarmz] Has secondaryBtn: \(secondaryBtn != nil)")
                    print("🔔 [RnAlarmz] Title: \(title)")
                    print("🔔 [RnAlarmz] TintColor: \(tintColor)")
                    print("🔔 [RnAlarmz] Stop button text: \(stopBtn.text)")
                    print("🔔 [RnAlarmz] Sound name: \(soundName ?? "nil (using default)")")
                    print("🔔 [RnAlarmz] Configuration created, attempting to schedule...")

                    _ = try await manager.schedule(id: uuid, configuration: configuration)

                    print("✅ [RnAlarmz] Alarm scheduled successfully with ID: \(uuid)")
                    return true
                } catch let error as NSError {
                    print("❌ [RnAlarmz] ========== SCHEDULING FAILED ==========")
                    print("❌ [RnAlarmz] Error domain: \(error.domain)")
                    print("❌ [RnAlarmz] Error code: \(error.code)")
                    print("❌ [RnAlarmz] Error description: \(error.localizedDescription)")
                    print("❌ [RnAlarmz] Error userInfo: \(error.userInfo)")
                    print("❌ [RnAlarmz] Full error: \(error)")

                    // Create a more detailed error to throw back
                    let detailedError = NSError(
                        domain: error.domain,
                        code: error.code,
                        userInfo: [
                            NSLocalizedDescriptionKey: "AlarmKit Error: \(error.domain) Code: \(error.code) - \(error.localizedDescription)",
                            "originalError": error.userInfo
                        ]
                    )
                    throw detailedError
                } catch {
                    print("❌ [RnAlarmz] Unknown error type: \(error)")
                    throw error
                }
            } else {
                throw NSError(
                    domain: "AlarmKitError",
                    code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "AlarmKit requires iOS 26.0 or later"]
                )
            }
        }
    }

    @available(iOS 15.1, *)
    public func getScheduledAlarms() throws -> NitroModules.Promise<[ScheduledAlarm]> {
        return NitroModules.Promise.async {
            if #available(iOS 26.0, *) {
                let manager = AlarmManager.shared

                do {
                    let alarms = try manager.alarms
                    NSLog("🔔 [RnAlarmz] Found \(alarms.count) scheduled alarms")

                    let scheduledAlarms: [ScheduledAlarm] = alarms.compactMap { alarm -> ScheduledAlarm? in
                        guard let schedule = alarm.schedule else {
                            NSLog("⚠️ [RnAlarmz] Alarm has no schedule")
                            return nil
                        }

                        switch schedule {
                        case .relative(let relative):
                            let weekdays: [AlarmWeekday]
                            switch relative.repeats {
                            case .weekly(let localeWeekdays):
                                weekdays = localeWeekdays.map { weekday in
                                    switch weekday {
                                    case .monday: return AlarmWeekday.monday
                                    case .tuesday: return AlarmWeekday.tuesday
                                    case .wednesday: return AlarmWeekday.wednesday
                                    case .thursday: return AlarmWeekday.thursday
                                    case .friday: return AlarmWeekday.friday
                                    case .saturday: return AlarmWeekday.saturday
                                    case .sunday: return AlarmWeekday.sunday
                                    @unknown default:
                                        NSLog("⚠️ [RnAlarmz] Unknown Locale.Weekday value \(weekday)")
                                        return AlarmWeekday.monday
                                    }
                                }
                            case .never:
                                weekdays = []
                            @unknown default:
                                NSLog("⚠️ [RnAlarmz] Unknown relative repeats option")
                                weekdays = []
                            }

                            return ScheduledAlarm(
                                id: alarm.id.uuidString,
                                hour: Double(relative.time.hour),
                                minute: Double(relative.time.minute),
                                repeats: weekdays,
                                isRepeating: !weekdays.isEmpty
                            )
                        case .fixed(let date):
                            let components = Calendar.current.dateComponents([.hour, .minute], from: date)
                            return ScheduledAlarm(
                                id: alarm.id.uuidString,
                                hour: Double(components.hour ?? 0),
                                minute: Double(components.minute ?? 0),
                                repeats: [],
                                isRepeating: false
                            )
                        @unknown default:
                            NSLog("⚠️ [RnAlarmz] Unknown schedule type")
                            return nil
                        }
                    }

                    NSLog("✅ [RnAlarmz] Returning \(scheduledAlarms.count) parsed alarms")
                    return scheduledAlarms
                } catch {
                    NSLog("❌ [RnAlarmz] Failed to fetch alarms: \(error)")
                    throw error
                }
            } else {
                throw NSError(
                    domain: "AlarmKitError",
                    code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "AlarmKit requires iOS 26.0 or later"]
                )
            }
        }
    }

    @available(iOS 15.1, *)
    public func cancelScheduledAlarm(id: String) throws -> NitroModules.Promise<Bool> {
        return NitroModules.Promise.async {
            guard let uuid = UUID(uuidString: id) else {
                NSLog("❌ [RnAlarmz] Invalid alarm id for cancellation: \(id)")
                return false
            }

            if #available(iOS 26.0, *) {
                let manager = AlarmManager.shared
                do {
                    try manager.cancel(id: uuid)
                    NSLog("✅ [RnAlarmz] Cancelled alarm with ID: \(id)")
                    return true
                } catch {
                    NSLog("❌ [RnAlarmz] Failed to cancel alarm \(id): \(error)")
                    throw error
                }
            } else {
                throw NSError(
                    domain: "AlarmKitError",
                    code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "AlarmKit requires iOS 26.0 or later"]
                )
            }
        }
    }
}

func StringToColor (hex:String) -> UIColor {
    var cString:String = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()

    if (cString.hasPrefix("#")) {
        cString.remove(at: cString.startIndex)
    }

    if ((cString.count) != 6) {
        return UIColor.gray
    }

    var rgbValue:UInt64 = 0
    Scanner(string: cString).scanHexInt64(&rgbValue)

    return UIColor(
        red: CGFloat((rgbValue & 0xFF0000) >> 16) / 255.0,
        green: CGFloat((rgbValue & 0x00FF00) >> 8) / 255.0,
        blue: CGFloat(rgbValue & 0x0000FF) / 255.0,
        alpha: CGFloat(1.0)
    )
}
