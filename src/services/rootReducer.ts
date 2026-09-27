import { combineReducers } from '@reduxjs/toolkit';

import { burgerConstructorReducer } from './slices/burgerConstructorSlice';
import { feedReducer } from './slices/feedSlice';
import { ingredientsReducer } from './slices/ingredientsSlice';
import { orderReducer } from './slices/orderSlice';
import { userOrdersReducer } from './slices/userOrdersSlice';
import { userReducer } from './slices/userSlice';

export const rootReducer = combineReducers({
  ingredients: ingredientsReducer,
  burgerConstructor: burgerConstructorReducer,
  feed: feedReducer,
  order: orderReducer,
  user: userReducer,
  userOrders: userOrdersReducer,
});
