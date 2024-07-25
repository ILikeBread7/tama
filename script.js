function $(id) {
	id = id.substr(1);
	return document.getElementById(id);
}

HTMLElement.prototype.show = function() {
	this.style.display = 'inline';
}

HTMLElement.prototype.hide = function() {
	this.style.display = 'none';
}

HTMLElement.prototype.val = function() {
	return this.value;
}

HTMLElement.prototype.click = function(listener) {
	this.addEventListener('click', listener);
}

function collideGlobal(e){	//for buttons
	return (e.pageX>=this.x && e.pageX<=this.x+this.w && e.pageY>=this.y && e.pageY<=this.y+this.h);
}

let titleInterval = null;

const WIDTH = 1280;
const HEIGHT = 720;
const GROUND_OFFSET = 85;

const RAPTOR = 0;
const TRICERATOPS = 1;
const T_REX = 2;

const POWERUP_FLAME = 0;
const POWERUP_HEART = 1;

const TAMA_STANDARD_SPEED = 2.75;
const TAMA_SLOWDOWN_SPEED = 1;
const TAMA_SLOWDOWN_FUEL_MAX = 200;
const TAMA_MAX_HP = 3;
const TAMA_FLAME_UPGRADE = 0.25;
const TAMA_FLAME_W = 128;
const TAMA_FLAME_H = 64;

const POWERUP_DROP_RATE = 0.1;

const T_REX_SPAWN_INTERVAL = 1;
const T_REX_UP_DOWN_MOVEMENT_LEVEL = 1;
const DINOS_UP_DOWN_MOVEMENT_LEVEL = 1;

const BGM_TRACK = 'Juhani Junkala [Retro Game Music Pack] Level 1.ogg';
const EXPLOSION_TRACK = '8bit_bomb_explosion.ogg';
const TAMA_DAMAGE_TRACK = '7.ogg';
const LASER_TRACK = 'laser5.ogg';
const ENEMY_DAMAGE_TRACK = 'Skeleton Roar.ogg';
const FIRE_TRACK = 'qubodupFireLoop.ogg';
const SUPERMAN_POINTS_TRACK = 'Jingle_Win_00.ogg';
const SUPERMAN_FLYING_TRACK = 'Climb_Rope_Loop_00.ogg';

const audioHandler = (() => {
	const trackNames = [
		BGM_TRACK,
		EXPLOSION_TRACK,
		TAMA_DAMAGE_TRACK,
		LASER_TRACK,
		ENEMY_DAMAGE_TRACK,
		FIRE_TRACK,
		SUPERMAN_POINTS_TRACK,
		SUPERMAN_FLYING_TRACK
	];

	const trackVolumes = new Map([
		[BGM_TRACK, 0.3],
		[EXPLOSION_TRACK, 2],
		[TAMA_DAMAGE_TRACK, 1],
		[LASER_TRACK, 2],
		[ENEMY_DAMAGE_TRACK, 2],
		[FIRE_TRACK, 0.5],
		[SUPERMAN_POINTS_TRACK, 1],
		[SUPERMAN_FLYING_TRACK, 1]
	]);

	let tracksMapPromise = null;
	let audioCtx = null;

	const playFunc = (track, loop, volume) => {
		const audioBuffer = track;
		const trackSource = audioCtx.createBufferSource();

		const gainNode = audioCtx.createGain();
		trackSource.loop = loop;
		trackSource.buffer = audioBuffer;
		trackSource.connect(gainNode).connect(audioCtx.destination);

		gainNode.gain.value = volume;

		trackSource.start();
		return trackSource;
	}


	let currentBgm = { name: null, track: null };
	let currentLoopingEffects = [];

	return {
		init: function() {
			if (tracksMapPromise !== null) {
				return;
			}
			tracksMapPromise = (async () => {
				const AudioContext = window.AudioContext || window.webkitAudioContext;
				audioCtx = new AudioContext();
		
				const tracks = await Promise.all(trackNames.map(async trackName => {
					const response = await fetch(`audio/${trackName}`);
					const arrayBuffer = await response.arrayBuffer();
					const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
					return audioBuffer;
				}));
			
				return new Map((() => {
					const result = [];
					for (let i = 0; i < trackNames.length; i++) {
						result.push([trackNames[i], tracks[i]]);
					}
					return result;
				})());
			})();
		},
		playBgm: function(trackName) {
			if (trackName === currentBgm.name) {
				return;
			}
			tracksMapPromise.then(tm => {
				const track = tm.get(trackName);
				if (currentBgm.track !== null) {
					currentBgm.track.stop();
				}
				currentBgm = { name: trackName, track: playFunc(track, true, trackVolumes.get(trackName)) };
			});
		},
		playEffect: function(trackName) {
			tracksMapPromise.then(tm => {
				const track = tm.get(trackName);
				playFunc(track, false, trackVolumes.get(trackName));
			});
		},
		playLoopingEffect: function(trackName) {
			const effectIndex = currentLoopingEffects.findIndex(e => e.name === trackName);
			if (effectIndex >= 0) {
				return;
			}
			tracksMapPromise.then(tm => {
				const track = tm.get(trackName);
				const volume = trackName === ENEMY_DAMAGE_TRACK ? 5 : 1;
				currentLoopingEffects.push({ name: trackName, track: playFunc(track, true, trackVolumes.get(trackName)) });
			});
		},
		stopLoopingEffect: function(trackName) {
			const effectIndex = currentLoopingEffects.findIndex(e => e.name === trackName);
			if (effectIndex >= 0) {
				currentLoopingEffects[effectIndex].track.stop();
				currentLoopingEffects.splice(effectIndex, 1);
			}
		},
		stopAll: function() {
			if (currentBgm.track !== null) {
				currentBgm.track.stop();
				currentBgm = { name: null, track: null };
			}
			currentLoopingEffects.forEach(e => e.track.stop());
			currentLoopingEffects = [];
		}
	};

})();

