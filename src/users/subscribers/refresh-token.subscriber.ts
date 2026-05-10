import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from "typeorm";
import { RefreshToken } from "../entities/refresh-token.entity";

@EventSubscriber()
export class RefreshTokenSubscriber implements EntitySubscriberInterface<RefreshToken> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return RefreshToken;
  }

  async beforeInsert(event: InsertEvent<RefreshToken>): Promise<void> {
    if (!event.entity.id) {
      const result = await event.manager.query(
        "SELECT nextval('refresh_tokens_seq') AS id",
      );
      event.entity.id = Number(result[0].id);
    }
  }
}
