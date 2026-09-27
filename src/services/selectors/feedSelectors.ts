import type { RootState } from '../store';

export const selectFeed = (state: RootState): RootState['feed'] => state.feed;
