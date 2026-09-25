import Phaser from "phaser";
import Environment, { multiplyColors, lighten } from "./EnvironmentManager";

// Everything here is drawn in code -- no extra tilesets or sprites.
//
// Depth order (world art tops out around 11, interaction UI starts at 58):
//   18 cloud shadows -> 20 sky tint (multiply) -> 21 window glows (add)
//   -> 22 rain/snow -> 23 fog haze

const PERIOD_TINT = {
  dawn: 0xf6cbbb,
  day: 0xffffff,
  evening: 0xf2ad80,
  night: 0x5a69a8,
};

const WEATHER_TINT = {
  clear: 0xffffff,
  cloudy: 0xd2d5dc,
  fog: 0xdcdfe4,
  rain: 0xb0b7c6,
  snow: 0xe6ecf6,
  storm: 0x8f97aa,
};

// How brightly windows and lamps glow.
const GLOW = { dawn: 0.25, day: 0, evening: 0.65, night: 1 };
const CLOUD_ALPHA = {
  cloudy: 0.16,
  fog: 0.1,
  rain: 0.2,
  snow: 0.12,
  storm: 0.26,
};
const HAZE_ALPHA = { fog: 0.53, snow: 0.16 };

const LABELS = {
  dawn: "Dawn",
  day: "Daytime",
  evening: "Evening",
  night: "Night",
  clear: "Clear skies",
  cloudy: "Cloudy",
  fog: "Foggy",
  rain: "Raining",
  snow: "Snowing",
  storm: "Thunderstorm",
};

function ensureTextures(scene) {
  const tex = scene.textures;

  if (!tex.exists("atmo-glow")) {
    const canvas = tex.createCanvas("atmo-glow", 64, 64);
    const ctx = canvas.getContext();
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    canvas.refresh();
  }

  if (!tex.exists("atmo-cloud")) {
    const canvas = tex.createCanvas("atmo-cloud", 160, 80);
    const ctx = canvas.getContext();
    ctx.scale(1, 0.5);
    const g = ctx.createRadialGradient(80, 80, 0, 80, 80, 80);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 160, 160);
    canvas.refresh();
  }

  const pixel = (key, w, h, color) => {
    if (tex.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, 1).fillRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  pixel("atmo-rain", 1, 5, 0xc8d6ff);
  pixel("atmo-snow", 2, 2, 0xffffff);
}

/**
 * Dresses a scene for the current time of day and weather, and re-dresses
 * it whenever either changes (live forecast arriving, the clock rolling
 * past sunset, or the Options menu).
 */
