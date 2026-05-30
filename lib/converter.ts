// ============================================================
// RupantarCode — Conversion Engine
// AksharaTantra · Yuktishaalaa AI Lab
// ============================================================

import type { SupportedLang, ConversionResult } from '@/types/rupantar.types';

const HEADER = (lang: string) => `# ============================================================
# Converted from: ${lang}
# Tool: RupantarCode — AksharaTantra (aksharatantra.miriyala.in)
# Yuktishaalaa AI Lab · Offline · Privacy-First
# ============================================================
`;

// ── Java ────────────────────────────────────────────────────
function convertJava(code: string): string {
  const imports = new Set<string>();

  if (code.includes('RestController') || code.includes('GetMapping'))
    imports.add('# pip install fastapi uvicorn\nfrom fastapi import FastAPI, HTTPException\nfrom pydantic import BaseModel  # pip install pydantic');
  if (code.includes('HttpClient'))
    imports.add('import httpx  # pip install httpx\nimport asyncio');
  if (code.includes('Math.random') || code.includes('Math.floor'))
    imports.add('import math\nimport random');
  if (code.includes('DbSet') || code.includes('DbContext'))
    imports.add('from sqlalchemy.orm import Session, declarative_base\nfrom sqlalchemy import Column, Integer, String, Float  # pip install sqlalchemy');

  let result = code
    .replace(/\/\/ (.+)/g, '# $1')
    .replace(/\/\*[\s\S]*?\*\//g, (c) => '"""\n' + c.replace(/\/\*|\*\//g, '').trim() + '\n"""')
    .replace(/import java\.util\.\*;/g, '# Python built-ins: list, dict, set — no import needed')
    .replace(/import java\.\w+\.\w+;/g, '')
    .replace(/System\.out\.println\((.+?)\);/g, 'print($1)')
    .replace(/new ArrayList<.*?>\(\)/g, '[]')
    .replace(/new LinkedList<.*?>\(\)/g, '[]')
    .replace(/new HashMap<.*?>\(\)/g, '{}')
    .replace(/new HashSet<.*?>\(\)/g, 'set()')
    .replace(/\.add\(/g, '.append(')
    .replace(/\.getOrDefault\((.+?),\s*(.+?)\)/g, '.get($1, $2)')
    .replace(/\.put\((.+?),\s*(.+?)\);/g, '[$1] = $2')
    .replace(/\.size\(\)/g, '  # use len()')
    .replace(/\.isEmpty\(\)/g, ' == []')
    .replace(/\.toUpperCase\(\)/g, '.upper()')
    .replace(/\.toLowerCase\(\)/g, '.lower()')
    .replace(/\.trim\(\)/g, '.strip()')
    .replace(/\.split\("(.+?)"\)/g, '.split("$1")')
    .replace(/\.equals\((.+?)\)/g, ' == $1')
    .replace(/\.equalsIgnoreCase\((.+?)\)/g, '.lower() == $1.lower()')
    .replace(/Integer\.parseInt\(/g, 'int(')
    .replace(/Double\.parseDouble\(/g, 'float(')
    .replace(/Math\.abs\(/g, 'abs(')
    .replace(/Math\.max\(/g, 'max(')
    .replace(/Math\.min\(/g, 'min(')
    .replace(/Math\.random\(\)/g, 'random.random()')
    .replace(/\bString\b/g, 'str')
    .replace(/\bdouble\b/g, 'float')
    .replace(/\bint\b/g, 'int')
    .replace(/\bboolean\b/g, 'bool')
    .replace(/\bvoid\b/g, 'None')
    .replace(/\blong\b/g, 'int')
    .replace(/\btrue\b/g, 'True')
    .replace(/\bfalse\b/g, 'False')
    .replace(/\bnull\b/g, 'None')
    .replace(/} else if \(/g, 'elif (')
    .replace(/} else {/g, 'else:')
    .replace(/for \((\w+\s+)?(\w+) : (\w+)\)/g, 'for $2 in $3:')
    .replace(/for \(int (\w+) = (\d+); \w+ < (\w+); \w+\+\+\)/g, 'for $1 in range($2, $3):')
    .replace(/@\w+(\([^)]*\))?/g, '')
    .replace(/\b(public|private|protected|static|final|abstract|synchronized)\b/g, '')
    .replace(/\bclass\s+(\w+)(\s+extends\s+(\w+))?(\s+implements\s+[\w,\s]+)?/g, 'class $1($3):')
    .replace(/class (\w+)\(\s*\):/g, 'class $1:')
    .replace(/new (\w+)\(/g, '$1(')
    .replace(/;\s*$/gm, '')
    .replace(/\{$/gm, '')
    .replace(/^\s*\}\s*$/gm, '')
    .replace(/\bthis\./g, 'self.')
    .replace(/throws\s+\w+/g, '')
    .replace(/ResponseEntity\.ok\((.+?)\)/g, '$1')
    .replace(/ResponseEntity\.notFound\(\)\.build\(\)/g, 'None  # 404 in FastAPI: raise HTTPException(404)')
    .replace(/ResponseEntity\.noContent\(\)\.build\(\)/g, 'None  # 204 response')
    .replace(/throw new (\w+)\((.+?)\)/g, 'raise $1($2)')
    .replace(/catch \((\w+) (\w+)\)/g, 'except $1 as $2:')
    .replace(/try \{?/g, 'try:')
    .replace(/finally \{?/g, 'finally:')
    .replace(/List<(\w+)>/g, 'list  # List[$1]')
    .replace(/Map<(\w+),\s*(\w+)>/g, 'dict  # Dict[$1, $2]')
    .replace(/\.stream\(\)\.filter\((\w+) -> (.+?)\)\.sorted\(\)\.collect\(Collectors\.toList\(\)\)/g,
      'sorted([x for x in ITERABLE if $2])')
    .replace(/\.stream\(\)\.mapToInt\(Integer::intValue\)\.sum\(\)/g, 'sum(ITERABLE)')
    .replace(/return;/g, 'return')
    .replace(/^(\s*)(if|elif|while|for) \((.*)\):/gm, '$1$2 $3:');

  const importBlock = imports.size > 0
    ? '\n# --- Required Imports ---\n' + [...imports].join('\n') + '\n\n'
    : '';

  return HEADER('Java') + importBlock + result;
}

// ── C# ──────────────────────────────────────────────────────
function convertCSharp(code: string): string {
  const baseImports = `from typing import Optional, List, Dict, Any  # built-in
import asyncio  # built-in Python 3.5+
`;

  let result = code
    .replace(/\/\/ (.+)/g, '# $1')
    .replace(/using\s+[\w.]+;/g, '')
    .replace(/Console\.WriteLine\((.+?)\);/g, 'print($1)')
    .replace(/Console\.Write\((.+?)\);/g, 'print($1, end="")')
    .replace(/\$"(.+?)"/g, (_, s) => 'f"' + s.replace(/\{(.+?)\}/g, '{$1}') + '"')
    .replace(/var\s+(\w+)\s*=/g, '$1 =')
    .replace(/\.Where\((\w+) => (.+?)\)/g, '\n    # filter: [x for x in items if $2]')
    .replace(/\.Select\((\w+) => (.+?)\)/g, '\n    # map: [$2 for $1 in items]')
    .replace(/\.OrderByDescending\((\w+) => (.+?)\)/g, '\n    # sorted(items, key=lambda $1: $2, reverse=True)')
    .replace(/\.OrderBy\((\w+) => (.+?)\)/g, '\n    # sorted(items, key=lambda $1: $2)')
    .replace(/\.GroupBy\((\w+) => (.+?)\)/g, '\n    # {k: list(g) for k, g in groupby(items, key=lambda $1: $2)}')
    .replace(/\.Average\((\w+) => (.+?)\)/g, 'sum($2 for $1 in items) / len(items)')
    .replace(/\.Sum\((\w+) => (.+?)\)/g, 'sum($2 for $1 in items)')
    .replace(/\.ToList\(\)/g, '')
    .replace(/\.Count\(\)/g, '  # use len()')
    .replace(/\.FirstOrDefault\(\)/g, '[0] if items else None')
    .replace(/\.Any\((\w+) => (.+?)\)/g, 'any($2 for $1 in items)')
    .replace(/\.All\((\w+) => (.+?)\)/g, 'all($2 for $1 in items)')
    .replace(/await\s+Task\.WhenAll\((.+?)\)/g, 'await asyncio.gather($1)')
    .replace(/async\s+Task<(.+?)>\s+(\w+)/g, 'async def $2() -> $1:')
    .replace(/async\s+Task\s+(\w+)/g, 'async def $1():')
    .replace(/new List<\w+>\(\)/g, '[]')
    .replace(/new Dictionary<\w+,\s*\w+>\(\)/g, '{}')
    .replace(/new HashSet<\w+>\(\)/g, 'set()')
    .replace(/\.Add\(/g, '.append(')
    .replace(/\.Remove\(/g, '.remove(')
    .replace(/\bstring\b/g, 'str')
    .replace(/\bdouble\b/g, 'float')
    .replace(/\bint\b/g, 'int')
    .replace(/\bdecimal\b/g, 'float  # use Decimal for precision')
    .replace(/\bbool\b/g, 'bool')
    .replace(/\bvoid\b/g, 'None')
    .replace(/\btrue\b/g, 'True')
    .replace(/\bfalse\b/g, 'False')
    .replace(/\bnull\b/g, 'None')
    .replace(/\b(public|private|protected|static|readonly|sealed|virtual|override|abstract)\b/g, '')
    .replace(/\bclass\s+(\w+)(\s*:\s*(\w+))?/g, 'class $1($3):')
    .replace(/class (\w+)\(\s*\):/g, 'class $1:')
    .replace(/\{ get; set; \}/g, '  # property')
    .replace(/\{ get; \}/g, '  # readonly property')
    .replace(/catch\s*\((\w+)\s+(\w+)\)/g, 'except $1 as $2:')
    .replace(/throw new (\w+)\((.+?)\)/g, 'raise $1($2)')
    .replace(/foreach\s*\((\w+)\s+(\w+)\s+in\s+(\w+)\)/g, 'for $2 in $3:')
    .replace(/for\s*\(int (\w+) = (\d+); \w+ < (\w+); \w+\+\+\)/g, 'for $1 in range($2, $3):')
    .replace(/} else if \(/g, 'elif (')
    .replace(/\} else \{/g, 'else:')
    .replace(/String\.IsNullOrEmpty\((.+?)\)/g, 'not $1')
    .replace(/String\.Join\("(.+?)",\s*(.+?)\)/g, '"$1".join($2)')
    .replace(/int\.Parse\(/g, 'int(')
    .replace(/double\.Parse\(/g, 'float(')
    .replace(/\bthis\./g, 'self.')
    .replace(/\bbase\./g, 'super().')
    .replace(/new (\w+)\(/g, '$1(')
    .replace(/;\s*$/gm, '')
    .replace(/\{$/gm, '')
    .replace(/^\s*\}\s*$/gm, '')
    .replace(/return;/g, 'return')
    .replace(/^(\s*)(if|elif|while|for)\s+\((.*)\):/gm, '$1$2 $3:');

  return HEADER('C# (.NET)') + baseImports + '\n' + result;
}

// ── JavaScript ──────────────────────────────────────────────
function convertJS(code: string): string {
  const baseImports = `import asyncio  # built-in
import json     # built-in
import math     # built-in
import os       # built-in
`;

  let result = code
    .replace(/\/\/ (.+)/g, '# $1')
    .replace(/\/\*\*([\s\S]*?)\*\//g, '"""$1"""')
    .replace(/require\('express'\)/g, 'from flask import Flask, request, jsonify  # pip install flask')
    .replace(/require\('axios'\)/g, 'import httpx  # pip install httpx')
    .replace(/require\('fs'\)/g, 'import os, pathlib  # built-in')
    .replace(/require\('path'\)/g, 'import pathlib  # built-in')
    .replace(/require\('(\w+)'\)/g, 'import $1  # verify: pip install $1')
    .replace(/console\.log\((.+?)\);/g, 'print($1)')
    .replace(/console\.error\((.+?)\);/g, 'import sys; print($1, file=sys.stderr)')
    .replace(/process\.env\.(\w+)/g, 'os.environ.get("$1")')
    .replace(/JSON\.parse\(/g, 'json.loads(')
    .replace(/JSON\.stringify\(/g, 'json.dumps(')
    .replace(/async function (\w+)\((.+?)\)/g, 'async def $1($2):')
    .replace(/async function (\w+)\(\)/g, 'async def $1():')
    .replace(/function (\w+)\((.+?)\)/g, 'def $1($2):')
    .replace(/function (\w+)\(\)/g, 'def $1():')
    .replace(/Promise\.all\(\[(.+?)\]\)/g, 'asyncio.gather($1)')
    .replace(/\.filter\((\w+) => (.+?)\)/g, '\n    [x for x in ARRAY if $2]  # list comprehension')
    .replace(/\.map\((\w+) => (.+?)\)/g, '\n    [$2 for $1 in ARRAY]  # list comprehension')
    .replace(/\.reduce\((.+?),\s*(.+?)\)/g, 'functools.reduce($1, ARRAY, $2)  # import functools')
    .replace(/\.find\((\w+) => (.+?)\)/g, 'next((x for x in ARRAY if $2), None)')
    .replace(/\.includes\(/g, ' in ')
    .replace(/\.indexOf\(/g, '.index(')
    .replace(/\.push\(/g, '.append(')
    .replace(/\.pop\(\)/g, '.pop()')
    .replace(/\.shift\(\)/g, '.pop(0)')
    .replace(/\.unshift\(/g, '.insert(0, ')
    .replace(/\.length\b/g, '  # use len()')
    .replace(/\.toUpperCase\(\)/g, '.upper()')
    .replace(/\.toLowerCase\(\)/g, '.lower()')
    .replace(/\.trim\(\)/g, '.strip()')
    .replace(/\.toString\(\)/g, '  # use str()')
    .replace(/parseInt\(/g, 'int(')
    .replace(/parseFloat\(/g, 'float(')
    .replace(/Math\./g, 'math.')
    .replace(/\btrue\b/g, 'True')
    .replace(/\bfalse\b/g, 'False')
    .replace(/\bnull\b/g, 'None')
    .replace(/\bundefined\b/g, 'None')
    .replace(/typeof (\w+) === 'string'/g, 'isinstance($1, str)')
    .replace(/typeof (\w+) === 'number'/g, 'isinstance($1, (int, float))')
    .replace(/} else if \(/g, 'elif (')
    .replace(/\} else \{/g, 'else:')
    .replace(/for \(const (\w+) of (\w+)\)/g, 'for $1 in $2:')
    .replace(/for \(let (\w+) = (\d+); \w+ < (\w+); \w+\+\+\)/g, 'for $1 in range($2, $3):')
    .replace(/throw new Error\((.+?)\)/g, 'raise Exception($1)')
    .replace(/catch\s*\((\w+)\)/g, 'except Exception as $1:')
    .replace(/try \{?/g, 'try:')
    .replace(/finally \{?/g, 'finally:')
    .replace(/class (\w+)(\s+extends\s+(\w+))?/g, 'class $1($3):')
    .replace(/class (\w+)\(\s*\):/g, 'class $1:')
    .replace(/constructor\((.+?)\)/g, 'def __init__(self, $1):')
    .replace(/constructor\(\)/g, 'def __init__(self):')
    .replace(/\bthis\./g, 'self.')
    .replace(/super\(/g, 'super().__init__(')
    .replace(/const\s+(\w+)\s*=/g, '$1 =')
    .replace(/let\s+(\w+)\s*=/g, '$1 =')
    .replace(/var\s+(\w+)\s*=/g, '$1 =')
    .replace(/return;/g, 'return')
    .replace(/;\s*$/gm, '')
    .replace(/\{$/gm, '')
    .replace(/^\s*\}\s*$/gm, '')
    .replace(/^(\s*)(if|elif|while|for)\s+\((.*)\):/gm, '$1$2 $3:');

  return HEADER('JavaScript') + baseImports + '\n' + result;
}

// ── TypeScript ───────────────────────────────────────────────
function convertTS(code: string): string {
  const tsImports = `from dataclasses import dataclass, field  # built-in Python 3.7+
from typing import Optional, List, Dict, Any, TypeVar, Generic  # built-in
import asyncio  # built-in

T = TypeVar("T")

`;

  // Strip TypeScript-specific syntax first
  let cleaned = code
    .replace(/interface\s+(\w+)\s*\{([\s\S]*?)\}/g, (_: string, name: string, body: string) => {
      const fields = body
        .split('\n')
        .filter((l: string) => l.trim())
        .map((l: string) => {
          const trimmed = l.replace(/[\s;,]+$/, '').trim();
          return trimmed ? `    ${trimmed.replace(/:\s*[\w\s|&\[\]<>]+/, ': Any')}` : '';
        })
        .filter(Boolean)
        .join('\n');
      return `@dataclass\nclass ${name}:\n${fields}`;
    })
    .replace(/type\s+(\w+)\s*=\s*(.+);/g, '$1 = $2  # TypeAlias')
    .replace(/:\s*string\b/g, ': str')
    .replace(/:\s*number\b/g, ': float')
    .replace(/:\s*boolean\b/g, ': bool')
    .replace(/:\s*any\b/g, ': Any')
    .replace(/:\s*void\b/g, ': None')
    .replace(/:\s*(\w+)\[\]/g, ': List[$1]')
    .replace(/Array<(\w+)>/g, 'List[$1]')
    .replace(/<T extends \{ id: number \}>/g, '')
    .replace(/<(\w+)>/g, '')
    .replace(/\| null\b/g, '')
    .replace(/\| undefined\b/g, '')
    .replace(/readonly\s+/g, '')
    .replace(/as\s+\w+/g, '')
    .replace(/\?\./g, '.')
    .replace(/!(\s|;)/g, '$1');

  // Then run JS conversion
  const jsResult = convertJS(cleaned)
    .replace('# Converted from: JavaScript', '# Converted from: TypeScript')
    .replace(/import asyncio[\s\S]*?\n\n/, '');

  return HEADER('TypeScript') + tsImports + jsResult.split('\n').slice(7).join('\n');
}

// ── SQL Server ───────────────────────────────────────────────
function convertSQL(code: string): string {
  const sqlImports = `import pandas as pd                           # pip install pandas
from sqlalchemy import create_engine, text    # pip install sqlalchemy
import pyodbc                                 # pip install pyodbc
from datetime import datetime, timedelta      # built-in

# --- Connection (update with your credentials) ---
# conn_str = "mssql+pyodbc://user:pass@server/db?driver=ODBC+Driver+17+for+SQL+Server"
# engine = create_engine(conn_str)

`;

  let result = code
    .replace(/--\s*(.+)/g, '# $1')
    .replace(/\/\*[\s\S]*?\*\//g, '# SQL block comment')
    .replace(/SELECT\s+([\s\S]+?)\s+FROM\s+(\w+)(?:\s+\w+)?/gi, (_, cols, table) =>
      `# SELECT from ${table}\ndf_${table.toLowerCase()} = pd.read_sql(\n    "SELECT ${cols.replace(/\s+/g, ' ')} FROM ${table}",\n    engine\n)`
    )
    .replace(/WHERE\s+(.+)/gi, '# WHERE filter:\n# df = df.query("$1")')
    .replace(/GROUP BY\s+(.+)/gi, '# GROUP BY: df.groupby([$1])')
    .replace(/ORDER BY\s+(.+?)\s+DESC/gi, '# ORDER DESC: df.sort_values("$1", ascending=False)')
    .replace(/ORDER BY\s+(.+)/gi, '# ORDER ASC: df.sort_values("$1")')
    .replace(/HAVING\s+(.+)/gi, '# HAVING: df.groupby(...).filter(lambda g: $1)')
    .replace(/LEFT JOIN\s+(\w+)\s+ON\s+(.+)/gi, '# LEFT JOIN $1:\n# df = pd.merge(df_left, df_$1, on="key", how="left")')
    .replace(/INNER JOIN\s+(\w+)\s+ON\s+(.+)/gi, '# INNER JOIN $1:\n# df = pd.merge(df_left, df_$1, on="key", how="inner")')
    .replace(/CREATE\s+PROCEDURE\s+(\w+)\s*([\s\S]*?)AS\s+BEGIN/gi, (_, name, params) => {
      const pyParams = (params || '')
        .split(',')
        .map((p: string) => {
          const m = p.match(/@(\w+)\s+\w+(?:\([\d,]+\))?\s*(?:=\s*(.+))?/);
          return m ? (m[2] ? `${m[1].toLowerCase()} = ${m[2].trim()}` : m[1].toLowerCase()) : '';
        })
        .filter(Boolean)
        .join(', ');
      return `def ${name.toLowerCase()}(${pyParams}):\n    """Converted from SQL Server stored procedure: ${name}"""\n    with engine.connect() as conn:`;
    })
    .replace(/DECLARE\s+@(\w+)\s+\w+(?:\([\d,]+\))?\s*=\s*(.+);/gi, '$1 = $2  # DECLARE')
    .replace(/DECLARE\s+@(\w+)\s+\w+(?:\([\d,]+\))?;/gi, '$1 = None  # DECLARE')
    .replace(/@(\w+)/g, '$1')
    .replace(/PRINT\s+(.+);/gi, 'print($1)')
    .replace(/CAST\((.+?)\s+AS\s+VARCHAR\)/gi, 'str($1)')
    .replace(/CAST\((.+?)\s+AS\s+INT\)/gi, 'int($1)')
    .replace(/CAST\((.+?)\s+AS\s+FLOAT\)/gi, 'float($1)')
    .replace(/ISNULL\((.+?),\s*(.+?)\)/gi, '($1 if $1 is not None else $2)')
    .replace(/GETDATE\(\)/gi, 'datetime.now()')
    .replace(/DATEADD\(MONTH,\s*(-?\d+),\s*(.+?)\)/gi, '$2 - timedelta(days=30*$1)')
    .replace(/DATEDIFF\(YEAR,\s*(.+?),\s*(.+?)\)/gi, '($2.year - $1.year)')
    .replace(/COUNT\(\*\)/gi, 'len(df)')
    .replace(/SUM\((.+?)\)/gi, 'df["$1"].sum()')
    .replace(/AVG\((.+?)\)/gi, 'df["$1"].mean()')
    .replace(/MAX\((.+?)\)/gi, 'df["$1"].max()')
    .replace(/MIN\((.+?)\)/gi, 'df["$1"].min()')
    .replace(/RANK\(\) OVER \((.+?)\)/gi, '# RANK: df.groupby(...).rank()')
    .replace(/LAG\((.+?),\s*(\d+)\) OVER \((.+?)\)/gi, 'df["$1"].shift($2)  # LAG')
    .replace(/LEAD\((.+?),\s*(\d+)\) OVER \((.+?)\)/gi, 'df["$1"].shift(-$2)  # LEAD')
    .replace(/DECLARE\s+\w+_cursor\s+CURSOR\s+FOR/gi, '# Cursor → Python for loop:')
    .replace(/OPEN\s+\w+_cursor;/gi, '')
    .replace(/FETCH NEXT FROM\s+\w+_cursor\s+INTO\s+(.+);/gi, 'for row in cursor_rows:  # iterate')
    .replace(/WHILE\s+@@FETCH_STATUS\s*=\s*0/gi, 'while cursor_has_rows:')
    .replace(/CLOSE\s+\w+_cursor;/gi, '')
    .replace(/DEALLOCATE\s+\w+_cursor;/gi, '')
    .replace(/WITH\s+(\w+)\s+AS\s*\(/gi, '# CTE $1:\ndef cte_$1(df):')
    .replace(/SET\s+(\w+)\s*=/gi, '$1 =')
    .replace(/SET NOCOUNT ON;/gi, '# SET NOCOUNT ON — not needed in Python')
    .replace(/\bIS\s+NULL\b/gi, 'is None')
    .replace(/\bIS\s+NOT\s+NULL\b/gi, 'is not None')
    .replace(/\bAND\b/g, 'and')
    .replace(/\bOR\b/g, 'or')
    .replace(/\bNOT\b/g, 'not')
    .replace(/\bNULL\b/g, 'None')
    .replace(/IF\s*\((.+?)\)/gi, 'if $1:')
    .replace(/BEGIN$/gim, '')
    .replace(/\bEND\b/gi, '')
    .replace(/;$/gm, '');

  return HEADER('SQL Server (T-SQL)') + sqlImports + result;
}

// ── Public converter ─────────────────────────────────────────
export function convertCode(lang: SupportedLang, code: string): ConversionResult {
  if (!code.trim()) return { python: '', linesIn: 0, linesOut: 0 };

  let python = '';
  switch (lang) {
    case 'java':   python = convertJava(code);   break;
    case 'csharp': python = convertCSharp(code); break;
    case 'js':     python = convertJS(code);     break;
    case 'ts':     python = convertTS(code);     break;
    case 'sql':    python = convertSQL(code);    break;
  }

  return {
    python,
    linesIn:  code.split('\n').length,
    linesOut: python.split('\n').length,
  };
}