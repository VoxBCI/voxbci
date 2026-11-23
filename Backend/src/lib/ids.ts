import { randomBytes } from 'node:crypto';

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const TIME_LEN = 10;
const RANDOM_LEN = 16;

/**
 * ULID: 48-bit millisecond timestamp + 80 bits of randomness, Crockford base32.
 *
 * Sortable by creation time and collision-free across devices, which matters
 * once headset sessions start minting ids from more than one place.
 */
export function newId(): string {
  let time = Date.now();
  let timePart = '';

  for (let index = TIME_LEN - 1; index >= 0; index -= 1) {
    timePart = CROCKFORD[time % 32] + timePart;
    time = Math.floor(time / 32);
  }

  const bytes = randomBytes(RANDOM_LEN);
  let randomPart = '';

  for (let index = 0; index < RANDOM_LEN; index += 1) {
    randomPart += CROCKFORD[bytes[index]! % 32];
  }

  return timePart + randomPart;
}
