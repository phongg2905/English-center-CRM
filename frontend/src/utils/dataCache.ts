/**
 * Smart In-Memory Data Cache & Request Deduplicator cho EduFlow CRM
 * - Lưu cache dữ liệu GET theo từng phân hệ để chuyển trang / mở modal mượt mà tức thì
 * - Chống gọi trùng lặp (in-flight request deduplication) khi nhiều component cùng gọi 1 API
 * - Tự động xóa cache (invalidate) đúng phân hệ khi có thao tác thêm/sửa/xóa thực sự thay đổi dữ liệu
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}

type CacheListener = (invalidatedPrefixes: string[]) => void;

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 phút

class DataCacheManager {
  private store = new Map<string, CacheEntry>();
  private inFlight = new Map<string, Promise<any>>();
  private listeners = new Set<CacheListener>();

  /**
   * Tạo khóa cache chuẩn hóa từ prefix và tham số truy vấn
   */
  buildKey(prefix: string, params?: unknown): string {
    if (params === undefined || params === null || params === '') {
      return `${prefix}:all`;
    }
    if (typeof params !== 'object') {
      return `${prefix}:${String(params)}`;
    }
    const entries = Object.entries(params as Record<string, any>)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .sort(([a], [b]) => a.localeCompare(b));

    if (entries.length === 0) {
      return `${prefix}:all`;
    }
    return `${prefix}:${JSON.stringify(Object.fromEntries(entries))}`;
  }

  /**
   * Đọc nhanh dữ liệu trong cache (đồng bộ) để tránh bật skeleton loading khi đã có sẵn dữ liệu
   */
  peek<T>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > ttlMs) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  /**
   * Kiểm tra một prefix có dữ liệu cache hợp lệ hay không
   */
  hasPrefix(prefix: string): boolean {
    const now = Date.now();
    for (const [k, v] of this.store.entries()) {
      if (k.startsWith(prefix) && now - v.timestamp <= DEFAULT_TTL_MS) {
        return true;
      }
    }
    return false;
  }

  /**
   * Lấy dữ liệu từ cache nếu còn hạn, nếu chưa có thì gọi API (kèm chống gọi trùng in-flight)
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { ttlMs?: number; forceRefresh?: boolean }
  ): Promise<T> {
    const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
    const forceRefresh = options?.forceRefresh ?? false;

    if (!forceRefresh) {
      const cached = this.peek<T>(key, ttlMs);
      if (cached !== undefined) {
        return cached;
      }

      const pending = this.inFlight.get(key);
      if (pending) {
        return pending as Promise<T>;
      }
    }

    const promise = fetcher()
      .then((result) => {
        this.store.set(key, {
          data: result,
          timestamp: Date.now(),
        });
        this.inFlight.delete(key);
        return result;
      })
      .catch((err) => {
        this.inFlight.delete(key);
        throw err;
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Ghi đè dữ liệu vào cache
   */
  set<T>(key: string, data: T): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Làm mới (xóa) các khóa cache bắt đầu bằng prefix khi dữ liệu thực sự thay đổi
   */
  invalidate(prefix: string): void {
    this.invalidateMany([prefix]);
  }

  /**
   * Làm mới nhiều phân hệ liên quan cùng lúc (VD: xếp lớp sẽ làm mới classes, enrollments, leads, analytics)
   */
  invalidateMany(prefixes: string[]): void {
    for (const key of Array.from(this.store.keys())) {
      if (prefixes.some((p) => key.startsWith(p))) {
        this.store.delete(key);
      }
    }
    for (const key of Array.from(this.inFlight.keys())) {
      if (prefixes.some((p) => key.startsWith(p))) {
        this.inFlight.delete(key);
      }
    }
    this.notify(prefixes);
  }

  /**
   * Xóa toàn bộ cache (dùng khi đăng xuất hoặc đổi tài khoản)
   */
  clearAll(): void {
    this.store.clear();
    this.inFlight.clear();
    this.notify(['*']);
  }

  subscribe(listener: CacheListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(prefixes: string[]): void {
    for (const listener of this.listeners) {
      try {
        listener(prefixes);
      } catch {
        // Bỏ qua lỗi listener
      }
    }
  }
}

export const dataCache = new DataCacheManager();

