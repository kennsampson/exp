// Everything the player has discovered: who they've met, which dialog
// topics they've heard, which objects they've inspected, and whether the
// finale has played. One shared instance lives for the whole game so the
// town and every interior see the same state, and it's mirrored to
// localStorage so progress survives a reload.
//
// The selector functions are exported separately (and are pure) so the
// gating rules can be unit-tested without a browser.

import Dialog from "../data/Dialog.js";

const STORAGE_KEY = "exp:progress:v2";

// How many stories the player needs before Kenn has something new to say.
export const FINALE_THRESHOLD = 0.6;

export function emptyProgress() {
  return { met: [], heard: [], inspected: [], finaleSeen: false };
}

/**
 * A requirement is either a villager key ("kenn": you've met them) or a
 * "villager:topic" pair (you've heard that specific topic).
 */
export function meetsRequirement(req, progress) {
  return req.includes(":")
    ? progress.heard.includes(req)
    : progress.met.includes(req);
}

export function isTopicUnlocked(topic, progress) {
  return (topic.requires || []).every((req) =>
    meetsRequirement(req, progress),
  );
}


export function availableTopics(personKey, people, progress) {
  return (people[personKey]?.topics || []).filter(
    (topic) =>
      isTopicUnlocked(topic, progress) &&
      (!topic.finale || finaleUnlocked(progress, people)),
  );
}

export function hasNewTopics(personKey, people, progress) {
  return availableTopics(personKey, people, progress).some(
    (topic) => !progress.heard.includes(`${personKey}:${topic.id}`),
  );
}

/** Every topic flagged `story: true`, across everyone. */
export function listStories(people) {
  return Object.entries(people).flatMap(([key, person]) =>
    (person.topics || [])
      .filter((topic) => topic.story)
      .map((topic) => ({ id: `${key}:${topic.id}`, person: key, topic })),
  );
}

export function storyCount(progress, people) {
  const stories = listStories(people);
  const found = stories.filter((s) => progress.heard.includes(s.id)).length;
  return { found, total: stories.length };
}

export function finaleUnlocked(progress, people) {
  const { found, total } = storyCount(progress, people);
  return total > 0 && found / total >= FINALE_THRESHOLD;
}

class ProgressManager {
  constructor(people) {
    this.people = people;
    this.state = this.load();
    this.listeners = new Set();
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return { ...emptyProgress(), ...saved };
    } catch {
      return emptyProgress();
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Private mode or storage full -- progress just won't persist.
    }
    this.listeners.forEach((fn) => fn(this.state));
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  meet(personKey) {
    if (this.state.met.includes(personKey)) return false;
    this.state.met.push(personKey);
    this.save();
    return true;
  }

  /** @returns {boolean} true the first time this topic is heard. */
  hear(personKey, topicId) {
    const id = `${personKey}:${topicId}`;
    if (this.state.heard.includes(id)) return false;
    this.state.heard.push(id);
    this.save();
    return true;
  }

  inspect(id) {
    if (this.state.inspected.includes(id)) return false;
    this.state.inspected.push(id);
    this.save();
    return true;
  }

  markFinaleSeen() {
    this.state.finaleSeen = true;
    this.save();
  }

  hasMet(key) {
    return this.state.met.includes(key);
  }

  hasHeard(personKey, topicId) {
    return this.state.heard.includes(`${personKey}:${topicId}`);
  }

  hasInspected(id) {
    return this.state.inspected.includes(id);
  }

  availableTopics(personKey) {
    return availableTopics(personKey, this.people, this.state);
  }

  hasNewTopics(personKey) {
    return hasNewTopics(personKey, this.people, this.state);
  }

  get stories() {
    return storyCount(this.state, this.people);
  }

  get finaleUnlocked() {
    return finaleUnlocked(this.state, this.people);
  }

  reset() {
    this.state = emptyProgress();
    this.save();
  }
}

// Node's test runner has no localStorage; only build the singleton in the
// browser so the pure helpers above stay importable from tests.
const Progress =
  typeof localStorage === "undefined"
    ? null
    : new ProgressManager(Dialog.people);

export default Progress;
