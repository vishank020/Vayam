import { PostService } from './post.service';

export interface VotablePost {
  id: string;
  userVote?: number | undefined;
  upvoteCount?: number | undefined;
  downvoteCount?: number | undefined;
}

export interface SavablePost {
  id: string;
  isSaved?: boolean | undefined;
}

export function optimisticToggleVote(
  event: Event,
  post: VotablePost,
  direction: number,
  postService: PostService
): void {
  event.stopPropagation();
  event.preventDefault();

  const newVote = post.userVote === direction ? 0 : direction;
  const oldVote = post.userVote || 0;

  post.userVote = newVote;

  if (newVote === 1) {
    post.upvoteCount = (post.upvoteCount || 0) + 1;
    if (oldVote === -1) post.downvoteCount = Math.max(0, (post.downvoteCount || 0) - 1);
  } else if (newVote === -1) {
    post.downvoteCount = (post.downvoteCount || 0) + 1;
    if (oldVote === 1) post.upvoteCount = Math.max(0, (post.upvoteCount || 0) - 1);
  } else if (newVote === 0) {
    if (oldVote === 1) post.upvoteCount = Math.max(0, (post.upvoteCount || 0) - 1);
    if (oldVote === -1) post.downvoteCount = Math.max(0, (post.downvoteCount || 0) - 1);
  }

  postService.votePost(post.id, newVote).subscribe({
    error: () => {
      post.userVote = oldVote;
      if (newVote === 1) {
        post.upvoteCount = Math.max(0, (post.upvoteCount || 0) - 1);
        if (oldVote === -1) post.downvoteCount = (post.downvoteCount || 0) + 1;
      } else if (newVote === -1) {
        post.downvoteCount = Math.max(0, (post.downvoteCount || 0) - 1);
        if (oldVote === 1) post.upvoteCount = (post.upvoteCount || 0) + 1;
      } else if (newVote === 0) {
        if (oldVote === 1) post.upvoteCount = (post.upvoteCount || 0) + 1;
        if (oldVote === -1) post.downvoteCount = (post.downvoteCount || 0) + 1;
      }
    }
  });
}

export function optimisticToggleSave(
  event: Event,
  post: SavablePost,
  postService: PostService
): void {
  event.stopPropagation();
  event.preventDefault();

  const currentlySaved = post.isSaved || false;
  post.isSaved = !currentlySaved;

  const request = currentlySaved
    ? postService.unsavePost(post.id)
    : postService.savePost(post.id);

  request.subscribe({
    error: () => post.isSaved = currentlySaved
  });
}
