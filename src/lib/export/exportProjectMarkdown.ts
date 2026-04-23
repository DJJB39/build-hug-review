/**
 * Client-side project export.
 *
 * Uses Vite's `import.meta.glob` with `query: "?raw"` to inline the *source*
 * of every file in the repo at build time. We then concatenate them into a
 * single Markdown document with a file tree + fenced code blocks, and trigger
 * a browser download.
 *
 * Notes:
 * - This runs entirely in the browser. No server / edge function needed.
 * - We deliberately exclude generated files, lockfiles, binaries, env files,
 *   and the export module itself to keep the bundle small and the output clean.
 */

// Eagerly import the raw text of every candidate source file in the repo.
// `import.meta.glob` is resolved at build time, so the contents are baked
// into the client bundle.
const RAW_FILES = import.meta.glob(
  [
    "/src/**/*.{ts,tsx,js,jsx,css,md,json,toml}",
    "/supabase/**/*.{toml,sql,ts}",
    "/*.{ts,tsx,js,jsx,json,toml,md,html,cjs,mjs}",
    "/.prettierrc",
    "/.prettierignore",
    // Exclusions
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/.lovable/**",
    "!/src/routeTree.gen.ts",
    "!/src/integrations/supabase/types.ts",
    "!/bun.lockb",
    "!/package-lock.json",
    "!/.env",
  ],
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

type TreeNode = {
  name: string;
  children: Map<string, TreeNode>;
  isFile: boolean;
};

function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = { name: "", children: new Map(), isFile: false };
  for (const full of paths) {
    const parts = full.replace(/^\//, "").split("/");
    let node = root;
    parts.forEach((part, idx) => {
      let next = node.children.get(part);
      if (!next) {
        next = { name: part, children: new Map(), isFile: false };
        node.children.set(part, next);
      }
      if (idx === parts.length - 1) next.isFile = true;
      node = next;
    });
  }
  return root;
}

function renderTree(node: TreeNode, prefix = "", isLast = true, isRoot = true): string {
  const lines: string[] = [];
  if (!isRoot) {
    const branch = isLast ? "└── " : "├── ";
    lines.push(prefix + branch + node.name + (node.isFile ? "" : "/"));
  }
  const childPrefix = isRoot ? "" : prefix + (isLast ? "    " : "│   ");
  const entries = [...node.children.values()].sort((a, b) => {
    // Directories first, then files; alphabetical within each group.
    if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
    return a.name.localeCompare(b.name);
  });
  entries.forEach((child, i) => {
    lines.push(renderTree(child, childPrefix, i === entries.length - 1, false));
  });
  return lines.filter(Boolean).join("\n");
}

const LANG_BY_EXT: Record<string, string> = {
  ts: "ts",
  tsx: "tsx",
  js: "js",
  jsx: "jsx",
  css: "css",
  json: "json",
  md: "md",
  toml: "toml",
  sql: "sql",
  html: "html",
  cjs: "js",
  mjs: "js",
};

function langFor(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return LANG_BY_EXT[ext] ?? "";
}

/**
 * Some files (e.g. markdown) may themselves contain triple-backtick fences.
 * To avoid breaking the outer code block, we pick a fence longer than any
 * fence already present inside the file.
 */
function pickFence(content: string): string {
  let len = 3;
  const re = /^`{3,}/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m[0].length >= len) len = m[0].length + 1;
  }
  return "`".repeat(len);
}

export function buildProjectMarkdown(): string {
  const paths = Object.keys(RAW_FILES).sort();
  const tree = buildTree(paths);

  const header = [
    "# Bisque — Project Source Export",
    "",
    `_Generated ${new Date().toISOString()} from the live preview._`,
    "",
    "This single Markdown file contains the project's source tree followed by",
    "the contents of every source file. Auto-generated files (route tree,",
    "Supabase types), lockfiles, the `.env` file, and binaries are intentionally",
    "excluded.",
    "",
    "## File tree",
    "",
    "```",
    renderTree(tree),
    "```",
    "",
    "## Files",
    "",
  ].join("\n");

  const body = paths
    .map((path) => {
      const content = RAW_FILES[path] ?? "";
      const fence = pickFence(content);
      const lang = langFor(path);
      return `### \`${path.replace(/^\//, "")}\`\n\n${fence}${lang}\n${content.replace(/\s+$/, "")}\n${fence}\n`;
    })
    .join("\n");

  return header + body;
}

export function downloadProjectMarkdown(filename = "bisque-source.md"): void {
  const md = buildProjectMarkdown();
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer revocation so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
