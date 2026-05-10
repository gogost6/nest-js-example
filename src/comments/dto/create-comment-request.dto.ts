import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCommentRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  content: string;
}
