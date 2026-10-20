import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateTiltOffset } from '../src/lib/deviceOrientation.ts';

test('mantém o centro calibrado sem deslocamento', () => {
  assert.deepEqual(
    calculateTiltOffset({ beta: 90, gamma: 0 }, { beta: 90, gamma: 0 }),
    { x: 0, y: 0 },
  );
});

test('normaliza inclinação e limita o deslocamento', () => {
  assert.deepEqual(
    calculateTiltOffset({ beta: 99, gamma: 30 }, { beta: 90, gamma: 0 }),
    { x: 1, y: 0.5 },
  );
});

test('rotaciona os eixos quando o celular está em paisagem', () => {
  assert.deepEqual(
    calculateTiltOffset({ beta: 99, gamma: 18 }, { beta: 90, gamma: 0 }, 90),
    { x: 0.5, y: -1 },
  );
});

test('trata a passagem pelo limite angular sem um salto de quase 360 graus', () => {
  assert.deepEqual(
    calculateTiltOffset({ beta: -179, gamma: 0 }, { beta: 179, gamma: 0 }),
    { x: 0, y: 2 / 18 },
  );
});
