/**
 * People the user can start a conversation with.
 *
 * Stand-in directory until the backend exposes real nearby users. The
 * coordinates cluster around central London so the markers stay readable and
 * do not overlap when the map first fits them all.
 */

export type Person = {
  id: string;
  name: string;
  /** One line under the name in the map popup. */
  headline: string;
  lat: number;
  lng: number;
};

export const PEOPLE: Person[] = [
  {
    id: 'amara',
    name: 'Amara Okafor',
    headline: 'AAC user · relaxed chats, one word at a time',
    lat: 51.5079,
    lng: -0.1281,
  },
  {
    id: 'liam',
    name: 'Liam Chen',
    headline: 'Late-night talker · loves sci-fi',
    lat: 51.5194,
    lng: -0.127,
  },
  {
    id: 'sofia',
    name: 'Sofia Rossi',
    headline: 'Speech-therapy student · patient listener',
    lat: 51.5033,
    lng: -0.1195,
  },
  {
    id: 'noah',
    name: 'Noah Patel',
    headline: 'Cricket fan · new to the app',
    lat: 51.5155,
    lng: -0.0922,
  },
  {
    id: 'mei',
    name: 'Mei Tanaka',
    headline: 'Paints in the park · short sessions',
    lat: 51.4989,
    lng: -0.099,
  },
  {
    id: 'diego',
    name: 'Diego Alvarez',
    headline: 'Music lover · voice on, camera off',
    lat: 51.5129,
    lng: -0.1759,
  },
  {
    id: 'hana',
    name: 'Hana Kim',
    headline: 'BCI volunteer · happy to practise',
    lat: 51.5308,
    lng: -0.1248,
  },
  {
    id: 'tom',
    name: 'Tom Becker',
    headline: 'Runs by the river · chats in the morning',
    lat: 51.4929,
    lng: -0.0635,
  },
];
