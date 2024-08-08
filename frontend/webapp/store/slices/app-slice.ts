import { K8sActualSource } from '@/types';
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface IAppState {
  sources: {
    [key: string]: K8sActualSource[];
  };
  namespaceFutureSelectAppsList: { [key: string]: boolean };
}

const initialState: IAppState = {
  sources: {},
  namespaceFutureSelectAppsList: {},
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setSources: (
      state,
      action: PayloadAction<{ [key: string]: K8sActualSource[] }>
    ) => {
      state.sources = action.payload;
    },
    setNamespaceFutureSelectAppsList: (
      state,
      action: PayloadAction<{ [key: string]: boolean }>
    ) => {
      state.namespaceFutureSelectAppsList = action.payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setSources, setNamespaceFutureSelectAppsList } =
  appSlice.actions;

export const appReducer = appSlice.reducer;
