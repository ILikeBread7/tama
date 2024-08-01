const FULLSCREEN_BUTTON_LEFT = 1200;
const FULLSCREEN_BUTTON_TOP = 10;
const CREDITS_DIV_LEFT = 850;
const CREDITS_DIV_TOP = 250;

class Events {


  /**
   * @param {...string} eventTypes
   */
  static registerResize(...eventTypes) {
    eventTypes.forEach(type => {
      window.addEventListener(type, () => this._resize());
    });
  }

  static _resize() {
    const container = document.getElementById('container');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const dimensions = this._calculateMaxDimensions(viewportWidth, viewportHeight);
   
    const top = Math.floor((viewportHeight - dimensions.height) / 2);
    const left = Math.floor((viewportWidth - dimensions.width) / 2);
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    canvas.style.top = `${top}px`;
    canvas.style.left = `${left}px`;
    ctx.scale(dimensions.factor, dimensions.factor);

    const fullscreenButton = document.getElementById('fullscreen');
    fullscreenButton.style.left = `${FULLSCREEN_BUTTON_LEFT * dimensions.factor}px`;
    fullscreenButton.style.top = `${FULLSCREEN_BUTTON_TOP * dimensions.factor}px`;

    const creditsDiv = document.getElementById('credits');
    creditsDiv.style.left = `${CREDITS_DIV_LEFT * dimensions.factor}px`;
    creditsDiv.style.top = `${CREDITS_DIV_TOP * dimensions.factor}px`;

    Game.menu.screenFactor = dimensions.factor;
    Game.menu.canvasTop = top;
    Game.menu.canvasLeft = left;
  }

  /**
   * 
   * @param {number} viewportWidth 
   * @param {number} viewportHeight 
   * @returns { { width: number, height: number, factor: number } }
   */
  static _calculateMaxDimensions(viewportWidth, viewportHeight) {
    const dimensionsByWidth = this._calculateMaxDimensionsByWidth(viewportWidth);
    const dimensionsByHeight = this._calculateMaxDimensionsByHeight(viewportHeight);
    return dimensionsByWidth.factor < dimensionsByHeight.factor ? dimensionsByWidth : dimensionsByHeight;
  }

  /**
   * 
   * @param {number} viewportWidth 
   * @returns { { width: number, height: number, factor: number } }
   */
  static _calculateMaxDimensionsByWidth(viewportWidth) {
    const factor = viewportWidth / WIDTH;
    return { width: viewportWidth,  height: HEIGHT * factor, factor };
  }

  /**
   * 
   * @param {number} viewportHeight 
   * @returns { { width: number, height: number, factor: number } }
   */
  static _calculateMaxDimensionsByHeight(viewportHeight) {
    const factor = viewportHeight / HEIGHT;
    return { width: WIDTH * factor,  height: viewportHeight, factor };
  }
};

Events.registerResize('resize');
Events._resize();