import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import axios from "axios";
import { Cache } from "cache-manager";

const CAT_API = "https://cataas.com";

@Injectable()
export class CatService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getRandomCatImage(): Promise<{ data: Buffer; contentType: string }> {
    return this.fetchImage("/cat");
  }

  async getRandomCatByTag(
    tag: string,
  ): Promise<{ data: Buffer; contentType: string }> {
    const tags = await this.fetchTags();
    if (!tags || !tags.includes(tag)) {
      throw new NotFoundException(`Tag "${tag}" not found`);
    }
    return this.fetchImage(`/cat/${tag}`);
  }

  async getRandomCatGif(): Promise<{ data: Buffer; contentType: string }> {
    return this.fetchImage("/cat/gif");
  }

  private async fetchImage(
    path: string,
  ): Promise<{ data: Buffer; contentType: string }> {
    const response = await axios.get(`${CAT_API}${path}`, {
      responseType: "arraybuffer",
      headers: { Accept: "*/*" },
    });
    return {
      data: Buffer.from(response.data),
      contentType: String(response.headers["content-type"] ?? "image/jpeg"),
    };
  }

  async fetchTags(): Promise<string[]> {
    const cached = await this.cacheManager.get<string[]>("catTags");
    if (cached) return cached;

    const response = await axios.get<string[]>(`${CAT_API}/api/tags`);
    await this.cacheManager.set("catTags", response.data, 5 * 60 * 1000); // 5 min TTL
    return response.data;
  }
}
