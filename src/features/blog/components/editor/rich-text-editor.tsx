"use client";

import { NodeSelection, Selection, type Transaction } from "@tiptap/pm/state";
import { EditorContent, useEditor, useEditorState, type JSONContent } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { MediaLibraryDialog } from "@/components/admin/media-library-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { MediaOption } from "@/features/media/admin-queries";
import { cn } from "@/lib/utils";

import { safeHref, safeImageSrc, youtubeVideoId, youtubeWatchUrl } from "../../rich-text";
import { EditorDialog, type EditorDialogField } from "./editor-dialog";
import { EditorToolbar, type EditorDialogKind } from "./editor-toolbar";
import { editorExtensions } from "./extensions";

type RichTextEditorProps = {
  /** The document to start from (stored JSON); later changes come from the editor itself. */
  value: unknown;
  onChange: (doc: JSONContent) => void;
  /** Accessible name of the writing area. */
  label: string;
  placeholder: string;
  invalid?: boolean;
  /** Id of the field's error message. */
  describedBy?: string;
  mediaOptions: readonly MediaOption[];
  canUseLibrary: boolean;
  canUpload: boolean;
};

/** The editor's document as plain objects (a JSON round trip drops null prototypes). */
const toPlainJson = (doc: JSONContent): JSONContent =>
  JSON.parse(JSON.stringify(doc)) as JSONContent;

/**
 * Puts the caret right after the current selection. After inserting (or editing) an image or a
 * video, that node is selected; without this the next insertion would replace it.
 */
const caretAfterSelection = ({ tr }: { tr: Transaction }) => {
  tr.setSelection(Selection.near(tr.doc.resolve(tr.selection.to), 1));
  return true;
};

/** "bec.id/x" → "https://bec.id/x"; anything not allowed → `null`. */
function normalizeHref(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  return safeHref(value) ?? safeHref(`https://${value.replace(/^\/+/, "")}`);
}

/**
 * The blog's writing area (Tiptap): a sticky formatting toolbar, the document and a word and
 * character count. Its JSON is what the post stores; `sanitizeDoc()` checks it again on save.
 */
