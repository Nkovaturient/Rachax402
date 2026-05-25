"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

const markdownComponents: Components = {
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      className="text-[#00d4aa] underline underline-offset-2 hover:text-[#34d399]"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-semibold text-[#e2e8f0] mt-4 mb-2 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-[#cbd5e1] mt-3 mb-1.5">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-sm text-[#e2e8f0] leading-relaxed my-2 first:mt-0 last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="text-sm text-[#cbd5e1] my-2 pl-5 list-disc space-y-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-sm text-[#cbd5e1] my-2 pl-5 list-decimal space-y-1">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[#8b5cf6]/60 pl-3 my-2 text-[#94a3b8] italic text-sm">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-white/10">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-white/5 text-[#e2e8f0]">{children}</thead>
  ),
  tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-medium text-[#e2e8f0]">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-[#cbd5e1]">{children}</td>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-black/40 border border-white/10 p-3 text-xs font-mono text-[#cbd5e1]">
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className?.includes("language-"));
    if (isBlock) {
      return (
        <code className={`${className ?? ""} text-[#a78bfa]`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="bg-white/10 rounded px-1.5 py-0.5 text-xs font-mono text-[#a78bfa]"
        {...props}
      >
        {children}
      </code>
    );
  },
  hr: () => <hr className="my-4 border-white/10" />,
  strong: ({ children }) => (
    <strong className="font-semibold text-[#f1f5f9]">{children}</strong>
  ),
};

export function AgentMarkdown({ content }: { content: string }) {
  return (
    <div className="agent-markdown prose prose-sm prose-invert max-w-none prose-p:my-0 prose-headings:scroll-mt-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
