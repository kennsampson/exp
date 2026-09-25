import Dialog from "../data/Dialog";
import Links from "../data/Links";
import Animations from "../data/Animations";
import AudioManager from "./AudioManager";
import Progress from "./ProgressManager";
import { isTouch } from "../device";

// The scripted flows behind pressing Space on something. Each one opens the
// dialog box, awaits its way through lines and choices, and closes it again.

const GOODBYE = "__goodbye";
const NARRATOR_VOICE = 520;

/** Greeting, then a JRPG-style "ask about..." menu until the player leaves. */
export async function talkTo(scene, villager) {
  const key = villager.key;
  const person = Dialog.people[key];
  const dialog = scene.dialogManager;
  if (!person) return;

  scene.player.halt();
  villager.isTalking = true;
  const p = scene.player.getCenter();
  villager.faceToward(p.x, p.y);

  dialog.open(person);
  const firstMeeting = Progress.meet(key);
  let ok = await dialog.say(
    firstMeeting ? person.greeting : person.returnGreeting,
  );

  while (ok) {
    const topics = Progress.availableTopics(key);
    if (!topics.length) {
      await dialog.say(person.lockedLines || ["..."]);
      break;
    }

    const pick = await dialog.choose([
      ...topics.map((topic) => {
        const heard = Progress.hasHeard(key, topic.id);
        return { id: topic.id, label: topic.label, isNew: !heard, isDone: heard };
      }),
      { id: GOODBYE, label: "Goodbye" },
    ]);
    if (!pick || pick === GOODBYE) break;

    const topic = topics.find((t) => t.id === pick);
    ok = await dialog.say(
      isTouch() && topic.touchLines ? topic.touchLines : topic.lines,
    );
    if (!ok) break; // bailed out mid-story: don't count it as heard

    const finaleWasReady = Progress.finaleUnlocked;
    const firstTime = Progress.hear(key, topic.id);
    if (firstTime && topic.story) announceStory(scene, topic);
    if (!finaleWasReady && Progress.finaleUnlocked) {
      Animations.toast("Kenn wants to talk to you.", { delay: 1.6 });
    }

    if (topic.finale) {
      dialog.close();
      villager.isTalking = false;
      Progress.markFinaleSeen();
      scene.creditsManager.play();
      return;
    }
  }

  dialog.close();
  villager.isTalking = false;
}

function announceStory(scene, topic) {
  const { found, total } = Progress.stories;
  new AudioManager(scene).jingle();
  Animations.toast(`Story found: ${topic.title} (${found}/${total})`, {
    star: true,
  });
}

/** Read an object's description, then run its follow-up action if any. */
export async function inspect(scene, def) {
  const dialog = scene.dialogManager;
  scene.player.halt();
  dialog.open({ name: def.title, voice: NARRATOR_VOICE });
  const ok = await dialog.say(def.lines);
  if (ok) Progress.inspect(def.id);

  const action = ok && def.action ? await confirmAction(dialog, def) : null;
  dialog.close();

  if (action === "case-studies") {
    scene.optionsManager.openCaseStudies();
  } else if (action === "journal") {
    scene.optionsManager.openJournal();
  } else if (action?.startsWith("link:")) {
    const url = Links[action.slice(5)];
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }
}

// Links need a live URL -- with none configured, say so instead of
// offering a choice that does nothing.
async function confirmAction(dialog, def) {
  if (def.action.startsWith("link:") && !Links[def.action.slice(5)]) {
    await dialog.say(def.missingLines || ["(Coming soon.)"]);
    return null;
  }
  const pick = await dialog.choose([
    { id: "yes", label: def.actionLabel || "Take a look" },
    { id: "no", label: "Leave it" },
  ]);
  return pick === "yes" ? def.action : null;
}

export async function useDoor(scene, def) {
  if (def.to) {
    scene.goTo(def.to, def.arrive);
    return;
  }
  const dialog = scene.dialogManager;
  scene.player.halt();
  dialog.open({ name: def.title, voice: NARRATOR_VOICE });
  const ok = await dialog.say(def.lines);
  if (ok) Progress.inspect(def.id);
  dialog.close();
}
