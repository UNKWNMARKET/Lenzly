import { Capacitor } from '@capacitor/core'
import { Purchases, LOG_LEVEL, PurchasesOffering, CustomerInfo } from '@revenuecat/purchases-capacitor'

// RevenueCat public SDK key (safe to ship in the app — it is NOT a secret).
// Set VITE_REVENUECAT_IOS_KEY in your Codemagic / .env. Get it from
// RevenueCat dashboard → Project → API Keys → Public app-specific (Apple).
const RC_IOS_KEY = import.meta.env.VITE_REVENUECAT_IOS_KEY as string | undefined

// The "entitlement" id you configure in RevenueCat that represents Pro access.
export const PRO_ENTITLEMENT = 'pro'

let configured = false

/** Initialise RevenueCat once, tying purchases to the logged-in Supabase user. */
export async function initRevenueCat(appUserId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return // IAP only works on a real device
  if (!RC_IOS_KEY) return
  if (configured) {
    // Already configured — just make sure the user id is in sync
    try { await Purchases.logIn({ appUserID: appUserId }) } catch { /* noop */ }
    return
  }
  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR })
    await Purchases.configure({ apiKey: RC_IOS_KEY, appUserID: appUserId })
    configured = true
  } catch {
    /* configuration failed — Pro will simply stay locked */
  }
}

/** Returns true if the current customer has the active Pro entitlement. */
export async function hasProEntitlement(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !RC_IOS_KEY) return false
  try {
    const { customerInfo } = await Purchases.getCustomerInfo()
    return isPro(customerInfo)
  } catch {
    return false
  }
}

export function isPro(info: CustomerInfo): boolean {
  return info.entitlements.active[PRO_ENTITLEMENT] !== undefined
}

/** Fetch the current offering (the $5/month Pro package configured in RevenueCat). */
export async function getProOffering(): Promise<PurchasesOffering | null> {
  if (!Capacitor.isNativePlatform() || !RC_IOS_KEY) return null
  try {
    const offerings = await Purchases.getOfferings()
    return offerings.current ?? null
  } catch {
    return null
  }
}

/**
 * Trigger the native Apple purchase sheet for the Pro subscription.
 * Returns true if the user is now Pro.
 */
export async function purchasePro(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !RC_IOS_KEY) {
    throw new Error('In-app purchases are only available in the LENZLY iOS app.')
  }
  const offering = await getProOffering()
  const pkg = offering?.availablePackages?.[0]
  if (!pkg) throw new Error('Pro subscription is not available right now.')

  const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
  return isPro(customerInfo)
}

/** Restore previously-purchased subscriptions (App Store requirement). */
export async function restorePurchases(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !RC_IOS_KEY) return false
  try {
    const { customerInfo } = await Purchases.restorePurchases()
    return isPro(customerInfo)
  } catch {
    return false
  }
}
