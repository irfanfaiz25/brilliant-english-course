"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BaselineIcon,
  BoldIcon,
  CodeIcon,
  CodeXmlIcon,
  FileCodeIcon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  HighlighterIcon,
  ImageIcon,
  ImagePlusIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  QuoteIcon,
  Redo2Icon,
  SquarePenIcon,
  StrikethroughIcon,
  TableIcon,
  UnderlineIcon,
  Undo2Icon,
  SquarePlayIcon,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { KeyboardEvent, ReactNode } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { highlightColors, textColors, type TextAlign } from "../../rich-text";

/** Dialogs the toolbar opens (owned by the editor). */
export type EditorDialogKind = "link" | "imageUrl" | "imageDetails" | "youtube" | "importHtml";

type ToolbarProps = {
  editor: Editor;
  onDialog: (kind: EditorDialogKind) => void;
  onLibraryImage: () => void;
  /** Library images need `media` read access. */
  canUseLibrary: boolean;
};

const buttonClass = cn(
  "inline-flex size-9 shrink-0 items-center justify-center rounded-md text-foreground transition-colors duration-(--duration-fast)",
  "hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
  "disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-[1.125rem]",
  "aria-pressed:bg-primary-soft aria-pressed:text-primary",
);

function ToolButton({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      disabled={disabled}
      // Keep the text selection: a mouse press on the toolbar must not blur the editor.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={buttonClass}
    >
      <Icon aria-hidden />
    </button>
  );
}

const Divider = () => <span aria-hidden className="mx-1 h-6 w-px shrink-0 bg-border" />;

