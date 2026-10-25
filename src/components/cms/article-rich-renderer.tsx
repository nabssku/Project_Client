import React from "react";
import { ExternalLink } from "lucide-react";

interface ArticleRichRendererProps {
  content: string;
  className?: string;
}

// Parses inline formatting: **bold**, *italic*, `code`, [text](url), and ![alt](url)
function parseInline(text: string): React.ReactNode[] {
  if (!text) return [];

  // Tokenize regex for images, links, bold, italic, inline code
  const regex = /(!?\[[^\]]*\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Image: ![alt](url)
    if (part.startsWith("![") && part.includes("](") && part.endsWith(")")) {
      const match = part.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (match) {
        const [, alt, url] = match;
        return (
          <span key={index} className="block my-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={alt || "Gambar artikel"}
              className="w-full max-h-[480px] object-cover rounded-xl shadow-xs border border-gray-200"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            {alt && (
              <span className="block text-center text-xs text-gray-500 mt-1.5 italic">
                {alt}
              </span>
            )}
          </span>
        );
      }
    }

    // Link: [text](url)
    if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
      const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (match) {
        const [, linkText, url] = match;
        const isExternal = url.startsWith("http://") || url.startsWith("https://");
        return (
          <a
            key={index}
            href={url}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="text-accent font-semibold underline decoration-accent/40 hover:decoration-accent hover:text-accent-dark transition-colors inline-flex items-center gap-0.5 mx-0.5"
          >
            <span>{linkText}</span>
            {isExternal && <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-70" />}
          </a>
        );
      }
    }

    // Bold: **text**
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic: *text*
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Inline code: `code`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          className="bg-gray-100 text-[#1a1a2e] px-1.5 py-0.5 rounded text-xs font-mono font-medium"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export function ArticleRichRenderer({ content, className = "" }: ArticleRichRendererProps) {
  if (!content) return null;

  // Split into block paragraphs by double line breaks
  const rawBlocks = content.split(/\n{2,}/);

  return (
    <div className={`article-rich-content space-y-5 leading-relaxed ${className}`}>
      {rawBlocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Standalone image block: ![alt](url)
        const standaloneImgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (standaloneImgMatch) {
          const [, alt, url] = standaloneImgMatch;
          return (
            <figure key={idx} className="my-6 rounded-2xl overflow-hidden border border-[#e8e6df] shadow-sm bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={alt || "Gambar artikel"}
                className="w-full max-h-[520px] object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              {alt && (
                <figcaption className="text-center text-xs text-gray-500 py-2.5 px-4 bg-gray-50/70 border-t border-gray-100 italic">
                  {alt}
                </figcaption>
              )}
            </figure>
          );
        }

        // Heading 1: # Title
        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={idx} className="font-display text-2xl sm:text-3xl font-bold text-primary pt-6 pb-1">
              {parseInline(trimmed.replace(/^#\s+/, ""))}
            </h1>
          );
        }

        // Heading 2: ## Title
        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={idx}
              className="font-display text-xl sm:text-2xl font-bold text-primary pt-6 pb-2 border-b border-[#e8e6df]"
            >
              {parseInline(trimmed.replace(/^##\s+/, ""))}
            </h2>
          );
        }

        // Heading 3: ### Title
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={idx} className="font-display text-lg sm:text-xl font-bold text-primary pt-4 pb-1">
              {parseInline(trimmed.replace(/^###\s+/, ""))}
            </h3>
          );
        }

        // Blockquote: > Quote
        if (trimmed.startsWith("> ")) {
          const quoteLines = trimmed
            .split("\n")
            .map((line) => line.replace(/^>\s?/, ""))
            .join(" ");
          return (
            <blockquote
              key={idx}
              className="border-l-4 border-accent pl-5 py-3 italic text-gray-700 bg-accent/5 rounded-r-xl my-5"
            >
              {parseInline(quoteLines)}
            </blockquote>
          );
        }

        // Divider: --- or ___
        if (/^[-*_]{3,}$/.test(trimmed)) {
          return <hr key={idx} className="border-t border-[#e8e6df] my-8" />;
        }

        // Bullet List: - item or * item
        if (trimmed.split("\n").some((l) => /^[*-]\s+/.test(l.trim()))) {
          const lines = trimmed.split("\n");
          return (
            <ul key={idx} className="list-disc pl-6 space-y-2 text-gray-700 my-4">
              {lines.map((line, lIdx) => {
                const clean = line.replace(/^[*-]\s+/, "").trim();
                if (!clean) return null;
                return <li key={lIdx}>{parseInline(clean)}</li>;
              })}
            </ul>
          );
        }

        // Numbered List: 1. item
        if (trimmed.split("\n").some((l) => /^\d+\.\s+/.test(l.trim()))) {
          const lines = trimmed.split("\n");
          return (
            <ol key={idx} className="list-decimal pl-6 space-y-2 text-gray-700 my-4">
              {lines.map((line, lIdx) => {
                const clean = line.replace(/^\d+\.\s+/, "").trim();
                if (!clean) return null;
                return <li key={lIdx}>{parseInline(clean)}</li>;
              })}
            </ol>
          );
        }

        // Regular paragraph with single line breaks handled as soft breaks
        const lines = trimmed.split("\n");
        return (
          <p key={idx} className="text-gray-700 leading-relaxed text-base sm:text-lg">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {parseInline(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
