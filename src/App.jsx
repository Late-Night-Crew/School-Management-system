import React from "react";
import { RouterProvider } from "react-router-dom";
import router from "./router"; 
import Dashboard from "./views/Dashboard";

const App = () => {
  return (
    <RouterProvider router={router} />
    
  );
};

export default App;
