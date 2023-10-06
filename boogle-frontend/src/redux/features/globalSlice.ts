import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";

interface GlobalState {
  board: string[];
  timeLeft: number;
}

const initialState: GlobalState = {
  board: [],
  timeLeft: 180,
};

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setGlobalBoard: (state, action: PayloadAction<string[]>) => {
      state.board = action.payload;
    },
    setTimeLeft: (state, action: PayloadAction<number>) => {
      state.timeLeft = action.payload;
    },
  },
});

export const { setGlobalBoard, setTimeLeft } = globalSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectGlobalBoard = (state: RootState) => state.global.board;
export const selectGlobalTimeLeft = (state: RootState) => state.global.timeLeft;

export default globalSlice.reducer;
