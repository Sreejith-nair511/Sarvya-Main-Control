'use client';
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSarvyaStore } from '@/store/useSarvyaStore';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { useMQTT } from '@/hooks/useMQTT';

function AppWithRealtime() {
  const { userId, setMqttConnected } = useSarvyaStore();

  // Supabase realtime — live DB updates
  useSupabaseRealtime();

  // MQTT — ESP32 rover data
  const { status: mqttStatus } = useMQTT(userId);

  useEffect(() => {
    setMqttConnected(mqttStatus.connected);
  }, [mqttStatus.connected]);

  return <DashboardShell />;
}

export default function Home() {
  const { user, isLoaded } = useUser();
  const { setUserId, userId } = useSarvyaStore();

  useEffect(() => {
    if (isLoaded && user) {
      setUserId(
        user.id,
        user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'Learner'
      );
    }
  }, [isLoaded, user]);

  if (!isLoaded) return <LoadingSpinner className="h-screen" />;

  return <AppWithRealtime />;
}
