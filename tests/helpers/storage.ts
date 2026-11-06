// localStorage em memória para os testes (o Node não tem um). Um novo a cada teste, para
// exercitar o caminho real de gravação sem vazar estado entre testes.
export function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, String(value));
    },
  };
}

// Simula o localStorage cheio: lê normalmente, mas qualquer gravação lança QuotaExceededError.
export function fullStorage(base: Storage = memoryStorage()): Storage {
  return {
    get length() {
      return base.length;
    },
    clear: () => base.clear(),
    getItem: (key) => base.getItem(key),
    key: (index) => base.key(index),
    removeItem: (key) => base.removeItem(key),
    setItem: () => {
      throw new DOMException("O armazenamento está cheio.", "QuotaExceededError");
    },
  };
}
