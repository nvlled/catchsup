import { assert, describe, it } from "vitest";
import { createFnMux } from "../src/lib/fn-mux";
import { sleep } from "../src/lib/jsext";

describe("invoke multiplexing", () => {
  it("waits for interval", async () => {
    let calls = 0;
    const f = createFnMux(async () => {
      calls++;
    }, 250);
    f();
    await sleep(10);
    f({ waitInterval: true });
    await sleep(10);
    f({ waitInterval: true });
    await sleep(10);
    f({ waitInterval: true });
    await sleep(10);
    f({ waitInterval: true });
    await sleep(300);
    assert.equal(calls, 2);

    calls = 0;

    f();
    await sleep(10);
    f({ waitInterval: false });
    await sleep(10);
    f({ waitInterval: false });
    await sleep(10);
    f({ waitInterval: false });
    await sleep(10);
    f({ waitInterval: false });
    await sleep(300);
    assert.equal(calls, 5);
  });

  it("prevents simultaneous invocation", async () => {
    let totalWrites = 0;
    const promises: Promise<void>[] = [];
    const fs = {
      busy: false,
      async write() {
        assert.isFalse(fs.busy);
        fs.busy = true;
        const p = sleep(50 + Math.random() * 100);
        totalWrites++;
        promises.push(p);
        await p;
        fs.busy = false;
      },
    };
    const f = createFnMux(fs.write);
    for (let i = 0; i < 100; i++) {
      await sleep(5 + Math.random() * 10);
      f();
    }
    await sleep(200);
    await Promise.all(promises);
    //console.log({ totalWrites });
    assert.isTrue(totalWrites >= 1 && totalWrites < 100);

    totalWrites = 0;
    f();
    await sleep(200);
    f();
    await sleep(200);
    f();
    await sleep(200);
    //console.log({ totalWrites });
    assert.equal(totalWrites, 3);
  });
});
