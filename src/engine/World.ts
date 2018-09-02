import { EntityFactory } from './EntityFactory'
import { DataNode, DataNodeListener } from './Dataframework'

export interface WorldController {
  initialize(world: World): any;
  update(delta: number): any;
  cleanup(world: World): any;
}

export interface WorldListener {
  entityAdded(entity: DataNode): any;
  entityRemoved(entity: DataNode): any;
}

/**
 * Holds all information about ongoing game.
 * Has to be extended to realize either a server, client or local implementation.
 */
export abstract class World {
  private _entityFactory: EntityFactory;
  private _entities: Array<DataNode> = [];
  private _entitiesById: any = {};
  private _controllers: Array<WorldController> = [];
  private _listeners: Array<WorldListener> = [];

  private lastEntityId: number = 0;

  get entityFactory() {
    return this._entityFactory;
  }

  constructor(entityFactory: EntityFactory) {
    this._entityFactory = entityFactory;
  }

  addListener(listener: WorldListener) {
    this._listeners.push(listener);
  }

  addController(controller: WorldController) {
    this._controllers.push(controller);
    controller.initialize(this);
  }

  getEntityById(id: string): DataNode {
    return this._entitiesById[id];
  }

  /**
   * Adds given Entity to World.
   */
  addEntity(entity: DataNode): string {
    // test if entity has already been added
    let id: string = entity.data('id');
    if (id && this._entitiesById[id]) {
      console.error('Could not add Entity with id %s because it has already been added.', id);
      return;
    }

    // be sure an id is provided
    id = id || this.generateNewEntityId();

    // be sure id is set
    entity.data('id', id);

    this._entitiesById[id] = entity;
    // generate entity id
    this._entities.push(entity);
    // store entity

    // notify listeners
    this._listeners.forEach(listener => {
      listener.entityAdded(entity);
    });

    // TODO add entity listener and prevent modification of id attribute
    /*entity.addListener(<DataNodeListener> {
      dataUpdated(key: string, newValue: any, oldValue: any, node: DataNode) {
        if (key === 'id') {
          throw new Error('Do not modify id attribute of Entity after it has been added to a world!');
        }
      }
    });*/

    this.entityAdded(entity);

    return id;
  }

  update(delta: number) {
    this._entities.forEach(entity => {
      entity.update(delta);
    });
    this._controllers.forEach(controller => {
      controller.update(delta);
    });
  }

  /**
   * Generates a new unique id for a Role that is added to the DataNode.
   */
  private generateNewEntityId(): string {
    this.lastEntityId++;
    if (this._entitiesById['' + this.lastEntityId] !== undefined) {
      // node with id already existing -> generate new id
      return this.generateNewEntityId();
    }
    return '' + this.lastEntityId;
  }

  abstract entityAdded(entity: DataNode): void;

}
