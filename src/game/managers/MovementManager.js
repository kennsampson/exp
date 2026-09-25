export default class MovementManager {
  constructor(scene) {
    this.scene = scene;
    this.anims = scene.anims;
  }

  //Create the animation frames. all characters should be the same cycles
  npcAnimationFrames(entity) {
    const key = typeof entity === "string" ? entity : entity?.texture?.key;
    if (!key) return;

    if (!this.anims.exists(`${key}_walk_up`)) {
      this.anims.create({
        key: `${key}_walk_up`,
        frames: this.anims.generateFrameNumbers(key, {
          start: 12,
          end: 15,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.anims.exists(`${key}_walk_down`)) {
      this.anims.create({
        key: `${key}_walk_down`,
        frames: this.anims.generateFrameNumbers(key, {
          start: 0,
          end: 3,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.anims.exists(`${key}_walk_side`)) {
      this.anims.create({
        key: `${key}_walk_side`,
        frames: this.anims.generateFrameNumbers(key, {
          start: 4,
          end: 7,
        }),
        frameRate: 10,
        repeat: -1,
      });
    }

    //Idle frame
    if (!this.anims.exists(`${key}_idle`)) {
      this.anims.create({
        key: `${key}_idle`,
        frames: [{ key: key, frame: 1 }],
        frameRate: 10,
        repeat: -1,
      });
    }
  }

  /**
   * True when the player is standing right in an NPC's path. Villagers are
   * immovable bodies, so walking on would shove the player -- most often
   * right after a conversation, when the patrol resumes toward them.
   */
  blockedByPlayer(entity, dirX, dirY) {
    const player = this.scene.player;
    if (!player || (!dirX && !dirY)) return false;
    const a = entity.getCenter();
    const b = player.getCenter();
    const ahead = dirX ? b.x - a.x : b.y - a.y;
    const across = dirX ? b.y - a.y : b.x - a.x;
    return (
      Math.sign(ahead) === Math.sign(dirX || dirY) &&
      Math.abs(ahead) < 20 &&
      Math.abs(across) < 12
    );
  }

  horizontalMovement(entity, speed, left, right) {
    this.npcAnimationFrames(entity);
    const key = entity.texture.key;
    const dirX =
      entity.body.velocity.x || (entity.wasInterrupted && entity.lastVelocityX);

    if (entity.isTalking || this.blockedByPlayer(entity, dirX, 0)) {
      entity.patrolTimer?.remove(false);
      entity.patrolTimer = null;
      if (entity.body.velocity.x !== 0) {
        entity.lastVelocityX = entity.body.velocity.x;
      }
      entity.wasInterrupted = true;
      entity.setVelocityX(0);
      // Hold whatever frame faceToward() picked while they're talking.
      entity.anims.stop();
      return;
    }

    // resume patrolling after a conversation interrupted it, whether mid-path or paused at a boundary
    if (entity.wasInterrupted) {
      entity.wasInterrupted = false;
      if (entity.lastVelocityX && entity.x > left && entity.x < right) {
        entity.setVelocityX(entity.lastVelocityX);
        entity.flipX = entity.lastVelocityX > 0;
        entity.anims.play(`${key}_walk_side`, true);
        entity.lastVelocityX = 0;
      } else if (!entity.patrolTimer) {
        entity.patrolTimer = entity.scene.time.delayedCall(2000, () => {
          entity.patrolTimer = null;
          const goingLeft = entity.x >= right;
          entity.setVelocityX(goingLeft ? -speed : speed);
          entity.flipX = !goingLeft;
          entity.anims.play(`${key}_walk_side`, true);
        });
      }
    }

    if (entity.x >= right) {
      entity.x = right;
      entity.setVelocityX(0);
      entity.anims.play(`${key}_idle`, true);
      if (!entity.patrolTimer) {
        entity.patrolTimer = entity.scene.time.delayedCall(2000, () => {
          entity.patrolTimer = null;
          if (!entity.isTalking) {
            entity.setVelocityX(-speed);
            entity.flipX = false; // Face left
            entity.anims.play(`${key}_walk_side`, true);
          }
        });
      }
    } else if (entity.x <= left) {
      entity.x = left;
      entity.setVelocityX(0);
      entity.anims.play(`${key}_idle`, true);
      if (!entity.patrolTimer) {
        entity.patrolTimer = entity.scene.time.delayedCall(2000, () => {
          entity.patrolTimer = null;
          if (!entity.isTalking) {
            entity.setVelocityX(speed);
            entity.flipX = true; // Face right
            entity.anims.play(`${key}_walk_side`, true);
          }
        });
      }
    }
  }
  verticalMovement(entity, speed, up, down) {
    this.npcAnimationFrames(entity);
    const key = entity.texture.key;
    const dirY =
      entity.body.velocity.y || (entity.wasInterrupted && entity.lastVelocityY);

    if (entity.isTalking || this.blockedByPlayer(entity, 0, dirY)) {
      entity.patrolTimer?.remove(false);
      entity.patrolTimer = null;
      if (entity.body.velocity.y !== 0) {
        entity.lastVelocityY = entity.body.velocity.y;
      }
      entity.wasInterrupted = true;
      entity.setVelocityY(0);
      entity.anims.stop();
      return;
    }

    // resume patrolling after a conversation interrupted it, whether mid-path or paused at a boundary
    if (entity.wasInterrupted) {
      entity.wasInterrupted = false;
      entity.flipX = false; // facing the player may have flipped a side frame
      if (entity.lastVelocityY && entity.y > up && entity.y < down) {
        entity.setVelocityY(entity.lastVelocityY);
        entity.anims.play(
          entity.lastVelocityY < 0 ? `${key}_walk_up` : `${key}_walk_down`,
          true,
        );
        entity.lastVelocityY = 0;
      } else if (!entity.patrolTimer) {
        entity.patrolTimer = entity.scene.time.delayedCall(2000, () => {
          entity.patrolTimer = null;
          const goingUp = entity.y >= down;
          entity.setVelocityY(goingUp ? -speed : speed);
          entity.anims.play(
            goingUp ? `${key}_walk_up` : `${key}_walk_down`,
            true,
          );
        });
      }
    }

    if (entity.y >= down) {
      entity.y = down;
      entity.setVelocityY(0);
      entity.anims.play(`${key}_idle`, true);
      if (!entity.patrolTimer) {
        entity.patrolTimer = entity.scene.time.delayedCall(2000, () => {
          entity.patrolTimer = null;
          if (!entity.isTalking) {
            entity.setVelocityY(-speed);
            entity.anims.play(`${key}_walk_up`, true);
          }
        });
      }
    } else if (entity.y <= up) {
      entity.y = up;
      entity.setVelocityY(0);
      entity.anims.play(`${key}_idle`, true);
      if (!entity.patrolTimer) {
        entity.patrolTimer = entity.scene.time.delayedCall(2000, () => {
          entity.patrolTimer = null;
          if (!entity.isTalking) {
            entity.setVelocityY(speed);
            entity.anims.play(`${key}_walk_down`, true);
          }
        });
      }
    }
  }
}
