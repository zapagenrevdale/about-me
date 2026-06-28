import Link from "next/link";

import { cn } from "@/lib/utils";

const GITHUB_USERNAME = "zapagenrevdale";
const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;
const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
const CONTRIBUTION_DAYS = 7;
const REVALIDATE_SECONDS = 60 * 60;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const GITHUB_CONTRIBUTIONS_QUERY = `
  query GitHubContributions($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

const dayLabels = [
  { label: "Mon", row: 3 },
  { label: "Wed", row: 5 },
  { label: "Fri", row: 7 },
];

const contributionLevelClasses = [
  "bg-neutral-200 dark:bg-neutral-800/70",
  "bg-emerald-100 dark:bg-emerald-950",
  "bg-emerald-300 dark:bg-emerald-800",
  "bg-emerald-500 dark:bg-emerald-600",
  "bg-emerald-600 dark:bg-emerald-400",
] as const;

const numberFormatter = new Intl.NumberFormat("en-US");
const monthFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  timeZone: "UTC",
});
const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

type GitHubContribution = {
  date: string;
  count: number;
  level: number;
};

type GitHubContributionsData = {
  total: number;
  contributions: GitHubContribution[];
};

type GitHubContributionLevel =
  | "NONE"
  | "FIRST_QUARTILE"
  | "SECOND_QUARTILE"
  | "THIRD_QUARTILE"
  | "FOURTH_QUARTILE";

type GitHubContributionDayResponse = {
  date?: unknown;
  contributionCount?: unknown;
  contributionLevel?: unknown;
};

type GitHubContributionsResponse = {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: {
          totalContributions?: unknown;
          weeks?: unknown;
        };
      };
    } | null;
  };
  errors?: unknown;
};

type CalendarCell = {
  key: string;
  contribution: GitHubContribution | null;
};

type ContributionWeek = {
  key: string;
  cells: CalendarCell[];
};

type MonthLabel = {
  key: string;
  label: string;
  column: number;
};

type GitHubContributionsProps = {
  className?: string;
};

const contributionLevelMap: Record<GitHubContributionLevel, number> = {
  FIRST_QUARTILE: 1,
  FOURTH_QUARTILE: 4,
  NONE: 0,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGitHubContributionLevel(
  value: unknown
): value is GitHubContributionLevel {
  return (
    typeof value === "string" && Object.hasOwn(contributionLevelMap, value)
  );
}

function toGitHubContribution(
  value: GitHubContributionDayResponse
): GitHubContribution | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.date === "string" &&
    DATE_PATTERN.test(value.date) &&
    typeof value.contributionCount === "number" &&
    Number.isFinite(value.contributionCount) &&
    isGitHubContributionLevel(value.contributionLevel)
  ) {
    return {
      count: value.contributionCount,
      date: value.date,
      level: contributionLevelMap[value.contributionLevel],
    };
  }

  return null;
}

function toUtcDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function getContributionLevelClass(level: number): string {
  const normalizedLevel = Math.min(
    Math.max(Math.round(level), 0),
    contributionLevelClasses.length - 1
  );

  return (
    contributionLevelClasses[normalizedLevel] ?? contributionLevelClasses[0]
  );
}

function getContributionLabel(contribution: GitHubContribution): string {
  const noun = contribution.count === 1 ? "contribution" : "contributions";

  return `${numberFormatter.format(contribution.count)} ${noun} on ${dateFormatter.format(
    toUtcDate(contribution.date)
  )}`;
}

function getCalendarCellTitle(contribution: GitHubContribution | null): string {
  if (!contribution) {
    return "No contribution data for this day";
  }

  return getContributionLabel(contribution);
}

function buildWeeks(contributions: GitHubContribution[]): ContributionWeek[] {
  const weeks: ContributionWeek[] = [];
  let currentWeek: CalendarCell[] = [];

  const pushCurrentWeek = () => {
    if (currentWeek.length === 0) {
      return;
    }

    while (currentWeek.length < CONTRIBUTION_DAYS) {
      currentWeek.push({
        contribution: null,
        key: `empty-end-${weeks.length}-${currentWeek.length}`,
      });
    }

    const firstContribution = currentWeek.find(
      (cell) => cell.contribution !== null
    )?.contribution;

    weeks.push({
      cells: currentWeek,
      key: firstContribution?.date ?? `empty-week-${weeks.length}`,
    });

    currentWeek = [];
  };

  for (const contribution of contributions) {
    const day = toUtcDate(contribution.date).getUTCDay();

    if (currentWeek.length === CONTRIBUTION_DAYS) {
      pushCurrentWeek();
    }

    while (currentWeek.length < day) {
      currentWeek.push({
        contribution: null,
        key: `empty-start-${weeks.length}-${currentWeek.length}`,
      });
    }

    currentWeek.push({
      contribution,
      key: contribution.date,
    });
  }

  pushCurrentWeek();

  return weeks;
}

function buildMonthLabels(weeks: ContributionWeek[]): MonthLabel[] {
  const labels: MonthLabel[] = [];
  let previousMonth: string | null = null;

  for (const [weekIndex, week] of weeks.entries()) {
    const firstWeekMonthCell = week.cells.find((cell) => {
      if (!cell.contribution) {
        return false;
      }

      return (
        toUtcDate(cell.contribution.date).getUTCDate() <= CONTRIBUTION_DAYS
      );
    });

    if (!firstWeekMonthCell?.contribution) {
      continue;
    }

    const date = toUtcDate(firstWeekMonthCell.contribution.date);
    const month = monthFormatter.format(date);

    if (month === previousMonth) {
      continue;
    }

    labels.push({
      column: weekIndex + 2,
      key: `${month}-${firstWeekMonthCell.contribution.date}`,
      label: month,
    });

    previousMonth = month;
  }

  return labels;
}

function getContributionWindow() {
  const to = new Date();
  const from = new Date(to);

  from.setUTCFullYear(to.getUTCFullYear() - 1);
  from.setUTCDate(from.getUTCDate() + 1);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

function parseGitHubContributions({
  data,
  errors,
}: GitHubContributionsResponse): GitHubContributionsData | null {
  if (errors) {
    return null;
  }

  const calendar =
    data?.user?.contributionsCollection?.contributionCalendar ?? null;

  if (!(calendar && Array.isArray(calendar.weeks))) {
    return null;
  }

  const contributions = calendar.weeks
    .flatMap((week) => {
      if (!(isRecord(week) && Array.isArray(week.contributionDays))) {
        return [];
      }

      return week.contributionDays
        .map(toGitHubContribution)
        .filter((contribution) => contribution !== null);
    })
    .sort((first, second) => first.date.localeCompare(second.date));

  if (contributions.length === 0) {
    return null;
  }

  const total =
    typeof calendar.totalContributions === "number"
      ? calendar.totalContributions
      : contributions.reduce(
          (contributionTotal, contribution) =>
            contributionTotal + contribution.count,
          0
        );

  return {
    contributions,
    total,
  };
}

async function getGitHubContributions(): Promise<GitHubContributionsData | null> {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;

  if (!token) {
    return null;
  }

  try {
    const { from, to } = getContributionWindow();
    const response = await fetch(GITHUB_GRAPHQL_URL, {
      body: JSON.stringify({
        query: GITHUB_CONTRIBUTIONS_QUERY,
        variables: {
          from,
          login: GITHUB_USERNAME,
          to,
        },
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "about-me",
      },
      method: "POST",
      next: {
        revalidate: REVALIDATE_SECONDS,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as GitHubContributionsResponse;

    return parseGitHubContributions(data);
  } catch {
    return null;
  }
}

function GitHubContributionsUnavailable({
  className,
}: GitHubContributionsProps) {
  return (
    <div className={cn("mt-5 space-y-2 text-xs", className)}>
      <div className="work-item-wrapper">
        <Link
          className="granular-dash"
          href={GITHUB_PROFILE_URL}
          rel="noreferrer"
          target="_blank"
        >
          GitHub contributions
        </Link>
        <div className="work-line" />
        <p className="text-muted-foreground">@{GITHUB_USERNAME}</p>
      </div>
      <p className="text-muted-foreground">
        Open the public activity graph on GitHub.
      </p>
    </div>
  );
}

export async function GitHubContributions({
  className,
}: GitHubContributionsProps) {
  const data = await getGitHubContributions();

  if (!data) {
    return <GitHubContributionsUnavailable className={className} />;
  }

  const weeks = buildWeeks(data.contributions);
  const monthLabels = buildMonthLabels(weeks);
  const total = numberFormatter.format(data.total);

  return (
    <figure className={cn("mt-5 space-y-2 text-xs", className)}>
      <figcaption className="flex items-center justify-between gap-4">
        <Link
          className="granular-dash"
          href={GITHUB_PROFILE_URL}
          rel="noreferrer"
          target="_blank"
        >
          GitHub contributions
        </Link>
        <p className="text-muted-foreground">{total} in the last 365 days</p>
      </figcaption>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div
          aria-label={`${total} GitHub contributions by ${GITHUB_USERNAME} in the last 365 days`}
          className="grid min-w-max gap-1"
          role="img"
          style={{
            gridTemplateColumns: `2rem repeat(${weeks.length}, 0.65rem)`,
            gridTemplateRows: "1rem repeat(7, 0.65rem)",
          }}
        >
          {monthLabels.map((month) => (
            <span
              className="text-muted-foreground"
              key={month.key}
              style={{
                gridColumn: month.column,
                gridRow: 1,
              }}
            >
              {month.label}
            </span>
          ))}

          {dayLabels.map((day) => (
            <span
              className="text-muted-foreground"
              key={day.label}
              style={{
                gridColumn: 1,
                gridRow: day.row,
              }}
            >
              {day.label}
            </span>
          ))}

          {weeks.map((week, weekIndex) =>
            week.cells.map((cell, dayIndex) => (
              <span
                aria-hidden="true"
                className={cn(
                  "size-[0.65rem] rounded-[2px]",
                  getContributionLevelClass(cell.contribution?.level ?? 0)
                )}
                key={cell.key}
                style={{
                  gridColumn: weekIndex + 2,
                  gridRow: dayIndex + 2,
                }}
                title={getCalendarCellTitle(cell.contribution)}
              />
            ))
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 text-muted-foreground">
        <Link
          className="granular-dash"
          href={GITHUB_PROFILE_URL}
          rel="noreferrer"
          target="_blank"
        >
          @{GITHUB_USERNAME}
        </Link>
        <div className="flex items-center gap-1">
          <span>Less</span>
          {contributionLevelClasses.map((levelClassName) => (
            <span
              aria-hidden="true"
              className={cn("size-[0.65rem] rounded-[2px]", levelClassName)}
              key={levelClassName}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </figure>
  );
}
