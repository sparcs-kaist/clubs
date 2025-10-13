import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from "typeorm";

import {
  makeObjectPropsFromDBTimezone,
  makeObjectPropsToDBTimezone,
} from "@sparcs-clubs/api/common/util/util";

/**
 * TypeORM Subscriber for automatic timezone conversion
 * - Converts between DB (UTC+9) and Application (UTC)
 * - Applied globally to all entities
 */
@EventSubscriber()
export class TimezoneSubscriber implements EntitySubscriberInterface {
  /**
   * Called after entity is loaded from the database
   * DB (UTC+9) → Application (UTC)
   */
  afterLoad(entity: unknown): void {
    if (entity && typeof entity === "object") {
      Object.assign(entity, makeObjectPropsFromDBTimezone(entity));
    }
  }

  /**
   * Called before entity is inserted into the database
   * Application (UTC) → DB (UTC+9)
   */
  beforeInsert(event: InsertEvent<unknown>): void {
    if (event.entity && typeof event.entity === "object") {
      Object.assign(event.entity, makeObjectPropsToDBTimezone(event.entity));
    }
  }

  /**
   * Called before entity is updated in the database
   * Application (UTC) → DB (UTC+9)
   */
  beforeUpdate(event: UpdateEvent<unknown>): void {
    if (event.entity && typeof event.entity === "object") {
      Object.assign(event.entity, makeObjectPropsToDBTimezone(event.entity));
    }
  }
}
