import { Schema, type, MapSchema } from '@colyseus/schema';

export class PlayerState extends Schema {
  @type('string') id = '';
  @type('string') name = 'Traveler';
  @type('string') species = 'frog';
  @type('number') x = 0;
  @type('number') z = 0;
  @type('number') heading = 0;
  @type('string') animState = 'idle';
  @type('string') appearanceJson = '{}';
  @type('string') partyId = '';
}

export class NpcState extends Schema {
  @type('string') id = '';
  @type('number') x = 0;
  @type('number') z = 0;
}

export class RoomState extends Schema {
  @type('string') sceneId = 'causeway';
  @type('string') instanceId = '';
  @type('number') worldMinutes = 480;
  @type('string') weather = 'clear';
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: NpcState }) npcs = new MapSchema<NpcState>();
}
