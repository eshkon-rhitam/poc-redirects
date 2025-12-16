import { createSlice, PayloadAction } from "@reduxjs/toolkit";
export type RedirectType = "Permanent" | "Temporary";
interface RouteMapping {
  from: string;
  to: string;
  type: RedirectType;
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
    updateMapping: (state, action: PayloadAction<RouteMapping>) => {
      if (!Array.isArray(state.mappings)) return;
      const idx = state.mappings.findIndex(
        (m) => m.from === action.payload.from
      );
      if (idx === -1) return;
      state.mappings[idx] = action.payload;
    },
    upsertMany: (state, action: PayloadAction<RouteMapping[]>) => {
      if (!Array.isArray(state.mappings)) state.mappings = [];
      action.payload.forEach((item) => {
        const idx = state.mappings.findIndex((m) => m.from === item.from);
        if (idx === -1) state.mappings.push(item);
        else state.mappings[idx] = item;
      });
    },
    deleteMapping: (state, action: PayloadAction<{ from: string }>) => {
      if (!Array.isArray(state.mappings)) return;

      state.mappings = state.mappings.filter(
        (m) => !(m.from === action.payload.from)
      );
    },
  },
});

export const { addMapping, updateMapping, upsertMany, deleteMapping } =
  routeSlice.actions;
export default routeSlice.reducer;
