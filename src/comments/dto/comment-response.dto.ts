export class CommentResponseDto {
  id: number;
  content: string;
  ownerEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}
