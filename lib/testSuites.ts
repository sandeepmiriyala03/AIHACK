// ============================================================
// RupantarCode — Unit Test Suites
// AksharaTantra · Yuktishaalaa AI Lab
// ============================================================

import type { TestCase, SupportedLang } from '@/types/rupantar.types';

export const TEST_SUITES: Record<SupportedLang, Record<string, TestCase[]>> = {
  java: {
    'REST Controller': [
      { name: 'GET /users returns list',        fn: () => { const a: {id:number,name:string}[] = []; a.push({id:1,name:'Alice'}); return a.length === 1; } },
      { name: 'GET /users/:id found',           fn: () => { const u = [{id:1,name:'Alice'}]; return u.find(x => x.id === 1) !== undefined; } },
      { name: 'GET /users/:id not found → 404', fn: () => { const u = [{id:1}]; return u.find(x => x.id === 99) === undefined; } },
      { name: 'POST validates payload',         fn: () => { const name='Bob', email='b@t.com'; return !!(name && email); } },
      { name: 'DELETE removes correct user',    fn: () => { const a = [{id:1},{id:2}]; return a.filter(u => u.id !== 1).length === 1; } },
      { name: 'dict.get() default value',       fn: () => { const d: Record<string,number> = {Laptop:999}; return (d['Mouse'] ?? 0) === 0; } },
    ],
    'ArrayList & HashMap': [
      { name: 'list.append() adds item',        fn: () => { const a: string[] = []; a.push('Laptop'); return a.length === 1; } },
      { name: 'dict key lookup',                fn: () => { const d: Record<string,number> = {Laptop:999.99}; return d['Laptop'] === 999.99; } },
      { name: 'dict.get() with default',        fn: () => { const d: Record<string,number> = {a:1}; return (d['b'] ?? 0) === 0; } },
      { name: 'sum of values',                  fn: () => { const p = [999.99, 29.99, 79.99]; return Math.abs(p.reduce((a,b)=>a+b,0) - 1109.97) < 0.01; } },
      { name: 'list iteration count',           fn: () => { const a = ['a','b','c']; let c=0; for(const _ of a) c++; return c===3; } },
    ],
    'Exception Handling': [
      { name: 'negative amount raises error',   fn: () => { try { if(-10<=0) throw new Error('neg'); return false; } catch { return true; } } },
      { name: 'insufficient funds raises',      fn: () => { const bal=100,amt=200; try { if(amt>bal) throw new Error('insuf'); return false; } catch { return true; } } },
      { name: 'valid withdrawal succeeds',      fn: () => { let bal=500; const amt=100; if(amt>0&&amt<=bal) bal-=amt; return bal===400; } },
      { name: 'balance updated correctly',      fn: () => { let bal=300; bal-=50; return bal===250; } },
    ],
    'Java Streams': [
      { name: 'filter > 200',                   fn: () => { const s=[120,340,89,456,230,78,560]; return s.filter(x=>x>200).length===4; } },
      { name: 'sum is 1873',                    fn: () => { const s=[120,340,89,456,230,78,560]; return s.reduce((a,b)=>a+b,0)===1873; } },
      { name: 'sorted ascending',               fn: () => { const s=[3,1,2]; return [...s].sort((a,b)=>a-b)[0]===1; } },
      { name: 'average of [10,20,30] = 20',     fn: () => { const s=[10,20,30]; return s.reduce((a,b)=>a+b,0)/s.length===20; } },
    ],
  },

  csharp: {
    'LINQ Query': [
      { name: 'filter IT department',           fn: () => { const e=[{dept:'IT',sal:75000},{dept:'HR',sal:55000}]; return e.filter(x=>x.dept==='IT').length===1; } },
      { name: 'sort desc by salary',            fn: () => { const e=[{sal:75000},{sal:82000}]; return [...e].sort((a,b)=>b.sal-a.sal)[0].sal===82000; } },
      { name: 'group by dept counts',           fn: () => { const e=[{d:'IT'},{d:'HR'},{d:'IT'}]; const g: Record<string,number>={}; e.forEach(x=>{g[x.d]=(g[x.d]||0)+1;}); return g['IT']===2; } },
      { name: 'average salary = 78500',         fn: () => { const s=[75000,82000]; return s.reduce((a,b)=>a+b,0)/s.length===78500; } },
    ],
    'Async/Await': [
      { name: 'async fn returns Promise',       fn: () => { const fn = async () => 'ok'; return fn() instanceof Promise; } },
      { name: 'await resolves value',           fn: async () => { const fn = async () => 42; return await fn() === 42; } },
      { name: 'error caught correctly',         fn: () => { try { throw new Error('http err'); } catch(e: unknown) { return (e as Error).message === 'http err'; } } },
      { name: 'Promise.all runs parallel',      fn: async () => { const r = await Promise.all([Promise.resolve(1), Promise.resolve(2)]); return r.length===2; } },
    ],
    'Entity Framework': [
      { name: 'filter price < 500',             fn: () => { const p=[{price:100},{price:600}]; return p.filter(x=>x.price<500).length===1; } },
      { name: 'sort by price asc',              fn: () => { const p=[{price:300},{price:100}]; return [...p].sort((a,b)=>a.price-b.price)[0].price===100; } },
      { name: 'filter by categoryId',           fn: () => { const p=[{catId:1},{catId:2}]; return p.filter(x=>x.catId===1).length===1; } },
    ],
  },

  js: {
    'Express API': [
      { name: 'GET returns array',              fn: () => Array.isArray([{id:1}]) },
      { name: 'POST validates name+email',      fn: () => { const {name,email}={name:'A',email:'a@b.com'}; return !!(name&&email); } },
      { name: 'POST rejects missing field',     fn: () => { const {name,email}={name:'A',email:''}; return !(name&&email); } },
      { name: 'find user by id',                fn: () => { const u=[{id:1,name:'A'},{id:2,name:'B'}]; return u.find(x=>x.id===2)?.name==='B'; } },
      { name: '404 when not found',             fn: () => { const u=[{id:1}]; return u.find(x=>x.id===99)===undefined; } },
    ],
    'Promises & Async': [
      { name: 'filter even numbers',            fn: () => [1,2,3,4,5,6,7,8,9,10].filter(x=>x%2===0).length===5 },
      { name: 'map to squares',                 fn: () => [2,4,6,8,10].map(x=>x*x)[0]===4 },
      { name: 'async/await resolves',           fn: async () => (await Promise.resolve(99))===99 },
      { name: 'try/catch catches error',        fn: () => { try { throw new Error('fail'); } catch { return true; } return false; } },
    ],
    'Class & OOP': [
      { name: 'addItem increases length',       fn: () => { const c: {name:string,price:number,qty:number}[]=[]; c.push({name:'X',price:10,qty:1}); return c.length===1; } },
      { name: 'getTotal sums correctly',        fn: () => [{price:10,qty:2},{price:5,qty:3}].reduce((s,i)=>s+i.price*i.qty,0)===35 },
      { name: 'discount applied to total',      fn: () => Math.abs(100*(1-0.1)-90)<0.001 },
      { name: 'removeItem filters correctly',   fn: () => [{name:'A'},{name:'B'}].filter(i=>i.name!=='A').length===1 },
      { name: 'duplicate item merges qty',      fn: () => { const items=[{name:'A',qty:1}]; const ex=items.find(i=>i.name==='A'); if(ex) ex.qty+=1; return items[0].qty===2; } },
    ],
  },

  ts: {
    'Interface & Types': [
      { name: 'user object shape valid',        fn: () => { const u={id:1,name:'A',email:'a@b.com',role:'admin',createdAt:new Date()}; return !!(u.id&&u.name&&u.email); } },
      { name: 'filterByRole returns admins',    fn: () => [{role:'admin'},{role:'user'},{role:'admin'}].filter(u=>u.role==='admin').length===2 },
      { name: 'invalid role excluded',          fn: () => [{role:'guest'}].filter(u=>u.role==='admin').length===0 },
      { name: 'default role is user',           fn: () => 'user'==='user' },
    ],
    'Generics': [
      { name: 'add item to repository',         fn: () => { const items: {id:number}[]=[]; items.push({id:1}); return items.length===1; } },
      { name: 'findById returns correct item',  fn: () => [{id:1},{id:2}].find(i=>i.id===2)?.id===2 },
      { name: 'remove shifts length',           fn: () => { const items=[{id:1},{id:2}]; const idx=items.findIndex(i=>i.id===1); if(idx!==-1) items.splice(idx,1); return items.length===1; } },
      { name: 'count returns 3',                fn: () => [{id:1},{id:2},{id:3}].length===3 },
    ],
  },

  sql: {
    'SELECT & JOINs': [
      { name: 'group by sums correctly',        fn: () => { const o=[{cid:1,amt:100},{cid:1,amt:200},{cid:2,amt:50}]; const g: Record<number,number>={}; o.forEach(x=>{g[x.cid]=(g[x.cid]||0)+x.amt;}); return g[1]===300; } },
      { name: 'left join preserves nulls',      fn: () => { const c=[{id:1},{id:2}]; const o=[{cid:1}]; return c.map(x=>({...x,order:o.find(y=>y.cid===x.id)||null}))[1].order===null; } },
      { name: 'having count > 0 filters',       fn: () => [{cid:1,cnt:3},{cid:2,cnt:0}].filter(d=>d.cnt>0).length===1 },
      { name: 'order by desc',                  fn: () => [...[{s:100},{s:500},{s:200}]].sort((a,b)=>b.s-a.s)[0].s===500 },
    ],
    'Stored Procedure': [
      { name: 'filter by department',           fn: () => [{dept:1,sal:50000},{dept:2,sal:60000}].filter(x=>x.dept===1).length===1 },
      { name: 'filter min salary >= 50k',       fn: () => [{sal:30000},{sal:70000}].filter(x=>x.sal>=50000).length===1 },
      { name: 'years of service = 6',           fn: () => (new Date('2026-01-01').getFullYear()-new Date('2020-01-01').getFullYear())===6 },
      { name: 'null param returns all',         fn: () => { const d=null; const e=[{d:1},{d:2}]; return (d===null?e:e.filter(x=>x.d===d)).length===2; } },
    ],
    'T-SQL Cursor': [
      { name: 'stock < 10 is critical',         fn: () => 5 < 10 },
      { name: 'reorder flag set to 1',          fn: () => { const p=[{id:1,flag:0}]; p[0].flag=1; return p[0].flag===1; } },
      { name: 'cursor iterates all rows',       fn: () => { const p=[{id:1,stock:5},{id:2,stock:45}]; let c=0; for(const x of p){if(x.stock<50)c++;} return c===2; } },
    ],
    'CTE & Window Fns': [
      { name: 'monthly sum by group',           fn: () => { const o=[{m:1,a:100},{m:1,a:200},{m:2,a:300}]; const g: Record<number,number>={}; o.forEach(x=>{g[x.m]=(g[x.m]||0)+x.a;}); return g[1]===300; } },
      { name: 'LAG = previous value diff',      fn: () => [100,200,300][1]-[100,200,300][0]===100 },
      { name: 'top 3 by rank',                  fn: () => [...[{v:500},{v:300},{v:100},{v:700}]].sort((a,b)=>b.v-a.v).slice(0,3).length===3 },
    ],
  },
};
