import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface RouteMapping {
  from: string;
  to: string;
}

interface RouteState {
  mappings: RouteMapping[];
}

const initialState: RouteState = {
  mappings: [],
};

const routeSlice = createSlice({
  name: "routes",
  initialState,
  reducers: {
    addMapping: (state, action: PayloadAction<RouteMapping>) => {
      if (!Array.isArray(state.mappings)) {
        state.mappings = [];
      }
      state.mappings.push(action.payload);
    },
    updateMapping: (
      state,
      action: PayloadAction<{ from: string; to: string }>
    ) => {
      if (!Array.isArray(state.mappings)) return;
      const idx = state.mappings.findIndex(
        (m) => m.from === action.payload.from
      );
      if (idx === -1) return;
      state.mappings[idx] = action.payload;
    },
  },
});

export const { addMapping, updateMapping } = routeSlice.actions;
export default routeSlice.reducer;
