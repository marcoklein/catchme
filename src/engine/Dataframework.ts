
/**
 * Dataframework is a tiny library to separate data and logic easily.
 * Data is held in DataNodes. DataNodes can contain other DataNodes in form of childs.
 * DataNode logic is defined by adding Roles. Each role needs a unique name for identification.
 */

/**
 * Defines logic for a DataNode.
 * For identification every role needs a unique name
 * that has to be set in the constructor.
 */
export interface Role {
  readonly roleName: string;
  node: DataNode;
  id: string;

  addedToNode(node: DataNode): void;
  removedFromNode(node: DataNode): void;
  updateRole(delta: number, node: DataNode): void;

	nodeDataUpdated?(key: string, newValue: any, oldValue: any, node: DataNode): void;
}

export abstract class AbstractRole implements Role {
  readonly roleName: string;
  node: DataNode;
  id: string;


  /**
   * Used to access data. data(key) will get data and data(key, value) sets data.
   */
  data<T>(key?: string, value?: Object): {[key: string]: Object} | any | T {
		return this.node.data(key, value);
	}

  addedToNode(node: DataNode) {
	}
  removedFromNode(node: DataNode) {
	}
  updateRole(delta: number, node: DataNode) {
	}
	nodeDataUpdated(key: string, newValue: any, oldValue: any, node: DataNode) {
	}
}

/**
 * Listener gets informed about DataNode events.
 */
export interface DataNodeListener {
  addedRoleToNode?(role: Role, node: DataNode): void;
  dataUpdated?(key: string, newValue: any, oldValue: any, node: DataNode): void;
  //dataDeleted(key: string, node: DataNode): void;
}

/**
 * Holds data and may contain further DataNode childs.
 * Roles can be added to DataNodes.
 */
export class DataNode {
  private _data: {[key: string]: Object};

  private listeners: Array<DataNodeListener> = [];
  private roles: any = {};
  private rolesByName: any = {};
  private roleArray: Array<Role> = [];

  private lastRoleId = 0;

  constructor(data?: {[key: string]: any} ) {
    this._data = data || {};
  }

  /* Data access */

  /**
   * Used to access data. data(key) will get data and data(key, value) sets data.
   */
  data<T>(key?: string, value?: Object): {[key: string]: Object} | any | T {
    if (key === undefined && value === undefined) {
      return this._data;
    } else if (value === undefined) {
      // get data with given key
      return <T> this._data[key];
    }
    let oldValue = this._data[key];
    this._data[key] = value;
    if (value !== oldValue) {
      //console.log('updated value: key=%s, value=%s of entity id %s', key, value, this.data('id'));
			// inform roles
			this.roleArray.forEach(role => {
				if (role.nodeDataUpdated) {
					role.nodeDataUpdated(key, value, oldValue, this);
				}
			});
			// notify listeners
      this.listeners.forEach(listener => {
				if (listener.dataUpdated) {
	        listener.dataUpdated(key, value, oldValue, this);
				}
      });
    }
  }
  /**
   * Delete data with given key.
   * FIXME deletion is not supported because of synchronization issues
   * data may have been updated and then deleted but don't know when
   * use data(key, undefined) instead
   */
  /*delete(key: string) {
    delete this._data[key];
    this.listeners.forEach(listener => {
      listener.dataDeleted(key, this);
    });
  }*/

  /* Listeners */
  addListener(listener: DataNodeListener): void {
    this.listeners.push(listener);
  }

  removeListener(listener: DataNodeListener): void {
    this.listeners.splice(this.listeners.indexOf(listener), 1);
  }

  update(delta: number) {
    this.roleArray.forEach((role: Role) => {
      role.updateRole(delta, this);
    });
  }

  /*private notifyListeners<T extends keyof DataNodeListener>(fnName: T, a: any, b: any) {
    this.listeners.forEach(listener => {
      if (listener[fnName]) {
        listener[fnName].call(a, b);
      }
    });
  }*/

  /* Roles */

  /**
   * Returns Role with given id.
   * @param id Id of Role to return.
   * @return Role with given id or undefined.
   */
  getRoleById(id: string): Role {
    return this.roles[id];
  }
  getRoleByName(name: string): Role {
    let roles = this.rolesByName[name];
    if (!roles || roles.length === 0) {
      return undefined;
    }
    return roles[0];
  }
  getRolesByName(name: string): Array<Role> {
    return this.rolesByName[name];
  }

  // TODO optimization for role by class: store clazz calls and results? -> remove cached when role is removed
  getRoleByClass<T extends Role>(Clazz: Function): T {
    for (let role of this.roleArray) {
      if (role instanceof Clazz) {
        return <T>role;
      }
    }
    /*this.roleArray.forEach(role => {
      if (role instanceof Clazz) {
        return role;
      }
    });*/
    return undefined;
  }

  getRolesByClass(Clazz: Function): Array<Role> {
    // TODO check if clazz is a function and instanceof Role
    let result: Array<Role> = [];
    this.roleArray.forEach(role => {
      if (role instanceof Clazz) {
        result.push(role);
      }
    });
    return result;
  }

  /**
   * Add given role.
   * The role must have a name property.
   * The name property is copied to role.data.name and must not be modified.
   *
   *
   *
   * @param role Role to add.
   */
  addRole(role: Role) {
    let name = role.roleName;
    if (name === undefined || name === null || name.trim() === '') {
      throw new Error('Role has no name.');
    }
    if (role.node !== undefined) {
      throw new Error('Tried to add role ' + name + ', but role is already attached to a node.');
    }

    // generate id for role
    let roleId = role.id || this.generateNewRoleId();
    role.id = roleId;

    // store role instance
    this.roles[roleId] = role;
    this.roleArray.push(role);

    // name array of role exists?
    let nameRoleArray = this.rolesByName[role.roleName];
    if (nameRoleArray !== undefined) {
      nameRoleArray.push(role);
    } else {
      this.rolesByName[role.roleName] = [role];
    }

    // store node in role
    role.node = this;
    // notify role
    role.addedToNode(this);

    // notify listeners
    this.listeners.forEach(listener => {
			if (listener.addedRoleToNode) {
	      listener.addedRoleToNode(role, this);
			}
    });

    return roleId;
  }

  /**
   * Removes given role from DataNode.
   * @param role Role instance to remove.
   */
  removeRole(role: Role) {
    if (role.node === undefined || role.node === null) {
      return;
    }
    // unset role node and id
    role.node = undefined;
    role.id = undefined;

    // remove from node

    throw new Error('Not implemented yet.');
  }

  /**
   * Generates a new unique id for a Role that is added to the DataNode.
   */
  private generateNewRoleId(): string {
    this.lastRoleId++;
    if (this.roles['' + this.lastRoleId] !== undefined) {
      // node with id already existing -> generate new id
      return this.generateNewRoleId();
    }
    return '' + this.lastRoleId;
  }

}
