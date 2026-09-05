import type { Firestore } from "firebase-admin/firestore";
import type {
  AiCompletionInput,
  AiCompletionResult,
  AiProvider,
} from "../../src/ai/shared/ai-provider";

/**
 * Minimal in-memory stand-ins for `Firestore`/`AiProvider` — just enough of the chained
 * query API that `handler.ts`/`quota.ts`/`context-builder.ts` actually call. No real
 * Firestore or AI provider is touched in these tests.
 */

type DocData = Record<string, unknown>;

interface FakeQuery {
  where(field: string, op: "==", value: unknown): FakeQuery;
  orderBy(field: string, direction?: "asc" | "desc"): FakeQuery;
  limit(n: number): FakeQuery;
  get(): Promise<{ docs: { id: string; data: () => DocData }[] }>;
}

export interface FakeFirestore {
  seedDoc(path: string, data: DocData): void;
  doc(path: string): {
    id: string;
    get(): Promise<{ exists: boolean; id: string; data: () => DocData | undefined }>;
    set(data: DocData): Promise<void>;
  };
  collection(path: string): FakeQuery & { doc(id?: string): ReturnType<FakeFirestore["doc"]> };
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
    };
  }

  function makeQuery(
    path: string,
    filters: ((data: DocData) => boolean)[],
    limitN?: number,
  ): FakeQuery {
    return {
      where(field, op, value) {
        if (op !== "==") throw new Error(`Fake Firestore only supports "==", got "${op}"`);
        return makeQuery(path, [...filters, (data) => data[field] === value], limitN);
      },
      orderBy() {
        // Ordering isn't simulated — tests seed data already in the order they assert on,
        // or assert on set membership rather than order.
        return makeQuery(path, filters, limitN);
      },
      limit(n) {
        return makeQuery(path, filters, n);
      },
      async get() {
        const prefix = `${path}/`;
        let results = [...docs.entries()]
          .filter(([key]) => key.startsWith(prefix) && !key.slice(prefix.length).includes("/"))
          .map(([key, data]) => ({ id: key.slice(prefix.length), data: () => data }));
        results = results.filter(({ data }) => filters.every((filter) => filter(data())));
        if (limitN !== undefined) results = results.slice(0, limitN);
        return { docs: results };
      },
    };
  }

  return {
    seedDoc(path, data) {
      docs.set(path, data);
    },
    doc: (path: string) => makeDocRef(path),
    collection(path: string) {
      const query = makeQuery(path, []);
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
