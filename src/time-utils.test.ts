import {test, TestContext} from "node:test";
import assert from "node:assert/strict";
import { parseRuntimeToMinutes, parseClockTimeToMinutes, formatMinutesToClockTime } from "./time-utils.js";

test("parseRuntimeToMinutes", async (t: TestContext) => {
  await t.test("parses hours and minutes", () => {
    assert.equal(parseRuntimeToMinutes("1 hr 46 minutes"), 106);
  });

  await t.test("parses minutes only", () => {
    assert.equal(parseRuntimeToMinutes("45 minutes"), 45);
  });

  await t.test("parses hours only", () => {
    assert.equal(parseRuntimeToMinutes("2 hrs"), 120);
  });

  await t.test("returns null for non-numeric runtimes like TBC", () => {
    assert.equal(parseRuntimeToMinutes("TBC"), null);
  });

  await t.test("returns 0 for an explicit zero-minute runtime", () => {
    assert.equal(parseRuntimeToMinutes("0 minutes"), 0);
  });
});

test("parseClockTimeToMinutes", async (t: TestContext) => {
  await t.test("parses a standard HH:MM time", () => {
    assert.equal(parseClockTimeToMinutes("09:05"), 545);
  });

  await t.test("parses the last minute of the day", () => {
    assert.equal(parseClockTimeToMinutes("23:59"), 1439);
  });

  await t.test("returns null for non-time text", () => {
    assert.equal(parseClockTimeToMinutes("TBC"), null);
  });

  await t.test("returns null when minutes are not zero-padded", () => {
    assert.equal(parseClockTimeToMinutes("9:5"), null);
  });
});

test("formatMinutesToClockTime", async (t :TestContext) => {
  await t.test("formats a normal time", () => {
    assert.equal(formatMinutesToClockTime(65), "01:05");
  });

  await t.test("formats midnight", () => {
    assert.equal(formatMinutesToClockTime(0), "00:00");
  });

  await t.test("wraps a negative value back into the previous day", () => {
    assert.equal(formatMinutesToClockTime(-1), "23:59");
  });

  await t.test("wraps a value past 24 hours into the next day", () => {
    assert.equal(formatMinutesToClockTime(1500), "01:00");
  });
});
