// ─────────────────────────────────────────────────────────────────────────────
// move-inline-styles.mjs  —  node move-inline-styles.mjs
//
// Moves styles out of .tsx/.jsx files into the globals.css your layout imports:
//   • style={{ padding: 8, color: "#888" }}       → className="is-xxxxxxx"
//   • style={{ ...S.card, marginTop: 4 }}          → resolved from const S, moved
//   • style={S.card}                               → moved
//   • sx={{ mt: 2, display: "flex" }} (MUI)        → moved (8px spacing, MUI rules)
//   • <style>{`...`}</style>, <style jsx>, <style>{CSS}</style> → CSS moved, tag removed
//     (only when every rule uses a class/id, so other pages don't change)
// Same styles share one class. Style objects / CSS consts that are no longer
// used are deleted. Run it again any time; nothing is added twice.
//
// What stays inline (on purpose — CSS cannot know these values):
//   values from state/props (width: `${pct}%`, color: active ? a : b),
//   style passed to your own components, sx with theme colours/hover/breakpoints,
//   <style> blocks with body / * / tag rules (those would hit every page).
// ─────────────────────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ts = createRequire(path.join(process.cwd(), "package.json"))("typescript");

const ROOTS = ["src", "app", "components"].filter((d) => fs.existsSync(d));
const SKIP_DIRS = new Set(["node_modules", ".next", "out", "build", "dist", "public", ".git"]);
const MARK_START = "/* ═══ MOVED INLINE STYLES (move-inline-styles.mjs) ═══ */";
const MARK_END = "/* ═══ END MOVED INLINE STYLES ═══ */";

// ── which globals.css does the root layout import? ──
function findGlobals() {
  for (const lay of ["src/app/layout.tsx", "app/layout.tsx", "src/app/layout.jsx", "app/layout.jsx", "src/app/layout.js", "app/layout.js"]) {
    if (!fs.existsSync(lay)) continue;
    const m = fs.readFileSync(lay, "utf8").match(/import\s+["']([^"']*globals\.css)["']/);
    if (!m) continue;
    const spec = m[1];
    const tries = spec.startsWith(".") ? [path.join(path.dirname(lay), spec)]
      : spec.startsWith("@/") ? [path.join("src", spec.slice(2)), spec.slice(2)]
      : [spec];
    const hit = tries.find((t) => fs.existsSync(t));
    if (hit) return hit;
  }
  return ["src/app/globals.css", "app/globals.css", "styles/globals.css", "src/styles/globals.css"].find((f) => fs.existsSync(f));
}
const GLOBALS = findGlobals();
if (!GLOBALS) { console.error("globals.css not found"); process.exit(1); }

// ── CSS helpers ──
const UNITLESS = new Set([
  "animationIterationCount", "aspectRatio", "borderImageOutset", "borderImageSlice", "borderImageWidth",
  "columnCount", "columns", "flex", "flexGrow", "flexShrink", "gridArea", "gridRow", "gridRowEnd", "gridRowStart",
  "gridColumn", "gridColumnEnd", "gridColumnStart", "fontWeight", "lineClamp", "lineHeight", "opacity", "order",
  "orphans", "scale", "tabSize", "widows", "zIndex", "zoom", "fillOpacity", "floodOpacity", "stopOpacity",
  "strokeDasharray", "strokeDashoffset", "strokeMiterlimit", "strokeOpacity", "strokeWidth", "WebkitLineClamp",
]);
const kebab = (k) =>
  k.startsWith("--") ? k
    : k.replace(/^(Webkit|Moz|ms|O)(?=[A-Z])/, (m) => "-" + m.toLowerCase()).replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

const unwrap = (n) => { while (n && (ts.isAsExpression(n) || ts.isParenthesizedExpression(n) || ts.isSatisfiesExpression?.(n))) n = n.expression; return n; };
const keyOf = (p) => (p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? p.name.text : null);

// literal value: string or number, or null
function literal(init, consts, depth = 0) {
  init = unwrap(init);
  if (!init || depth > 4) return null;
  if (ts.isIdentifier(init) && consts.str.has(init.text)) return literal(consts.str.get(init.text), consts, depth + 1);
  if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) return init.text;
  if (ts.isNumericLiteral(init)) return Number(init.text);
  if (ts.isPrefixUnaryExpression(init) && init.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(init.operand)) return -Number(init.operand.text);
  if (ts.isTemplateExpression(init)) {           // `${G_DARK} 1px` with fixed consts
    let s = init.head.text;
    for (const sp of init.templateSpans) {
      const v = literal(sp.expression, consts, depth + 1);
      if (v === null) return null;
      s += v + sp.literal.text;
    }
    return s;
  }
  return null;
}
const styleValue = (name, v) => (typeof v === "number" ? (v === 0 || UNITLESS.has(name) || name.startsWith("--") ? String(v) : `${v}px`) : v);

