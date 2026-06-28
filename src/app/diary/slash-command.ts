"use client";

import { type Editor, Extension, type Range } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion, {
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from "@tiptap/suggestion";

type SlashCommandItem = {
  title: string;
  description: string;
  run: (editor: Editor, range: Range) => void;
};

const slashCommandKey = new PluginKey("diarySlashCommand");

const slashCommandItems: SlashCommandItem[] = [
  {
    title: "Text",
    description: "Plain paragraph",
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: "Heading 1",
    description: "Large section title",
    run: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 1 })
        .run();
    },
  },
  {
    title: "Heading 2",
    description: "Small section title",
    run: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 2 })
        .run();
    },
  },
  {
    title: "Bullet list",
    description: "Simple list",
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered list",
    description: "Ordered steps",
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "To-do",
    description: "Checkbox list",
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Quote",
    description: "Indented note",
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Divider",
    description: "Horizontal rule",
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Code block",
    description: "Preformatted text",
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
];

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashCommandItem, SlashCommandItem>({
        editor: this.editor,
        char: "/",
        pluginKey: slashCommandKey,
        startOfLine: true,
        command: ({ editor, range, props }) => {
          props.run(editor, range);
        },
        items: ({ query }) => {
          const normalizedQuery = query.toLowerCase().trim();

          if (!normalizedQuery) {
            return slashCommandItems;
          }

          return slashCommandItems.filter((item) =>
            `${item.title} ${item.description}`
              .toLowerCase()
              .includes(normalizedQuery)
          );
        },
        render: () => {
          let selectedIndex = 0;
          let element: HTMLDivElement | null = null;
          let unmount: (() => void) | null = null;
          let currentProps: SuggestionProps<
            SlashCommandItem,
            SlashCommandItem
          > | null = null;

          const renderMenu = (
            props: SuggestionProps<SlashCommandItem, SlashCommandItem>
          ) => {
            if (!element) {
              return;
            }

            element.replaceChildren();

            if (props.items.length === 0) {
              const empty = document.createElement("div");
              empty.className = "diary-slash-menu-empty";
              empty.textContent = "No blocks";
              element.append(empty);
              return;
            }

            for (const [index, item] of props.items.entries()) {
              const button = document.createElement("button");
              const title = document.createElement("span");
              const description = document.createElement("span");

              button.type = "button";
              button.className =
                index === selectedIndex
                  ? "diary-slash-menu-item is-selected"
                  : "diary-slash-menu-item";
              title.className = "diary-slash-menu-title";
              title.textContent = item.title;
              description.className = "diary-slash-menu-description";
              description.textContent = item.description;

              button.append(title, description);
              button.addEventListener("mousedown", (event) => {
                event.preventDefault();
                props.command(item);
              });

              element.append(button);
            }
          };

          const updateMenu = (
            props: SuggestionProps<SlashCommandItem, SlashCommandItem>
          ) => {
            currentProps = props;
            selectedIndex = Math.min(selectedIndex, props.items.length - 1);
            selectedIndex = Math.max(selectedIndex, 0);
            renderMenu(props);
          };

          return {
            onStart: (props) => {
              element = document.createElement("div");
              element.className = "diary-slash-menu";
              updateMenu(props);
              unmount = props.mount(element);
            },
            onUpdate: updateMenu,
            onKeyDown: ({ event }: SuggestionKeyDownProps) => {
              if (!currentProps) {
                return false;
              }

              const itemCount = Math.max(currentProps.items.length, 1);

              switch (event.key) {
                case "ArrowDown":
                  selectedIndex = (selectedIndex + 1) % itemCount;
                  renderMenu(currentProps);
                  return true;
                case "ArrowUp":
                  selectedIndex = (selectedIndex + itemCount - 1) % itemCount;
                  renderMenu(currentProps);
                  return true;
                case "Enter":
                  return selectCurrentItem(currentProps, selectedIndex);
                case "Escape":
                  return true;
                default:
                  return false;
              }
            },
            onExit: () => {
              unmount?.();
              unmount = null;
              element = null;
              currentProps = null;
              selectedIndex = 0;
            },
          };
        },
      }),
    ];
  },
});

function selectCurrentItem(
  props: SuggestionProps<SlashCommandItem, SlashCommandItem>,
  selectedIndex: number
) {
  const item = props.items[selectedIndex];

  if (!item) {
    return false;
  }

  props.command(item);

  return true;
}