var Game={
	canvas:null,ctx:null,
	title_img:null,flame1_title_img:null,flame2_title_img:null,start_img:null,start_img_hover:null,
	tama_stand_img:null,tama_run_img:null,tama_stand_hit_img:null,tama_run_hit_img:null,tama_flame_run:null,tama_flame_stand:null,
	flame1_img:null,flame2_img:null,
	raptor1_img:null,raptor2_img:null,
	explosion1_img:null,explosion2_img:null,
	heart_img:null,heart_faint_img:null,
	stone_img:null,
	laser_img:null,
	al:null,
	drawCycle: true,
	phase:0,	//0=menu
	menu:{
		button:null,
		init:function(){
			this.button={
				x:300,y:180,w:230,h:80,
				hover: false,
				getImg: function() {
					return this.hover ? Game.start_img_hover : Game.start_img;
				},
				
				collide:collideGlobal
			}
		}
	},
	gameplay:{
		game:null,
		pause:false,
		stop:false,
		score:-1,
		left_scroll:0,
		points:0,
		bonus:0,
		time:0,
		level: 1,
		powerupLevel: 0,
		lastTRexKilledPoints: 0,
		tRexSpawned: false,
		initialized:false,
		rocks:{
			sprite:null,
			number:1,
			max_number:7,
			width:2400,
			wh:50,	//wh=width height
			rocks:[],
			all_on_screen:true,
			
			addRocks:function(game){
				if(this.all_on_screen){
					var rocks=this;
					for(var i=0;i<this.number-1;i++){
						this.rocks.push({
							x:Math.floor(Math.random()*this.width)+WIDTH+game.gameplay.left_scroll,
							y:Math.floor(Math.random()*(430-rocks.wh))+GROUND_OFFSET
						});
					}
					this.rocks.push({
						x:this.width+WIDTH+game.gameplay.left_scroll,
						y:Math.floor(Math.random()*(430-rocks.wh))+GROUND_OFFSET
					});
				}
			},
			increaseRockNumber:function(){
				if(this.number<this.max_number)
					this.number++;
			},
			init:function(game){
				this.rocks=[];
				this.sprite=game.stone_img;
				this.number=1;
				this.all_on_screen=true;
				this.addRocks(game);
				audioHandler.init();
				audioHandler.playBgm(BGM_TRACK);
			}
		},
		powerups: {
			game: null,
			powerups: [],
			flameSprite: null,
			heartSprite: null,
			flameW: 50,
			flameH: 50,
			heartW: 39,
			heartH: 39,

			init: function(game) {
				this.game = game;
				this.powerups = [];
				this.flameSprite = game.flame_powerup_img;
				this.heartSprite = game.heart_img;
			},

			move: function(powerup) {
				const speed = this.game.gameplay.tama.getSpeed() * 1.5;
				powerup.timer++;
				powerup.x += Math.max(60 - powerup.timer, 0) * speed / 60;
			},

			movePowerups: function() {
				for (let i = 0; i < this.powerups.length; i++) {
					this.move(this.powerups[i]);
				}
			},

			addFlamePowerup: function(x, y) {
				const that = this;
				this.powerups.push({
					w: that.flameW,
					h: that.flameH,
					x: x,
					y: y,
					timer: 0,

					getSprite: function() {
						return that.flameSprite;
					},
					doEffect: function() {
						that.game.gameplay.powerupLevel = Math.min(that.game.gameplay.powerupLevel + 1, 8);
					}
				});
			},

			addHeart: function(x, y) {
				const that = this;
				this.powerups.push({
					w: that.heartW,
					h: that.heartH,
					x: x,
					y: y,
					timer: 0,

					getSprite: function() {
						return that.heartSprite;
					},
					doEffect: function() {
						that.game.gameplay.tama.hp = Math.min(that.game.gameplay.tama.hp + 1, TAMA_MAX_HP);
					}
				});
			},

			getPositionFromDino: function(dino, type) {
				const { w, h } = type === POWERUP_FLAME ? { w: this.flameW, h: this.flameH } : { w: this.heartW, h: this.heartH };
				return { x : Math.floor(dino.x + (dino.w - w) / 2), y: Math.floor(dino.y + (dino.h - h) / 2) };
			}
		},
		dinosaurs:{
			raptorSprites: [],
			triceratopsSprites: [],
			tRexSprites: [],
			dinosaurs:[],
			number:2,
			max_number:8,
			width:2400,
			laser_freq:60*3,
			all_on_screen:true,
			
			moveDinosaurs:function(game){
				for(var i=0;i<this.dinosaurs.length;i++){
					var dino=this.dinosaurs[i];
					if (dino.type === T_REX) {
						const tRexX = dino.x - game.gameplay.left_scroll;
						if (tRexX < WIDTH * 3 / 4) {
							dino.speed = game.gameplay.tama.getSpeed() * 1.05;
						} else if (tRexX + dino.w > WIDTH) {
							dino.speed = game.gameplay.tama.getSpeed() * 0.95;
						}
						dino.x += dino.speed;
					} else {
						if (dino.x - game.gameplay.left_scroll <= WIDTH) {
							dino.x+=dino.speed;
						}
					}

					if (dino.speedY) {
						const maxY = HEIGHT - GROUND_OFFSET - dino.h;
						dino.y = Math.min(Math.max(dino.y + dino.speedY, GROUND_OFFSET), maxY);
						if (dino.y <= GROUND_OFFSET || dino.y >= maxY) {
							dino.speedY = -dino.speedY;
						}
					}

					dino.timer++;
					if (dino.timer % this.laser_freq === 0) {
						const LASERS_GAP = 10;
						switch (dino.type) {
							case RAPTOR:
								game.gameplay.lasers.add(dino.x, dino.y + Math.floor(dino.h - game.gameplay.lasers.h) / 2 - LASERS_GAP, 0);
								game.gameplay.lasers.add(dino.x, dino.y + Math.floor(dino.h - game.gameplay.lasers.h) / 2 + LASERS_GAP, 0);
							break;
							case TRICERATOPS:
								game.gameplay.lasers.add(dino.x, dino.y + Math.floor(dino.h - game.gameplay.lasers.h) / 2, this.aimAtTama(dino, game.gameplay.tama));
							break;
							case T_REX:
								const T_REX_EYE_LEVEL = 30;
								const EUPHO_LEVEL = 50;
								const TURRET_START = 10;
								const BASE_TURRET_ANGLE = Math.PI / 4 / 5;
								const level = game.gameplay.level;
								const tama = game.gameplay.tama;
								if (level >= 5) {
									game.gameplay.lasers.add(dino.x, dino.y + TURRET_START, BASE_TURRET_ANGLE * 3);
									game.gameplay.lasers.add(dino.x, dino.y + dino.h - TURRET_START, -BASE_TURRET_ANGLE * 3);
								}
								if (level >= 4) {
									game.gameplay.lasers.add(dino.x, dino.y + TURRET_START, BASE_TURRET_ANGLE * 2);
									game.gameplay.lasers.add(dino.x, dino.y + dino.h - TURRET_START, -BASE_TURRET_ANGLE * 2);
								}
								if (level >= 3) {
									game.gameplay.lasers.add(dino.x, dino.y + TURRET_START, level >= 8 ? this.aimAtTama(dino, tama) : BASE_TURRET_ANGLE);
									game.gameplay.lasers.add(dino.x, dino.y + dino.h - TURRET_START, level >= 8 ? this.aimAtTama(dino, tama) : -BASE_TURRET_ANGLE);
								}
								if (level >= 2) {
									game.gameplay.lasers.add(dino.x, dino.y + Math.floor(dino.h - game.gameplay.lasers.h) / 2 - T_REX_EYE_LEVEL + EUPHO_LEVEL, level >= 7 ? this.aimAtTama(dino, tama) : 0);
								}
								if (level >= 1) {
									game.gameplay.lasers.add(dino.x, dino.y + Math.floor(dino.h - game.gameplay.lasers.h) / 2 - T_REX_EYE_LEVEL - LASERS_GAP, level >= 6 ? this.aimAtTama(dino, tama) : 0);
									game.gameplay.lasers.add(dino.x, dino.y + Math.floor(dino.h - game.gameplay.lasers.h) / 2 - T_REX_EYE_LEVEL + LASERS_GAP, level >= 6 ? this.aimAtTama(dino, tama) : 0);
								}
							break;
						}
						audioHandler.playEffect(LASER_TRACK);
					}
				}
			},
			aimAtTama: function(dino, tama) {
				return Math.atan2(dino.y + dino.h / 2 - (tama.y + tama.h / 2), dino.x - (tama.x + tama.w));
			},
			newRaptor: function(game, single, level) {
				var dinos = this;
				return {
					points:1,
					maxHp:10,
					hp:10,
					w:116,
					h:60,
					timer:0,
					type: RAPTOR,
					speed: single ? (Math.floor(Math.random()*2)+1) : (Math.floor(Math.random()*7)-2),
					speedY: level >= T_REX_UP_DOWN_MOVEMENT_LEVEL ? (Math.floor(Math.random() * 10) - 5) : 0,
					x: single ? (this.width+WIDTH+game.gameplay.left_scroll) : (Math.floor(Math.random()*this.width)+WIDTH+game.gameplay.left_scroll),
					y:Math.floor(Math.random() * (HEIGHT - 170 - 60)) + GROUND_OFFSET,
					getSprite:function(){
						return dinos.raptorSprites[Math.floor(this.timer * (Math.abs(this.speed) + Math.abs(this.speedY)) / 40) % 2];
					}
				}
			},
			newTriceratops: function(game, single, level) {
				var dinos = this;
				return {
					points: 3,
					maxHp: 30,
					hp: 30,
					w: 95,
					h: 148,
					timer: 0,
					type: TRICERATOPS,
					speed: single ? (Math.floor(Math.random()) + 1) : (Math.floor(Math.random() * 3) - 2),
					speedY: level >= T_REX_UP_DOWN_MOVEMENT_LEVEL ? (Math.floor(Math.random() * 10) - 5) : 0,
					x: single ? (this.width + WIDTH + game.gameplay.left_scroll) : (Math.floor(Math.random() * this.width) + WIDTH + game.gameplay.left_scroll),
					y: Math.floor(Math.random() * (HEIGHT - 170 - 95)) + GROUND_OFFSET,
					getSprite: function() {
						return dinos.triceratopsSprites[Math.floor(this.timer * (Math.abs(this.speed) + Math.abs(this.speedY)) / 40) % 2];
					}
				}
			},
			newTRex: function (game, level) {
				var dinos = this;
				return {
					points: 10,
					maxHp: 100 + 20 * level,
					hp: 100 + 20 * level,
					w: 149,
					h: 121,
					timer: 0,
					type: T_REX,
					speed: game.gameplay.tama.getSpeed(),
					speedY: level >= T_REX_UP_DOWN_MOVEMENT_LEVEL ? (Math.floor(Math.random() * 10) - 5) : 0,
					x: WIDTH + game.gameplay.left_scroll,
					y: Math.floor(Math.random() * (HEIGHT - 170 - 95)) + GROUND_OFFSET,
					getSprite: function() {
						return dinos.tRexSprites[Math.floor(this.timer * (Math.abs(this.speed) + Math.abs(this.speedY)) / 30) % 2];
					}
				}
			},
			newDino: function (game, single, level) {
				return Math.random() < 0.15 ? this.newTriceratops(game, single, level) : this.newRaptor(game, single, level);
			},
			addSingleDino:function(game, level){
				this.newDino(game, true, level);
			},
			addDinosaurs:function(game){
				if(this.all_on_screen){
					for(var i=0;i<this.number-1;i++){
						this.dinosaurs.push(this.newDino(game, false, game.gameplay.level));
					}
					this.addSingleDino(game, game.gameplay.level);
				}
			},
			increaseDinosaurNumber:function(){
				if(this.number<this.max_number)
					this.number++;
			},
			init:function(game){
				this.dinosaurs=[];
				if (this.raptorSprites.length === 0) {
					this.raptorSprites.push(game.raptor1_img);
					this.raptorSprites.push(game.raptor2_img);
				}
				if (this.triceratopsSprites.length === 0) {
					this.triceratopsSprites.push(game.triceratops1_img);
					this.triceratopsSprites.push(game.triceratops2_img);
				}
				if (this.tRexSprites.length === 0) {
					this.tRexSprites.push(game.tRex1_img);
					this.tRexSprites.push(game.tRex2_img);
				}
				this.number=2;
				this.width=2400;
				this.all_on_screen=true;
				this.addDinosaurs(game);
			}
		},
		tama:{
			sprites:[],
			flame_sprites:[],
			hp: TAMA_MAX_HP,
			x:0,y:0,w:64,h:64,
			speed:TAMA_STANDARD_SPEED,
			speed_multiplier:4,
			movement_speed:5,
			timer:0,
			recovery_time:120,
			hit_time:-this.recovery_time,
			fuel:900,
			slowdownFuel: TAMA_SLOWDOWN_FUEL_MAX,
			slowdown: false,
			shooting:false,
			directionX: 0,	//0=nothing, 1=left, 2=right
			directionY: 0,	//0=nothing, 3=up, 4=down
			
			hit:function(){
				this.hit_time=this.timer;
				this.hp--;
				audioHandler.playEffect(TAMA_DAMAGE_TRACK);
			},
			isHit:function(){
				return this.timer-this.hit_time<this.recovery_time;
			},
			shoot:function(){
				if(this.shooting && this.fuel>=3 && !this.isHit()){
					this.fuel-=3;
					if(this.fuel<0)
						this.fuel=0;
				}
				else{
					this.fuel++;
					this.shooting=false;
					if(this.fuel>900)
						this.fuel=900;
				}
			},
			getSprite:function(){
				var offset=0;
				if(this.isHit())
					offset=2;
				else if(this.shooting)
					offset=4;
				return this.sprites[Math.floor(this.timer*this.speed/20)%2+offset];
			},
			getFlameSprite:function(){
				return this.flame_sprites[Math.floor(this.timer/10)%2];
			},
			getSpeedModifier: function() {
				const seconds = this.timer / 60;
				return 1 + seconds / 300;
			},
			getSpeed:function(){
				return this.speed * this.speed_multiplier * this.getSpeedModifier();
			},
			resetTemps:function(){
				this.directionX = 0;
				this.directionY = 0;
			},
			move:function(gameListener){
				this.x+=this.getSpeed();
				gameListener.tamaMove(this.directionX, this.directionY);
				this.shoot();
				this.resetTemps();
				this.timer++;
				if (this.slowdown) {
					this.slowdownFuel = Math.max(this.slowdownFuel - 1, 0);
				} else {
					this.slowdownFuel = Math.min(this.slowdownFuel + 1, TAMA_SLOWDOWN_FUEL_MAX);
				}
				if (this.slowdownFuel <= 0) {
					this.deactivateSlowdown();
				}
			},
			activateSlowdown: function() {
				if (this.slowdownFuel >= TAMA_SLOWDOWN_FUEL_MAX) {
					this.slowdown = true;
					this.speed = TAMA_SLOWDOWN_SPEED;
				}
			},
			deactivateSlowdown: function() {
				this.slowdown = false;
				this.speed = TAMA_STANDARD_SPEED;
			},
			moveDirection:function(directionX, directionY){
				if(directionX === 1)
					this.x-=this.movement_speed;
				else if(directionX === 2)
					this.x+=this.movement_speed;

				if(directionY === 3)
					this.y-=this.movement_speed;
				else if(directionY === 4)
					this.y+=this.movement_speed;
			},
			init:function(game){
				this.x=0;
				this.y=300-this.h/2;
				this.speed = TAMA_STANDARD_SPEED;
				this.speed_multiplier=4;
				this.movement_speed=5;
				this.timer=0;
				this.direction=0;
				this.hp = TAMA_MAX_HP;
				this.recovery_time=120;
				this.hit_time=-this.recovery_time;
				this.fuel=900;
				this.slowdownFuel = TAMA_SLOWDOWN_FUEL_MAX,
				this.slowdown = false,
				this.shooting=false;
				if(this.sprites.length==0){
					this.sprites.push(game.tama_stand_img);
					this.sprites.push(game.tama_run_img);
					this.sprites.push(game.tama_stand_hit_img);
					this.sprites.push(game.tama_run_hit_img);
					this.sprites.push(game.tama_flame_stand_img);
					this.sprites.push(game.tama_flame_run_img);
				}
				if(this.flame_sprites.length==0){
					this.flame_sprites.push(game.flame1_img);
					this.flame_sprites.push(game.flame2_img);
				}
			}
		},
		dots:{
			dots:[],
			colors:["#c9ce4f", "#c3c83b", "#b2b633"],
			
			init:function(){
				if(this.dots.length==0)
					for(var i=0;i<60;i++)
						this.dots.push({
							x:Math.floor(Math.random()*(WIDTH + 20)),
							y:Math.floor(Math.random()*(HEIGHT - 200))+100,
							r:10+Math.floor(Math.random()*7-3),
							color:Math.floor(Math.random()*this.colors.length)
						});
			}
		},
		booms:{
			sprites:[],
			booms:[],
			wh:120,
			add:function(boom_x,down_y){
				var booms=this;
				this.booms.push({
					x:boom_x,
					y:down_y-this.wh,
					timer:0,
					
					getSprite:function(){
						return booms.sprites[Math.floor(this.timer/10)%2];
					}
				});
				audioHandler.playEffect(EXPLOSION_TRACK);
			},
			init:function(game){
				this.booms=[];
				this.sprites.push(game.explosion1_img);
				this.sprites.push(game.explosion2_img);
			}
		},
		lasers:{
			lasers:[],
			sprite:null,
			speed:10,
			w:30,
			h:10,
			
			add: function(laser_x, laser_y, angle){
				this.lasers.push({
					x: laser_x,
					y: laser_y,
					angle: angle
				});
			},
			moveLasers:function(){
				for (let i=0; i < this.lasers.length; i++) {
					this.lasers[i].x -= this.speed * Math.cos(this.lasers[i].angle);
					this.lasers[i].y -= this.speed * Math.sin(this.lasers[i].angle);
				}
			},
			init:function(game){
				this.lasers=[];
				this.sprite=game.laser_img;
			}
		},
		superman: {
			sprites: [],
			x: -130,
			y: 42,
			speed: 5,
			active: false,
			timer: 0,
			pointsActivated: 0,

			activate: function(points) {
				if (points > this.pointsActivated) {
					this.active = true;
					this.pointsActivated = Math.floor(points / 10) * 10;
				}
			},
			move: function() {
				if (this.active) {
					this.x += this.speed;
					this.timer++;
					audioHandler.playLoopingEffect(SUPERMAN_FLYING_TRACK);
				}
				if (this.x > WIDTH) {
					this.reset();
					return true;
				}
				return false;
			},
			reset: function() {
				this.x = -130;
				this.active = false;
				this.timer = 0;
				audioHandler.stopLoopingEffect(SUPERMAN_FLYING_TRACK);
			},
			getSprite: function() {
				return this.sprites[Math.floor(this.timer / 10) % 2];
			},
			getPoints: function() {
				return 100 * this.pointsActivated;
			},
			init: function(game) {
				if (this.sprites.length === 0) {
					this.sprites.push(game.superman1_img, game.superman2_img);
				}
				this.pointsActivated = 0;
				this.reset();
			}
		},
		supermanPoints: {
			active: false,
			maxTimer: 60 * 3,
			timer: 0,

			move: function() {
				if (this.active) {
					this.timer++;
				}
				if (this.timer >= this.maxTimer) {
					this.reset();
				}
			},
			reset: function() {
				this.timer = 0;
				this.active = false;
			}
		},
		levelUpMessage: {
			active: false,
			maxTimer: 60 * 3,
			timer: 0,
			x: 600,
			y: 72,

			update: function() {
				if (this.active) {
					this.timer++;
				}
				if (this.timer >= this.maxTimer) {
					this.reset();
				}
			},

			reset: function() {
				this.timer = 0;
				this.active = false;
			}
		},
		drawDots:function(){
			for(var i=0;i<this.dots.dots.length;i++){
				var dot=this.dots.dots[i];
				this.game.ctx.beginPath();
				this.game.ctx.arc((WIDTH + 20)-(dot.x+this.left_scroll)%(WIDTH + 40),dot.y,dot.r,0,2*Math.PI);
				this.game.ctx.fillStyle=this.dots.colors[dot.color];
				this.game.ctx.fill();
				this.game.ctx.closePath();
			}
		},
		drawRocks:function(){
			this.rocks.all_on_screen=true;
			for(var i=0;i<this.rocks.rocks.length;i++){
				var rock=this.rocks.rocks[i];
				if(rock.x-this.left_scroll>=WIDTH)
					this.rocks.all_on_screen=false;
				if(rock.x+this.rocks.wh-this.left_scroll<0){
					this.rocks.rocks.splice(i,1);
					i--;
				}
				this.game.ctx.drawImage(this.rocks.sprite,rock.x-this.left_scroll,rock.y);
			}
		},
		drawPowerups: function() {
			for (let i = 0; i < this.powerups.powerups.length; i++) {
				const powerup = this.powerups.powerups[i];
				if (powerup.x + powerup.w - this.left_scroll < 0) {
					this.powerups.powerups.splice(i, 1);
					i--;
				}
				this.game.ctx.drawImage(powerup.getSprite(), powerup.x - this.left_scroll, powerup.y);
			}
		},
		drawDinoLifeBar: function(hp, maxHp, dinoX, dinoY) {
			if (hp < maxHp) {
				var borderWidth = 4;
				this.game.ctx.fillStyle = '#000000';
				this.game.ctx.fillRect(dinoX + 20 - borderWidth, dinoY - 10 - borderWidth, 80 + borderWidth * 2 , 20  + borderWidth * 2);
				var color = '#00FF00';
				var hpRatio = hp / maxHp;
				if (hpRatio <= 0.33) {
					color = '#FF0000'
				} else if (hpRatio <= 0.66) {
					color = '#FFFF00'
				}
				this.game.ctx.fillStyle = color;
				this.game.ctx.fillRect(dinoX + 20, dinoY - 10, 80 * hpRatio, 20);
			}
		},
		drawDinosaurs:function(){
			this.dinosaurs.all_on_screen=true;
			for(var i=0;i<this.dinosaurs.dinosaurs.length;i++){
				var dino=this.dinosaurs.dinosaurs[i];
				if(dino.x-this.left_scroll>=WIDTH)
					this.dinosaurs.all_on_screen=false;
				if(dino.x+dino.w-this.left_scroll<0){
					this.dinosaurs.dinosaurs.splice(i,1);
					i--;
				}
				if(dino.x>WIDTH+this.width){
					dino.x-=this.width/2;
					dino.speed--;
				}
				this.game.ctx.drawImage(dino.getSprite(),dino.x-this.left_scroll,dino.y);
				this.drawDinoLifeBar(dino.hp, dino.maxHp, dino.x - this.left_scroll, dino.y);
			}
		},
		drawBooms:function(){
			for(var i=0;i<this.booms.booms.length;i++){
				var boom=this.booms.booms[i];
				if(boom.x+this.booms.wh-this.left_scroll<0){
					this.booms.booms.splice(i,1);
					i--;
				}
				this.game.ctx.drawImage(boom.getSprite(),boom.x-this.left_scroll,boom.y);
				boom.timer++;
			}
		},
		drawLasers:function(){
			for(var i=0;i<this.lasers.lasers.length;i++){
				var laser=this.lasers.lasers[i];
				if(laser.x+this.lasers.w-this.left_scroll<0){
					this.lasers.lasers.splice(i,1);
					i--;
				}
				this.game.ctx.drawImage(this.lasers.sprite,laser.x-this.left_scroll,laser.y);
				laser.timer++;
			}
		},
		drawSuperman: function() {
			if (this.superman.active) {
				this.game.ctx.drawImage(this.superman.getSprite(), this.superman.x, this.superman.y);
			}
		},
		drawSupermanPoints: function() {
			if (this.supermanPoints.active) {
				this.game.ctx.font = '24px Verdana';
				this.game.ctx.fillStyle = '#ffffff';
				this.game.ctx.strokeStyle = '#ff0000';
				this.game.ctx.fillText(this.superman.getPoints(), 720, this.superman.y + 30);
				this.game.ctx.strokeText(this.superman.getPoints(), 720, this.superman.y + 30);
			}
		},
		drawLevelUpMessage: function() {
			if (this.levelUpMessage.active && (Math.floor(this.levelUpMessage.timer / 20) % 2)) {
				this.game.ctx.fillStyle = '#000';
				this.game.ctx.fillRect(this.levelUpMessage.x - 30, this.levelUpMessage.y - 25, 150, 35);
				this.game.ctx.font = '24px Verdana';
				this.game.ctx.fillStyle = '#ffffff';
				this.game.ctx.strokeStyle = '#ff0000';
				const message = `Level ${this.game.gameplay.level}!!!`;
				this.game.ctx.fillText(message, this.levelUpMessage.x, this.levelUpMessage.y);
				this.game.ctx.strokeText(message, this.levelUpMessage.x, this.levelUpMessage.y);
			}
		},
		timeFormat:function(time){
			var t=time/60;
			var min=Math.floor(t/60);
			var sec=Math.floor(t%60);
			if(sec<=9)
				sec="0"+sec;
			return min+":"+sec;
		},
		calculateTotalScore: function() {
			return Math.floor(this.tama.x/100*(1+this.points)) + this.bonus;
		},
		drawBackground:function(){
			// Top and bottom panels
			this.game.ctx.fillStyle="#291eff";
			this.game.ctx.fillRect(0,0,WIDTH,45);
			this.game.ctx.fillRect(0,HEIGHT - 45,WIDTH,45);

			// "Grass"
			this.game.ctx.fillStyle="#3bc870";
			this.game.ctx.fillRect(0,45,WIDTH,40);
			this.game.ctx.fillRect(0,HEIGHT - GROUND_OFFSET,WIDTH,40);		

			// Ground
			this.game.ctx.fillStyle="#c3c83b";
			this.game.ctx.fillRect(0,GROUND_OFFSET,WIDTH,HEIGHT - 170);
			
			this.game.ctx.fillStyle="#ffffff";
			this.game.ctx.font="20px Verdana";
			this.game.ctx.fillText("Time:",15,30);
			this.game.ctx.fillText("Distance:",175,30);
			this.game.ctx.fillText("Kills:",435,30);
			this.game.ctx.fillText("Total score:",225, HEIGHT - 15);
			this.game.ctx.fillText('Level:', 670, 30);
			
			this.game.ctx.fillText(this.timeFormat(this.time),80,30);
			this.game.ctx.fillText(Math.floor(this.tama.x/100),275,30);
			this.game.ctx.fillText(this.points,490,30);
			this.game.ctx.fillText(this.calculateTotalScore(),345, HEIGHT - 15);
			this.game.ctx.fillText(this.level, 735, 30);
			
			this.drawDots();
		},
		drawHearts:function(){
			var hearts=this.game.gameplay.tama.hp;
			for (let i = 0; i < TAMA_MAX_HP; i++){
				var img;
				if(hearts>i)
					img=this.game.heart_img;
				else
					img=this.game.heart_faint_img;
				this.game.ctx.drawImage(img,50+i*40, HEIGHT - 42);
			}
		},
		drawPickedFlamePowerups: function() {
			const powerups = this.game.gameplay.powerupLevel;
			const img = this.powerups.flameSprite;
			for (let i = 0; i < powerups; i++) {
				this.game.ctx.drawImage(img, 1050 + i * 30, HEIGHT - 60);
			}	
		},
		drawFuel:function(){
			this.game.ctx.fillStyle="#fff";
			this.game.ctx.fillText("Fuel:",620,HEIGHT - 15);
			this.game.ctx.fillStyle="#000";
			this.game.ctx.fillRect(680,HEIGHT - 35,100,25);

			var fuel=Math.floor(this.game.gameplay.tama.fuel/9);
			this.game.ctx.fillStyle="#12de32";
			this.game.ctx.fillRect(680, HEIGHT- 35, fuel,25);
		},
		drawSlowdownfuel:function(){
			const DRAW_X = 940;

			this.game.ctx.fillStyle= '#fff';
			this.game.ctx.fillText('Slowdown:', 820, HEIGHT - 15);
			this.game.ctx.fillStyle= '#000';
			this.game.ctx.fillRect(DRAW_X, HEIGHT - 35, 100, 25);

			const fuel = Math.floor(this.game.gameplay.tama.slowdownFuel * 100 / TAMA_SLOWDOWN_FUEL_MAX);
			this.game.ctx.fillStyle = '#de1232';
			this.game.ctx.fillRect(DRAW_X, HEIGHT - 35, fuel, 25);
		},
		drawTama:function(){
			this.game.ctx.drawImage(this.tama.getSprite(),this.tama.x-this.left_scroll,this.tama.y);
			if(this.tama.shooting) {
				this.game.ctx.drawImage(
					this.tama.getFlameSprite(),
					this.tama.x + this.tama.w - this.left_scroll, this.tama.y,
					TAMA_FLAME_W * (1 + this.powerupLevel * TAMA_FLAME_UPGRADE),
					TAMA_FLAME_H
				);
				audioHandler.playLoopingEffect(FIRE_TRACK);
			} else {
				audioHandler.stopLoopingEffect(FIRE_TRACK);
			}
		},
		drawPause: function() {
			const PAUSE_WIDTH = 212;
			const PAUSE_HEIGHT = 100;
			const PAUSE_X = (WIDTH - PAUSE_WIDTH) / 2;
			const PAUSE_Y = (HEIGHT - PAUSE_HEIGHT) / 2;

			this.game.ctx.fillStyle = '#000000';
			this.game.ctx.fillRect(PAUSE_X, PAUSE_Y, PAUSE_WIDTH, PAUSE_HEIGHT);
			this.game.ctx.fillStyle = "#ffffff";
			this.game.ctx.font = "20px Verdana";
			this.game.ctx.fillText('Pause', PAUSE_X + 70, PAUSE_Y + 30);
			this.game.ctx.fillText('Press ESC to continue', PAUSE_X + 3, PAUSE_Y + 55);
			this.game.ctx.fillText('or H to exit', PAUSE_X + 50, PAUSE_Y + 80);
		},
		addBoom:function(x,down_y){
			this.booms.add(x,down_y);
		},
		checkDinosaurFlame(){
			let isHit = false;
			if(this.tama.shooting)
				for(var i=0;i<this.dinosaurs.dinosaurs.length;i++){
					var dino=this.dinosaurs.dinosaurs[i];
					var flame_x=this.tama.x+this.tama.w;
					var flame_y=this.tama.y;
					var flame_w = TAMA_FLAME_W * (1 + this.powerupLevel * TAMA_FLAME_UPGRADE);
					var flame_h = TAMA_FLAME_H;
					if(dino.x<flame_x+flame_w && dino.x+dino.w>flame_x && dino.y+dino.h>flame_y && dino.y<flame_y+flame_h){
						isHit = true;
						dino.hp--;
						if(dino.hp<=0){
							this.dinosaurs.dinosaurs.splice(i,1);
							i--;
							this.points+=dino.points;
							this.addBoom(dino.x,dino.y+dino.h);

							if (dino.type === T_REX) {
								this.level++;
								this.levelUpMessage.active = true;
								this.lastTRexKilledPoints = this.points;
								this.tRexSpawned = false;
								const { x, y } = this.powerups.getPositionFromDino(dino, POWERUP_HEART);
								this.powerups.addHeart(x, y);
							} else if (Math.random() < POWERUP_DROP_RATE) {
								const { x, y } = this.powerups.getPositionFromDino(dino, POWERUP_FLAME);
								this.powerups.addFlamePowerup(x, y);
							}

							if (!this.tRexSpawned && this.points >= this.lastTRexKilledPoints + T_REX_SPAWN_INTERVAL) {
								this.dinosaurs.dinosaurs.push(this.dinosaurs.newTRex(this.game, this.level));
								this.tRexSpawned = true;
							}
						}
					}
				}
			if (isHit) {
				audioHandler.playLoopingEffect(ENEMY_DAMAGE_TRACK);
			} else {
				audioHandler.stopLoopingEffect(ENEMY_DAMAGE_TRACK);
			}
		},
		drawScores:function(){
			var score=this.calculateTotalScore();
			this.score=score;
			this.game.ctx.fillStyle="#000000";

			const SCORES_WIDTH = 420;
			const SCORES_HEIGHT = 430;
			const SCORES_X = (WIDTH - SCORES_WIDTH) / 2;
			const SCORES_Y = (HEIGHT - SCORES_HEIGHT) / 2;
			this.game.ctx.fillRect(SCORES_X, SCORES_Y, SCORES_WIDTH, SCORES_HEIGHT);
			
			this.game.ctx.fillStyle="#ffffff";
			this.game.ctx.font="20px Verdana";
			this.game.ctx.fillText("Your total score: "+score, SCORES_X + 10, SCORES_Y + 20);
			this.game.ctx.fillText("Top scores:", SCORES_X + 10, SCORES_Y + 50);
			this.game.ctx.fillText("Press ESC to exit or Enter to play again!", SCORES_X + 10, SCORES_Y + 420);
			var ctx=this.game.ctx;

			const { highscores, currentScoreIndex } = this.updateHighscores(score, this.level);

			for (let i = 0; i < highscores.length; i++) {
				ctx.fillStyle = i === currentScoreIndex ? '#00ff00' : '#ffffff';
				ctx.fillText(`${i < 10 ? '' : ' '}${i + 1}. Level ${highscores[i].level}, Score: ${highscores[i].score}`, SCORES_X + 10, SCORES_Y + 80 + i * 30);
			}
		},
		showScores:function(){
			this.game.al.gameListener.resetKeys();
			this.game.phase=3;
			this.drawScores();
		},
		updateHighscores: function(score, level) {
			const HIGHSCORES_STORAGE_ITEM = 'highscores';
			const highscores = JSON.parse(localStorage.getItem(HIGHSCORES_STORAGE_ITEM)) || [];

			let currentScoreIndex = -1;
			if (highscores.length) {
				for (let i = 0; i < highscores.length; i++) {
					if (score > highscores[i].score) {
						highscores.splice(i, 0, { score, level });
						currentScoreIndex = i;
						break;
					}
				}

				if (highscores.length > 10) {
					highscores.splice(10);
				}
			} else {
				highscores.push({ score, level });
				currentScoreIndex = 0;
			}

			localStorage.setItem(HIGHSCORES_STORAGE_ITEM, JSON.stringify(highscores));
			return { highscores, currentScoreIndex };
		},
		togglePause:function(){
			if(this.pause)
				this.pause=false;
			else
				this.pause=true;
		},
		start:function(){
			clearInterval(titleInterval);
			var gameplay=this;
			var interval=setInterval(function(){
				if(gameplay.stop){
					clearInterval(interval);
					gameplay.game.menu.button.hover = false;
					gameplay.game.al.gameListener.resetKeys();
					gameplay.game.phase=0;	//0=menu
					titleInterval = setInterval(() => {
						gameplay.game.drawTitle();
						gameplay.game.drawMenu();
					}, 200);
				}
				else if(gameplay.pause) {
					gameplay.drawPause();
				}
				else {
					gameplay.left_scroll+=gameplay.tama.getSpeed();
					gameplay.game.al.gameListener.setTamaShoot();
					gameplay.game.al.gameListener.setTamaDirection();
					gameplay.tama.move(gameplay.game.al.gameListener);
					gameplay.dinosaurs.moveDinosaurs(gameplay.game);
					gameplay.lasers.moveLasers();
					gameplay.powerups.movePowerups();
					gameplay.checkDinosaurFlame();
					if (gameplay.points >= gameplay.superman.pointsActivated + 10) {
						gameplay.superman.activate(gameplay.points);
					}
					if (gameplay.superman.move()) {
						gameplay.bonus += gameplay.superman.getPoints();
						gameplay.supermanPoints.active = true;
						audioHandler.playEffect(SUPERMAN_POINTS_TRACK);
					}
					gameplay.supermanPoints.move();
					gameplay.levelUpMessage.update();
					gameplay.drawBackground();
					gameplay.drawHearts();
					gameplay.drawFuel();
					gameplay.drawSlowdownfuel();
					gameplay.drawPickedFlamePowerups();
					gameplay.drawRocks();
					gameplay.drawDinosaurs();
					gameplay.rocks.addRocks(gameplay.game);
					gameplay.dinosaurs.addDinosaurs(gameplay.game);
					gameplay.drawTama();
					gameplay.drawBooms();
					gameplay.drawPowerups();
					gameplay.drawLasers();
					gameplay.drawSuperman();
					gameplay.drawSupermanPoints();
					gameplay.drawLevelUpMessage();
					gameplay.time++;
					if(gameplay.time%(60*20)==0)
						gameplay.rocks.increaseRockNumber();
					if(gameplay.time%(60*40)==0){
						gameplay.dinosaurs.increaseDinosaurNumber();
						gameplay.dinosaurs.addSingleDino(gameplay.game);
					}
					if(gameplay.tama.hp<=0){
						clearInterval(interval);
						gameplay.showScores();
					}
				}
			},100/6);
		},
		init:function(game){
			this.game=game;
			this.left_scroll=0;
			this.points=0;
			this.bonus=0;
			this.level = 1;
			this.powerupLevel = 0;
			this.lastTRexKilledPoints = 0;
			this.tRexSpawned = false;
			this.tama.init(game);
			this.rocks.init(game);
			this.powerups.init(game);
			this.lasers.init(game);
			this.dinosaurs.init(game);
			this.booms.init(game);
			this.dots.init();
			this.superman.init(game);
			this.supermanPoints.reset();
			this.drawBackground();
			this.pause=false;
			this.stop=false;
			this.time=0;
			this.drawCycle = true;
			this.start();
		}
	},
	init:function(){
		this.canvas=document.getElementById("canvas");
		this.title_img=document.getElementById("title_img");
		this.flame1_title_img=document.getElementById("flame1_title_img");
		this.flame2_title_img=document.getElementById("flame2_title_img");
		this.start_img=document.getElementById("start_img");
		this.start_img_hover=document.getElementById("start_img_hover");
		this.tama_stand_img=document.getElementById("tama_stand_img");
		this.tama_run_img=document.getElementById("tama_run_img");
		this.tama_stand_hit_img=document.getElementById("tama_stand_hit_img");
		this.tama_run_hit_img=document.getElementById("tama_run_hit_img");
		this.tama_flame_stand_img=document.getElementById("tama_flame_stand_img");
		this.tama_flame_run_img=document.getElementById("tama_flame_run_img");
		this.heart_img=document.getElementById("heart_img");
		this.heart_faint_img=document.getElementById("heart_faint_img");
		this.stone_img=document.getElementById("stone_img");
		this.flame1_img=document.getElementById("flame1_img");
		this.flame2_img=document.getElementById("flame2_img");
		this.raptor1_img=document.getElementById("raptor1_img");
		this.raptor2_img=document.getElementById("raptor2_img");
		this.triceratops1_img = document.getElementById("triceratops1_img");
		this.triceratops2_img = document.getElementById("triceratops2_img");
		this.tRex1_img = document.getElementById("tRex1_img");
		this.tRex2_img = document.getElementById("tRex2_img");
		this.flame_powerup_img = document.getElementById("powerup_img");
		this.explosion1_img=document.getElementById("explosion1_img");
		this.explosion2_img=document.getElementById("explosion2_img");
		this.laser_img=document.getElementById("laser_img");
		this.superman1_img=document.getElementById("superman1_img");
		this.superman2_img=document.getElementById("superman2_img");
		this.ctx=this.canvas.getContext("2d");
		this.phase=0;
		this.menu.init();
		var game=this;

		$("#canvas").click(function(e){
			game.al.clicked(e);
		});
		$("#canvas").addEventListener('mousemove', function(e){
			game.al.moved(e);
		});
		window.addEventListener('keydown',function(e){
			game.al.keydown(e);
		});
		window.addEventListener('keyup',function(e){
			game.al.keyup(e);
		});
	},
	drawTitle:function(){
		audioHandler.stopAll();
		this.ctx.drawImage(this.title_img,0,0);
		$('#credits').show();

		const instructionsOffset = 180;
		const leftOffset = 5;

		this.ctx.fillStyle="#000000";
		this.ctx.fillRect(leftOffset,100+instructionsOffset,450,295);
		
		this.ctx.fillStyle="#ffffff";
		this.ctx.font="20px Verdana";

		this.ctx.fillText("In game controls:",leftOffset+5,120+instructionsOffset);
		this.ctx.fillText("WASD - movement",leftOffset+5,150+instructionsOffset);
		this.ctx.fillText("H - slow down",leftOffset+5,180+instructionsOffset);
		this.ctx.fillText("J - fire",leftOffset+5,210+instructionsOffset);
		this.ctx.fillText("ESC - pause",leftOffset+5,240+instructionsOffset);
		
		this.ctx.fillText("Every 10 kills you get a bonus!",leftOffset+5,355+instructionsOffset);
		this.ctx.fillText("Total score = distance * (1 + kills) + bonus",leftOffset+5,385+instructionsOffset);

		this.ctx.fillStyle = "#fff";
		this.ctx.strokeStyle = "#000";
		const sign = {
			text: 'I_LIKE_BREAD7 2015 - 2021',
			x: 500,
			y: 592
		};
		this.ctx.fillText(sign.text, sign.x, sign.y);
		this.ctx.strokeText(sign.text, sign.x, sign.y);

		this.ctx.drawImage(this.drawCycle ? this.flame1_title_img : this.flame2_title_img, 370, 90);
		this.ctx.font = "64px Verdana";
		this.ctx.fillStyle = "#f00";
		this.ctx.strokeStyle = "#fff";
		const dx = {
			text: 'DX',
			x: 370,
			y: 150
		};
		this.ctx.fillText(dx.text, dx.x, dx.y);
		this.ctx.strokeText(dx.text, dx.x, dx.y);
		this.drawCycle = !this.drawCycle;
	},
	drawMenu:function(){
		var but = this.menu.button;
		this.ctx.drawImage(but.getImg(), but.x, but.y);
	},
}