// ── MUI sx → CSS (default theme: spacing 8px, radius 4px) ──
const SX_SPACE = {
  m: ["margin"], mt: ["margin-top"], mr: ["margin-right"], mb: ["margin-bottom"], ml: ["margin-left"],
  mx: ["margin-left", "margin-right"], my: ["margin-top", "margin-bottom"],
  p: ["padding"], pt: ["padding-top"], pr: ["padding-right"], pb: ["padding-bottom"], pl: ["padding-left"],
  px: ["padding-left", "padding-right"], py: ["padding-top", "padding-bottom"],
  margin: ["margin"], marginTop: ["margin-top"], marginRight: ["margin-right"], marginBottom: ["margin-bottom"], marginLeft: ["margin-left"],
  marginX: ["margin-left", "margin-right"], marginY: ["margin-top", "margin-bottom"],
  padding: ["padding"], paddingTop: ["padding-top"], paddingRight: ["padding-right"], paddingBottom: ["padding-bottom"], paddingLeft: ["padding-left"],
  paddingX: ["padding-left", "padding-right"], paddingY: ["padding-top", "padding-bottom"],
  gap: ["gap"], rowGap: ["row-gap"], columnGap: ["column-gap"],
};
const SX_SIZE = new Set(["width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight"]);
const SX_BORDER = new Set(["border", "borderTop", "borderRight", "borderBottom", "borderLeft"]);
const SX_COLOR = new Set(["color", "bgcolor", "backgroundColor", "borderColor"]);
const SX_ALIAS = { bgcolor: "background-color", displayPrint: null, typography: null };

// returns [[prop, value], ...] or null if this sx key can't be turned into plain CSS
function sxDecl(key, v) {
  if (key in SX_ALIAS && SX_ALIAS[key] === null) return null;
  if (typeof v === "string" && SX_COLOR.has(key) && /^[a-z]+\.[a-z]+/i.test(v)) return null; // "primary.main"
  if (typeof v === "string" && key === "fontFamily" && /^[a-z]+\.[a-z]+/i.test(v)) return null;
  if (key in SX_SPACE) return SX_SPACE[key].map((p) => [p, typeof v === "number" ? (v === 0 ? "0" : `${v * 8}px`) : v]);
  if (SX_SIZE.has(key) && typeof v === "number") return [[kebab(key), v > 0 && v <= 1 ? `${+(v * 100).toFixed(4)}%` : `${v}px`]];
  if (key === "borderRadius" && typeof v === "number") return [["border-radius", `${v * 4}px`]];
  if (SX_BORDER.has(key) && typeof v === "number") return [[kebab(key), `${v}px solid`]];
  if (key === "boxShadow" && typeof v === "number") return null;                 // theme shadow
  if (key === "zIndex" && typeof v === "string" && !/^\d+$/.test(v)) return null; // "modal"
  if (key === "fontWeight" && typeof v === "string" && /^(light|regular|medium|bold)$/.test(v)) {
    return [["font-weight", { light: "300", regular: "400", medium: "500", bold: "700" }[v]]];
  }
  if (key === "typography" || key.startsWith("&") || key.startsWith(":") || key.startsWith("@")) return null;
  const name = SX_ALIAS[key] || kebab(key);
  return [[name, styleValue(key, v)]];
}


