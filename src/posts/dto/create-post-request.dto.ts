import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CreatePostRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(10000)
  body: string;
}
