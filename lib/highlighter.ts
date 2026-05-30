// ============================================================
// RupantarCode — Python Syntax Highlighter
// ============================================================

const KEYWORDS = [
  'def','class','import','from','return','if','elif','else',
  'for','while','in','not','and','or','True','False','None',
  'try','except','finally','raise','with','as','pass','break',
  'continue','lambda','yield','async','await','global','nonlocal',
];

const BUILTINS = [
  'print','len','range','list','dict','set','tuple','str','int',
  'float','bool','type','isinstance','hasattr','getattr','setattr',
  'sum','min','max','sorted','reversed','enumerate','zip','map',
  'filter','open','super','any','all','next','iter',
];

export function highlightPython(code: string): string {
  const lines = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n');

  return lines.map(line => {
    // pip install comment — special highlight
    if (line.includes('pip install')) {
      return `<span class="token-pip">${line}</span>`;
    }
    // Comment lines
    if (line.trim().startsWith('#')) {
      return `<span class="token-comment">${line}</span>`;
    }
    // Section headers
    if (line.includes('===')) {
      return `<span class="token-comment">${line}</span>`;
    }
    // Decorators
    if (line.trim().startsWith('@')) {
      return `<span class="token-decorator">${line}</span>`;
    }

    let out = line;

    // Strings (before keyword matching)
    out = out.replace(/(f?"[^"]*"|f?'[^']*'|"""[\s\S]*?""")/g,
      '<span class="token-string">$1</span>');

    // Keywords
    for (const kw of KEYWORDS) {
      out = out.replace(
        new RegExp(`\\b(${kw})\\b`, 'g'),
        '<span class="token-keyword">$1</span>'
      );
    }

    // Import lines
    if (line.trimStart().startsWith('import') || line.trimStart().startsWith('from')) {
      return `<span class="token-import">${out}</span>`;
    }

    // Builtins
    for (const b of BUILTINS) {
      out = out.replace(
        new RegExp(`\\b(${b})\\b`, 'g'),
        '<span class="token-builtin">$1</span>'
      );
    }

    // Numbers
    out = out.replace(/\b(\d+\.?\d*)\b/g, '<span class="token-number">$1</span>');

    // Class/function names after def/class
    out = out.replace(
      /(<span class="token-keyword">def<\/span>)\s+(\w+)/g,
      '$1 <span class="token-funcname">$2</span>'
    );
    out = out.replace(
      /(<span class="token-keyword">class<\/span>)\s+(\w+)/g,
      '$1 <span class="token-classname">$2</span>'
    );

    return out;
  }).join('\n');
}
