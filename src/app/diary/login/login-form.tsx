"use client";

import { LockKeyhole, LogIn } from "lucide-react";
import { useActionState } from "react";

import { type DiaryLoginState, loginToDiary } from "./actions";

const initialState: DiaryLoginState = {
  error: null,
};

export function DiaryLoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginToDiary,
    initialState
  );

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <div className="grid gap-2">
        <label className="text-neutral-400 text-xs" htmlFor="diary-password">
          Password
        </label>
        <div className="flex items-center gap-2 border-border border-b py-2">
          <LockKeyhole className="size-4 text-muted-foreground" />
          <input
            autoComplete="current-password"
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            id="diary-password"
            name="password"
            placeholder="Enter password"
            required
            type="password"
          />
        </div>
      </div>

      {state.error ? (
        <p className="text-destructive text-xs" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        className="granular-dash flex w-fit items-center gap-1 text-neutral-700 transition hover:text-foreground disabled:opacity-50 dark:text-neutral-300"
        disabled={isPending}
        type="submit"
      >
        <LogIn className="h-4 w-4" />
        {isPending ? "Checking" : "Enter"}
      </button>
    </form>
  );
}
