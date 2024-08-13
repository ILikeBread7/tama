class Cheats {

    static finalLevel() {
        Game.gameplay.level = 8;
        Game.gameplay.time = 60 * 60 * 10;
        Game.gameplay.tama.timer = 60 * 60 * 10;
        Game.gameplay.timePowerupLevel = MAX_FUEL_POWERUP_LEVEL;
        Game.gameplay.fuelPowerupLevel = MAX_FUEL_POWERUP_LEVEL;
        Game.gameplay.powerupLevel = MAX_FLAME_POWERUP_LEVEL;
        Game.gameplay.rocks.number = Game.gameplay.rocks.max_number;
        Game.gameplay.dinosaurs.number = Game.gameplay.dinosaurs.max_number;
    }

    static allPowerups() {
        Game.gameplay.timePowerupLevel = MAX_FUEL_POWERUP_LEVEL;
        Game.gameplay.fuelPowerupLevel = MAX_FUEL_POWERUP_LEVEL;
        Game.gameplay.powerupLevel = MAX_FLAME_POWERUP_LEVEL;
    }

    static goToLevel(level) {
        const lvl = Math.floor(level);
        if (lvl <= 0) {
            console.log('Level must be above 0');
        }
        Game.gameplay.level = lvl;
    }

    static setTime(time) {
        if (time < 0) {
            console.log('Time must not be below 0');
        }
        const timerFps = Math.floor(time * MILIS_TO_FPS);
        Game.gameplay.realTimerStart = Date.now() - Math.floor(time);
        Game.gameplay.time = timerFps;
        Game.gameplay.tama.timer = timerFps;
        Game.gameplay.rocks.increaseRockNumber(timerFps)
        Game.gameplay.dinosaurs.increaseDinosaurNumber(timerFps, Game);
    }

}

console.log(`Welcome to the cheat menu!
This is the list of cheats:

Cheats.finalLevel()
Cheats.allPowerups()
Cheats.goToLevel(level)
Cheats.setTime(time [in miliseconds])

In order to use them, type one of them into this console
while the game is playing (not on the menu screen).`
);