export function RichTextEditor({
  value,
  onChange,
  label,
  placeholder,
  invalid,
  describedBy,
  mediaOptions,
  canUseLibrary,
  canUpload,
}: RichTextEditorProps) {
  const t = useTranslations("AdminBlog.editor");
  const [dialog, setDialog] = useState<EditorDialogKind | null>(null);
  const [library, setLibrary] = useState(false);
  const extensions = useMemo(() => editorExtensions(placeholder), [placeholder]);

  const editor = useEditor({
    extensions,
    content: (value as JSONContent | null) ?? null,
    // Rendered on the client only: the server has no editor to hydrate.
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: "rich-text-editor-content",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
        ...(invalid ? { "aria-invalid": "true" } : {}),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
      },
    },
    // ProseMirror builds `attrs` with `Object.create(null)`, which a Server Action cannot receive
    // (React sends such objects as opaque references): pass plain JSON on.
    onUpdate: ({ editor: current }) => onChange(toPlainJson(current.getJSON())),
  });

  const counts = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current
        ? {
            words: current.storage.characterCount.words() as number,
            characters: current.storage.characterCount.characters() as number,
          }
        : { words: 0, characters: 0 },
  });

  if (!editor) {
    return <Skeleton aria-hidden className="h-[28rem] rounded-xl" />;
  }

  const close = () => setDialog(null);
  const common = {
    cancelLabel: t("dialogs.cancel"),
    onOpenChange: (open: boolean) => !open && close(),
  };
  const linkHref = (editor.getAttributes("link").href as string | undefined) ?? "";
  const image = editor.getAttributes("image") as { alt?: string; title?: string };

  const dialogs: Record<
    EditorDialogKind,
    {
      title: string;
      description?: string;
      fields: EditorDialogField[];
      submitLabel: string;
      onSubmit: (values: Record<string, string>) => Partial<Record<string, string>> | void;
      extra?: { label: string; onClick: () => void };
    }
  > = {
    link: {
      title: t("dialogs.link.title"),
      description: t("dialogs.link.description"),
      fields: [
        {
          name: "href",
          label: t("dialogs.link.url"),
          type: "url",
          required: true,
          defaultValue: linkHref,
          placeholder: "https://",
        },
      ],
      submitLabel: t("dialogs.apply"),
      onSubmit: ({ href = "" }) => {
        const url = normalizeHref(href);
        if (!url) return { href: t("dialogs.invalidUrl") };
        const { empty } = editor.state.selection;
        if (empty && !editor.isActive("link")) {
          editor
            .chain()
            .focus()
            .insertContent({
              type: "text",
              text: url,
              marks: [{ type: "link", attrs: { href: url } }],
            })
            .run();
        } else {
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }
      },
      extra: linkHref
        ? {
            label: t("dialogs.link.remove"),
            onClick: () => editor.chain().focus().extendMarkRange("link").unsetLink().run(),
          }
        : undefined,
    },
    imageUrl: {
      title: t("dialogs.imageUrl.title"),
      description: t("dialogs.imageUrl.description"),
      fields: [
        {
          name: "src",
          label: t("dialogs.imageUrl.url"),
          type: "url",
          required: true,
          placeholder: "https://",
        },
        {
          name: "alt",
          label: t("dialogs.image.alt"),
          description: t("dialogs.image.altHint"),
          required: true,
        },
        { name: "title", label: t("dialogs.image.caption") },
      ],
      submitLabel: t("dialogs.insert"),
      onSubmit: ({ src = "", alt = "", title = "" }) => {
        const url = safeImageSrc(src.trim());
        const errors: Record<string, string> = {};
        if (!url || !url.startsWith("https://")) errors.src = t("dialogs.imageUrl.invalid");
        if (!alt.trim()) errors.alt = t("dialogs.image.altRequired");
        if (Object.keys(errors).length > 0 || !url) return errors;
        editor
          .chain()
          .focus()
          .insertContent({
            type: "image",
            attrs: { src: url, alt: alt.trim(), title: title.trim() || null },
          })
          .command(caretAfterSelection)
          .run();
      },
    },
    imageDetails: {
      title: t("dialogs.image.title"),
      fields: [
        {
          name: "alt",
          label: t("dialogs.image.alt"),
          description: t("dialogs.image.altHint"),
          required: true,
          defaultValue: image.alt ?? "",
        },
        { name: "title", label: t("dialogs.image.caption"), defaultValue: image.title ?? "" },
      ],
      submitLabel: t("dialogs.apply"),
      onSubmit: ({ alt = "", title = "" }) => {
        if (!alt.trim()) return { alt: t("dialogs.image.altRequired") };
        editor
          .chain()
          .focus()
          .updateAttributes("image", { alt: alt.trim(), title: title.trim() || null })
          .command(caretAfterSelection)
          .run();
      },
    },
    youtube: {
      title: t("dialogs.youtube.title"),
      description: t("dialogs.youtube.description"),
      fields: [
        {
          name: "url",
          label: t("dialogs.youtube.url"),
          type: "url",
          required: true,
          placeholder: "https://www.youtube.com/watch?v=…",
        },
      ],
      submitLabel: t("dialogs.insert"),
      onSubmit: ({ url = "" }) => {
        const id = youtubeVideoId(url);
        if (!id) return { url: t("dialogs.youtube.invalid") };
        editor
          .chain()
          .focus()
          .setYoutubeVideo({ src: youtubeWatchUrl(id) })
          .command(caretAfterSelection)
          .run();
      },
    },
    importHtml: {
      title: t("dialogs.importHtml.title"),
      description: t("dialogs.importHtml.description"),
      fields: [
        {
          name: "html",
          label: t("dialogs.importHtml.label"),
          multiline: true,
          required: true,
          placeholder: "<h2>…</h2><p>…</p>",
        },
      ],
      submitLabel: t("dialogs.importHtml.submit"),
      onSubmit: ({ html = "" }) => {
        if (!html.trim()) return { html: t("dialogs.importHtml.empty") };
        // Parsed by the editor's schema: unsupported tags and attributes are dropped.
        if (editor.isEmpty) editor.commands.setContent(html, { emitUpdate: true });
        else editor.chain().focus().insertContent(html).run();
      },
    },
  };

  return (
    <div
      className={cn(
        "rich-text-editor overflow-clip rounded-xl border bg-background/80 transition-[border-color,box-shadow] duration-(--duration-fast) focus-within:border-primary focus-within:ring-4 focus-within:ring-primary-soft",
        invalid ? "border-destructive" : "border-input",
      )}
    >
      {/* Sticks under the admin top bar while a long article scrolls. */}
      <div className="sticky top-20 z-(--z-sticky)">
        <EditorToolbar
          editor={editor}
          onDialog={setDialog}
          onLibraryImage={() => setLibrary(true)}
          canUseLibrary={canUseLibrary}
        />
      </div>
      <EditorContent editor={editor} />
      <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-border/70 px-5 py-2.5 text-caption text-muted-foreground tabular-nums">
        <span>{t("counts.words", { count: counts?.words ?? 0 })}</span>
        <span>{t("counts.characters", { count: counts?.characters ?? 0 })}</span>
      </div>

      {dialog && (
        <EditorDialog
          key={dialog}
          open
          onClosed={() =>
            editor
              .chain()
              .focus()
              // A cancelled dialog can leave an image or video selected: step past it.
              .command(({ tr }) => {
                if (tr.selection instanceof NodeSelection) caretAfterSelection({ tr });
                return true;
              })
              .run()
          }
          {...common}
          {...dialogs[dialog]}
        />
      )}
      {canUseLibrary && (
        <MediaLibraryDialog
          open={library}
          onOpenChange={setLibrary}
          options={mediaOptions}
          canUpload={canUpload}
          onPick={(media) => {
            editor
              .chain()
              .focus()
              .insertContent({
                type: "image",
                attrs: {
                  src: media.src,
                  alt: "",
                  mediaId: media.id,
                  width: media.width,
                  height: media.height,
                },
              })
              .run();
            // Alt text belongs to the image: select the new image and ask for it right away.
            let position: number | null = null;
            editor.state.doc.descendants((node, pos) => {
              if (
                node.type.name === "image" &&
                node.attrs.mediaId === media.id &&
                !node.attrs.alt
              ) {
                position = pos;
              }
            });
            if (position !== null) {
              editor.commands.setNodeSelection(position);
              setDialog("imageDetails");
            }
          }}
        />
      )}
    </div>
  );
}
