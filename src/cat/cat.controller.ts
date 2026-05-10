import { Controller, Get, Param, Res } from "@nestjs/common";
import { Response } from "express";
import { CatService } from "./cat.service";

@Controller("cat")
export class CatController {
  constructor(private readonly catService: CatService) {}

  @Get("random-cat")
  async getRandomCat(@Res() res: Response) {
    const { data, contentType } = await this.catService.getRandomCatImage();
    res.set("Content-Type", contentType).send(data);
  }

  @Get("random-cat-by-tag/:tag")
  async getRandomCatByTag(@Param("tag") tag: string, @Res() res: Response) {
    const { data, contentType } = await this.catService.getRandomCatByTag(tag);
    res.set("Content-Type", contentType).send(data);
  }

  @Get("random-cat-gif")
  async getRandomCatGif(@Res() res: Response) {
    const { data, contentType } = await this.catService.getRandomCatGif();
    res.set("Content-Type", contentType).send(data);
  }
}
