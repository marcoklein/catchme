import { DataNode } from "./Dataframework";


export interface EntityProducer {
  produceEntity(type: string, data: Object): DataNode;
}

/**
 * Factory to produce Entities for the world. Entities have a certain 'type' and
 * consists out of several Roles that define behavior.
 *
 * Entity types can be registered through registerEntity(type, producer)
 * The produceFunction must return an Entity.
 */
export class EntityFactory {

  // map of registereded entities associated to their type key
  private registeredProducers: any = {};

  /**
   * Produces and returns Entity with given type.
   * An EntityProducer has to be registered using registerEntity() in order to
   * produce an entity type.
   *
   * @param type Type of Entity to produce.
   */
  produceFromType(type: string, data?: Object): DataNode {
    let producer = this.registeredProducers[type];
    if (producer) {
      return producer.produceEntity(type, data);
    }
    throw new Error('Unsupported Entity type of EntityFactory: ' + type);
  }

  /**
   * Register a new EntityProducer that can produce a certain type of Entity.
   *
   * @param type Type of producer.
   * @param producer Producer used to create Entity.
   */
  registerProducer(type: string, producer: EntityProducer) {
    this.registeredProducers[type] = producer;
  }

  /**
   * Unregister producer with given type.
   *
   * @param type Type of EntityProducer to remove.
   */
  unregisterProducer(type: string) {
    delete this.registeredProducers[type];
  }
}
