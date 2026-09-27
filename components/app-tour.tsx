"use client";

import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useCallback, useEffect, useRef } from "react";

export const TOUR_KEY = "printstacker-tour";

const TOUR_STEPS = [
  {
    element: "[data-tour='upload']",
    popover: {
      title: "Upload your STL",
      description:
        "Upload the STL you want to stack. Drop it here, or click to browse.",
      side: "right" as const,
      align: "start" as const,
    },
  },
  {
    element: "[data-tour='process']",
    popover: {
      title: "Print settings",
      description:
        "Match your printer, then choose the slicer the file should open in.",
      side: "right" as const,
      align: "start" as const,
    },
  },
  {
    element: "[data-tour='stack']",
    popover: {
      title: "Stack options",
      description:
        "Set how many copies to stack and how many empty layers sit between them. The gap stays on whole layers.",
      side: "right" as const,
      align: "start" as const,
    },
  },
  {
    element: "[data-tour='preview']",
    popover: {
      title: "Preview",
      description:
        "The preview shows the stacked copies. Orbit it to check spacing before you export.",
      side: "left" as const,
      align: "start" as const,
    },
  },
  {
    element: "[data-tour='download']",
    popover: {
      title: "Download",
      description:
        "Download a 3MF with the copies already stacked. The bar under the preview shows the total height.",
      side: "top" as const,
      align: "start" as const,
    },
  },
];

function markTourComplete() {
  try {
    localStorage.setItem(TOUR_KEY, "done");
  } catch {
    // Ignore storage failures.
  }
}

function isTourComplete(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) === "done";
  } catch {
    return false;
  }
}

function createTourDriver(): Driver {
  const driverObj = driver({
    showProgress: true,
    progressText: "{{current}} of {{total}}",
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Done",
    popoverClass: "printstacker-tour-popover",
    steps: TOUR_STEPS,
    onDestroyStarted: () => {
      markTourComplete();
      driverObj.destroy();
    },
  });

  return driverObj;
}

export function startAppTour() {
  const driverObj = createTourDriver();
  driverObj.drive();
}

type AppTourProps = {
  replaySignal: number;
};

export function AppTour({ replaySignal }: AppTourProps) {
  const startedRef = useRef(false);

  const maybeStartFirstVisit = useCallback(() => {
    if (startedRef.current || isTourComplete()) {
      return;
    }
    startedRef.current = true;
    startAppTour();
  }, []);

  useEffect(() => {
    maybeStartFirstVisit();
  }, [maybeStartFirstVisit]);

  useEffect(() => {
    if (replaySignal === 0) {
      return;
    }
    startAppTour();
  }, [replaySignal]);

  return null;
}