// ── <style> block safety ──
// A page's <style> only applies while that page is open. In globals.css it
// applies everywhere, so a block moves only if every rule targets a class or
// id (".card p" ok; "body", "*", "h1" would change other pages → stays).
// @import lines are pulled out so they can go to the top of globals.css.
function splitCss(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const imports = [];
  css = css.replace(/@import[^;]+;/g, (m) => { imports.push(m.trim()); return ""; });
  return { css, imports };
}
function cssIsScoped(css) {
  let i = 0;
  const block = () => { // returns index after matching }
    let depth = 0;
    for (; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") { depth--; if (depth === 0) { i++; return true; } }
    }
    return false;
  };
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open === -1) return css.slice(i).trim() === "";
    const sel = css.slice(i, open).trim();
    if (/^@(media|supports|container|layer)/.test(sel)) {
      const start = open + 1; i = open; block();
      if (!cssIsScoped(css.slice(start, i - 1))) return false;
      continue;
    }
    if (/^@(keyframes|-webkit-keyframes|font-face|property|page)/.test(sel)) { i = open; block(); continue; }
    if (sel.startsWith("@")) return false;
    const parts = sel.split(",").map((x) => x.trim()).filter(Boolean);
    if (!parts.length || parts.some((x) => !/[.#][A-Za-z_-]/.test(x) || /^(html|body|:root)\b/.test(x))) return false;
    i = open; block();
  }
  return true;
}

// ── files ──
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

let globalsText = fs.readFileSync(GLOBALS, "utf8");
const known = new Map(); // css text → class
for (const m of globalsText.matchAll(/\.(is-[a-f0-9]{7})\.\1 \{ ([^}]*) \}/g)) known.set(m[2].trim(), m[1]);
const newRules = [];
const movedBlocks = [];
const movedImports = new Set();

function classFor(decls) {
  const css = decls.map(([k, v]) => `${k}: ${v};`).join(" ");
  if (known.has(css)) return known.get(css);
  const cls = "is-" + crypto.createHash("md5").update(css).digest("hex").slice(0, 7);
  known.set(css, cls);
  newRules.push(`.${cls}.${cls} { ${css} }`); // doubled class wins like inline did
  return cls;
}

let deferred = 0; // sx on an element whose style was just moved → next pass
const count = { style: 0, partial: 0, sx: 0, blocks: 0, consts: 0, left: 0, files: 0 };
const rel = (f) => path.relative(process.cwd(), f).replace(/\\/g, "/");

