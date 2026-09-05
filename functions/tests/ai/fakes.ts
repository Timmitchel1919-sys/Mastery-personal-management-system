import type { Firestore } from "firebase-admin/firestore";
import type {
  AiCompletionInput,
  AiCompletionResult,
  AiProvider,
} from "../../src/ai/shared/ai-provider";

/**
 * Minimal in-memory stand-ins for `Firestore`/`AiProvider` — just enough of the chained
 * query API the real code calls (across `ai/` and `scheduled/`). No real Firestore or AI
 * provider is touched in these tests.
 */

type DocData = Record<string, unknown>;

interface FakeQuery {
  where(field: string, op: "==", value: unknown): FakeQuery;
  orderBy(field: string, direction?: "asc" | "desc"): FakeQuery;
  limit(n: number): FakeQuery;
  startAfter(cursor: unknown): FakeQuery;
  get(): Promise<{ docs: { id: string; data: () => DocData }[]; empty: boolean }>;
}

export interface FakeFirestore {
  seedDoc(path: string, data: DocData): void;
  doc(path: string): {
    id: string;
    get(): Promise<{ exists: boolean; id: string; data: () => DocData | undefined }>;
    set(data: DocData): Promise<void>;
    update(data: DocData): Promise<void>;
  };
  collection(path: string): FakeQuery & { doc(id?: string): ReturnType<FakeFirestore["doc"]> };
}

interface QueryState {
  filters: ((data: DocData) => boolean)[];
  limitN?: number;
  orderField?: string;
  orderDir?: "asc" | "desc";
  cursor?: unknown;
}

export function createFakeFirestore(): FakeFirestore {
  const docs = new Map<string, DocData>();
  let autoId = 0;

  function makeDocRef(path: string) {
    const id = path.split("/").pop()!;
    return {
      id,
      async get() {
        const data = docs.get(path);
        return { exists: data !== undefined, id, data: () => data };
      },
      async set(data: DocData) {
        docs.set(path, data);
      },
      async update(data: DocData) {
        const existing = docs.get(path);
        if (existing === undefined) {
          throw new Error(`Fake Firestore: update() on missing doc ${path}`);
        }
        docs.set(path, { ...existing, ...data });
      },
    };
  }

  function sortKey(id: string, data: DocData, field: string): unknown {
    return field === "__name__" ? id : data[field];
  }

  function makeQuery(path: string, state: QueryState): FakeQuery {
    return {
      where(field, op, value) {
        if (op !== "==") throw new Error(`Fake Firestore only supports "==", got "${op}"`);
        return makeQuery(path, {
          ...state,
          filters: [...state.filters, (data) => data[field] === value],
        });
      },
      orderBy(field, direction = "asc") {
        return makeQuery(path, { ...state, orderField: field, orderDir: direction });
      },
      limit(n) {
        return makeQuery(path, { ...state, limitN: n });
      },
      startAfter(cursor) {
        return makeQuery(path, { ...state, cursor });
      },
      async get() {
        const prefix = `${path}/`;
        let results = [...docs.entries()]
          .filter(([key]) => key.startsWith(prefix) && !key.slice(prefix.length).includes("/"))
          .map(([key, data]) => ({ id: key.slice(prefix.length), data: () => data }));
        results = results.filter(({ data }) => state.filters.every((filter) => filter(data())));

        if (state.orderField) {
          const field = state.orderField;
          const dir = state.orderDir === "desc" ? -1 : 1;
          results = [...results].sort((a, b) => {
            const av = sortKey(a.id, a.data(), field);
            const bv = sortKey(b.id, b.data(), field);
            if (av === bv) return 0;
            return (av! < bv! ? -1 : 1) * dir;
          });
        }

        if (state.cursor !== undefined && state.orderField) {
          const field = state.orderField;
          const cursor = state.cursor;
          const index = results.findIndex(
            (entry) => sortKey(entry.id, entry.data(), field) === cursor,
          );
          results = index === -1 ? [] : results.slice(index + 1);
        }

        if (state.limitN !== undefined) results = results.slice(0, state.limitN);
        return { docs: results, empty: results.length === 0 };
      },
    };
  }

  return {
    seedDoc(path, data) {
      docs.set(path, data);
    },
    doc: (path: string) => makeDocRef(path),
    collection(path: string) {
      const query = makeQuery(path, { filters: [] });
      return {
        ...query,
        doc(id?: string) {
          return makeDocRef(`${path}/${id ?? `auto-${++autoId}`}`);
        },
      };
    },
  };
}

export function asFirestore(fake: FakeFirestore): Firestore {
  return fake as unknown as Firestore;
}

export function createFakeProvider(
  script: AiCompletionResult | Error | ((input: AiCompletionInput) => AiCompletionResult),
): AiProvider {
  return {
    async complete(input) {
      if (script instanceof Error) throw script;
      if (typeof script === "function") return script(input);
      return script;
    },
  };
}
