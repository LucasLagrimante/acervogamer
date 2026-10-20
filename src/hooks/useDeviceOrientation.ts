import { useCallback, useEffect, useRef, useState } from 'react';
import { calculateTiltOffset, type DeviceAngles, type TiltOffset } from '../lib/deviceOrientation';

export type DeviceOrientationStatus = 'off' | 'requesting' | 'on' | 'denied' | 'unavailable' | 'unsupported';

export interface DeviceMotionValue extends TiltOffset {
  active: boolean;
}

type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

function getScreenAngle(): number {
  const angle = window.screen.orientation?.angle;
  if (typeof angle === 'number') return angle;
  return (window as Window & { orientation?: number }).orientation ?? 0;
}

export function useDeviceOrientation() {
  const [status, setStatus] = useState<DeviceOrientationStatus>(() =>
    typeof window !== 'undefined' && typeof window.DeviceOrientationEvent === 'undefined' ? 'unsupported' : 'off',
  );
  const offsetRef = useRef<DeviceMotionValue>({ x: 0, y: 0, active: false });
  const baseline = useRef<DeviceAngles | null>(null);
  const listening = useRef(false);
  const hasSample = useRef(false);
  const watchdog = useRef<number | null>(null);
  const operation = useRef(0);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    if (event.beta === null || event.gamma === null || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;

    hasSample.current = true;
    if (watchdog.current !== null) {
      window.clearTimeout(watchdog.current);
      watchdog.current = null;
    }

    const current = { beta: event.beta, gamma: event.gamma };
    if (!baseline.current) {
      baseline.current = current;
      offsetRef.current = { x: 0, y: 0, active: true };
      setStatus('on');
      return;
    }

    offsetRef.current = {
      ...calculateTiltOffset(current, baseline.current, getScreenAngle()),
      active: true,
    };
  }, []);

  const stopListening = useCallback(() => {
    if (listening.current) {
      window.removeEventListener('deviceorientation', handleOrientation);
      listening.current = false;
    }
    if (watchdog.current !== null) {
      window.clearTimeout(watchdog.current);
      watchdog.current = null;
    }
    baseline.current = null;
    offsetRef.current = { x: 0, y: 0, active: false };
  }, [handleOrientation]);

  const disable = useCallback(() => {
    operation.current += 1;
    stopListening();
    setStatus(current => current === 'unsupported' ? current : 'off');
  }, [stopListening]);

  const toggle = useCallback(async (): Promise<DeviceOrientationStatus> => {
    if (status === 'on') {
      disable();
      return 'off';
    }
    if (status === 'requesting') return status;
    if (status === 'unsupported') return status;

    const requestId = operation.current + 1;
    operation.current = requestId;
    setStatus('requesting');
    hasSample.current = false;
    baseline.current = null;
    offsetRef.current = { x: 0, y: 0, active: false };

    try {
      const Orientation = window.DeviceOrientationEvent as DeviceOrientationEventWithPermission | undefined;
      if (!Orientation) {
        setStatus('unsupported');
        return 'unsupported';
      }

      if (typeof Orientation.requestPermission === 'function') {
        const permission = await Orientation.requestPermission();
        if (operation.current !== requestId) return 'off';
        if (permission !== 'granted') {
          setStatus('denied');
          return 'denied';
        }
      }

      if (operation.current !== requestId) return 'off';
      window.addEventListener('deviceorientation', handleOrientation);
      listening.current = true;
      watchdog.current = window.setTimeout(() => {
        if (!hasSample.current) {
          stopListening();
          setStatus('unavailable');
        }
      }, 3000);
      return 'requesting';
    } catch {
      if (operation.current === requestId) {
        stopListening();
        setStatus('denied');
        return 'denied';
      }
      return 'off';
    }
  }, [disable, handleOrientation, status, stopListening]);

  useEffect(() => () => {
    operation.current += 1;
    stopListening();
  }, [stopListening]);

  return { status, offsetRef, toggle, disable };
}
