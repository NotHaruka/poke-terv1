import { MapData, NPCPlacement, Transition, EncounterZone } from '../../shared/types.js';

const MAP_LAYOUT = [
  'TTTTTTTTTTPTTTTTTTTT',
  'TGGGGGGGGGPGGGGGGGGT',
  'TGHHHHGGGGPGGHHHHGGT',
  'TGHHHHGGGGPGGHHHHGGT',
  'TGHDHHSGGGPGBHDHHSGT',
  'TGGPGGGGGGPBGGPGGGGT',
  'TGGPPPPPPPPPPPPGGGGT',
  'TGGGGGGGGPBGGGGGGGGT',
  'TGXXXXGGGPBGGXXXXGGT',
  'TGXXXXGGGPBGGXXXXGGT',
  'TGXXXXGGGPBGGXXXXGGT',
  'TGGGGGGGGPBGGGGGGGGT',
  'TGGGGGGGGPBPPPPGGGGT',
  'TGHHHHGGGPBGGGGGGGGT',
  'TGHHHHGGGPBGGWWWWWT',
  'TGHDHHSGGPBGGWWWWWT',
  'TGGPGGGGGPBGGWWWWWT',
  'TGGPPPPPPPBGGWWWWWT',
  'TGGGGGGGGGGGGGGGGGGT',
  'TTTTTTTTTTTTTTTTTTTT',
];

// Character mapping to tile library definition IDs
const CHAR_MAP: Record<string, string> = {
  'G': 'grass_flat',
  'T': 'tree_canopy',
  'H': 'building_facade',
  'D': 'door_entrance',
  'P': 'path_dirt',
  'S': 'sign_post',
  'X': 'tall_grass',
  'W': 'water_open',
  'B': 'bridge_wood',
};

export function getStarterTownMap(): MapData {
  const height = MAP_LAYOUT.length;
  const width = MAP_LAYOUT[0].length;

  const base: string[][] = [];
  const overlay: string[][] = [];

  for (let y = 0; y < height; y++) {
    const baseRow: string[] = [];
    const overlayRow: string[] = [];
    for (let x = 0; x < width; x++) {
      const char = MAP_LAYOUT[y][x];
      const tileId = CHAR_MAP[char] || 'grass_flat';
      baseRow.push(tileId);
      overlayRow.push(''); // No overlay by default
    }
    base.push(baseRow);
    overlay.push(overlayRow);
  }

  const npcs: NPCPlacement[] = [
    {
      id: 'professor_oak',
      name: 'Prof. Oak',
      spriteType: 'professor',
      x: 13,
      y: 5,
      facing: 'down',
      dialogue: [
        'Prof. Oak: Hello there! Welcome to the world of poke-ter!',
        'This starter area is a handcrafted map, while the outside world is fully procedural!',
        'You can walk to the north path at the top of the town to enter the infinite procedural wilderness.',
        'Be careful of wild monsters in the tall grass!',
      ],
    },
    {
      id: 'nurse_joy',
      name: 'Nurse Joy',
      spriteType: 'healer',
      x: 4,
      y: 16,
      facing: 'down',
      dialogue: [
        'Nurse Joy: Welcome to the local Healing Station!',
        'I can restore your team to full health in an instant.',
        'There you go! Your team is fully healed and ready to adventure!',
      ],
    },
    {
      id: 'villager_bob',
      name: 'Town Citizen',
      spriteType: 'villager',
      x: 8,
      y: 10,
      facing: 'right',
      dialogue: [
        'Citizen: I love living in Starter Town. It is so peaceful here!',
        'The pond on the southeast is beautiful, but the grass on Route 1 is full of danger.',
      ],
    },
  ];

  const transitions: Transition[] = [
    {
      x: 10,
      y: 0,
      targetMapId: 'procedural',
      targetX: 128, // coordinate in procedural world
      targetY: 127,
      message: 'Heading north into Route 1 (Procedural World)...',
    },
  ];

  const encounterZones: EncounterZone[] = [
    {
      x: 2,
      y: 8,
      width: 4,
      height: 3,
      encounterType: 'grass',
    },
    {
      x: 14,
      y: 8,
      width: 4,
      height: 3,
      encounterType: 'grass',
    },
  ];

  return {
    id: 'starter_town',
    name: 'Starter Town',
    width,
    height,
    layers: {
      base,
      overlay,
    },
    npcs,
    spawnPoint: { x: 10, y: 11 }, // near the center intersection
    encounterZones,
    transitions,
  };
}
