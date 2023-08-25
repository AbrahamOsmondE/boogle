import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import MainScreen from "./pages/MainScreen/MainScreen";
import PracticeScreen from "./pages/PracticeScreen/PracticeScreen";
import axios from 'axios';

const baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:8000'
export const boogleAxios = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type' : 'application/json',
    "Access-Control-Allow-Origin": "*",
  }
})

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainScreen />,
  },
  {
    path: "/practice",
    element: <PracticeScreen />,
  },
]);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
