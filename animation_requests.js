function titleAnimation(timestamp) {
    if (Game.phase === PHASE_MENU) {
        Game.drawTitle(timestamp || 0);
        Game.drawMenu();
        requestAnimationFrame(titleAnimation);
    }
}

function gameplayAnimation() {
    if (Game.phase === PHASE_GAMEPLAY) {
        Game.gameplay.updateGame();
        requestAnimationFrame(gameplayAnimation);
        console.log(Game.phase)
    }
}