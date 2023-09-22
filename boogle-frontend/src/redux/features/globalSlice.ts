import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";

interface GlobalState {
  board: string[];
}

const initialState: GlobalState = {
  board: [],
};

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setGlobalBoard: (state, action: PayloadAction<string[]>) => {
      state.board = action.payload;
    },
  },
});

export const { setGlobalBoard } = globalSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectGlobalBoard = (state: RootState) => state.global.board;

export default globalSlice.reducer;
