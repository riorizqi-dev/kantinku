"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  getStallColor,
  getStallColorBySellerId,
  DEFAULT_STALL_COLOR,
  type StallColor,
} from "@/lib/stall-colors";
import { useApp } from "@/context/AppContext";

interface StallColorContextValue {
  selectedBooth: string | null;
  color: StallColor;
  selectBooth: (booth: string | null) => void;
  selectSeller: (sellerId: string | null) => void;
}

const StallColorContext = createContext<StallColorContextValue>({
  selectedBooth: null,
  color: DEFAULT_STALL_COLOR,
  selectBooth: () => {},
  selectSeller: () => {},
});

export function useStallColor() {
  return useContext(StallColorContext);
}

export function StallColorProvider({ children }: { children: ReactNode }) {
  const { state } = useApp();
  const [selectedBooth, setSelectedBooth] = useState<string | null>(null);

  const selectBooth = useCallback((booth: string | null) => {
    setSelectedBooth(booth);
  }, []);

  const selectSeller = useCallback(
    (sellerId: string | null) => {
      if (!sellerId) {
        setSelectedBooth(null);
        return;
      }
      const color = getStallColorBySellerId(sellerId, state.sellers);
      setSelectedBooth(color.name === "KantinKu" ? null : color.name);
    },
    [state.sellers]
  );

  const color = selectedBooth ? getStallColor(selectedBooth) : DEFAULT_STALL_COLOR;

  return (
    <StallColorContext.Provider
      value={{ selectedBooth, color, selectBooth, selectSeller }}
    >
      {children}
    </StallColorContext.Provider>
  );
}