export default class AtmosphereManager {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} opts
   * @param {{x: number, y: number, radius?: number, color?: number, always?: boolean}[]} opts.lights
   * @param {boolean} opts.indoor Softer tint, no weather.
   */
  constructor(scene, { lights = [], indoor = false } = {}) {
    this.scene = scene;
    this.indoor = indoor;
    ensureTextures(scene);

    const cam = scene.cameras.main;
    // Screen-fixed and viewport-sized; the camera zoom scales it up around
    // the centre, so it always covers the view.
    const screenRect = (color) =>
      scene.add
        .rectangle(0, 0, cam.width, cam.height, color)
        .setOrigin(0)
        .setScrollFactor(0);

    this.tint = screenRect(0xffffff)
      .setDepth(20)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.tintColor = 0xffffff;
    this.haze = screenRect(0xe9edf2).setDepth(23).setAlpha(0);

    this.lights = lights.map((light) => {
      const scale = (light.radius || 18) / 32;
      const glow = scene.add
        .image(light.x, light.y, "atmo-glow")
        .setScale(scale)
        .setTint(light.color ?? 0xffc26b)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(21)
        .setAlpha(0);
      scene.tweens.add({
        targets: glow,
        scale: scale * 1.08,
        duration: 700 + Math.random() * 600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      return { glow, always: !!light.always };
    });

    const bounds = scene.physics.world.bounds;
    this.worldWidth = bounds.width;
    this.clouds = indoor
      ? []
      : Array.from({ length: 5 }, (_, i) =>
          scene.add
            .image(
              (bounds.width / 5) * i + Math.random() * 80,
              60 + Math.random() * (bounds.height - 120),
              "atmo-cloud",
            )
            .setScale(1.6 + Math.random())
            .setDepth(18)
            .setAlpha(0),
        );

    const view = cam.worldView;
    const spread = { min: -40, max: cam.width / cam.zoom + 40 };
    this.rain = scene.add
      .particles(0, 0, "atmo-rain", {
        x: spread,
        y: -10,
        lifespan: 1000,
        speedY: { min: 280, max: 340 },
        speedX: { min: -50, max: -30 },
        alpha: { start: 0.75, end: 0.35 },
        quantity: 2,
        frequency: 20,
        emitting: false,
      })
      .setDepth(22);
    this.snow = scene.add
      .particles(0, 0, "atmo-snow", {
        x: spread,
        y: -10,
        lifespan: 9000,
        speedY: { min: 16, max: 30 },
        speedX: { min: -12, max: 12 },
        scale: { min: 0.5, max: 1 },
        alpha: { min: 0.6, max: 1 },
        quantity: 1,
        frequency: 70,
        emitting: false,
      })
      .setDepth(22);
    this.followCamera(view);

    this.badge = document.getElementById("atmosphere-badge");
    this.signature = null;
    this.nextClockCheck = 0;

    const unsubscribe = Environment.onChange(() => this.apply());
    scene.events.once("shutdown", () => {
      unsubscribe();
      this.lightning?.remove(false);
    });

    this.apply(true);
  }

  apply(instant = false) {
    const period = Environment.period;
    const weather = this.indoor ? "clear" : Environment.weather;
    this.signature = `${period}/${weather}`;
    const duration = instant ? 0 : 1500;

    let color = multiplyColors(PERIOD_TINT[period], WEATHER_TINT[weather]);
    if (this.indoor) color = lighten(color, 0.45);
    this.fadeTint(color, duration);

    const glow = GLOW[period];
    this.lights.forEach(({ glow: sprite, always }) =>
      this.fade(sprite, always ? Math.max(glow, 0.85) : glow, duration),
    );
    this.clouds.forEach((c) =>
      this.fade(c, CLOUD_ALPHA[weather] || 0, duration),
    );
    this.fade(this.haze, HAZE_ALPHA[weather] || 0, duration);

    const raining = weather === "rain" || weather === "storm";
    this.rain.setQuantity(weather === "storm" ? 4 : 2);
    if (raining) this.rain.start();
    else this.rain.stop();
    if (weather === "snow") this.snow.start();
    else this.snow.stop();

    this.lightning?.remove(false);
    this.lightning = null;
    if (weather === "storm") this.scheduleLightning();

    this.updateBadge(period, weather);
  }

  // Tracks its own tween per target so it never cancels the glow flicker.
  fade(target, alpha, duration) {
    target.fadeTween?.remove();
    target.fadeTween = null;
    if (!duration) {
      target.setAlpha(alpha);
      return;
    }
    target.fadeTween = this.scene.tweens.add({
      targets: target,
      alpha,
      duration,
    });
  }

  fadeTint(to, duration) {
    const from = this.tintColor;
    this.tintColor = to;
    this.tintTween?.remove();
    if (!duration) {
      this.tint.setFillStyle(to);
      return;
    }
    const a = Phaser.Display.Color.ValueToColor(from);
    const b = Phaser.Display.Color.ValueToColor(to);
    this.tintTween = this.scene.tweens.addCounter({
      from: 0,
      to: 100,
      duration,
      onUpdate: (tween) => {
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(
          a,
          b,
          100,
          tween.getValue(),
        );
        this.tint.setFillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
      },
    });
  }

  scheduleLightning() {
    this.lightning = this.scene.time.delayedCall(
      5000 + Math.random() * 9000,
      () => {
        const cam = this.scene.cameras.main;
        cam.flash(90, 235, 240, 255);
        this.scene.time.delayedCall(160, () => cam.flash(140, 235, 240, 255));
        this.scheduleLightning();
      },
    );
  }

  updateBadge(period, weather) {
    if (!this.badge) return;
    const place = Environment.place;
    const sky = this.indoor
      ? ""
      : ` · ${LABELS[weather]}${place ? ` in ${place}` : ""}`;
    this.badge.textContent = `${LABELS[period]}${sky}`;
  }

  followCamera(view) {
    this.rain.setPosition(view.x, view.y);
    this.snow.setPosition(view.x, view.y);
  }

  update(time, delta) {
    this.followCamera(this.scene.cameras.main.worldView);

    // Cloud shadows drift east and wrap around the map.
    this.clouds.forEach((cloud) => {
      cloud.x += (delta / 1000) * 6;
      if (cloud.x - cloud.displayWidth / 2 > this.worldWidth) {
        cloud.x = -cloud.displayWidth / 2;
      }
    });

    // The clock can roll past sunset while someone is playing.
    if (time > this.nextClockCheck) {
      this.nextClockCheck = time + 15000;
      const weather = this.indoor ? "clear" : Environment.weather;
      if (`${Environment.period}/${weather}` !== this.signature) this.apply();
    }
  }
}
