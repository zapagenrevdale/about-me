"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useActionState,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";

import { BackLink } from "@/components/back-link";
import { LIFESPAN_MONTHS, LIFESPAN_WEEKS } from "../someday/lifespan-data";
import {
  type LifeBoxEntryState,
  LifespanGrid,
  type LifespanMode,
} from "../someday/lifespan-grid";
import {
  type DiaryAuthState,
  getDiaryEntry,
  getDiaryEntrySummaries,
  unveilDiary,
  veilDiary,
} from "./actions";
import { DiaryEditor } from "./diary-editor";
import type { DiaryEntryRecord, DiaryEntrySummary, DiaryPeriod } from "./types";

type EntriesByKey = Record<string, DiaryEntrySummary>;

type DiaryClientProps = {
  initialIsUnveiled: boolean;
};

const DIARY_MAP_PERIOD_TYPES = ["day", "week", "month"] as const;
const WEEK_LABELS_BY_KEY = new Map(
  LIFESPAN_WEEKS.map((week) => [week.key, week.label])
);
const MONTHS_BY_KEY = new Map(
  LIFESPAN_MONTHS.map((month) => [month.key, month])
);
const FULL_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  weekday: "long",
  year: "numeric",
});
const MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

export function DiaryClient({ initialIsUnveiled }: DiaryClientProps) {
  const router = useRouter();
  const [isUnveiled, setIsUnveiled] = useState(initialIsUnveiled);
  const [entriesByKey, setEntriesByKey] = useState<EntriesByKey>({});
  const [activePeriod, setActivePeriod] = useState<DiaryPeriod | null>(null);
  const [activeEntry, setActiveEntry] = useState<
    DiaryEntryRecord | undefined
  >();
  const [isEntryLoading, setIsEntryLoading] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [summaryReloadKey, setSummaryReloadKey] = useState(0);
  const [gridFocusKey, setGridFocusKey] = useState(0);
  const [isSummaryPending, startSummaryTransition] = useTransition();

  useEffect(() => {
    let isActive = true;
    const requestedReloadKey = summaryReloadKey;

    startSummaryTransition(() => {
      Promise.all(
        DIARY_MAP_PERIOD_TYPES.map((periodType) =>
          getDiaryEntrySummaries(periodType)
        )
      )
        .then((entryGroups) => {
          if (!isActive || requestedReloadKey !== summaryReloadKey) {
            return;
          }

          setEntriesByKey(
            Object.fromEntries(
              entryGroups.flat().map((entry) => [entry.periodKey, entry])
            )
          );
        })
        .catch(() => {
          if (isActive && requestedReloadKey === summaryReloadKey) {
            setEntriesByKey({});
          }
        });
    });

    return () => {
      isActive = false;
    };
  }, [summaryReloadKey]);

  const getBoxEntry = useCallback(
    (
      mode: LifespanMode,
      lifespanKey: string
    ): LifeBoxEntryState | undefined => {
      const entry = entriesByKey[getDiaryPeriodKey(mode, lifespanKey)];

      return entry ? { isPublic: entry.isPublic } : undefined;
    },
    [entriesByKey]
  );

  const openLifeBox = useCallback(
    async (mode: LifespanMode, lifespanKey: string) => {
      const period = createDiaryPeriod(mode, lifespanKey);
      const summary = entriesByKey[period.key];

      if (!(isUnveiled || summary?.isPublic)) {
        return;
      }

      setActivePeriod(period);
      setActiveEntry(undefined);
      setEntryError(null);

      if (!summary) {
        setIsEntryLoading(false);
        return;
      }

      setIsEntryLoading(true);

      try {
        const entry = await getDiaryEntry(period.key);

        if (!entry) {
          setEntryError("This entry is not available.");
          return;
        }

        setActiveEntry(entry);
      } catch {
        setEntryError("This entry could not be opened.");
      } finally {
        setIsEntryLoading(false);
      }
    },
    [entriesByKey, isUnveiled]
  );

  const handleSaved = (entry: DiaryEntryRecord) => {
    setActiveEntry(entry);
    setEntriesByKey((currentEntries) => ({
      ...currentEntries,
      [entry.periodKey]: toDiaryEntrySummary(entry),
    }));
  };

  const handleDeleted = (periodKey: string) => {
    setActiveEntry(undefined);
    setEntriesByKey((currentEntries) => {
      const nextEntries = { ...currentEntries };
      delete nextEntries[periodKey];
      return nextEntries;
    });
  };

  const requestGridFocus = useCallback(() => {
    setGridFocusKey((currentKey) => currentKey + 1);
  }, []);

  const closeActiveEditor = useCallback(() => {
    setActivePeriod(null);
    requestGridFocus();
  }, [requestGridFocus]);

  const handleUnveiled = useCallback(() => {
    setIsUnveiled(true);
    setEntriesByKey({});
    setSummaryReloadKey((currentKey) => currentKey + 1);
    requestGridFocus();
    router.refresh();
  }, [requestGridFocus, router]);

  const handleVeiled = useCallback(() => {
    setIsUnveiled(false);
    setEntriesByKey({});
    setActivePeriod(null);
    setActiveEntry(undefined);
    setSummaryReloadKey((currentKey) => currentKey + 1);
    requestGridFocus();
    router.refresh();
  }, [requestGridFocus, router]);

  let activeEditor: ReactNode = null;

  if (activePeriod && isEntryLoading) {
    activeEditor = (
      <DiaryEntryLoading onClose={closeActiveEditor} period={activePeriod} />
    );
  } else if (activePeriod && entryError) {
    activeEditor = (
      <DiaryEntryLoading
        message={entryError}
        onClose={closeActiveEditor}
        period={activePeriod}
      />
    );
  } else if (activePeriod && (isUnveiled || activeEntry?.isPublic)) {
    const isReadOnly = !isUnveiled;

    activeEditor = (
      <DiaryEditor
        entry={activeEntry}
        isReadOnly={isReadOnly}
        key={`${activePeriod.key}:${isReadOnly ? "read" : "edit"}`}
        onClose={closeActiveEditor}
        onDeleted={handleDeleted}
        onSaved={handleSaved}
        period={activePeriod}
      />
    );
  }

  const statusLabel = getStatusLabel(isSummaryPending, isUnveiled);

  return (
    <div className="relative min-h-[calc(100vh-8rem)] pb-20">
      <BackLink href="/">Home</BackLink>

      <article className="mt-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-muted-foreground text-xs">
            <LegendItem
              className="border-foreground/35 bg-foreground/60"
              label="Past"
            />
            <LegendItem
              className="border-teal-300 bg-teal-400"
              label="Current"
            />
            <LegendItem
              className="border-foreground/10 bg-foreground/[0.03]"
              label="Future"
            />
            <LegendItem
              className="border-teal-300/80 bg-teal-300/30"
              label="Start"
            />
            <LegendItem
              className="border-yellow-300 bg-yellow-300/70"
              label="Selected"
            />
            <LegendItem
              className="border-chart-4 bg-chart-4/75"
              label="Public"
            />
            {isUnveiled ? (
              <LegendItem
                className="border-foreground bg-foreground/80"
                label="Private"
              />
            ) : null}
          </div>
          <p className="font-mono text-muted-foreground text-xs">
            {statusLabel}
          </p>
        </div>

        <LifespanGrid
          autoFocusKey={gridFocusKey}
          enablePageKeyboardNavigation
          getBoxEntry={getBoxEntry}
          isKeyboardNavigationActive={activePeriod === null}
          onOpenBox={openLifeBox}
        />
      </article>

      {activeEditor}

      <DiaryAuthControl
        isUnveiled={isUnveiled}
        onUnveiled={handleUnveiled}
        onVeiled={handleVeiled}
      />
    </div>
  );
}

