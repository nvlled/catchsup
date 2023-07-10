import React from "react";
import { ArrayUtil } from "./lib/jsext";
import { marked } from "marked";
import { api } from "./lib/api";

export function Space({ count }: { count?: number }) {
  return (
    <span>
      {ArrayUtil.range(1, count ?? 1).map((i) => (
        <React.Fragment key={i}>&nbsp;</React.Fragment>
      ))}
    </span>
  );
}

export function MarkdownContent({
  content = "",
  className = "",
}: {
  content?: string;
  className?: string;
}) {
  return (
    <div
      ref={onMountDesc}
      className={className}
      dangerouslySetInnerHTML={{
        __html: marked.parse(content),
      }}
    />
  );
  function onMountDesc(div: HTMLDivElement) {
    if (!div) return;
    for (const a of div.querySelectorAll("a")) {
      a.onclick = (e: MouseEvent) => {
        e.preventDefault();
        api.openExternal(a.href);
      };
    }
  }
}
