import { Comment } from "@sparcs-clubs/web/types/comment";

const filterActivityComments = (comments: Comment[]): Comment[] =>
  comments.filter(comment => comment.content !== "활동이 승인되었습니다");

export { filterActivityComments };
