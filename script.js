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

var Game={
	canvas:null,ctx:null,
	title_img:null,start_img:null,
	instr_img:null,back_img:null,
	tama_stand_img:null,tama_run_img:null,tama_stand_hit_img:null,tama_run_hit_img:null,tama_flame_run:null,tama_flame_stand:null,
	flame1_img:null,flame2_img:null,
	raptor1_img:null,raptor2_img:null,
	explosion1_img:null,explosion2_img:null,
	heart_img:null,heart_faint_img:null,
	stone_img:null,
	laser_img:null,
	al:null,
	phase:0,	//0=menu
	menu:{
		buttons:[],
		init:function(){
			var but={
				x:300,y:200,w:230,h:80,
				img:start_img,
				
				collide:collideGlobal
			}
			this.buttons.push(but);
			but={
				x:300,y:300,w:230,h:80,
				img:instr_img,
				
				collide:collideGlobal
			}
			this.buttons.push(but);
		}
	},
	instructions:{
		back_button:null,
		init:function(){
			this.back_button={
				x:300,y:500,w:230,h:80,
				img:back_img,
					
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
		time:0,
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
							x:Math.floor(Math.random()*this.width)+800+game.gameplay.left_scroll,
							y:Math.floor(Math.random()*(430-rocks.wh))+85
						});
					}
					this.rocks.push({
						x:this.width+800+game.gameplay.left_scroll,
						y:Math.floor(Math.random()*(430-rocks.wh))+85
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
			}
		},
		dinosaurs:{
			sprites:[],
			dinosaurs:[],
			number:2,
			max_number:8,
			width:2400,
			laser_freq:60*3,
			all_on_screen:true,
			
			moveDinosaurs:function(game){
				for(var i=0;i<this.dinosaurs.length;i++){
					var dino=this.dinosaurs[i];
					if(dino.x-game.gameplay.left_scroll<=800)
						dino.x+=dino.speed;
					dino.timer++;
					if(dino.timer%this.laser_freq==0)
						game.gameplay.lasers.add(dino.x,dino.y+Math.floor(dino.h-game.gameplay.lasers.h)/2);
				}
			},
			newDino: function(game, single) {
				var dinos = this;
				return {
					points:1,
					maxHp:10,
					hp:10,
					w:116,
					h:60,
					timer:0,
					speed: single ? (Math.floor(Math.random()*2)+1) : (Math.floor(Math.random()*7)-2),
					x: single ? (this.width+800+game.gameplay.left_scroll) : (Math.floor(Math.random()*this.width)+800+game.gameplay.left_scroll),
					y:Math.floor(Math.random()*(430-60))+85,
					getSprite:function(){
						return dinos.sprites[Math.floor(this.timer*Math.abs(this.speed)/20)%2];
					}
				}
			},
			addSingleDino:function(game){
				this.newDino(game, true);
			},
			addDinosaurs:function(game){
				if(this.all_on_screen){
					for(var i=0;i<this.number-1;i++){
						this.dinosaurs.push(this.newDino(game, false));
					}
					this.addSingleDino(game);
				}
			},
			increaseDinosaurNumber:function(){
				if(this.number<this.max_number)
					this.number++;
			},
			init:function(game){
				this.dinosaurs=[];
				if(this.sprites.length==0){
					this.sprites.push(game.raptor1_img);
					this.sprites.push(game.raptor2_img);
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
			hp:3,
			x:0,y:0,w:64,h:64,
			speed:1,
			speed_multiplier:4,
			movement_speed:5,
			timer:0,
			recovery_time:120,
			hit_time:-this.recovery_time,
			fuel:900,
			shooting:false,
			directionX: 0,	//0=nothing, 1=left, 2=right
			directionY: 0,	//0=nothing, 3=up, 4=down
			acc:0,	//acceleration 0=nothing, -1=decrease, 1=increase
			
			hit:function(){
				this.speed=1;
				this.hit_time=this.timer;
				this.hp--;
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
			getSpeed:function(){
				return this.speed*this.speed_multiplier;
			},
			resetTemps:function(){
				this.directionX = 0;
				this.directionY = 0;
				this.acc=0;
			},
			accelerate:function(){
				var new_speed=this.speed+this.acc;
				if(new_speed>=1 && new_speed<=4)
					this.speed=new_speed;
			},
			move:function(gameListener){
				this.x+=this.getSpeed();
				gameListener.tamaMove(this.directionX, this.directionY);
				this.shoot();
				this.accelerate();
				this.resetTemps();
				this.timer++;
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
				this.speed=1;
				this.speed_multiplier=4;
				this.movement_speed=5;
				this.timer=0;
				this.direction=0;
				this.acc=0;
				this.hp=3;
				this.recovery_time=120;
				this.hit_time=-this.recovery_time;
				this.fuel=900;
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
							x:Math.floor(Math.random()*820),
							y:Math.floor(Math.random()*400)+100,
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
			
			add:function(laser_x,laser_y){
				this.lasers.push({
					x:laser_x,
					y:laser_y
				});
			},
			moveLasers:function(){
				for(var i=0;i<this.lasers.length;i++)
					this.lasers[i].x-=this.speed;
			},
			init:function(game){
				this.lasers=[];
				this.sprite=game.laser_img;
			}
		},
		drawDots:function(){
			for(var i=0;i<this.dots.dots.length;i++){
				var dot=this.dots.dots[i];
				this.game.ctx.beginPath();
				this.game.ctx.arc(820-(dot.x+this.left_scroll)%840,dot.y,dot.r,0,2*Math.PI);
				this.game.ctx.fillStyle=this.dots.colors[dot.color];
				this.game.ctx.fill();
				this.game.ctx.closePath();
			}
		},
		drawRocks:function(){
			this.rocks.all_on_screen=true;
			for(var i=0;i<this.rocks.rocks.length;i++){
				var rock=this.rocks.rocks[i];
				if(rock.x-this.left_scroll>=800)
					this.rocks.all_on_screen=false;
				if(rock.x+this.rocks.wh-this.left_scroll<0){
					this.rocks.rocks.splice(i,1);
					i--;
				}
				this.game.ctx.drawImage(this.rocks.sprite,rock.x-this.left_scroll,rock.y);
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
				if(dino.x-this.left_scroll>=800)
					this.dinosaurs.all_on_screen=false;
				if(dino.x+dino.w-this.left_scroll<0){
					this.dinosaurs.dinosaurs.splice(i,1);
					i--;
				}
				if(dino.x>800+this.width){
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
		timeFormat:function(time){
			var t=time/60;
			var min=Math.floor(t/60);
			var sec=Math.floor(t%60);
			if(sec<=9)
				sec="0"+sec;
			return min+":"+sec;
		},
		calculateTotalScore: function() {
			return Math.floor(this.tama.x/100*(1+this.points));
		},
		drawBackground:function(){
			this.game.ctx.fillStyle="#291eff";
			this.game.ctx.fillRect(0,0,800,45);
			this.game.ctx.fillRect(0,555,800,45);
			this.game.ctx.fillStyle="#3bc870";
			this.game.ctx.fillRect(0,45,800,40);
			this.game.ctx.fillRect(0,515,800,40);			
			this.game.ctx.fillStyle="#c3c83b";
			this.game.ctx.fillRect(0,85,800,430);
			
			this.game.ctx.fillStyle="#ffffff";
			this.game.ctx.font="20px Verdana";
			this.game.ctx.fillText("Time:",15,30);
			this.game.ctx.fillText("Distance:",175,30);
			this.game.ctx.fillText("Kills:",435,30);
			this.game.ctx.fillText("Speed:",670,30);
			this.game.ctx.fillText("Total score:",225,585);
			
			this.game.ctx.fillText(this.timeFormat(this.time),80,30);
			this.game.ctx.fillText(Math.floor(this.tama.x/100),275,30);
			this.game.ctx.fillText(this.points,490,30);
			this.game.ctx.fillText(this.tama.speed,745,30);
			this.game.ctx.fillText(this.calculateTotalScore(),345,585);
			
			this.game.ctx.fillText("Fuel:",620,585);
			this.game.ctx.fillStyle="#000000";
			this.game.ctx.fillRect(680,565,100,25);
			
			this.drawDots();
		},
		drawHearts:function(){
			var hearts=this.game.gameplay.tama.hp;
			for(var i=0;i<3;i++){
				var img;
				if(hearts>i)
					img=this.game.heart_img;
				else
					img=this.game.heart_faint_img;
				this.game.ctx.drawImage(img,50+i*40,558);
			}
		},
		drawFuel:function(){
			var fuel=Math.floor(this.game.gameplay.tama.fuel/9);
			this.game.ctx.fillStyle="#12de32";
			this.game.ctx.fillRect(680,565,fuel,25);
		},
		drawTama:function(){
			this.game.ctx.drawImage(this.tama.getSprite(),this.tama.x-this.left_scroll,this.tama.y);
			if(this.tama.shooting)
				this.game.ctx.drawImage(this.tama.getFlameSprite(),this.tama.x+this.tama.w-this.left_scroll,this.tama.y);
		},
		drawPause: function() {
			this.game.ctx.fillStyle = '#000000';
			this.game.ctx.fillRect(300, 250, 200, 100);
			this.game.ctx.fillStyle = "#ffffff";
			this.game.ctx.font = "20px Verdana";
			this.game.ctx.fillText('Pause', 370, 280);
			this.game.ctx.fillText('Press P to continue', 303, 305);
			this.game.ctx.fillText('or ESC to exit', 330, 330);
		},
		addBoom:function(x,down_y){
			this.booms.add(x,down_y);
		},
		checkDinosaurFlame(){
			if(this.tama.shooting)
				for(var i=0;i<this.dinosaurs.dinosaurs.length;i++){
					var dino=this.dinosaurs.dinosaurs[i];
					var flame_x=this.tama.x+this.tama.w;
					var flame_y=this.tama.y;
					var flame_w=128;
					var flame_h=64;
					if(dino.x<flame_x+flame_w && dino.x+dino.w>flame_x && dino.y+dino.h>flame_y && dino.y<flame_y+flame_h){
						dino.hp--;
						if(dino.hp<=0){
							this.dinosaurs.dinosaurs.splice(i,1);
							i--;
							this.points+=dino.points;
							this.addBoom(dino.x,dino.y+dino.h);
						}
					}
				}
		},
		drawScores:function(){
			var score=this.calculateTotalScore();
			this.score=score;
			this.game.ctx.fillStyle="#000000";
			this.game.ctx.fillRect(200,100,420,430);
			
			this.game.ctx.fillStyle="#ffffff";
			this.game.ctx.font="20px Verdana";
			this.game.ctx.fillText("Your total score: "+score,210,120);
			this.game.ctx.fillText("Top scores:",210,150);
			this.game.ctx.fillText("Press ESC to exit or Enter to play again!",210,520);
			var ctx=this.game.ctx;
			var scoreOnLeaderBoard = false;
			var adjustForPlayerScore = 0;
			GJAPI.ScoreFetch(0, false, 10, function(e){
				for(var i=0;i<e.scores.length&&i+adjustForPlayerScore<10;i++){
					if (!scoreOnLeaderBoard && score > e.scores[i].sort) {
						scoreOnLeaderBoard = true;
						adjustForPlayerScore = 1;
						ctx.fillStyle = "#00ff00";
						ctx.fillText((i+1)+": [You!] "+score,210,180+i*30);
						if (i + adjustForPlayerScore === 10) {
							break;
						}
					}

					var name;
					if(e.scores[i].user){
						ctx.fillStyle="#ffffff";
						name=e.scores[i].user;
					}
					else{
						name=e.scores[i].guest;
						ctx.fillStyle="#ffff00";
					}
					ctx.fillText((i+1+adjustForPlayerScore)+": "+name+" "+e.scores[i].sort,210,180+(i+adjustForPlayerScore)*30);
				}

				if(!GJAPI.ScoreAdd(0, score, score)){
					$("#guest").show();
					$("#guest_name").focus();
				}
			});
		},
		showScores:function(){
			this.game.al.gameListener.resetKeys();
			this.game.phase=3;
			this.drawScores();
		},
		addGuestScore:function(){
			$("#guest").hide();
			GJAPI.ScoreAddGuest (0, this.score, this.score, $('#guest_name').val());
		},
		togglePause:function(){
			if(this.pause)
				this.pause=false;
			else
				this.pause=true;
		},
		start:function(){
			var gameplay=this;
			var interval=setInterval(function(){
				if(gameplay.stop){
					clearInterval(interval);
					gameplay.game.al.gameListener.resetKeys();
					gameplay.game.phase=0;	//0=menu
					gameplay.game.drawTitle();
					gameplay.game.drawMenu();
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
					gameplay.checkDinosaurFlame();
					gameplay.drawBackground();
					gameplay.drawHearts();
					gameplay.drawFuel();
					gameplay.drawRocks();
					gameplay.drawDinosaurs();
					gameplay.rocks.addRocks(gameplay.game);
					gameplay.dinosaurs.addDinosaurs(gameplay.game);
					gameplay.drawTama();
					gameplay.drawBooms();
					gameplay.drawLasers();
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
			this.tama.init(game);
			this.rocks.init(game);
			this.lasers.init(game);
			this.dinosaurs.init(game);
			this.booms.init(game);
			this.dots.init();
			this.drawBackground();
			this.pause=false;
			this.stop=false;
			this.time=0;
			this.start();
		}
	},
	init:function(){
		this.canvas=document.getElementById("canvas");
		this.title_img=document.getElementById("title_img");
		this.start_img=document.getElementById("start_img");
		this.instr_img=document.getElementById("instr_img");
		this.back_img=document.getElementById("back_img");
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
		this.explosion1_img=document.getElementById("explosion1_img");
		this.explosion2_img=document.getElementById("explosion2_img");
		this.laser_img=document.getElementById("laser_img");
		this.ctx=this.canvas.getContext("2d");
		this.phase=0;
		this.menu.init();
		this.instructions.init();
		var game=this;

		$("#canvas").click(function(e){
			game.al.clicked(e);
		});
		window.addEventListener('keydown',function(e){
			game.al.keydown(e);
		});
		window.addEventListener('keyup',function(e){
			game.al.keyup(e);
		});
	},
	drawTitle:function(){
		this.ctx.drawImage(this.title_img,0,0);
	},
	drawMenu:function(){
		for(var i=0;i<this.menu.buttons.length;i++){
			var but=this.menu.buttons[i];
			this.ctx.drawImage(but.img,but.x,but.y);
		}
	},
	drawInstructions:function(){
		var but=this.instructions.back_button;
		this.ctx.drawImage(but.img,but.x,but.y);
		
		this.ctx.fillStyle="#000000";
		this.ctx.fillRect(185,100,450,380);
		
		this.ctx.fillStyle="#ffffff";
		this.ctx.font="20px Verdana";
		this.ctx.fillText("In game controls:",190,120);
		this.ctx.fillText("WASD - movement",190,150);
		this.ctx.fillText("H - slow down",190,180);
		this.ctx.fillText("K - accelerate",190,210);
		this.ctx.fillText("J - fire",190,240);
		this.ctx.fillText("P - pause",190,270);
		this.ctx.fillText("ESC - exit to title",190,300);
		
		this.ctx.fillText("Total score = distance * (1 + kills) + bonus",190,360);
	}
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
					this.game.gameplay.tama.acc=-1;
				break;
				case 74:
					this.keys[5]=true;
				break;
				case 75:
					this.keys[6]=true;
					this.game.gameplay.tama.acc=1;
				break;
				case 80:
					this.game.gameplay.togglePause();
				break;
				case 27:
					this.game.gameplay.stop=true;
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
				x: x >= 0 && x + w <= 800,
				y: y >= 85 && y + h <= 515
			};
		},
		collides:function(tama,rocks,dinosaurs,lasers){
			if(tama.isHit())
				return false;
			for(var i=0;i<rocks.rocks.length;i++){
				var rock=rocks.rocks[i];
				if(tama.x+tama.w>rock.x && tama.x<rock.x+rocks.wh && tama.y<rock.y+rocks.wh && tama.y+tama.h>rock.y)
					return true;
			}
			for(var i=0;i<dinosaurs.dinosaurs.length;i++){
				var dino=dinosaurs.dinosaurs[i];
				if(tama.x+tama.w>dino.x && tama.x<dino.x+dino.w && tama.y<dino.y+dino.h && tama.y+tama.h>dino.y)
					return true;
			}
			for(var i=0;i<lasers.lasers.length;i++){
				var laser=lasers.lasers[i];
				if(tama.x+tama.w>laser.x && tama.x<rock.x+lasers.w && tama.y<laser.y+lasers.h && tama.y+tama.h>laser.y)
					return true;
			}
			return false;
		},
		tamaMove:function(directionX, directionY){
			var isInBounds = this.inBounds(directionX, directionY);
			if(isInBounds.x || isInBounds.y)
				this.game.gameplay.tama.moveDirection(isInBounds.x ? directionX : 0, isInBounds.y ? directionY : 0);
			if(this.collides(this.game.gameplay.tama,this.game.gameplay.rocks,this.game.gameplay.dinosaurs,this.game.gameplay.lasers))
				this.game.gameplay.tama.hit();
		}
	},
	startGame: function() {
		this.game.phase = 2;	// 2=gameplay
		this.game.gameplay.init(this.game);
	},
	listenButton:function(id){
		if(id==1){	//instr_button
			this.game.phase=1;	//1=instruction
			this.game.drawTitle();
			this.game.drawInstructions();
		}
		else if(id==0){	//play button
			this.startGame();
		}
	},
	listenBackButton:function(){
		this.game.phase=0;	//0=menu
		this.game.drawTitle();
		this.game.drawMenu();
	},
	phaseMenu:function(e){
		for(var i=0;i<this.game.menu.buttons.length;i++)
			if(this.game.menu.buttons[i].collide(e))
				this.listenButton(i);
	},
	phaseInstructions:function(e){
		if(this.game.instructions.back_button.collide(e))
			this.listenBackButton();
	},
	phaseGameplay:function(e){
		this.gameListener.click(e);
	},
	phaseScores:function(e){
		if(e.keyCode==27){
			this.gameListener.resetKeys();
			$("#guest").hide();
			this.listenBackButton();
		} else if (e.keyCode === 13 && $('#guest').style.display === 'none') {
			this.startGame();
		}
	},
	clicked:function(e){
		if(this.game.phase==0)
			this.phaseMenu(e);
		else if(this.game.phase==1)
			this.phaseInstructions(e);
		else if(this.game.phase==2)
			this.phaseGameplay(e);
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

function addGuestScore(){
	Game.gameplay.addGuestScore();
}

function guestNameListener(event) {
	if (event.keyCode === 13) {	// enter
		addGuestScore();
	}
}

function init(){
	AL.game=Game;
	AL.gameListener.game=Game;
	Game.al=AL;
	Game.init();
	Game.drawTitle();
	Game.drawMenu();
}