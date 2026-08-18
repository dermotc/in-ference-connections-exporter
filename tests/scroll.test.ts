import { startPassiveCollector, PassiveCollectorDeps } from '../src/content/scroll';
import { Connection } from '../src/domain/connection';

function makeConn(n: number): Connection {
  return {
    name: `Person ${n}`,
    profileUrl: `https://www.linkedin.com/in/person-${n}/`,
    headline: `Headline ${n}`,
    title: '',
    employer: '',
    connectedOn: 'Connected on Jan 1, 2025',
    messageUrl: '',
  };
}

/**
 * Test double for the DOM-change subscription: exposes `trigger()` so tests
 * can simulate "the observer fired" without a real MutationObserver, and
 * `unsubscribeCalls` so `stop()` can be verified.
 */
function makeDomChangeStub() {
  const callbacks: Array<() => void> = [];
  let unsubscribeCalls = 0;
  const onDomChange = (cb: () => void) => {
    callbacks.push(cb);
    return () => { unsubscribeCalls++; };
  };
  return {
    onDomChange,
    trigger: () => callbacks.forEach(cb => cb()),
    get unsubscribeCalls() { return unsubscribeCalls; },
  };
}

function makeDeps(overrides: Partial<PassiveCollectorDeps> = {}): PassiveCollectorDeps {
  return {
    getCards:      jest.fn().mockReturnValue([]),
    getTotalCount: jest.fn().mockReturnValue(null),
    onProgress:    jest.fn(),
    onDomChange:   jest.fn(() => () => {}),
    ...overrides,
  };
}

describe('startPassiveCollector', () => {

  test('ingests whatever is already visible immediately, before any DOM-change fires', () => {
    const deps = makeDeps({ getCards: jest.fn().mockReturnValue([makeConn(1), makeConn(2)]) });
    const collector = startPassiveCollector(deps);
    expect(collector.getCollected()).toHaveLength(2);
    expect(deps.onProgress).toHaveBeenCalledTimes(1);
    expect((deps.onProgress as jest.Mock).mock.calls[0][0]).toMatchObject({ found: 2 });
  });

  test('handles an empty page gracefully', () => {
    const deps = makeDeps();
    const collector = startPassiveCollector(deps);
    expect(collector.getCollected()).toHaveLength(0);
  });

  test('collects new cards as onDomChange fires, deduplicating by profileUrl', () => {
    const dom = makeDomChangeStub();
    let cards: Connection[] = [makeConn(1)];
    const deps = makeDeps({
      getCards:    jest.fn(() => cards),
      onDomChange: dom.onDomChange,
    });
    const collector = startPassiveCollector(deps);
    expect(collector.getCollected()).toHaveLength(1);

    cards = [makeConn(1), makeConn(2)]; // 1 re-seen, 2 new
    dom.trigger();
    expect(collector.getCollected()).toHaveLength(2);

    cards = [makeConn(2), makeConn(3)]; // simulates virtual-list recycling: 1 no longer in DOM
    dom.trigger();
    const result = collector.getCollected();
    expect(result).toHaveLength(3); // 1 stays collected even though it's no longer rendered
    expect(result.map(c => c.name)).toEqual(
      expect.arrayContaining(['Person 1', 'Person 2', 'Person 3'])
    );
  });

  test('only calls onProgress again when a DOM-change actually surfaces a new card', () => {
    const dom = makeDomChangeStub();
    let cards: Connection[] = [makeConn(1)];
    const deps = makeDeps({ getCards: jest.fn(() => cards), onDomChange: dom.onDomChange });
    startPassiveCollector(deps);
    expect(deps.onProgress).toHaveBeenCalledTimes(1); // initial ingest

    dom.trigger(); // same card, nothing new
    expect(deps.onProgress).toHaveBeenCalledTimes(1); // unchanged — no spurious progress event

    cards = [makeConn(1), makeConn(2)];
    dom.trigger(); // genuinely new
    expect(deps.onProgress).toHaveBeenCalledTimes(2);
  });

  test('reports total from getTotalCount alongside found', () => {
    const deps = makeDeps({
      getCards:      jest.fn().mockReturnValue([makeConn(1)]),
      getTotalCount: jest.fn().mockReturnValue(29793),
    });
    startPassiveCollector(deps);
    expect((deps.onProgress as jest.Mock).mock.calls[0][0]).toMatchObject({ found: 1, total: 29793 });
  });

  test('reports null total when the count element is absent', () => {
    const deps = makeDeps({ getTotalCount: jest.fn().mockReturnValue(null) });
    startPassiveCollector(deps);
    expect((deps.onProgress as jest.Mock).mock.calls[0][0]).toMatchObject({ total: null });
  });

  test('getCollected() reflects live state at any point, not just a final snapshot', () => {
    const dom = makeDomChangeStub();
    let cards: Connection[] = [makeConn(1)];
    const deps = makeDeps({ getCards: jest.fn(() => cards), onDomChange: dom.onDomChange });
    const collector = startPassiveCollector(deps);
    expect(collector.getCollected()).toHaveLength(1);

    cards = [makeConn(1), makeConn(2), makeConn(3)];
    dom.trigger();
    expect(collector.getCollected()).toHaveLength(3); // callable again immediately, no "finish" step
  });

  test('stop() calls the underlying unsubscribe function', () => {
    const dom = makeDomChangeStub();
    const deps = makeDeps({ onDomChange: dom.onDomChange });
    const collector = startPassiveCollector(deps);
    expect(dom.unsubscribeCalls).toBe(0);
    collector.stop();
    expect(dom.unsubscribeCalls).toBe(1);
  });

  test('simulates a real scroll session: many recycled DOM windows, all connections retained', () => {
    const dom = makeDomChangeStub();
    const windows: Connection[][] = [
      Array.from({ length: 10 }, (_, i) => makeConn(i + 1)),   // 1–10
      Array.from({ length: 10 }, (_, i) => makeConn(i + 6)),   // 6–15 (5 new)
      Array.from({ length: 10 }, (_, i) => makeConn(i + 11)),  // 11–20 (5 new)
      Array.from({ length: 5  }, (_, i) => makeConn(i + 16)),  // 16–20 (0 new)
    ];
    let i = 0;
    const deps = makeDeps({ getCards: jest.fn(() => windows[i]), onDomChange: dom.onDomChange });
    const collector = startPassiveCollector(deps);

    for (i = 1; i < windows.length; i++) dom.trigger();

    expect(collector.getCollected()).toHaveLength(20);
  });

});
