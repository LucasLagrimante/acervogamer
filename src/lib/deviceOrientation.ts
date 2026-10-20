export interface DeviceAngles {
  beta: number;
  gamma: number;
}

export interface TiltOffset {
  x: number;
  y: number;
}

const MAX_TILT_DEGREES = 18;

function wrapDegrees(value: number): number {
  return ((value + 180) % 360 + 360) % 360 - 180;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Converte a inclinação relativa ao ponto de ativação em eixos normalizados. */
export function calculateTiltOffset(
  current: DeviceAngles,
  baseline: DeviceAngles,
  screenAngle = 0,
): TiltOffset {
  const deltaX = clamp(wrapDegrees(current.gamma - baseline.gamma), -MAX_TILT_DEGREES, MAX_TILT_DEGREES) / MAX_TILT_DEGREES;
  const deltaY = clamp(wrapDegrees(current.beta - baseline.beta), -MAX_TILT_DEGREES, MAX_TILT_DEGREES) / MAX_TILT_DEGREES;
  const angle = ((Math.round(screenAngle / 90) * 90) % 360 + 360) % 360;

  switch (angle) {
    case 90:
      return { x: deltaY, y: -deltaX };
    case 180:
      return { x: -deltaX, y: -deltaY };
    case 270:
      return { x: -deltaY, y: deltaX };
    default:
      return { x: deltaX, y: deltaY };
  }
}
