import {
    configureStore,
} from "@reduxjs/toolkit";

import gameReducer
    from "./slices/gameSlice";

import wsGameReducer
    from "./slices/wsGameSlice";

export const store = configureStore({
    reducer: {
        game: gameReducer,
        wsGame: wsGameReducer,
    },
});
export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;