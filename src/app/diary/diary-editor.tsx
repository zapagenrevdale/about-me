"use client";

import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Code2, Italic, Link2, Save, X } from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

import { deleteDiaryEntry, upsertDiaryEntry } from "./actions";
import { EMPTY_TIPTAP_DOCUMENT } from "./date-utils";
import { SlashCommand } from "./slash-command";
import type { DiaryEntryRecord, DiaryPeriod } from "./types";

type DiaryEditorProps = {
  period: DiaryPeriod;
  entry?: DiaryEntryRecord;
  isReadOnly?: boolean;
  onClose: () => void;
  onDeleted?: (periodKey: string) => void;
  onSaved?: (entry: DiaryEntryRecord) => void;
};

type SaveStatus = "saved" | "unsaved" | "saving" | "error";

type EditorDraft = {
  contentJson: JSONContent;
  isPublic: boolean;
  plainText: string;
  isEmpty: boolean;
};

const SAVE_DEBOUNCE_MS = 700;

export function DiaryEditor({
  period,
  entry,
  isReadOnly = false,
  onClose,
  onDeleted,
  onSaved,
}: DiaryEditorProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [isPublic, setIsPublic] = useState(entry?.isPublic ?? false);
  const [isLinkInputOpen, setIsLinkInputOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const saveVersionRef = useRef(0);
  const savedVersionRef = useRef(0);
  const isPublicRef = useRef(entry?.isPublic ?? false);
  const latestDraftRef = useRef<(EditorDraft & { version: number }) | null>(
    null
  );
  const savePromiseRef = useRef<Promise<boolean> | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const linkInputRef = useRef<HTMLInputElement | null>(null);

  const initialContent = entry?.contentJson ?? EMPTY_TIPTAP_DOCUMENT;

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        link: false,
      }),
      LinkExtension.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return "Heading";
          }

          return "Start writing";
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      SlashCommand,
    ],
    []
  );

  const persistDraft = useCallback(
    async (nextDraft: EditorDraft) => {
      if (isReadOnly) {
        return;
      }

      if (nextDraft.isEmpty) {
        await deleteDiaryEntry(period.key);
        onDeleted?.(period.key);
        return;
      }

      const savedEntry = await upsertDiaryEntry({
        periodKey: period.key,
        periodType: period.type,
        periodStart: period.start,
        contentJson: nextDraft.contentJson,
        isPublic: nextDraft.isPublic,
        plainText: nextDraft.plainText,
      });

      onSaved?.(savedEntry);
    },
    [isReadOnly, onDeleted, onSaved, period.key, period.start, period.type]
  );

  const runSaveQueue = useCallback(() => {
    if (savePromiseRef.current) {
      return savePromiseRef.current;
    }

    if (!latestDraftRef.current) {
      return Promise.resolve(true);
    }

    const savePromise = (async () => {
      try {
        setSaveStatus("saving");

        while (
          latestDraftRef.current &&
          latestDraftRef.current.version > savedVersionRef.current
        ) {
          const nextDraft = latestDraftRef.current;
          await persistDraft(nextDraft);
          savedVersionRef.current = nextDraft.version;

          if (latestDraftRef.current?.version === nextDraft.version) {
            latestDraftRef.current = null;
          }
        }

        if (saveTimeoutRef.current !== null) {
          window.clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }

        setSaveStatus("saved");
        return true;
      } catch {
        setSaveStatus("error");
        return false;
      } finally {
        savePromiseRef.current = null;
      }
    })();

    savePromiseRef.current = savePromise;

    return savePromise;
  }, [persistDraft]);

  const queueDraft = useCallback(
    (nextDraft: EditorDraft) => {
      if (isReadOnly) {
        return;
      }

      saveVersionRef.current += 1;
      latestDraftRef.current = {
        ...nextDraft,
        version: saveVersionRef.current,
      };
      setSaveStatus("unsaved");

      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = window.setTimeout(() => {
        saveTimeoutRef.current = null;
        runSaveQueue().catch(() => undefined);
      }, SAVE_DEBOUNCE_MS);
    },
    [isReadOnly, runSaveQueue]
  );

  const flushPendingSave = useCallback(async () => {
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    return await runSaveQueue();
  }, [runSaveQueue]);

  useEffect(
    () => () => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    isPublicRef.current = isPublic;
  }, [isPublic]);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !isReadOnly,
    extensions,
    content: initialContent,
    editorProps: {
      attributes: {
        class: "diary-editor-surface",
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      if (isReadOnly) {
        return;
      }

      queueDraft({
        contentJson: updatedEditor.getJSON(),
        isPublic: isPublicRef.current,
        plainText: updatedEditor.getText().trim(),
        isEmpty: updatedEditor.isEmpty,
      });
    },
  });

  useEffect(() => {
    if (isLinkInputOpen) {
      linkInputRef.current?.focus();
    }
  }, [isLinkInputOpen]);

  const openLinkInput = () => {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    setLinkValue(previousUrl ?? "");
    setIsLinkInputOpen(true);
  };

  const applyLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editor) {
      return;
    }

    if (linkValue.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setIsLinkInputOpen(false);
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkValue.trim() })
      .run();
    setIsLinkInputOpen(false);
  };

  const handleClose = useCallback(async () => {
    if (isClosing) {
      return;
    }

    if (isReadOnly) {
      onClose();
      return;
    }

    setIsClosing(true);

    if (await flushPendingSave()) {
      onClose();
      return;
    }

    setIsClosing(false);
  }, [flushPendingSave, isClosing, isReadOnly, onClose]);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      handleClose().catch(() => undefined);
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleClose]);

  const handleVisibilityChange = (nextIsPublic: boolean) => {
    if (isReadOnly || !editor) {
      return;
    }

    setIsPublic(nextIsPublic);

    queueDraft({
      contentJson: editor.getJSON(),
      isPublic: nextIsPublic,
      plainText: editor.getText().trim(),
      isEmpty: editor.isEmpty,
    });
  };

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
          <div className="flex shrink-0 flex-col items-center gap-1">
            <button
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
              disabled={isClosing}
              onClick={handleClose}
              title="Close"
              type="button"
            >
              <X size={16} />
            </button>
            {isReadOnly ? (
              <span className="text-muted-foreground text-xs">public</span>
            ) : (
              <VisibilityToggle
                isPublic={isPublic}
                onChange={handleVisibilityChange}
              />
            )}
          </div>
        </header>

        <div className="diary-editor flex-1 overflow-y-auto px-5 py-8 md:px-12">
          {editor ? (
            <>
              {isReadOnly ? null : (
                <BubbleMenu
                  className="diary-bubble-menu"
                  editor={editor}
                  shouldShow={({ editor: menuEditor }) =>
                    !menuEditor.state.selection.empty
                  }
                >
                  <BubbleButton
                    isActive={editor.isActive("bold")}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title="Bold"
                  >
                    <Bold size={14} />
                  </BubbleButton>
                  <BubbleButton
                    isActive={editor.isActive("italic")}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    title="Italic"
                  >
                    <Italic size={14} />
                  </BubbleButton>
                  <BubbleButton
                    isActive={editor.isActive("code")}
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    title="Code"
                  >
                    <Code2 size={14} />
                  </BubbleButton>
                  <BubbleButton
                    isActive={editor.isActive("link")}
                    onClick={openLinkInput}
                    title="Link"
                  >
                    <Link2 size={14} />
                  </BubbleButton>
                  {isLinkInputOpen ? (
                    <form
                      className="flex items-center gap-1"
                      onSubmit={applyLink}
                    >
                      <input
                        className="h-8 w-44 rounded-md bg-muted px-2 text-xs outline-none"
                        onChange={(event) => setLinkValue(event.target.value)}
                        ref={linkInputRef}
                        type="url"
                        value={linkValue}
                      />
                      <button
                        className="h-8 rounded-md px-2 text-muted-foreground text-xs transition hover:bg-muted hover:text-foreground"
                        type="submit"
                      >
                        Set
                      </button>
                    </form>
                  ) : null}
                </BubbleMenu>
              )}
              <EditorContent editor={editor} />
            </>
          ) : (
            <div className="text-muted-foreground text-sm">
              Loading editor...
            </div>
          )}
        </div>
        {isReadOnly ? null : <SaveIndicator status={saveStatus} />}
      </div>
    </aside>
  );
}

type VisibilityToggleProps = {
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
};

function VisibilityToggle({ isPublic, onChange }: VisibilityToggleProps) {
  return (
    <button
      className="bg-transparent p-0 text-muted-foreground text-xs transition hover:text-foreground focus:outline-none focus:ring-0"
      onClick={() => onChange(!isPublic)}
      title="Toggle visibility"
      type="button"
    >
      {isPublic ? "public" : "private"}
    </button>
  );
}

type BubbleButtonProps = {
  children: ReactNode;
  isActive?: boolean;
  onClick: () => void;
  title: string;
};

function BubbleButton({
  children,
  isActive = false,
  onClick,
  title,
}: BubbleButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground",
        isActive && "bg-muted text-foreground"
      )}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  const label = {
    error: "Not saved",
    saved: "Saved",
    saving: "Saving",
    unsaved: "Unsaved",
  }[status];

  return (
    <span
      className={cn(
        "pointer-events-none fixed right-5 bottom-5 z-[60] inline-flex h-8 items-center gap-1.5 text-[11px] text-muted-foreground md:right-8",
        status === "error" && "text-destructive"
      )}
    >
      <Save size={13} />
      {label}
    </span>
  );
}
