import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Youtube from "@tiptap/extension-youtube";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";

import { headingLevels, safeHref } from "../../rich-text";

/**
 * Library images remember their `media_assets` id and size, so the article can use `next/image`
 * and the library knows the image is in use.
 */
const LibraryImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null },
      height: { default: null },
      mediaId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-media-id"),
        renderHTML: (attributes: { mediaId?: string | null }) =>
          attributes.mediaId ? { "data-media-id": attributes.mediaId } : {},
      },
    };
  },
});

/**
 * The editor's schema: what the toolbar can make is what `sanitizeDoc()` keeps (`rich-text.ts`).
 * Anything else pasted or imported is dropped by the schema here, and again on save.
 */
export function editorExtensions(placeholder: string) {
  return [
    StarterKit.configure({
      heading: { levels: [...headingLevels] },
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        isAllowedUri: (url) => safeHref(url) !== null,
        HTMLAttributes: { rel: "noopener noreferrer", target: null },
      },
      codeBlock: { HTMLAttributes: { spellcheck: "false" } },
    }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    LibraryImage.configure({ inline: false, allowBase64: false }),
    Youtube.configure({
      nocookie: true,
      modestBranding: true,
      controls: true,
      width: 640,
      height: 360,
    }),
    TableKit.configure({ table: { resizable: false } }),
    Placeholder.configure({ placeholder }),
    CharacterCount,
  ];
}
