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
  },
});

export const { addMapping } = routeSlice.actions;
export default routeSlice.reducer;