/** A palette of brand colors, plus "no color". */
function ColorMenu({
  icon,
  label,
  colors,
  current,
  swatch,
  onPick,
  onClear,
  names,
}: {
  icon: LucideIcon;
  label: string;
  colors: Record<string, string>;
  current: string | null;
  swatch: "text" | "background";
  onPick: (color: string) => void;
  onClear: () => void;
  names: (key: string) => string;
}) {
  const t = useTranslations("AdminBlog.editor");
  const Icon = icon;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={current !== null}
          onMouseDown={(event) => event.preventDefault()}
          className={buttonClass}
        >
          <span className="relative">
            <Icon aria-hidden />
            <span
              aria-hidden
              className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full"
              style={{ backgroundColor: current ?? "transparent" }}
            />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3" onOpenAutoFocus={(event) => event.preventDefault()}>
        <p className="mb-2 text-caption font-semibold text-muted-foreground">{label}</p>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(colors).map(([key, value]) => (
            <button
              key={key}
              type="button"
              title={names(key)}
              aria-label={names(key)}
              aria-pressed={current === value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onPick(value)}
              className="flex size-9 items-center justify-center rounded-md border border-border transition-transform duration-(--duration-fast) hover:scale-105 focus-visible:outline-2 focus-visible:outline-ring aria-pressed:ring-2 aria-pressed:ring-primary aria-pressed:ring-offset-1"
              style={swatch === "background" ? { backgroundColor: value } : undefined}
            >
              {swatch === "text" && (
                <span aria-hidden className="text-body font-bold" style={{ color: value }}>
                  A
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClear}
          className="mt-3 w-full rounded-md px-2 py-1.5 text-left text-body-sm font-semibold text-muted-foreground hover:bg-muted"
        >
          {t("colors.none")}
        </button>
      </PopoverContent>
    </Popover>
  );
}

/** Insert a table, or work on the one the caret is in. */
function TableMenu({ editor, inTable }: { editor: Editor; inTable: boolean }) {
  const t = useTranslations("AdminBlog.editor.table");
  const run = (command: (chain: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) =>
    command(editor.chain().focus()).run();
  const items: { label: string; onClick: () => void; danger?: boolean }[] = inTable
    ? [
        { label: t("addRowBefore"), onClick: () => run((c) => c.addRowBefore()) },
        { label: t("addRowAfter"), onClick: () => run((c) => c.addRowAfter()) },
        { label: t("addColumnBefore"), onClick: () => run((c) => c.addColumnBefore()) },
        { label: t("addColumnAfter"), onClick: () => run((c) => c.addColumnAfter()) },
        { label: t("toggleHeaderRow"), onClick: () => run((c) => c.toggleHeaderRow()) },
        { label: t("mergeOrSplit"), onClick: () => run((c) => c.mergeOrSplit()) },
        { label: t("deleteRow"), onClick: () => run((c) => c.deleteRow()), danger: true },
        { label: t("deleteColumn"), onClick: () => run((c) => c.deleteColumn()), danger: true },
        { label: t("deleteTable"), onClick: () => run((c) => c.deleteTable()), danger: true },
      ]
    : [];

  if (!inTable) {
    return (
      <ToolButton
        icon={TableIcon}
        label={t("insert")}
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      />
    );
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={t("menu")}
          aria-label={t("menu")}
          aria-pressed
          onMouseDown={(event) => event.preventDefault()}
          className={buttonClass}
        >
          <TableIcon aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1.5" onOpenAutoFocus={(event) => event.preventDefault()}>
        <ul className="flex flex-col">
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={item.onClick}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-body-sm hover:bg-muted",
                  item.danger ? "text-destructive-strong" : "text-foreground",
                )}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

/** Arrow keys move between toolbar buttons (WAI-ARIA toolbar pattern). */
function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  const buttons = [
    ...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
  ];
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  if (index === -1) return;
  event.preventDefault();
  const next = (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
  buttons[next]?.focus();
}

/** The editor's formatting toolbar (sticky while the article scrolls). */
export function EditorToolbar({ editor, onDialog, onLibraryImage, canUseLibrary }: ToolbarProps) {
  const t = useTranslations("AdminBlog.editor");
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      h4: e.isActive("heading", { level: 4 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      highlight: (e.getAttributes("highlight").color as string | undefined) ?? null,
      color: (e.getAttributes("textStyle").color as string | undefined) ?? null,
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      blockquote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      align: (["left", "center", "right", "justify"] as const).find((align) =>
        e.isActive({ textAlign: align }),
      ),
      link: e.isActive("link"),
      image: e.isActive("image"),
      table: e.isActive("table"),
    }),
  });
  const chain = () => editor.chain().focus();
  const alignIcons: Record<TextAlign, LucideIcon> = {
    left: AlignLeftIcon,
    center: AlignCenterIcon,
    right: AlignRightIcon,
    justify: AlignJustifyIcon,
  };

  const group = (children: ReactNode) => (
    <div className="flex items-center gap-0.5">{children}</div>
  );

  return (
    <div
      role="toolbar"
      aria-label={t("toolbar")}
      aria-orientation="horizontal"
      onKeyDown={moveFocus}
      className="flex flex-wrap items-center gap-y-1 border-b border-border/70 bg-background/95 px-2 py-1.5 backdrop-blur-sm"
    >
      {group(
        <>
          <ToolButton
            icon={Undo2Icon}
            label={t("undo")}
            onClick={() => chain().undo().run()}
            disabled={!state.canUndo}
          />
          <ToolButton
            icon={Redo2Icon}
            label={t("redo")}
            onClick={() => chain().redo().run()}
            disabled={!state.canRedo}
          />
        </>,
      )}
      <Divider />
      {group(
        <>
          <ToolButton
            icon={Heading2Icon}
            label={t("heading", { level: 2 })}
            active={state.h2}
            onClick={() => chain().toggleHeading({ level: 2 }).run()}
          />
          <ToolButton
            icon={Heading3Icon}
            label={t("heading", { level: 3 })}
            active={state.h3}
            onClick={() => chain().toggleHeading({ level: 3 }).run()}
          />
          <ToolButton
            icon={Heading4Icon}
            label={t("heading", { level: 4 })}
            active={state.h4}
            onClick={() => chain().toggleHeading({ level: 4 }).run()}
          />
        </>,
      )}
      <Divider />
      {group(
        <>
          <ToolButton
            icon={BoldIcon}
            label={t("bold")}
            active={state.bold}
            onClick={() => chain().toggleBold().run()}
          />
          <ToolButton
            icon={ItalicIcon}
            label={t("italic")}
            active={state.italic}
            onClick={() => chain().toggleItalic().run()}
          />
          <ToolButton
            icon={UnderlineIcon}
            label={t("underline")}
            active={state.underline}
            onClick={() => chain().toggleUnderline().run()}
          />
          <ToolButton
            icon={StrikethroughIcon}
            label={t("strike")}
            active={state.strike}
            onClick={() => chain().toggleStrike().run()}
          />
          <ColorMenu
            icon={HighlighterIcon}
            label={t("highlight")}
            colors={highlightColors}
            current={state.highlight}
            swatch="background"
            names={(key) => t(`colors.highlight.${key as keyof typeof highlightColors}`)}
            onPick={(color) => chain().setHighlight({ color }).run()}
            onClear={() => chain().unsetHighlight().run()}
          />
          <ColorMenu
            icon={BaselineIcon}
            label={t("textColor")}
            colors={textColors}
            current={state.color}
            swatch="text"
            names={(key) => t(`colors.text.${key as keyof typeof textColors}`)}
            onPick={(color) => chain().setColor(color).run()}
            onClear={() => chain().unsetColor().run()}
          />
        </>,
      )}
      <Divider />
      {group(
        <>
          <ToolButton
            icon={ListIcon}
            label={t("bulletList")}
            active={state.bulletList}
            onClick={() => chain().toggleBulletList().run()}
          />
          <ToolButton
            icon={ListOrderedIcon}
            label={t("orderedList")}
            active={state.orderedList}
            onClick={() => chain().toggleOrderedList().run()}
          />
          <ToolButton
            icon={QuoteIcon}
            label={t("blockquote")}
            active={state.blockquote}
            onClick={() => chain().toggleBlockquote().run()}
          />
          <ToolButton
            icon={CodeIcon}
            label={t("code")}
            active={state.code}
            onClick={() => chain().toggleCode().run()}
          />
          <ToolButton
            icon={CodeXmlIcon}
            label={t("codeBlock")}
            active={state.codeBlock}
            onClick={() => chain().toggleCodeBlock().run()}
          />
        </>,
      )}
      <Divider />
      {group(
        (["left", "center", "right", "justify"] as const).map((align) => (
          <ToolButton
            key={align}
            icon={alignIcons[align]}
            label={t(`align.${align}`)}
            active={(state.align ?? "left") === align}
            onClick={() => chain().setTextAlign(align).run()}
          />
        )),
      )}
      <Divider />
      {group(
        <>
          <ToolButton
            icon={LinkIcon}
            label={t("link")}
            active={state.link}
            onClick={() => onDialog("link")}
          />
          {canUseLibrary && (
            <ToolButton icon={ImageIcon} label={t("imageLibrary")} onClick={onLibraryImage} />
          )}
          <ToolButton
            icon={ImagePlusIcon}
            label={t("imageUrl")}
            onClick={() => onDialog("imageUrl")}
          />
          {state.image && (
            <ToolButton
              icon={SquarePenIcon}
              label={t("imageDetails")}
              onClick={() => onDialog("imageDetails")}
            />
          )}
          <TableMenu editor={editor} inTable={state.table} />
          <ToolButton
            icon={SquarePlayIcon}
            label={t("youtube")}
            onClick={() => onDialog("youtube")}
          />
          <ToolButton
            icon={MinusIcon}
            label={t("horizontalRule")}
            onClick={() => chain().setHorizontalRule().run()}
          />
        </>,
      )}
      <Divider />
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onDialog("importHtml")}
        className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-caption font-semibold tracking-wide text-foreground uppercase hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
      >
        <FileCodeIcon aria-hidden className="size-4" />
        {t("importHtml")}
      </button>
    </div>
  );
}
