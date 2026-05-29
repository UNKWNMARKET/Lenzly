import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { Purchases } from '@revenuecat/purchases-capacitor'
import { useAuth } from './AuthContext'
import { supabase } from '@/lib/supabase'
import {
  initRevenueCat, hasProEntitlement, purchasePro, restorePurchases, isPro,
} from '@/lib/revenuecat'

type ProContextType = {
  isProMember: boolean
  loading: boolean
  buyPro: () => Promise<boolean>
  restore: () => Promise<boolean>
  refreshPro: () => Promise<void>
}

const ProContext = createContext<ProContextType>({
  isProMember: false,
  loading: true,
  buyPro: async () => false,
  restore: async () => false,
  refreshPro: async () => {},
})

export function ProProvider({ children }: { children: ReactNode }) {
  const { user, profile, refreshProfile } = useAuth()
  const [isProMember, setIsProMember] = useState(false)
  const [loading, setLoading] = useState(true)

  // Persist the Pro flag to Supabase so badges & brand-search ranking work everywhere
  const syncProToDb = useCallback(async (pro: boolean) => {
    if (!user) return
    if (profile?.is_pro === pro) return // no change
    await supabase.from('profiles').update({ is_pro: pro }).eq('id', user.id)
    await refreshProfile()
  }, [user, profile?.is_pro, refreshProfile])

  const refreshPro = useCallback(async () => {
    // Trust the DB flag on web; trust the live entitlement on device
    if (!Capacitor.isNativePlatform()) {
      setIsProMember(profile?.is_pro ?? false)
      setLoading(false)
      return
    }
    const pro = await hasProEntitlement()
    setIsProMember(pro)
    await syncProToDb(pro)
    setLoading(false)
  }, [profile?.is_pro, syncProToDb])

  // Configure RevenueCat when a user logs in, and listen for live changes
  useEffect(() => {
    if (!user) { setIsProMember(false); setLoading(false); return }

    ;(async () => {
      await initRevenueCat(user.id)
      await refreshPro()

      if (Capacitor.isNativePlatform()) {
        // React instantly when Apple confirms / cancels / renews a subscription.
        // The listener is a session-long singleton — RevenueCat dedupes it.
        Purchases.addCustomerInfoUpdateListener(info => {
          const pro = isPro(info)
          setIsProMember(pro)
          void syncProToDb(pro)
        })
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const buyPro = useCallback(async () => {
    const pro = await purchasePro()
    setIsProMember(pro)
    await syncProToDb(pro)
    return pro
  }, [syncProToDb])

  const restore = useCallback(async () => {
    const pro = await restorePurchases()
    setIsProMember(pro)
    await syncProToDb(pro)
    return pro
  }, [syncProToDb])

  return (
    <ProContext.Provider value={{ isProMember, loading, buyPro, restore, refreshPro }}>
      {children}
    </ProContext.Provider>
  )
}

export const usePro = () => useContext(ProContext)
