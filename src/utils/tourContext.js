import React, { createContext, useContext } from 'react';

const TourContext = createContext({
  showTour: false,
  openTour: () => {},
  closeTour: () => {},
});

export function TourProvider({ value, children }) {
  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  return useContext(TourContext);
}