type LegendItemProps = {
  className: string;
  label: string;
};

function LegendItem({ className, label }: LegendItemProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`size-2 rounded-[1px] border ${className}`} />
      {label}
    </span>
  );
}

type DiaryAuthControlProps = {
  isUnveiled: boolean;
  onUnveiled: () => void;
  onVeiled: () => void;
};

function DiaryAuthControl({
  isUnveiled,
  onUnveiled,
  onVeiled,
}: DiaryAuthControlProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      {isUnveiled ? (
        <VeilButton onVeiled={onVeiled} />
      ) : (
        <UnveilForm onUnveiled={onUnveiled} />
      )}
    </div>
  );
}

type UnveilFormProps = {
  onUnveiled: () => void;
};

const INITIAL_AUTH_STATE: DiaryAuthState = {
  error: null,
  isAuthenticated: false,
};

function UnveilForm({ onUnveiled }: UnveilFormProps) {
  const [state, formAction, isPending] = useActionState(
    unveilDiary,
    INITIAL_AUTH_STATE
  );

  useEffect(() => {
    if (state.isAuthenticated) {
      onUnveiled();
    }
  }, [onUnveiled, state.isAuthenticated]);

  return (
    <form
      action={formAction}
      className="pointer-events-auto flex flex-col items-center gap-2"
    >
      <input
        aria-label="Unveil diary"
        autoComplete="current-password"
        className="w-28 border-0 border-foreground/45 border-b bg-transparent px-1 pb-1 text-center font-mono text-xs outline-none ring-0 transition placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus:ring-0 disabled:opacity-40"
        disabled={isPending}
        name="password"
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.nativeEvent.isComposing) {
            return;
          }

          event.preventDefault();
          event.currentTarget.form?.requestSubmit();
        }}
        placeholder="unveil"
        type="password"
      />
      <button className="sr-only" tabIndex={-1} type="submit">
        Unveil
      </button>
      {state.error ? (
        <p className="text-[11px] text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

type VeilButtonProps = {
  onVeiled: () => void;
};

function VeilButton({ onVeiled }: VeilButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="pointer-events-auto bg-transparent p-0 font-mono text-muted-foreground text-xs transition hover:text-foreground focus:outline-none focus:ring-0 disabled:opacity-40"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          veilDiary()
            .then(onVeiled)
            .catch(() => undefined);
        });
      }}
      type="button"
    >
      veil
    </button>
  );
}

