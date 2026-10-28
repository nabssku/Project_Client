import React from "react";
import { ExternalLink, Play } from "lucide-react";
import { extractYouTubeId, getYouTubeEmbedUrl } from "@/lib/youtube";

interface AboutRichRendererProps {
  content: string;
  className?: string;
}

// Parses inline formatting: **bold**, *italic*, ~~strike~~, `code`, [text](url), and ![alt](url)
function parseInline(text: string): React.ReactNode[] {
  if (!text) return [];

  const regex = /(!?\[[^\]]*\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Image: ![alt](url)
    if (part.startsWith("![") && part.includes("](") && part.endsWith(")")) {
      const match = part.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (match) {
        const [, alt, url] = match;
        return (
          <span key={index} className="block my-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={alt || "Gambar Tentang Kami"}
              className="w-full max-h-[520px] object-cover rounded-2xl shadow-sm border border-gray-200/80"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            {alt && (
              <span className="block text-center text-xs text-gray-500 mt-2 italic font-sans">
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
            className="text-accent font-semibold underline decoration-accent/40 hover:decoration-accent hover:text-accent-dark transition-colors inline-flex items-center gap-1 mx-0.5"
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
        <em key={index} className="italic text-gray-800">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Strikethrough: ~~text~~
    if (part.startsWith("~~") && part.endsWith("~~") && part.length >= 4) {
      return (
        <del key={index} className="line-through text-gray-400">
          {part.slice(2, -2)}
        </del>
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

export function AboutRichRenderer({ content, className = "" }: AboutRichRendererProps) {
  if (!content) return null;

  // Split into block paragraphs by double line breaks
  const rawBlocks = content.split(/\n{2,}/);

  return (
    <div className={`about-rich-content space-y-6 leading-relaxed font-sans ${className}`}>
      {rawBlocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. YouTube Video Embed (Standalone line or tag)
        const isYouTubeLine =
          trimmed.startsWith("http://") ||
          trimmed.startsWith("https://") ||
          trimmed.startsWith("@[youtube]") ||
          trimmed.startsWith("[youtube");

        if (isYouTubeLine) {
          const videoId = extractYouTubeId(trimmed);
          if (videoId) {
            return (
              <div key={idx} className="my-8">
                <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 shadow-md bg-black aspect-video w-full group">
                  <iframe
                    src={getYouTubeEmbedUrl(videoId)}
                    title="Video Profil Villa"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-gray-500">
                  <Play className="w-3.5 h-3.5 text-red-600 fill-red-600" />
                  <span>Sematkan Video YouTube</span>
                </div>
              </div>
            );
          }
        }

        // 2. Standalone image block: ![alt](url)
        const standaloneImgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (standaloneImgMatch) {
          const [, alt, url] = standaloneImgMatch;
          return (
            <figure key={idx} className="my-8 rounded-2xl overflow-hidden border border-gray-200/80 shadow-sm bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={alt || "Gambar Tentang Kami"}
                className="w-full max-h-[560px] object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              {alt && (
                <figcaption className="text-center text-xs text-gray-500 py-3 px-4 bg-gray-50/70 border-t border-gray-100 italic">
                  {alt}
                </figcaption>
              )}
            </figure>
          );
        }

        // 3. Heading 1: # Title
        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={idx} className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-primary pt-6 pb-2 tracking-tight">
              {parseInline(trimmed.replace(/^#\s+/, ""))}
            </h1>
          );
        }

        // 4. Heading 2: ## Title
        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={idx}
              className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-primary pt-6 pb-2.5 border-b border-gray-200/80 tracking-tight"
            >
              {parseInline(trimmed.replace(/^##\s+/, ""))}
            </h2>
          );
        }

        // 5. Heading 3: ### Title
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={idx} className="font-display text-lg sm:text-xl font-bold text-primary pt-4 pb-1">
              {parseInline(trimmed.replace(/^###\s+/, ""))}
            </h3>
          );
        }

        // 6. Blockquote: > Quote
        if (trimmed.startsWith("> ")) {
          const quoteLines = trimmed
            .split("\n")
            .map((line) => line.replace(/^>\s?/, ""))
            .join(" ");
          return (
            <blockquote
              key={idx}
              className="border-l-4 border-accent pl-5 sm:pl-6 py-4 italic text-gray-800 bg-[#C8A44E]/5 rounded-r-2xl my-6 leading-relaxed font-display text-base sm:text-lg"
            >
              {parseInline(quoteLines)}
            </blockquote>
          );
        }

        // 7. Divider: --- or ***
        if (/^[-*_]{3,}$/.test(trimmed)) {
          return <hr key={idx} className="border-t border-gray-200 my-10" />;
        }

        // 8. Bullet List: - item or * item
        if (trimmed.split("\n").some((l) => /^[*-]\s+/.test(l.trim()))) {
          const lines = trimmed.split("\n");
          return (
            <ul key={idx} className="list-disc pl-6 space-y-2.5 text-gray-700 my-5 text-base sm:text-lg">
              {lines.map((line, lIdx) => {
                const clean = line.replace(/^[*-]\s+/, "").trim();
                if (!clean) return null;
                return <li key={lIdx} className="leading-relaxed">{parseInline(clean)}</li>;
              })}
            </ul>
          );
        }

        // 9. Numbered List: 1. item
        if (trimmed.split("\n").some((l) => /^\d+\.\s+/.test(l.trim()))) {
          const lines = trimmed.split("\n");
          return (
            <ol key={idx} className="list-decimal pl-6 space-y-2.5 text-gray-700 my-5 text-base sm:text-lg">
              {lines.map((line, lIdx) => {
                const clean = line.replace(/^\d+\.\s+/, "").trim();
                if (!clean) return null;
                return <li key={lIdx} className="leading-relaxed">{parseInline(clean)}</li>;
              })}
            </ol>
          );
        }

        // 10. Regular paragraph with line breaks handled cleanly
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
