import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";

interface GlobalState {
  name: string;
}

const initialState: GlobalState = {
  name: "",
};

const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setGlobalName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
  },
});

export const { setGlobalName } = globalSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectGlobalName = (state: RootState) => state.global.name;

export default globalSlice.reducer;
