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
        const timer = Math.floor(time);
        if (timer < 0) {
            console.log('Time must not be below 0');
        }
        Game.gameplay.time = timer;
        Game.gameplay.tama.timer = timer;
        Game.gameplay.rocks.number = Math.min(Game.gameplay.rocks.max_number, 1 + Math.floor(timer / 120));
        Game.gameplay.dinosaurs.number = Math.min(Game.gameplay.dinosaurs.max_number, 2 + Math.floor(timer / 240));
    }

}

console.log(`Welcome to the cheat menu!
This is the list of cheats:

Cheats.finalLevel()
Cheats.allPowerups()
Cheats.goToLevel(level)
Cheats.setTime(time [in frames, 1 second = 60 frames])

In order to use them, type one of them into this console
while the game is playing (not on the menu screen).`
);