function pollGamepads() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const keys = {};

    for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i];

        if (gamepad) {
            if (gamepad.buttons[6].pressed) {
                keys.select = true;
            }
            if (gamepad.buttons[7].pressed) {
                keys.start = true;
            }

            if (gamepad.buttons[1].pressed) {
                keys.fire = true;
            }
            if (gamepad.buttons[17].pressed) {
                keys.fire = true;
            }

            if (gamepad.buttons[0].pressed) {
                keys.special = true;
            }
            if (gamepad.buttons[3].pressed) {
                keys.special = true;
            }

            const AXIS_THRESHOLD = 0.1
            if (gamepad.buttons[12].pressed || gamepad.axes[1] < -AXIS_THRESHOLD) {
                keys.up = true;
            }
            if (gamepad.buttons[13].pressed || gamepad.axes[1] > AXIS_THRESHOLD) {
                keys.down = true;
            }
            if (gamepad.buttons[14].pressed || gamepad.axes[0] < -AXIS_THRESHOLD) {
                keys.left = true;
            }
            if (gamepad.buttons[15].pressed || gamepad.axes[0] > AXIS_THRESHOLD) {
                keys.right = true;
            }
        }
    }

    return keys;
}