import { describe, expect, it } from "vitest";
import { arrivals } from "./motion";

const before = (ids: string[], pending = 0) => ({ ids: new Set(ids), pending });

describe("arrivals", () => {
  it("marks rows that weren't there before as fresh", () => {
    const result = arrivals(before(["a", "b"]), [
      { id: "c" },
      { id: "a" },
      { id: "b" },
    ]);
    expect([...result.fresh]).toEqual(["c"]);
    expect(result.confirmed.size).toBe(0);
  });

  it("a new optimistic row is fresh", () => {
    const result = arrivals(before(["a"]), [
      { id: "pending-1", pending: true },
      { id: "a" },
    ]);
    expect([...result.fresh]).toEqual(["pending-1"]);
  });

  it("the real row replacing an optimistic one is confirmed, not fresh", () => {
    const result = arrivals(before(["pending-1", "a"], 1), [
      { id: "real-1" },
      { id: "a" },
    ]);
    expect(result.fresh.size).toBe(0);
    expect([...result.confirmed]).toEqual(["real-1"]);
  });

  it("a restored row (same id, back after undo) is fresh", () => {
    const result = arrivals(before(["b"]), [{ id: "a" }, { id: "b" }]);
    expect([...result.fresh]).toEqual(["a"]);
  });

  it("nothing new, nothing animated", () => {
    const result = arrivals(before(["a", "b"]), [{ id: "b" }]);
    expect(result.fresh.size + result.confirmed.size).toBe(0);
  });
});
