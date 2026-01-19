import React from "react";
import { PrimeReactProvider } from "primereact/api";

const CustomPrimeReactProvider = ({ children }) => {
  return (
    <PrimeReactProvider
      value={{
        ripple: true,
        inputStyle: "filled",
        theme: {
          preset: "lara-light-blue",
          options: {
            darkMode: false,
            compact: false,
          },
        },
      }}
    >
      {children}
    </PrimeReactProvider>
  );
};

export default CustomPrimeReactProvider;