for (const file of ROOTS.flatMap((r) => walk(r))) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.JSX);

  // components that accept className: HTML tags + next/link, next/image, MUI
  const okTags = new Set();
  // top-level consts: fixed strings/numbers, object literals, CSS templates
  const consts = { str: new Map(), obj: new Map(), decl: new Map() };
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier) && /^(@mui\/|next\/link$|next\/image$)/.test(st.moduleSpecifier.text)) {
      const c = st.importClause;
      if (c?.name) okTags.add(c.name.text);
      if (c?.namedBindings && ts.isNamedImports(c.namedBindings)) c.namedBindings.elements.forEach((e) => okTags.add(e.name.text));
    }
    if (ts.isVariableStatement(st) && st.declarationList.flags & ts.NodeFlags.Const && !st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const d of st.declarationList.declarations) {
        if (!ts.isIdentifier(d.name)) continue;
        const init = unwrap(d.initializer);
        if (!init) continue;
        if (ts.isStringLiteral(init) || ts.isNumericLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init) || ts.isTemplateExpression(init)) consts.str.set(d.name.text, init);
        if (ts.isObjectLiteralExpression(init)) consts.obj.set(d.name.text, init);
        if (st.declarationList.declarations.length === 1) consts.decl.set(d.name.text, st);
      }
    }
  }

  // resolve S, S.card, S["card"] to an object literal
  const resolveObj = (e) => {
    e = unwrap(e);
    if (!e) return null;
    if (ts.isObjectLiteralExpression(e)) return e;
    if (ts.isIdentifier(e)) return consts.obj.get(e.text) || null;
    if (ts.isPropertyAccessExpression(e)) {
      const base = resolveObj(e.expression);
      const p = base?.properties.find((q) => ts.isPropertyAssignment(q) && keyOf(q) === e.name.text);
      return p ? resolveObj(p.initializer) : null;
    }
    return null;
  };

  // flatten a style object into ordered entries: { css:[k,v] } fixed, or { keep:text } dynamic
  const flatten = (obj, depth = 0) => {
    const out = [];
    for (const p of obj.properties) {
      if (ts.isSpreadAssignment(p)) {
        const inner = depth < 5 ? resolveObj(p.expression) : null;
        if (inner) out.push(...flatten(inner, depth + 1));
        else out.push({ keep: p.getText(sf) });
      } else if (ts.isPropertyAssignment(p) && keyOf(p) !== null) {
        const v = literal(p.initializer, consts);
        if (v === null) out.push({ keep: p.getText(sf), key: keyOf(p) });
        else out.push({ css: [kebab(keyOf(p)), styleValue(keyOf(p), v)], text: p.getText(sf) });
      } else if (ts.isShorthandPropertyAssignment(p) && consts.str.has(p.name.text)) {
        out.push({ css: [kebab(p.name.text), styleValue(p.name.text, literal(p.name, consts))], text: p.getText(sf) });
      } else out.push({ keep: p.getText(sf) });
    }
    return out;
  };

  const edits = []; // { start, end, text }
  const markUsed = () => {}; // consts still referenced are kept by the clean-up pass below

  // put a class on an element: merge with className if it exists
  function addClass(attrs, cls, replaceAttr, keepText) {
    const cn = attrs.find((a) => ts.isJsxAttribute(a) && a.name.getText(sf) === "className");
    if (!cn) { edits.push({ start: replaceAttr.getStart(sf), end: replaceAttr.getEnd(), text: [`className="${cls}"`, keepText].filter(Boolean).join(" ") }); return true; }
    const init = cn.initializer;
    let text = null;
    if (init && ts.isStringLiteral(init)) text = `className="${init.text} ${cls}"`;
    else if (init && ts.isJsxExpression(init) && init.expression) {
      const e = init.expression;
      if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) text = `className="${e.text} ${cls}"`;
      else if (ts.isTemplateExpression(e)) text = `className={${e.getText(sf).slice(0, -1)} ${cls}\`}`;
      else text = `className={\`\${${e.getText(sf)} ?? ""} ${cls}\`}`;
    }
    if (!text) return false;
    if (cn._edited) return false; // style and sx on the same element: do one per run
    cn._edited = true;
    edits.push({ start: replaceAttr.getStart(sf), end: replaceAttr.getEnd(), text: keepText });
    edits.push({ start: cn.getStart(sf), end: cn.getEnd(), text });
    return true;
  }

  const visit = (node) => {
    // ── <style> blocks ──
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(sf) === "style") {
      const kids = node.children.filter((c) => !(ts.isJsxText(c) && !c.text.trim()));
      let css = null;
      if (kids.length === 1 && ts.isJsxExpression(kids[0]) && kids[0].expression) {
        const e = unwrap(kids[0].expression);
        css = literal(e, consts);
        if (css === null && ts.isIdentifier(e) && consts.str.has(e.text)) css = literal(consts.str.get(e.text), consts);
      } else if (kids.length === 1 && ts.isJsxText(kids[0])) css = kids[0].text;
      const parsed = typeof css === "string" ? splitCss(css) : null;
      if (parsed && cssIsScoped(parsed.css)) {
        parsed.imports.forEach((x) => movedImports.add(x));
        const body = parsed.css.trim().split("\n").map((l) => l.trim()).join("\n");
        if (body && !globalsText.includes(body) && !movedBlocks.some((b) => b.endsWith("\n" + body))) movedBlocks.push(`/* from ${rel(file)} */\n${body}`);
        edits.push({ start: node.getStart(sf), end: node.getEnd(), text: "", line: true });
        count.blocks++;
      } else { markUsed(node); count.left++; }
      return;
    }

    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sf);
      const attrs = node.attributes.properties;
      const canClass = (/^[a-z]/.test(tag) || okTags.has(tag.split(".")[0])) && !attrs.some((a) => ts.isJsxSpreadAttribute(a));
      const attr = (n) => attrs.find((a) => ts.isJsxAttribute(a) && a.name.getText(sf) === n);

      // ── style= ──
      const style = attr("style");
      let styleDone = false;
      if (style) {
        const expr = style.initializer && ts.isJsxExpression(style.initializer) ? style.initializer.expression : null;
        const obj = canClass && expr ? resolveObj(expr) : null;
        if (!obj) { if (expr) markUsed(expr); count.left++; }
        else {
          const items = flatten(obj);
          // fixed values can move until the first dynamic part: after that, a
          // fixed value must stay inline so it still overrides the dynamic one
          const firstKeep = items.findIndex((i) => i.keep);
          const head = (firstKeep === -1 ? items : items.slice(0, firstKeep)).filter((i) => i.css);
          const tail = firstKeep === -1 ? [] : items.slice(firstKeep);
          if (!head.length) { markUsed(expr); count.left++; }
          else {
            const keepParts = tail.map((i) => i.text || i.keep);
            const keepText = keepParts.length ? `style={{ ${keepParts.join(", ")} }}` : "";
            if (addClass(attrs, classFor(head.map((i) => i.css)), style, keepText)) {
              styleDone = true;
              tail.length ? count.partial++ : count.style++;
            } else { markUsed(expr); count.left++; }
          }
        }
      }

      // ── sx= (MUI) ──
      const sx = attr("sx");
      if (sx) {
        const expr = sx.initializer && ts.isJsxExpression(sx.initializer) ? sx.initializer.expression : null;
        if (styleDone) { deferred++; ts.forEachChild(node, visit); return; }
        const obj = canClass && expr ? resolveObj(expr) : null;
        let decls = obj ? [] : null;
        if (obj) for (const p of obj.properties) {
          const k = ts.isPropertyAssignment(p) ? keyOf(p) : null;
          const v = k !== null ? literal(p.initializer, consts) : null;
          const d = v !== null ? sxDecl(k, v) : null;
          if (!d) { decls = null; break; }
          decls.push(...d);
        }
        // only when every key converts; otherwise the whole sx stays (theme, hover…)
        if (decls && decls.length && addClass(attrs, classFor(decls), sx, "")) count.sx++;
        else { if (expr) markUsed(expr); count.left++; }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  if (!edits.length) continue;

  // style objects / CSS consts nobody uses any more → delete
  let out = src;
  const apply = (list) => {
    for (const e of list.sort((a, b) => b.start - a.start)) {
      let start = e.start, end = e.end;
      if (!e.text) {
        while (start > 0 && /[ \t]/.test(out[start - 1])) start--;
        if (e.line && out[start - 1] === "\n" && out[end] === "\n") start--;
      }
      out = out.slice(0, start) + e.text + out.slice(end);
    }
  };
  apply(edits);

  // remove top-level consts no longer referenced anywhere in the file
  for (let pass = 0; pass < 3; pass++) {
    const sf2 = ts.createSourceFile(file, out, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.JSX);
    const refs = new Map();
    const countIds = (n) => { if (ts.isIdentifier(n) && !(ts.isVariableDeclaration(n.parent) && n.parent.name === n)) refs.set(n.text, (refs.get(n.text) || 0) + 1); ts.forEachChild(n, countIds); };
    countIds(sf2);
    const dead = [];
    for (const st of sf2.statements) {
      if (!ts.isVariableStatement(st) || !(st.declarationList.flags & ts.NodeFlags.Const) || st.declarationList.declarations.length !== 1) continue;
      if (st.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
      const d = st.declarationList.declarations[0];
      if (!ts.isIdentifier(d.name) || !consts.decl.has(d.name.text) || refs.get(d.name.text)) continue;
      const init = unwrap(d.initializer);
      if (!init || !(ts.isObjectLiteralExpression(init) || ts.isStringLiteral(init) || ts.isNumericLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init) || ts.isTemplateExpression(init))) continue;
      dead.push({ start: st.getFullStart(), end: st.getEnd(), text: "" });
      count.consts++;
    }
    if (!dead.length) break;
    apply(dead);
  }

  fs.writeFileSync(file, out);
  count.files++;
}

