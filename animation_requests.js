function titleAnimation(timestamp) {
    if (Game.phase === PHASE_MENU) {
        Game.drawTitle(timestamp || 0);
        Game.drawMenu();
        requestAnimationFrame(titleAnimation);
    }
}