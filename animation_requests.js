function titleAnimation(timestamp) {
    if (Game.phase === PHASE_MENU) {
        Game.drawTitle(timestamp || 0);
        Game.drawMenu();
        requestAnimationFrame(titleAnimation);
    }
}

function gameplayAnimation() {
    Game.gameplay.updateGame();
    if (Game.phase === PHASE_GAMEPLAY) {
        requestAnimationFrame(gameplayAnimation);
    }
}

function highscoresAnimation(highscores, currentScoreIndex) {
    let oldTime = Date.now();
    const subAnimation = () => {
        if (Game.phase === PHASE_HIGHSCORES) {
            const newTime = Date.now();
            const deltaTime = newTime - oldTime;
            oldTime = newTime;
            Game.gameplay.drawHighscores(highscores, currentScoreIndex, deltaTime);
            requestAnimationFrame(subAnimation);
        }
    };

    subAnimation();
}