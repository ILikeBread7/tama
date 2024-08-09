function pollGamepads() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const keys = {};

    for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i];
        
        if (gamepad) {
            if (buttonPressed(gamepad, 6) || buttonPressed(gamepad, 8)) {
                keys.select = true;
            }
            if (buttonPressed(gamepad, 7) || buttonPressed(gamepad, 9)) {
                keys.start = true;
            }

            if (buttonPressed(gamepad, 1)) {
                keys.fire = true;
            }
            if (buttonPressed(gamepad, 2) || buttonPressed(gamepad, 17)) {
                keys.fire = true;
            }

            if (buttonPressed(gamepad, 0)) {
                keys.special = true;
            }
            if (buttonPressed(gamepad, 3)) {
                keys.special = true;
            }

            const AXIS_THRESHOLD = 0.1
            if (buttonPressed(gamepad, 12) || axisValue(gamepad, 1) < -AXIS_THRESHOLD || axisValue(gamepad, 5) < -AXIS_THRESHOLD ) {
                keys.up = true;
            }
            if (buttonPressed(gamepad, 13) || axisValue(gamepad, 1) > AXIS_THRESHOLD || axisValue(gamepad, 5) > AXIS_THRESHOLD ) {
                keys.down = true;
            }
            if (buttonPressed(gamepad, 14) || axisValue(gamepad, 0) < -AXIS_THRESHOLD || axisValue(gamepad, 4) < -AXIS_THRESHOLD ) {
                keys.left = true;
            }
            if (buttonPressed(gamepad, 15) || axisValue(gamepad, 0) > AXIS_THRESHOLD || axisValue(gamepad, 4) > AXIS_THRESHOLD ) {
                keys.right = true;
            }
        }
    }

    return keys;
}

function buttonPressed(gamepad, index) {
    if (gamepad.buttons.length <= index) {
        return false;
    }
    return gamepad.buttons[index].pressed;
}

function axisValue(gamepad, index) {
    if (gamepad.axes.length <= index) {
        return 0;
    }
    return gamepad.axes[index];
}