import * as SocketIO from 'socket.io';
import * as Express from 'express';
import * as Path from 'path';
import { NetworkController, Message } from '../engine/Network';
import { World } from '../engine/World';
import { ServerWorld } from './ServerWorld';
import { ServerGameInterface } from './ServerMain';
//const io = require('socket.io');


export interface ServerMessage extends Message {
  apply(data: any, world: ServerWorld): void;

}

export abstract class WorldMessage implements ServerMessage {
  data: any;
  type: string;

  constructor(data?: any) {
    this.data = data;
  }

  abstract apply(data: any, world: ServerWorld): void;
}

export namespace WorldMessages {
  export const WORLD_MESSAGE_PREFIX: string = 'WM.';
  export class AddEntity extends WorldMessage {
    static TYPE: string = WORLD_MESSAGE_PREFIX + 'AE';
    type = AddEntity.TYPE;

    apply(data: any, world: ServerWorld): void {
      console.log('Adding the entity: %s with data ', data.type, data.data);
      world.addEntity(world.entityFactory.produceFromType(data.type, data.data));
    }

  }
}

export class ServerNetworkController extends NetworkController {
  private server: SocketIO.Server;

  game: ServerGameInterface;

  constructor(port: number, game: ServerGameInterface) {
    super();
    if (game === undefined) {
      throw new Error('ServerNetworkController: game has to be defined.');
    }
    this.game = game;
    this.server = SocketIO({ path: '/api' });


    this.server.on('connection', socket => {
      console.log('New connection with id %s.', socket.id);
      socket.emit('message', { type: 'Handshake', data: { clientId: socket.id, version: 1 }});
      // send simple sprite
      socket.emit('message', { type: 'WM.AE', data: { type: 'sprite', data: { x: 200, y: 200, image: 'test-sprite' }}});

      socket.on('event', data => {
        console.log('Recieved a message!', data);
      });
      socket.on('disconnect', () => {
        console.log('Client disconnected.');
      });
    });

    this.registerWorldMessages();

    this.server.listen(port);
  }

  private registerWorldMessages() {
    this.registerMessage(WorldMessages.AddEntity.TYPE, WorldMessages.AddEntity);
  }


}
