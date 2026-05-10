import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from "typeorm";
import { User } from "../entities/user.entity";

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  async beforeInsert(event: InsertEvent<User>): Promise<void> {
    if (!event.entity.id) {
      const result = await event.manager.query(
        "SELECT nextval('users_seq') AS id",
      );
      event.entity.id = Number(result[0].id);
    }
  }
}
