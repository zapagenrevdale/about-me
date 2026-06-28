"use client";

import { ArrowLeftRight, ArrowUpDown, Eye, EyeOff } from "lucide-react";
import {
  type Dispatch,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

import {
  END_DATE_LABEL,
  getLifespanWeekKey,
  LIFESPAN_DAY_KEYS,
  LIFESPAN_MONTH_YEARS,
  LIFESPAN_MONTHS,
  LIFESPAN_WEEK_YEARS,
  LIFESPAN_WEEKS,
  LIFESPAN_YEARS,
  START_DATE_KEY,
  START_DATE_LABEL,
  START_MONTH_KEY,
  START_WEEK_KEY,
} from "./lifespan-data";

const DAY_YEAR_ROW_STYLE = {
  containIntrinsicSize: "120px",
  contentVisibility: "auto",
} as const;

const MONTH_YEAR_ROW_STYLE = {
  containIntrinsicSize: "32px",
  contentVisibility: "auto",
} as const;

const WEEK_YEAR_ROW_STYLE = {
  containIntrinsicSize: "42px",
  contentVisibility: "auto",
} as const;

const MODES = ["day", "week", "month"] as const;
const LAYOUTS = ["rows", "shrink"] as const;
const TOOLTIP_MAX_WIDTH = 220;
const TOOLTIP_OFFSET_X = 12;
const TOOLTIP_OFFSET_Y = 30;
const DAY_TOOLTIP_FORMATTER = new Intl.DateTimeFormat(undefined, {
  timeZone: "UTC",
  weekday: "short",
});
const LIFESPAN_WEEK_KEYS = LIFESPAN_WEEKS.map((week) => week.key);
const LIFESPAN_MONTH_KEYS = LIFESPAN_MONTHS.map((month) => month.key);
const DAY_INDEX_BY_KEY = createIndexByKey(LIFESPAN_DAY_KEYS);
const WEEK_INDEX_BY_KEY = createIndexByKey(LIFESPAN_WEEK_KEYS);
const MONTH_INDEX_BY_KEY = createIndexByKey(LIFESPAN_MONTH_KEYS);
const DAY_TOOLTIP_BY_KEY = new Map(
  LIFESPAN_DAY_KEYS.map((dateKey) => [dateKey, formatDayTooltip(dateKey)])
);

type LifespanLayout = (typeof LAYOUTS)[number];
export type LifespanMode = (typeof MODES)[number];
export type LifeBoxEntryState = {
  isPublic: boolean;
};
type BoxState = "current" | "future" | "past";
type TodayKeys = {
  day: string;
  month: string;
  week: string;
};
type SelectedKeys = Partial<Record<LifespanMode, string>>;
type NavigationDirection = "down" | "left" | "right" | "up";
type LifespanShortcutKey =
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "p";
type GridKeyDownOptions = {
  event: LifespanKeyboardEvent;
  mapElement: HTMLDivElement | null;
  mode: LifespanMode;
  onOpenBox?: (mode: LifespanMode, periodKey: string) => void;
  setSelectedKeys: Dispatch<SetStateAction<SelectedKeys>>;
  tooltipElement: HTMLDivElement | null;
};
type LifespanKeyboardEvent = Pick<
  KeyboardEvent<HTMLElement>,
  "altKey" | "code" | "ctrlKey" | "key" | "metaKey" | "preventDefault"
>;

type LifespanGridProps = {
  autoFocusKey?: number | string;
  enablePageKeyboardNavigation?: boolean;
  getBoxEntry?: (
    mode: LifespanMode,
    periodKey: string
  ) => LifeBoxEntryState | undefined;
  isKeyboardNavigationActive?: boolean;
  onOpenBox?: (mode: LifespanMode, periodKey: string) => void;
};

export function LifespanGrid({
  autoFocusKey = 0,
  enablePageKeyboardNavigation = false,
  getBoxEntry,
  isKeyboardNavigationActive = true,
  onOpenBox,
}: LifespanGridProps = {}) {
  const [mode, setMode] = useState<LifespanMode>("day");
  const [layout, setLayout] = useState<LifespanLayout>("shrink");
  const [hidePast, setHidePast] = useState(true);
  const [todayKeys, setTodayKeys] = useState<TodayKeys>(() =>
    getTodayKeys(new Date())
  );
  const [selectedKeys, setSelectedKeys] = useState<SelectedKeys>({});
  const mapRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isShrinkLayout = layout === "shrink";
  const selectedKey = getSelectedKey(mode, selectedKeys, todayKeys);
  const focusMap = useCallback(
    () => mapRef.current?.focus({ preventScroll: true }),
    []
  );

  useEffect(() => {
    const updateToday = () => setTodayKeys(getTodayKeys(new Date()));

    updateToday();
    const interval = window.setInterval(updateToday, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: autoFocusKey is an external focus request signal.
  useEffect(() => {
    if (!isKeyboardNavigationActive) {
      return;
    }

    focusMap();
  }, [autoFocusKey, focusMap, isKeyboardNavigationActive]);

  useEffect(() => {
    if (!(enablePageKeyboardNavigation && isKeyboardNavigationActive)) {
      return;
    }

    const handlePageKeyDown = (event: globalThis.KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        mapRef.current === null ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isInteractiveKeyboardTarget(event.target)
      ) {
        return;
      }

      if (
        event.target instanceof Node &&
        mapRef.current.contains(event.target)
      ) {
        return;
      }

      if (!isOpenKey(event) && getNavigationDirection(event) === null) {
        return;
      }

      focusMap();
      handleGridKeyDown({
        event,
        mapElement: mapRef.current,
        mode,
        onOpenBox,
        setSelectedKeys,
        tooltipElement: tooltipRef.current,
      });
    };

    window.addEventListener("keydown", handlePageKeyDown, true);

    return () => window.removeEventListener("keydown", handlePageKeyDown, true);
  }, [
    enablePageKeyboardNavigation,
    focusMap,
    isKeyboardNavigationActive,
    mode,
    onOpenBox,
  ]);

  useEffect(() => {
    if (!isKeyboardNavigationActive) {
      return;
    }

    const shortcutActions: Record<LifespanShortcutKey, () => void> = {
      ArrowDown: () => {
        setLayout("shrink");
        focusMap();
      },
      ArrowLeft: () => {
        setMode((currentMode) => getPreviousMode(currentMode));
        focusMap();
      },
      ArrowRight: () => {
        setMode((currentMode) => getNextMode(currentMode));
        focusMap();
      },
      ArrowUp: () => {
        setLayout("rows");
        focusMap();
      },
      p: () => {
        setHidePast((currentValue) => !currentValue);
        focusMap();
      },
    };

    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      if (!isLifespanShortcutEvent(event)) {
        return;
      }

      const shortcutKey = getLifespanShortcutKey(event);

      if (shortcutKey === null) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      shortcutActions[shortcutKey]();
    };

    window.addEventListener("keydown", handleShortcut, true);

    return () => window.removeEventListener("keydown", handleShortcut, true);
  }, [focusMap, isKeyboardNavigationActive]);

  return (
    <section
      aria-label="Lifespan map"
      className={cn("pb-6", getBoxSizeClassName(mode))}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-muted-foreground text-xs tabular-nums">
            {formatPeriodLeftLabel(
              getRemainingPeriodCount(mode, todayKeys),
              mode
            )}
          </p>
          {isShrinkLayout ? (
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.16em]">
              {START_DATE_LABEL} — {END_DATE_LABEL}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-4 font-mono text-muted-foreground text-xs">
          <TextToggle
            icon={<ArrowLeftRight size={12} strokeWidth={1.75} />}
            label={mode}
            onClick={() => {
              setMode(getNextMode(mode));
              focusMap();
            }}
            title="Switch period: Alt + ← / Alt + →"
          />
          <TextToggle
            icon={<ArrowUpDown size={12} strokeWidth={1.75} />}
            label={layout}
            onClick={() => {
              setLayout(layout === "rows" ? "shrink" : "rows");
              focusMap();
            }}
            title="Switch layout: Alt + ↑ for rows, Alt + ↓ for shrink"
          />
          <TextToggle
            icon={
              hidePast ? (
                <EyeOff size={12} strokeWidth={1.75} />
              ) : (
                <Eye size={12} strokeWidth={1.75} />
              )
            }
            label={hidePast ? "past hidden" : "past shown"}
            onClick={() => {
              setHidePast((currentValue) => !currentValue);
              focusMap();
            }}
            title="Toggle past visibility: Alt + P"
          />
        </div>
      </div>

      {/* biome-ignore-start lint/a11y: This custom spatial map handles delegated pointer and arrow-key selection across thousands of boxes. */}
      <div
        aria-label="Selectable lifespan map"
        className="relative outline-none"
        onBlur={() => hideTooltip(tooltipRef.current)}
        onDoubleClick={(event) => openBoxFromPointer(event, mode, onOpenBox)}
        onKeyDown={(event) => {
          if (!isKeyboardNavigationActive) {
            return;
          }

          handleGridKeyDown({
            event,
            mapElement: mapRef.current,
            mode,
            onOpenBox,
            setSelectedKeys,
            tooltipElement: tooltipRef.current,
          });
        }}
        onPointerCancel={() => hideTooltip(tooltipRef.current)}
        onPointerDown={(event) =>
          selectBoxFromPointer(event, mode, setSelectedKeys, tooltipRef.current)
        }
        onPointerLeave={() => hideTooltip(tooltipRef.current)}
        onPointerMove={(event) => updateTooltip(event, tooltipRef.current)}
        onPointerOver={(event) => updateTooltip(event, tooltipRef.current)}
        ref={mapRef}
        role="application"
        tabIndex={0}
      >
        {isShrinkLayout ? (
          <ShrinkGrid
            getBoxEntry={getBoxEntry}
            hidePast={hidePast}
            mode={mode}
            selectedKey={selectedKey}
            todayKeys={todayKeys}
          />
        ) : (
          <YearRows
            getBoxEntry={getBoxEntry}
            hidePast={hidePast}
            mode={mode}
            selectedKey={selectedKey}
            todayKeys={todayKeys}
          />
        )}
        <LifeTooltip tooltipRef={tooltipRef} />
      </div>
      {/* biome-ignore-end lint/a11y: End custom spatial map suppression. */}
    </section>
  );
}

type YearRowsProps = {
  getBoxEntry?: LifespanGridProps["getBoxEntry"];
  hidePast: boolean;
  mode: LifespanMode;
  selectedKey: string | null;
  todayKeys: TodayKeys | null;
};

function YearRows({
  getBoxEntry,
  hidePast,
  mode,
  selectedKey,
  todayKeys,
}: YearRowsProps) {
  if (mode === "day") {
    return (
      <div className="space-y-2">
        {LIFESPAN_YEARS.map((lifespanYear) => (
          <DayYearRow
            getBoxEntry={getBoxEntry}
            hidePast={hidePast}
            key={lifespanYear.year}
            selectedKey={selectedKey}
            todayKey={todayKeys?.day ?? null}
            year={lifespanYear}
          />
        ))}
      </div>
    );
  }

  if (mode === "week") {
    return (
      <div className="space-y-2">
        {LIFESPAN_WEEK_YEARS.map((lifespanYear) => (
          <WeekYearRow
            getBoxEntry={getBoxEntry}
            hidePast={hidePast}
            key={lifespanYear.year}
            selectedKey={selectedKey}
            todayKey={todayKeys?.week ?? null}
            year={lifespanYear}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {LIFESPAN_MONTH_YEARS.map((lifespanYear) => (
        <MonthYearRow
          getBoxEntry={getBoxEntry}
          hidePast={hidePast}
          key={lifespanYear.year}
          selectedKey={selectedKey}
          todayKey={todayKeys?.month ?? null}
          year={lifespanYear}
        />
      ))}
    </div>
  );
}

type DayYearRowProps = {
  getBoxEntry?: LifespanGridProps["getBoxEntry"];
  hidePast: boolean;
  selectedKey: string | null;
  todayKey: string | null;
  year: (typeof LIFESPAN_YEARS)[number];
};

function DayYearRow({
  getBoxEntry,
  hidePast,
  selectedKey,
  todayKey,
  year,
}: DayYearRowProps) {
  const visibleDateKeys = year.dateKeys.filter((dateKey) =>
    shouldShowBox(getBoxState(dateKey, todayKey), hidePast)
  );

  if (visibleDateKeys.length === 0) {
    return null;
  }

  return (
    <div
      className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-3"
      style={DAY_YEAR_ROW_STYLE}
    >
      <div className="pt-px text-right font-mono text-[10px] text-muted-foreground leading-none">
        {year.year}
      </div>
      <div aria-hidden="true" className="flex min-w-0 flex-wrap gap-px">
        {visibleDateKeys.map((dateKey) => {
          const state = getBoxState(dateKey, todayKey);
          const isStartDate = dateKey === START_DATE_KEY;

          return (
            <LifeBox
              entry={getBoxEntry?.("day", dateKey)}
              isSelected={dateKey === selectedKey}
              isStartDate={isStartDate}
              key={dateKey}
              periodKey={dateKey}
              state={state}
              tooltip={getDayTooltip(dateKey)}
            />
          );
        })}
      </div>
    </div>
  );
}

type WeekYearRowProps = {
  getBoxEntry?: LifespanGridProps["getBoxEntry"];
  hidePast: boolean;
  selectedKey: string | null;
  todayKey: string | null;
  year: (typeof LIFESPAN_WEEK_YEARS)[number];
};

function WeekYearRow({
  getBoxEntry,
  hidePast,
  selectedKey,
  todayKey,
  year,
}: WeekYearRowProps) {
  const visibleWeeks = year.weeks.filter((week) =>
    shouldShowBox(getBoxState(week.key, todayKey), hidePast)
  );

  if (visibleWeeks.length === 0) {
    return null;
  }

  return (
    <div
      className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-3"
      style={WEEK_YEAR_ROW_STYLE}
    >
      <div className="pt-px text-right font-mono text-[10px] text-muted-foreground leading-none">
        {year.year}
      </div>
      <div aria-hidden="true" className="flex min-w-0 flex-wrap gap-px">
        {visibleWeeks.map((week) => {
          const state = getBoxState(week.key, todayKey);
          const isStartDate = week.key === START_WEEK_KEY;

          return (
            <LifeBox
              entry={getBoxEntry?.("week", week.key)}
              isSelected={week.key === selectedKey}
              isStartDate={isStartDate}
              key={week.key}
              periodKey={week.key}
              state={state}
              tooltip={week.label}
            />
          );
        })}
      </div>
    </div>
  );
}

type MonthYearRowProps = {
  getBoxEntry?: LifespanGridProps["getBoxEntry"];
  hidePast: boolean;
  selectedKey: string | null;
  todayKey: string | null;
  year: (typeof LIFESPAN_MONTH_YEARS)[number];
};

function MonthYearRow({
  getBoxEntry,
  hidePast,
  selectedKey,
  todayKey,
  year,
}: MonthYearRowProps) {
  const visibleMonths = year.months.filter((month) =>
    shouldShowBox(getBoxState(month.key, todayKey), hidePast)
  );

  if (visibleMonths.length === 0) {
    return null;
  }

  return (
    <div
      className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-3"
      style={MONTH_YEAR_ROW_STYLE}
    >
      <div className="pt-px text-right font-mono text-[10px] text-muted-foreground leading-none">
        {year.year}
      </div>
      <div aria-hidden="true" className="flex min-w-0 flex-wrap gap-px">
        {visibleMonths.map((month) => {
          const state = getBoxState(month.key, todayKey);
          const isStartDate = month.key === START_MONTH_KEY;

          return (
            <LifeBox
              entry={getBoxEntry?.("month", month.key)}
              isSelected={month.key === selectedKey}
              isStartDate={isStartDate}
              key={month.key}
              periodKey={month.key}
              state={state}
              tooltip={`${month.label} ${year.year}`}
            />
          );
        })}
      </div>
    </div>
  );
}

type TextToggleProps = {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  title: string;
};

function TextToggle({ icon, label, onClick, title }: TextToggleProps) {
  return (
    <button
      aria-label={`${label}. ${title}`}
      className="inline-flex items-center gap-1.5 p-0 capitalize transition hover:text-foreground"
      onClick={onClick}
      title={title}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

type ShrinkGridProps = {
  getBoxEntry?: LifespanGridProps["getBoxEntry"];
  hidePast: boolean;
  mode: LifespanMode;
  selectedKey: string | null;
  todayKeys: TodayKeys | null;
};

function ShrinkGrid({
  getBoxEntry,
  hidePast,
  mode,
  selectedKey,
  todayKeys,
}: ShrinkGridProps) {
  if (mode === "day") {
    return (
      <div className="flex flex-wrap gap-px">
        {LIFESPAN_DAY_KEYS.map((dateKey) => {
          const state = getBoxState(dateKey, todayKeys?.day ?? null);
          const isStartDate = dateKey === START_DATE_KEY;

          if (!shouldShowBox(state, hidePast)) {
            return null;
          }

          return (
            <LifeBox
              entry={getBoxEntry?.("day", dateKey)}
              isSelected={dateKey === selectedKey}
              isStartDate={isStartDate}
              key={dateKey}
              periodKey={dateKey}
              state={state}
              tooltip={getDayTooltip(dateKey)}
            />
          );
        })}
      </div>
    );
  }

  if (mode === "week") {
    return (
      <div className="flex flex-wrap gap-px">
        {LIFESPAN_WEEKS.map((week) => {
          const state = getBoxState(week.key, todayKeys?.week ?? null);
          const isStartDate = week.key === START_WEEK_KEY;

          if (!shouldShowBox(state, hidePast)) {
            return null;
          }

          return (
            <LifeBox
              entry={getBoxEntry?.("week", week.key)}
              isSelected={week.key === selectedKey}
              isStartDate={isStartDate}
              key={week.key}
              periodKey={week.key}
              state={state}
              tooltip={week.label}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-px">
      {LIFESPAN_MONTHS.map((month) => {
        const state = getBoxState(month.key, todayKeys?.month ?? null);
        const isStartDate = month.key === START_MONTH_KEY;

        if (!shouldShowBox(state, hidePast)) {
          return null;
        }

        return (
          <LifeBox
            entry={getBoxEntry?.("month", month.key)}
            isSelected={month.key === selectedKey}
            isStartDate={isStartDate}
            key={month.key}
            periodKey={month.key}
            state={state}
            tooltip={`${month.label} ${month.year}`}
          />
        );
      })}
    </div>
  );
}

type LifeBoxProps = {
  entry?: LifeBoxEntryState;
  isStartDate: boolean;
  isSelected: boolean;
  periodKey: string;
  state: BoxState;
  tooltip: string;
};

function LifeBox({
  entry,
  isSelected,
  isStartDate,
  periodKey,
  state,
  tooltip,
}: LifeBoxProps) {
  return (
    <span
      className={getBoxClassName(state, isStartDate, isSelected, entry)}
      data-life-current={state === "current" ? "true" : undefined}
      data-life-key={periodKey}
      data-life-selected={isSelected ? "true" : undefined}
      data-life-tooltip={tooltip}
    />
  );
}

function LifeTooltip({
  tooltipRef,
}: {
  tooltipRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      className="pointer-events-none fixed top-0 left-0 z-50 max-w-[220px] rounded border border-foreground/10 bg-background/95 px-2 py-1 font-mono text-[10px] text-foreground tabular-nums opacity-0 shadow-sm"
      ref={tooltipRef}
      role="tooltip"
    />
  );
}

function selectBoxFromPointer(
  event: PointerEvent<HTMLElement>,
  mode: LifespanMode,
  setSelectedKeys: Dispatch<SetStateAction<SelectedKeys>>,
  tooltipElement: HTMLDivElement | null
) {
  const boxElement = getLifeBoxElement(event.target);

  if (boxElement === null) {
    return;
  }

  event.currentTarget.focus({ preventScroll: true });
  updateSelectedKeyFromElement(boxElement, mode, setSelectedKeys);
  updateTooltip(event, tooltipElement);
}

function handleGridKeyDown({
  event,
  mapElement,
  mode,
  onOpenBox,
  setSelectedKeys,
  tooltipElement,
}: GridKeyDownOptions) {
  if (event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  if (mapElement === null) {
    return;
  }

  if (isOpenKey(event) && onOpenBox) {
    const boxElements = getLifeBoxElements(mapElement);

    if (boxElements.length === 0) {
      return;
    }

    event.preventDefault();

    const activeElement = getActiveLifeBoxElement(mapElement, boxElements);
    openLifeBoxElement(activeElement, mode, onOpenBox);
    showTooltipForElement(activeElement, tooltipElement);
    return;
  }

  const direction = getNavigationDirection(event);

  if (direction === null) {
    return;
  }

  const boxElements = getLifeBoxElements(mapElement);

  if (boxElements.length === 0) {
    return;
  }

  event.preventDefault();

  const activeElement = getActiveLifeBoxElement(mapElement, boxElements);
  const nextElement = getNextLifeBoxElement(
    boxElements,
    activeElement,
    direction
  );

  updateSelectedKeyFromElement(nextElement, mode, setSelectedKeys);
  nextElement.scrollIntoView({ block: "nearest", inline: "nearest" });
  showTooltipForElement(nextElement, tooltipElement);
}

function openBoxFromPointer(
  event: MouseEvent<HTMLElement>,
  mode: LifespanMode,
  onOpenBox: LifespanGridProps["onOpenBox"]
) {
  if (!onOpenBox) {
    return;
  }

  const boxElement = getLifeBoxElement(event.target);

  if (boxElement === null) {
    return;
  }

  event.currentTarget.focus({ preventScroll: true });
  openLifeBoxElement(boxElement, mode, onOpenBox);
}

function openLifeBoxElement(
  boxElement: HTMLElement,
  mode: LifespanMode,
  onOpenBox: NonNullable<LifespanGridProps["onOpenBox"]>
) {
  const lifeKey = boxElement.dataset.lifeKey;

  if (lifeKey === undefined) {
    return;
  }

  onOpenBox(mode, lifeKey);
}

function updateTooltip(
  event: PointerEvent<HTMLElement>,
  tooltipElement: HTMLDivElement | null
) {
  if (tooltipElement === null) {
    return;
  }

  const label = getTooltipLabel(event.target);

  if (label === null) {
    hideTooltip(tooltipElement);
    return;
  }

  const position = getTooltipPosition(event);

  tooltipElement.textContent = label;
  tooltipElement.style.opacity = "1";
  tooltipElement.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
}

function hideTooltip(tooltipElement: HTMLDivElement | null) {
  if (tooltipElement === null) {
    return;
  }

  tooltipElement.style.opacity = "0";
}

function showTooltipForElement(
  boxElement: HTMLElement,
  tooltipElement: HTMLDivElement | null
) {
  if (tooltipElement === null) {
    return;
  }

  const label = boxElement.dataset.lifeTooltip;

  if (label === undefined) {
    hideTooltip(tooltipElement);
    return;
  }

  const rect = boxElement.getBoundingClientRect();
  const position = getTooltipPositionFromPoint(
    rect.left + rect.width / 2,
    rect.top + rect.height / 2
  );

  tooltipElement.textContent = label;
  tooltipElement.style.opacity = "1";
  tooltipElement.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
}

function updateSelectedKeyFromElement(
  boxElement: HTMLElement,
  mode: LifespanMode,
  setSelectedKeys: Dispatch<SetStateAction<SelectedKeys>>
) {
  const lifeKey = boxElement.dataset.lifeKey;

  if (lifeKey === undefined) {
    return;
  }

  setSelectedKeys((currentKeys) =>
    currentKeys[mode] === lifeKey
      ? currentKeys
      : {
          ...currentKeys,
          [mode]: lifeKey,
        }
  );
}

function getTooltipLabel(target: EventTarget) {
  if (!(target instanceof Element)) {
    return null;
  }

  return (
    target.closest<HTMLElement>("[data-life-tooltip]")?.dataset.lifeTooltip ??
    null
  );
}

function getTooltipPosition(event: PointerEvent<HTMLElement>) {
  return getTooltipPositionFromPoint(event.clientX, event.clientY);
}

function getTooltipPositionFromPoint(clientX: number, clientY: number) {
  return {
    x: Math.max(
      8,
      Math.min(
        clientX + TOOLTIP_OFFSET_X,
        window.innerWidth - TOOLTIP_MAX_WIDTH
      )
    ),
    y: Math.max(8, clientY - TOOLTIP_OFFSET_Y),
  };
}

function getNavigationDirection(
  event: LifespanKeyboardEvent
): NavigationDirection | null {
  if (event.key === "ArrowDown" || event.code === "Numpad2") {
    return "down";
  }

  if (event.key === "ArrowLeft" || event.code === "Numpad4") {
    return "left";
  }

  if (event.key === "ArrowRight" || event.code === "Numpad6") {
    return "right";
  }

  if (event.key === "ArrowUp" || event.code === "Numpad8") {
    return "up";
  }

  return null;
}

function isOpenKey(event: LifespanKeyboardEvent) {
  return event.key === "Enter" || event.code === "NumpadEnter";
}

function getLifeBoxElement(target: EventTarget) {
  if (!(target instanceof Element)) {
    return null;
  }

  return target.closest<HTMLElement>("[data-life-key]");
}

function getLifeBoxElements(mapElement: HTMLElement) {
  return Array.from(
    mapElement.querySelectorAll<HTMLElement>("[data-life-key]")
  );
}

function getActiveLifeBoxElement(
  mapElement: HTMLElement,
  boxElements: HTMLElement[]
) {
  return (
    mapElement.querySelector<HTMLElement>('[data-life-selected="true"]') ??
    mapElement.querySelector<HTMLElement>('[data-life-current="true"]') ??
    boxElements[0]
  );
}

function getNextLifeBoxElement(
  boxElements: HTMLElement[],
  activeElement: HTMLElement,
  direction: NavigationDirection
) {
  if (direction === "down" || direction === "up") {
    return getVerticalLifeBoxElement(boxElements, activeElement, direction);
  }

  const activeIndex = boxElements.indexOf(activeElement);

  if (direction === "left") {
    return boxElements[Math.max(0, activeIndex - 1)];
  }

  return boxElements[Math.min(boxElements.length - 1, activeIndex + 1)];
}

function getVerticalLifeBoxElement(
  boxElements: HTMLElement[],
  activeElement: HTMLElement,
  direction: "down" | "up"
) {
  const activeRect = activeElement.getBoundingClientRect();
  const activeX = activeRect.left + activeRect.width / 2;
  const activeY = activeRect.top + activeRect.height / 2;
  const candidates = boxElements
    .map((boxElement) => {
      const rect = boxElement.getBoundingClientRect();

      return {
        boxElement,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    })
    .filter((candidate) =>
      direction === "up" ? candidate.y < activeY - 1 : candidate.y > activeY + 1
    );

  if (candidates.length === 0) {
    return activeElement;
  }

  return candidates.reduce((bestCandidate, candidate) => {
    const bestScore =
      Math.abs(bestCandidate.y - activeY) * 10_000 +
      Math.abs(bestCandidate.x - activeX);
    const candidateScore =
      Math.abs(candidate.y - activeY) * 10_000 +
      Math.abs(candidate.x - activeX);

    return candidateScore < bestScore ? candidate : bestCandidate;
  }).boxElement;
}

function getNextMode(mode: LifespanMode) {
  const currentModeIndex = MODES.indexOf(mode);

  return MODES[(currentModeIndex + 1) % MODES.length];
}

function getPreviousMode(mode: LifespanMode) {
  const currentModeIndex = MODES.indexOf(mode);

  return MODES[(currentModeIndex - 1 + MODES.length) % MODES.length];
}

function getLifespanShortcutKey(
  event: globalThis.KeyboardEvent
): LifespanShortcutKey | null {
  if (event.key === "ArrowDown" || event.code === "ArrowDown") {
    return "ArrowDown";
  }

  if (event.key === "ArrowLeft" || event.code === "ArrowLeft") {
    return "ArrowLeft";
  }

  if (event.key === "ArrowRight" || event.code === "ArrowRight") {
    return "ArrowRight";
  }

  if (event.key === "ArrowUp" || event.code === "ArrowUp") {
    return "ArrowUp";
  }

  if (event.key.toLowerCase() === "p" || event.code === "KeyP") {
    return "p";
  }

  return null;
}

function isLifespanShortcutEvent(event: globalThis.KeyboardEvent) {
  return (
    event.altKey &&
    !event.metaKey &&
    !event.getModifierState("AltGraph") &&
    !isEditableShortcutTarget(event.target)
  );
}

function isEditableShortcutTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  return (
    target.closest(
      'input, textarea, select, [contenteditable=""], [contenteditable="true"]'
    ) !== null
  );
}

function isInteractiveKeyboardTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  return (
    target.closest(
      'a[href], button, input, textarea, select, summary, [contenteditable=""], [contenteditable="true"], [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])'
    ) !== null
  );
}

function getBoxState(periodKey: string, todayKey: string | null): BoxState {
  if (todayKey === null) {
    return "future";
  }

  if (periodKey === todayKey) {
    return "current";
  }

  return periodKey < todayKey ? "past" : "future";
}

function getSelectedKey(
  mode: LifespanMode,
  selectedKeys: SelectedKeys,
  todayKeys: TodayKeys | null
) {
  return selectedKeys[mode] ?? todayKeys?.[mode] ?? null;
}

function getTodayKeys(date: Date): TodayKeys {
  return {
    day: formatLocalDateKey(date),
    month: formatLocalMonthKey(date),
    week: getLifespanWeekKey(date),
  };
}

function shouldShowBox(state: BoxState, hidePast: boolean) {
  return !(hidePast && state === "past");
}

function getBoxClassName(
  state: BoxState,
  isStartDate: boolean,
  isSelected: boolean,
  entry: LifeBoxEntryState | undefined
) {
  return cn(
    "size-[var(--life-box-size)] shrink-0 cursor-pointer rounded-[1px] border",
    state === "future" && "border-foreground/10 bg-foreground/[0.03]",
    state === "past" && "border-foreground/35 bg-foreground/60",
    state === "current" &&
      "border-teal-300 bg-teal-400 shadow-[0_0_0_1px_var(--background),0_0_0_2px_rgba(45,212,191,0.75)]",
    isStartDate && state !== "current" && "border-teal-300/80 bg-teal-300/30",
    entry?.isPublic && "border-chart-4 bg-chart-4/75",
    entry && !entry.isPublic && "border-foreground bg-foreground/80",
    isSelected &&
      "border-yellow-300 bg-yellow-300/70 shadow-[0_0_0_1px_var(--background),0_0_0_3px_rgba(250,204,21,0.85)]"
  );
}

function getBoxSizeClassName(mode: LifespanMode) {
  return mode === "month" ? "[--life-box-size:12px]" : "[--life-box-size:10px]";
}

function getRemainingPeriodCount(
  mode: LifespanMode,
  todayKeys: TodayKeys | null
) {
  if (mode === "day") {
    return getRemainingDayCount(todayKeys?.day ?? null);
  }

  if (mode === "week") {
    return getRemainingWeekCount(todayKeys?.week ?? null);
  }

  return getRemainingMonthCount(todayKeys?.month ?? null);
}

function getRemainingDayCount(currentDayKey: string | null) {
  return getRemainingCount(currentDayKey, LIFESPAN_DAY_KEYS, DAY_INDEX_BY_KEY);
}

function getRemainingWeekCount(currentWeekKey: string | null) {
  return getRemainingCount(
    currentWeekKey,
    LIFESPAN_WEEK_KEYS,
    WEEK_INDEX_BY_KEY
  );
}

function getRemainingMonthCount(currentMonthKey: string | null) {
  return getRemainingCount(
    currentMonthKey,
    LIFESPAN_MONTH_KEYS,
    MONTH_INDEX_BY_KEY
  );
}

function formatPeriodLeftLabel(count: number, period: string) {
  return `${count.toLocaleString()} ${period}${count === 1 ? "" : "s"} left`;
}

function formatDayTooltip(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const weekday = DAY_TOOLTIP_FORMATTER.format(
    new Date(Date.UTC(year, month - 1, day))
  );

  return `${weekday}, ${dateKey}`;
}

function getDayTooltip(dateKey: string) {
  return DAY_TOOLTIP_BY_KEY.get(dateKey) ?? dateKey;
}

function createIndexByKey(keys: readonly string[]) {
  return new Map(keys.map((key, index) => [key, index]));
}

function getRemainingCount(
  currentKey: string | null,
  keys: readonly string[],
  indexByKey: ReadonlyMap<string, number>
) {
  if (currentKey === null) {
    return keys.length;
  }

  const currentIndex = indexByKey.get(currentKey);

  if (currentIndex !== undefined) {
    return keys.length - currentIndex;
  }

  return currentKey > (keys.at(-1) ?? "") ? 0 : keys.length;
}

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatLocalMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}
