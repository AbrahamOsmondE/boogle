// src/redux/store.ts
import { configureStore } from '@reduxjs/toolkit';
import globalReducer from '../redux/features/globalSlice'; // Adjust the import path

export const store = configureStore({
  reducer: {
    global: globalReducer, // Using the globalSlice reducer
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
