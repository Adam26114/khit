"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RemoveFormatting,
} from "lucide-react";

interface RichTextEditorProps {
  defaultValue?: string;
  placeholder?: string;
  id?: string;
  name?: string;
  "aria-invalid"?: boolean;
}

export function RichTextEditor({
  defaultValue = "",
  placeholder = "Describe your product features, materials, and care instructions...",
  id,
  name,
  "aria-invalid": ariaInvalid,
}: RichTextEditorProps) {
  const [content, setContent] = useState(defaultValue);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4 cursor-pointer",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      CharacterCount.configure({
        limit: 10000,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "is-editor-empty before:content-[attr(data-placeholder)] before:float-left before:h-0 before:pointer-events-none before:text-muted-foreground/60",
      }),
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none min-h-[150px] w-full bg-transparent px-3 py-2 text-sm focus-visible:outline-none",
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4",
          "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3",
          "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2",
          "[&_p]:leading-7 [&_p:not(:first-child)]:mt-2",
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4",
          "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4",
          "[&_li]:mt-1"
        ),
      },
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div
      className={cn(
        "flex flex-col w-full rounded-md border border-input bg-background overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-ring",
        ariaInvalid && "border-destructive focus-within:ring-destructive"
      )}
    >
      <input type="hidden" name={name} id={id} value={content} />
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-1">
        <div className="flex items-center gap-1 px-1 border-r border-border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 rounded-sm", editor.isActive("bold") && "bg-accent text-accent-foreground")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 rounded-sm", editor.isActive("italic") && "bg-accent text-accent-foreground")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 rounded-sm", editor.isActive("underline") && "bg-accent text-accent-foreground")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 rounded-sm", editor.isActive("strike") && "bg-accent text-accent-foreground")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 px-1 border-r border-border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 rounded-sm", editor.isActive("heading", { level: 1 }) && "bg-accent text-accent-foreground")}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 rounded-sm", editor.isActive("heading", { level: 2 }) && "bg-accent text-accent-foreground")}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 rounded-sm", editor.isActive("heading", { level: 3 }) && "bg-accent text-accent-foreground")}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 px-1 border-r border-border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 rounded-sm", editor.isActive("bulletList") && "bg-accent text-accent-foreground")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 rounded-sm", editor.isActive("orderedList") && "bg-accent text-accent-foreground")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 px-1 border-r border-border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 rounded-sm", editor.isActive({ textAlign: "left" }) && "bg-accent text-accent-foreground")}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 rounded-sm", editor.isActive({ textAlign: "center" }) && "bg-accent text-accent-foreground")}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 rounded-sm", editor.isActive({ textAlign: "right" }) && "bg-accent text-accent-foreground")}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 px-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 rounded-sm", editor.isActive("link") && "bg-accent text-accent-foreground")}
            onClick={setLink}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-sm"
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          >
            <RemoveFormatting className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-background relative">
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center justify-end px-3 py-1.5 border-t border-border bg-muted/20 text-[10px] text-muted-foreground">
        {editor.storage.characterCount.words()} words · {editor.storage.characterCount.characters()} characters
      </div>
    </div>
  );
}
