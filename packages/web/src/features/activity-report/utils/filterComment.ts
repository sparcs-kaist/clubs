import { Comment } from "@sparcs-clubs/web/types/comment";

const APPROVAL_COMMENTS = new Set([
  "활동이 승인되었습니다",
  "승인 처리되었습니다",
]);

const filterActivityComments = (comments: Comment[]): Comment[] =>
  comments.filter(comment => !APPROVAL_COMMENTS.has(comment.content));

export { filterActivityComments };