type DiaryEntryLoadingProps = {
  message?: string;
  onClose: () => void;
  period: DiaryPeriod;
};

function DiaryEntryLoading({
  message = "Loading entry...",
  onClose,
  period,
}: DiaryEntryLoadingProps) {
  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  return (
    <aside className="fixed inset-0 z-50 flex bg-background/80 backdrop-blur-sm md:justify-end">
      <div className="flex h-full w-full flex-col border-border border-l bg-background md:max-w-2xl">
        <header className="flex items-start justify-between gap-6 border-border border-b px-5 py-4 md:px-8">
          <div className="min-w-0 space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
              {period.type}
            </p>
            <h1 className="truncate font-medium text-xl">
              {period.rangeLabel}
            </h1>
          </div>
          <button
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
            onClick={onClose}
            title="Close"
            type="button"
          >
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 px-5 py-8 text-muted-foreground text-sm md:px-12">
          {message}
        </div>
      </div>
    </aside>
  );
}

function toDiaryEntrySummary(entry: DiaryEntryRecord): DiaryEntrySummary {
  return {
    periodKey: entry.periodKey,
    periodType: entry.periodType,
    periodStart: entry.periodStart,
    plainText: entry.plainText,
    isPublic: entry.isPublic,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

function getStatusLabel(isSummaryPending: boolean, isUnveiled: boolean) {
  if (isSummaryPending) {
    return "loading";
  }

  if (isUnveiled) {
    return "unveiled";
  }

  return "veiled";
}

function createDiaryPeriod(
  mode: LifespanMode,
  lifespanKey: string
): DiaryPeriod {
  if (mode === "month") {
    const periodStart = `${lifespanKey}-01`;

    return {
      key: getDiaryPeriodKey(mode, lifespanKey),
      type: mode,
      start: periodStart,
      label: MONTHS_BY_KEY.get(lifespanKey)?.label ?? lifespanKey,
      detail: "Month note",
      rangeLabel: formatMonthRange(lifespanKey),
    };
  }

  if (mode === "week") {
    return {
      key: getDiaryPeriodKey(mode, lifespanKey),
      type: mode,
      start: lifespanKey,
      label: "Week",
      detail: WEEK_LABELS_BY_KEY.get(lifespanKey) ?? lifespanKey,
      rangeLabel: WEEK_LABELS_BY_KEY.get(lifespanKey) ?? lifespanKey,
    };
  }

  return {
    key: getDiaryPeriodKey(mode, lifespanKey),
    type: mode,
    start: lifespanKey,
    label: formatShortDate(lifespanKey),
    detail: "Day note",
    rangeLabel: formatFullDate(lifespanKey),
  };
}

function getDiaryPeriodKey(mode: LifespanMode, lifespanKey: string) {
  const periodStart = mode === "month" ? `${lifespanKey}-01` : lifespanKey;
  return `${mode}:${periodStart}`;
}

function formatFullDate(dateKey: string) {
  return FULL_DATE_FORMATTER.format(parseUtcDateKey(dateKey));
}

function formatShortDate(dateKey: string) {
  return dateKey;
}

function formatMonthRange(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return MONTH_FORMATTER.format(new Date(Date.UTC(year, month - 1, 1)));
}

function parseUtcDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