// ── write globals.css ──
// @import must come before every other rule → put new ones after the last existing @import
const newImports = [...movedImports].filter((x) => !globalsText.includes(x));
if (newImports.length) {
  const lines = globalsText.split("\n");
  let at = 0;
  lines.forEach((l, i) => { if (/^\s*@(import|charset)/.test(l)) at = i + 1; });
  lines.splice(at, 0, ...newImports);
  globalsText = lines.join("\n");
}
const addition = [...newRules, ...movedBlocks].join("\n");
if (addition || newImports.length) {
  if (globalsText.includes(MARK_START)) globalsText = globalsText.replace(MARK_END, addition + "\n" + MARK_END);
  else globalsText = globalsText.trimEnd() + "\n\n" + MARK_START + "\n" + addition + "\n" + MARK_END + "\n";
  fs.writeFileSync(GLOBALS, globalsText);
}

// a second quick pass picks up sx that shared an element with a moved style
if (deferred && !process.env.MIS_PASS2) {
  execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { stdio: "ignore", env: { ...process.env, MIS_PASS2: "1" } });
}
if (process.env.MIS_PASS2) process.exit(0);
console.log(`globals.css: ${GLOBALS}  ·  files changed: ${count.files}`);
console.log(`moved → style ${count.style} · style (part) ${count.partial} · sx ${count.sx} · <style> blocks ${count.blocks} · unused consts removed ${count.consts}`);
console.log(`left inline (value comes from state/props, own component, or MUI theme): ${count.left}`);
