import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

const native = Capacitor.isNativePlatform()

export const haptics = {
  light: () => native && Haptics.impact({ style: ImpactStyle.Light }),
  medium: () => native && Haptics.impact({ style: ImpactStyle.Medium }),
  heavy: () => native && Haptics.impact({ style: ImpactStyle.Heavy }),
  success: () => native && Haptics.notification({ type: NotificationType.Success }),
  error: () => native && Haptics.notification({ type: NotificationType.Error }),
}
