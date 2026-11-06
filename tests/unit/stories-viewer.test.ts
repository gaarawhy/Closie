import { describe, expect, it } from "vitest";
import {
  createViewer,
  currentStoryId,
  durationFor,
  segmentProgress,
  viewerReducer,
  type ViewerAction,
  type ViewerGroupRef,
  type ViewerState,
} from "@/lib/stories/viewer";

const groups: ViewerGroupRef[] = [
  { ownerId: "ana", storyIds: ["a1", "a2", "a3"], startIndex: 1 },
  { ownerId: "bia", storyIds: ["b1", "b2"], startIndex: 0 },
  { ownerId: "caio", storyIds: ["c1"], startIndex: 0 },
];

const run = (state: ViewerState, ...actions: ViewerAction[]) => actions.reduce(viewerReducer, state);
const loaded = (durationMs = 5000): ViewerAction => ({ type: "media_loaded", durationMs });
const tick = (deltaMs: number): ViewerAction => ({ type: "tick", deltaMs });

describe("abrir", () => {
  it("abre no primeiro não visto da pessoa escolhida, carregando", () => {
    const state = createViewer(groups, 0);
    expect(state).toMatchObject({ groupIndex: 0, storyIndex: 1, status: "loading", elapsedMs: 0, durationMs: null });
    expect(currentStoryId(state)).toBe("a2");
    expect(currentStoryId(createViewer(groups, 1))).toBe("b1");
  });

  it("sem nada para ver, já começa terminado", () => {
    expect(createViewer([], 0).status).toBe("finished");
  });
});

describe("tempo e avanço automático", () => {
  it("carregando não avança; carregou toca e avança sozinho no fim da duração", () => {
    let state = run(createViewer(groups, 1), tick(10_000));
    expect(state).toMatchObject({ storyIndex: 0, status: "loading", elapsedMs: 0 });
    state = run(state, loaded(5000), tick(3000));
    expect(state).toMatchObject({ status: "playing", elapsedMs: 3000, storyIndex: 0 });
    state = run(state, tick(2000));
    expect(state).toMatchObject({ storyIndex: 1, status: "loading", elapsedMs: 0, durationMs: null });
    expect(currentStoryId(state)).toBe("b2");
  });

  it("durationFor: foto 5 s; vídeo pela duração, entre 1 s e 60 s; sem duração válida, 10 s", () => {
    const image = { type: "image" as const, url: "https://x.com/a.jpg" };
    const video = { type: "video" as const, url: "https://x.com/a.mp4" };
    expect(durationFor(image, 30)).toBe(5000);
    expect(durationFor(video, 7.5)).toBe(7500);
    expect(durationFor(video, 0.2)).toBe(1000);
    expect(durationFor(video, 90)).toBe(60_000);
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, -3, undefined]) {
      expect(durationFor(video, bad)).toBe(10_000);
    }
  });
});

describe("pausar", () => {
  it("segurar pausa e soltar retoma sem perder o progresso", () => {
    let state = run(createViewer(groups, 1), loaded(5000), tick(2000), { type: "hold" });
    expect(state.status).toBe("paused");
    state = run(state, tick(5000));
    expect(state.elapsedMs).toBe(2000);
    state = run(state, { type: "release" }, tick(1000));
    expect(state).toMatchObject({ status: "playing", elapsedMs: 3000 });
  });

  it("segurar durante o carregamento: carrega pausado e só toca ao soltar", () => {
    let state = run(createViewer(groups, 1), { type: "hold" }, loaded(5000), tick(1000));
    expect(state).toMatchObject({ status: "paused", elapsedMs: 0 });
    state = run(state, { type: "release" });
    expect(state.status).toBe("playing");
  });

  it("aba escondida pausa e voltar retoma, a não ser que ainda esteja segurando", () => {
    let state = run(createViewer(groups, 1), loaded(), { type: "visibility", hidden: true });
    expect(state.status).toBe("paused");
    state = run(state, { type: "visibility", hidden: false });
    expect(state.status).toBe("playing");
    state = run(state, { type: "visibility", hidden: true }, { type: "hold" }, { type: "visibility", hidden: false });
    expect(state.status).toBe("paused");
    state = run(state, { type: "release" });
    expect(state.status).toBe("playing");
  });
});

describe("navegar", () => {
  it("próximo e anterior story atravessam pessoas; nas pontas recomeça ou termina", () => {
    let state = createViewer(groups, 0); // a2
    state = run(state, { type: "next_story" });
    expect(currentStoryId(state)).toBe("a3");
    state = run(state, { type: "next_story" });
    expect(currentStoryId(state)).toBe("b1");
    state = run(state, { type: "prev_story" });
    expect(currentStoryId(state)).toBe("a3"); // último da pessoa anterior
    state = run(state, { type: "prev_story" }, { type: "prev_story" }, { type: "prev_story" });
    expect(currentStoryId(state)).toBe("a1"); // primeiro da primeira pessoa: recomeça
    expect(state.status).toBe("loading");
  });

  it("próxima e anterior pessoa", () => {
    let state = createViewer(groups, 0); // a2
    state = run(state, { type: "next_user" });
    expect(currentStoryId(state)).toBe("b1");
    state = run(state, { type: "next_user" });
    expect(currentStoryId(state)).toBe("c1");
    state = run(state, { type: "prev_user" });
    expect(currentStoryId(state)).toBe("b1"); // começo da pessoa anterior
    state = run(state, { type: "prev_user" }, { type: "prev_user" });
    expect(currentStoryId(state)).toBe("a1");
    state = run(createViewer(groups, 2), { type: "next_user" });
    expect(state.status).toBe("finished");
  });

  it("o fim do último story da última pessoa termina", () => {
    const state = run(createViewer(groups, 2), loaded(1000), tick(1000));
    expect(state.status).toBe("finished");
    expect(currentStoryId(state)).toBeNull();
  });
});

describe("erros e fim", () => {
  it("erro de mídia não avança; tentar de novo volta a carregar", () => {
    let state = run(createViewer(groups, 1), { type: "media_error" }, tick(10_000));
    expect(state).toMatchObject({ status: "error", storyIndex: 0 });
    state = run(state, loaded());
    expect(state.status).toBe("error");
    state = run(state, { type: "retry" }, loaded());
    expect(state.status).toBe("playing");
    state = run(state, { type: "media_error" });
    expect(state.status).toBe("error");
    state = run(state, { type: "next_story" });
    expect(state).toMatchObject({ status: "loading", storyIndex: 1 });
  });

  it("fechado ou terminado ignora o resto", () => {
    const closed = run(createViewer(groups, 0), { type: "close" });
    expect(closed.status).toBe("closed");
    expect(run(closed, { type: "next_story" }, loaded(), tick(9000))).toEqual(closed);
    expect(currentStoryId(closed)).toBeNull();
  });
});

describe("barras de progresso", () => {
  it("1 nos anteriores, fração no atual, 0 nos seguintes", () => {
    const state = run(createViewer(groups, 0), loaded(4000), tick(1000));
    expect(segmentProgress(state)).toEqual([1, 0.25, 0]);
    expect(segmentProgress(createViewer(groups, 0))).toEqual([1, 0, 0]);
  });

  it("ao terminar, as barras da última pessoa ficam cheias", () => {
    const state = run(createViewer(groups, 1), { type: "next_user" }, loaded(5000), tick(4000), tick(1000));
    expect(state.status).toBe("finished");
    expect(segmentProgress(state)).toEqual([1]);
  });
});