var AL={	//AL - ActionListener
	game:null,
	gameListener:{
		game:null,
		keys:[false,false,false,false,false,false,false],
		
		resetKeys:function(){
			for(var i=0;i<this.keys.length;i++)
				this.keys[i]=false;
		},
		setTamaDirection:function(){
			var dirX = 0;
			var dirY = 0;
			for(var i=0;i<2;i++)
				if(this.keys[i])
					dirX=i+1;
			for(var i=2;i<4;i++)
				if(this.keys[i])
					dirY=i+1;
			this.game.gameplay.tama.directionX=dirX;
			this.game.gameplay.tama.directionY=dirY;
		},
		setTamaShoot:function(){
			this.game.gameplay.tama.shooting=this.keys[5];
		},
		click:function(e){
		},
		keydown:function(e){
			switch(e.keyCode){
				case 65:
					this.keys[0]=true;
				break;
				case 68:
					this.keys[1]=true;
				break;
				case 87:
					this.keys[2]=true;
				break;
				case 83:
					this.keys[3]=true;
				break;
				
				case 72:
					this.keys[4]=true;
					if (this.game.gameplay.pause) {
						this.game.gameplay.stop = true;
					} else {
						this.game.gameplay.tama.activateSlowdown();
					}
				break;
				case 74:
					this.keys[5]=true;
				break;

				case 27:
					this.game.gameplay.togglePause();
				break;
			}
		},
		keyup:function(e){
			switch(e.keyCode){
				case 65:
					this.keys[0]=false;
				break;
				case 68:
					this.keys[1]=false;
				break;
				case 87:
					this.keys[2]=false;
				break;
				case 83:
					this.keys[3]=false;
				break;
				
				case 72:
					this.keys[4]=false;
				break;
				case 74:
					this.keys[5]=false;
				break;
				case 75:
					this.keys[6]=false;
				break;
			}
		},
		inBounds:function(directionX, directionY){
			var tama=this.game.gameplay.tama;
			var x=tama.x-this.game.gameplay.left_scroll;
			var y=tama.y;
			var w=tama.w;
			var h=tama.h;
			switch(directionX){
				case 1:
					x-=tama.movement_speed;
				break;
				case 2:
					x+=tama.movement_speed;
				break;
			}
			switch(directionY){
				case 3:
					y-=tama.movement_speed;
				break;
				case 4:
					y+=tama.movement_speed;
				break;
			}
			return {
				x: x >= 0 && x + w <= WIDTH,
				y: y >= GROUND_OFFSET && y + h <= HEIGHT - GROUND_OFFSET
			};
		},
		collides: function(tama, rocks, dinosaurs,lasers, powerups){
			if(tama.isHit())
				return false;
			for(var i=0;i<rocks.rocks.length;i++){
				var rock=rocks.rocks[i];
				if (this.singleCollission(tama, { x: rock.x, y: rock.y, w: rocks.wh, h: rocks.wh })) {
					return true;
				}
			}
			for(var i=0;i<dinosaurs.dinosaurs.length;i++){
				var dino=dinosaurs.dinosaurs[i];
				if (this.singleCollission(tama, dino)) {
					return true;
				}
			}
			for(var i=0;i<lasers.lasers.length;i++){
				var laser=lasers.lasers[i];
				if (this.singleCollission(tama, { x: laser.x, y: laser.y, w: lasers.w, h: lasers.w })) {
					return true;
				}
			}

			for(let i = 0; i < powerups.powerups.length; i++) {
				const powerup = powerups.powerups[i];
				if (this.singleCollission(tama, powerup)) {
					powerup.doEffect();
					powerups.powerups.splice(i, 1);
					i--;
				}
			}

			return false;
		},
		singleCollission: function(object1, object2) {
			const LEEWAY = 10;
			return (
				object1.x + object1.w > object2.x + LEEWAY
				&& object1.x < object2.x + object2.w - LEEWAY
				&& object1.y < object2.y + object2.h - LEEWAY
				&& object1.y + object1.h > object2.y + LEEWAY
			);
		},
		tamaMove:function(directionX, directionY){
			var isInBounds = this.inBounds(directionX, directionY);
			if(isInBounds.x || isInBounds.y)
				this.game.gameplay.tama.moveDirection(isInBounds.x ? directionX : 0, isInBounds.y ? directionY : 0);
			if(this.collides(this.game.gameplay.tama,this.game.gameplay.rocks,this.game.gameplay.dinosaurs,this.game.gameplay.lasers, this.game.gameplay.powerups))
				this.game.gameplay.tama.hit();
		}
	},
	startGame: function() {
		this.game.phase = 2;	// 2=gameplay
		$('#credits').hide();
		this.game.gameplay.init(this.game);
	},
	listenBackButton:function(){
		this.game.phase=0;	//0=menu
		this.game.menu.button.hover = false;
		titleInterval = setInterval(() => {
			this.game.drawTitle();
			this.game.drawMenu();
		}, 200);
	},
	phaseMenu:function(e){
		if (this.game.menu.button.collide(e)) {
			this.startGame();
		}
	},
	phaseGameplay:function(e){
		this.gameListener.click(e);
	},
	phaseScores:function(e){
		if(e.keyCode==27){
			this.gameListener.resetKeys();
			this.listenBackButton();
		} else if (e.keyCode === 13) {
			this.startGame();
		}
	},
	clicked:function(e){
		if(this.game.phase==0)
			this.phaseMenu(e);
		else if(this.game.phase==2)
			this.phaseGameplay(e);
	},
	moved: function(e) {
		if(this.game.phase === 0) {
			const oldHover = this.game.menu.button.hover;
			this.game.menu.button.hover = this.game.menu.button.collide(e);
			if (this.game.menu.button.hover !== oldHover) {
				this.game.drawMenu();
			}
		}
	},
	keydown:function(e){
		if(this.game.phase==2)
			this.gameListener.keydown(e);
		else if(this.game.phase==3)
			this.phaseScores(e);
	},
	keyup:function(e){
		if(this.game.phase==2)
			this.gameListener.keyup(e);
	}
}

function init(){
	AL.game=Game;
	AL.gameListener.game=Game;
	Game.al=AL;
	Game.init();
	titleInterval = setInterval(() => {
		Game.drawTitle();
		Game.drawMenu();
	}, 200);
}