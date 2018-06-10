// gamefield: 10 tiles height, 20 tiles width

const CANVASWIDTH = window.innerWidth * 0.85; // 90% of screen width
const CANVASHEIGHT = CANVASWIDTH / (16 / 8);
const TILESIZEPX = 64; // tile size in px

console.log('window.innerWidth', window.innerWidth)

const CANVASWIDTHTILES = parseInt(CANVASWIDTH / TILESIZEPX);
const CANVASHEIGHTTILES = parseInt(CANVASHEIGHT / TILESIZEPX);

let RESOURCESLOADED = 0;

const OBSTACLESCOUNT = parseInt(CANVASWIDTHTILES / 2);

const BOTSSCOUNT = parseInt(CANVASWIDTHTILES) * 3;
const BOTSSPEED = 1;

const BOTWAITMIN = 30;
const BOTWAITMAX = 90;

const AIMZONEPX = 18;
const CHESTZONE = 45;

const IMGSPERFRAME = 40;
const STEPSPERIMG = 20;

// set canvas size 16/8 basing on window size
$('canvas').attr('height', CANVASHEIGHT).attr('width', CANVASWIDTH);

// set info block
$('#info').css('left', CANVASWIDTH + CANVASWIDTH * 0.004).css('width', window.innerWidth - CANVASWIDTH - 40);
let sniperPoints = localStorage.getItem('sniperPoints');
let spyPoints = localStorage.getItem('spyPoints');
if (sniperPoints) $("#sniperPoints").text(sniperPoints);
else localStorage.setItem('sniperPoints', '0');

if (spyPoints) $("#spyPoints").text(spyPoints);
else localStorage.setItem('spyPoints', '0');

$('#clearPoints').on('click', _ => {
	localStorage.setItem('sniperPoints', 0);
	localStorage.setItem('spyPoints', 0);
	$("#spyPoints").text(0);
	$("#sniperPoints").text(0);
});


// promise - wait untill all resources are loaded
async function waitAllTilesLoaded() {
	while (true) {
		let mustBe = CANVASWIDTHTILES * CANVASHEIGHTTILES  + OBSTACLESCOUNT + 9 + BOTSSCOUNT ;
		let result = (RESOURCESLOADED === mustBe);
		
		if (result)
			break;
		else {
			//console.log('doing sleep because ', RESOURCESLOADED, '!=', mustBe);
			await sleep(500);
		}
	}
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// obj of canvas contexts
const CANVCTX = {
	background: document.querySelector('#backgroundCanvas').getContext("2d"),
	map1: document.querySelector('#map1Canvas').getContext("2d"),
	map2: document.querySelector('#map2Canvas').getContext("2d"),
	map3: document.querySelector('#map3Canvas').getContext("2d"),
	bots: document.querySelector('#botsCanvas').getContext("2d"),
	sniper: document.querySelector('#sniperCanvas').getContext("2d"),
	loading: document.querySelector('#loadingCanvas').getContext("2d"),
};

// game timer
class Timer {
	constructor() {
		this.totalSecs = 60 * 5 + 1;
	}
	
	// called every second
	tick() {
		this.totalSecs -= 1;
		//console.log('called tick', this);
		let mins = parseInt(this.totalSecs / 60);
		let secs = parseInt(this.totalSecs % 60);
		$("#timerMins").text('0' + mins);
		$("#timerSecs").text((secs < 10) ? '0' + secs : secs);
		//console.log('Time left:', mins, ':', secs);
		if (mins === 0 && secs === 0) {
			clearInterval(timerInterval);
			gameEnd('spy');
		}
	}
}

// simple background tile
class Tile {
	constructor(imgPath, unstepable, collectable) {
		this.size = TILESIZEPX;
		this.img = new Image(TILESIZEPX, TILESIZEPX);
		this.unstepable = unstepable;
		this.collectable = collectable;
		this.img.src = imgPath;
		this.img.onload = _ => {
			RESOURCESLOADED += 1;
		}
	}
}

// game map object
class Map {
	constructor(w, h) {
		this.width = w;  // count of titles
		this.height = h; // count of titles
		this.mapType = parseInt(Math.random() + 0.5); // 0 for grass, 1 for sand
		this.gameMap = {
			background: [],
			map1: [],
			map2: [],
			bots: [],
			sniper: {}
		};
		
		
		console.log('init map: this.width=', this.width, 'this.height=', this.height, ' type:', this.mapType);
		this.backgroundTile = new Tile('./res/map_tiles/' + this.mapType + '/back.png', true, false);
		
		//generate banks and ground
		for (let i = 0; i < this.width; i++) {
			this.gameMap.map1[i] = [];
			for (let j = 0; j < this.height; j++) {
				if (i === 0 || j === 0 || j === this.height - 1 || i === this.width - 1) {
					if (i === 0 && j === 0)
						this.gameMap.map1[i][j] = new Tile('./res/map_tiles/' + this.mapType + '/border_lt.png', true, false);
					else if (i === 0 && j === this.height - 1)
						this.gameMap.map1[i][j] = new Tile('./res/map_tiles/' + this.mapType + '/border_lb.png', true, false);
					else if (i === this.width - 1 && j === 0)
						this.gameMap.map1[i][j] = new Tile('./res/map_tiles/' + this.mapType + '/border_rt.png', true, false);
					else if (i === this.width - 1 && j === this.height - 1)
						this.gameMap.map1[i][j] = new Tile('./res/map_tiles/' + this.mapType + '/border_rb.png', true, false);
					else if (j === 0)
						this.gameMap.map1[i][j] = new Tile('./res/map_tiles/' + this.mapType + '/border_t_' + Math.round((Math.random() * 2) + 1) + '.png', true, false);
					else if (i === 0)
						this.gameMap.map1[i][j] = new Tile('./res/map_tiles/' + this.mapType + '/border_l_' + Math.round((Math.random() * 2) + 1) + '.png', true, false);
					else if (i === this.width - 1)
						this.gameMap.map1[i][j] = new Tile('./res/map_tiles/' + this.mapType + '/border_r_' + Math.round((Math.random() * 2) + 1) + '.png', true, false);
					else if (j === this.height - 1)
						this.gameMap.map1[i][j] = new Tile('./res/map_tiles/' + this.mapType + '/border_b_' + Math.round((Math.random() * 2) + 1) + '.png', true, false);
				}
				else {
					this.gameMap.map1[i][j] = new Tile('./res/map_tiles/' + this.mapType + '/main.png', false, false)
				}
			}
		}
		
		//generate obstacles
		let min = 2, maxX = (this.width - 2), maxY = (this.height - 2);
		for (let cnt = 0; cnt < OBSTACLESCOUNT; cnt++) {
			let obstacleY = Math.floor(Math.random() * (maxY - min + 1)) + min;
			let obstacleX = Math.floor(Math.random() * (maxX - min + 1)) + min;
			
			if ((obstacleX === 2 && obstacleY === 2) ||
				(obstacleX === 2 && obstacleY === CANVASHEIGHTTILES - 3) ||
				(obstacleX === CANVASWIDTHTILES - 3 && obstacleY === 2) ||
				(obstacleX === CANVASWIDTHTILES - 3 && obstacleY === CANVASHEIGHTTILES - 3)) {
				cnt--;
				continue
			}
			if (this.gameMap.map2[obstacleX] === undefined)
				this.gameMap.map2[obstacleX] = [];
			this.gameMap.map2[obstacleX][obstacleY] = new Tile('./res/map_tiles/' + this.mapType + '/obstacle_' + Math.round((Math.random() * 3) + 1) + '.png', true, false);
		}
		
		this.obstacles = [];
		for (let col in this.gameMap.map2) {
			for (let row in this.gameMap.map2[col]) {
				//console.log('OBST xcol:', col, ' x:', col * TILESIZEPX, ' yrow:', row, ' y:', row*TILESIZEPX);
				this.obstacles.push({
					x: col * TILESIZEPX,
					y: row * TILESIZEPX,
				});
			}
		}
	}
	
	drawMap() {
		for (let i = 0; i < this.width; i++) {
			for (let j = 0; j < this.height; j++) {
				if (i === 0 || j === 0 || i === this.width - 1 || j === this.height - 1) {
					// draw water
					CANVCTX.background.drawImage(this.backgroundTile.img, i * TILESIZEPX, j * TILESIZEPX, TILESIZEPX, TILESIZEPX);
				}
				//draw banks and ground
				CANVCTX.map1.drawImage(this.gameMap.map1[i][j].img, i * TILESIZEPX, j * TILESIZEPX, TILESIZEPX, TILESIZEPX);
				CANVCTX.map1.setLineDash([1, 17]);
				if (this.mapType === 0)
					CANVCTX.map1.strokeStyle = "#fffefd";
				else
					CANVCTX.map1.strokeStyle = "#000000";
				CANVCTX.map1.strokeRect(i * TILESIZEPX, j * TILESIZEPX, TILESIZEPX, TILESIZEPX);
			}
		}
		
		//draw obstacles and collectables
		for (let i = 0; i < this.width; i++) {
			if (!this.gameMap.map2[i])
				continue;
			//console.log('draw obst i ', i);
			for (let j = 0; j < this.height; j++) {
				//console.log('i', i, 'j', j);
				if (!this.gameMap.map2[i][j]) {
					//console.log('j continue');
					continue;
				}
				//console.log('draw obst j ', j);
				//console.log('drawing obstacle ', i, j, this.gameMap.map2[i][j].img);
				CANVCTX.map2.drawImage(this.gameMap.map2[i][j].img, i * TILESIZEPX, j * TILESIZEPX, TILESIZEPX, TILESIZEPX);
			}
		}
	}
	
	checkCoords(x1, y1, x2, y2) {
		let result = {};
		result['unstepable'] = true;
		for (let i = 0; i < this.width; i++) {
			for (let j = 0; j < this.height; j++) {
				if (x1 < TILESIZEPX && y1 < TILESIZEPX) { //left upper corner
					result['unstepable'] = false;
				}
				else if (x1 > TILESIZEPX * (map.width - 1) && y2 < TILESIZEPX) { //right upper corner
					result['unstepable'] = false;
				}
				else if (x2 > TILESIZEPX * (map.width - 1) && y2 > TILESIZEPX * (map.height - 1)) { //right bottom corner
					result['unstepable'] = false;
				}
				else if (x1 < TILESIZEPX && y2 > TILESIZEPX * (map.height - 1)) { //left bottom corner
					result['unstepable'] = false;
				}
				else if (y1 < TILESIZEPX) { // top border
					result['unstepable'] = false;
				}
				else if (x2 > TILESIZEPX * (map.width - 1)) { // right border
					result['unstepable'] = false;
				}
				else if (y1 > TILESIZEPX * (map.height - 1)) { // bottom border
					result['unstepable'] = false;
				}
				else if (x1 < TILESIZEPX) { // left border
					result['unstepable'] = false;
				}
				
			}
		}
		return result;
	}
}

// collaectable chest (barrel with the gold)
class Chest {
	constructor(xTile, yTile) {
		this.img = new Image(64, 64);
		this.img.src = 'res/pic/barrel.png';
		this.img.onload = _ => {
			RESOURCESLOADED += 1;
		};
		this.x = xTile * TILESIZEPX;
		this.y = yTile * TILESIZEPX;
		
		this.isAlreadyCollected = false;
	}
	
	drawChest() {
		CANVCTX.map3.drawImage(this.img, this.x, this.y);
	}
}
// interface for bots and spy (traitor)
class ManInterface {
	// generate start position not standing on obstacle
	generateInitialCoords() {
		while (true) {
			let nextGen = true;
			let randXTile = parseInt(Math.random() * ((CANVASWIDTHTILES - 3) - 3) + 3);
			let randYTile = parseInt(Math.random() * ((CANVASHEIGHTTILES - 3) - 3) + 3);
			//console.log('generating', randXTile, randYTile);
			
			for (let obst of map.obstacles) {
				let obstTitleX = obst.x / TILESIZEPX;
				let obstTitleY = obst.y / TILESIZEPX;
				
				if (obstTitleX === randXTile && obstTitleY === randYTile) {
					//console.log('FAILED');
					nextGen = true;
					break;
				}
				else {
					nextGen = false;
				}
				
			}
			if (!nextGen) {
				this.x = randXTile * TILESIZEPX;
				this.y = randYTile * TILESIZEPX;
				break;
			}
		}
	}
	// doing animation - changing moving frames
	checkAnimationFrame() {
		this.currentStep++;
		if (this.currentStep > STEPSPERIMG) {
			this.currentStep = 0;
			this.currentImgX += 36;
			if (this.currentImgX === 36 * 4)
				this.currentImgX = 0;
		}
	}
}

class Spy extends ManInterface {
	constructor() {
		super();
		this.img = new Image();
		let tmp = Math.floor(Math.random() * 10) % 3 + 1;
		this.img.src = 'res/bots/' + tmp + '.png';
		this.img.onload = _ => {
			RESOURCESLOADED += 1;
		};
		this.x = 150;
		this.y = 150;
		
		this.generateInitialCoords();
		
		this.currentImgX = 0;
		this.currentImgY = 0;
		this.currentImgSet = 0;
		this.currentStep = 0;
		this.moving = {
			up: false,
			left: false,
			down: false,
			right: false
		};
		this.isAlive = true;
		
		this.hasLightning = true;
	};
	
	// check if not ran into obstacle or playable zone end
	checkObstaclesCollision(dir) {
		switch (dir) {
			case 'up':
				for (let obst of map.obstacles) {
					if (this.y - BOTSSPEED + 54 >= obst.y && this.y - BOTSSPEED <= obst.y + TILESIZEPX && this.x + 36 > obst.x && this.x < obst.x + TILESIZEPX)
						return false
				}
				break;
			case 'down':
				for (let obst of map.obstacles) {
					if (this.y + BOTSSPEED + 54 >= obst.y && this.y + BOTSSPEED <= obst.y + TILESIZEPX && this.x + 36 > obst.x && this.x < obst.x + TILESIZEPX)
						return false
				}
				break;
			
			
			case 'right':
				for (let obst of map.obstacles) {
					if (this.x + BOTSSPEED + 36 >= obst.x && this.x + BOTSSPEED <= obst.x + TILESIZEPX && this.y + 54 > obst.y && this.y < obst.y + TILESIZEPX)
						return false
				}
				break;
			case 'left':
				for (let obst of map.obstacles) {
					if (this.x - BOTSSPEED + 36 >= obst.x && this.x - BOTSSPEED <= obst.x + TILESIZEPX && this.y + 54 > obst.y && this.y < obst.y + TILESIZEPX) {
						return false
					}
				}
				break;
		}
		return true
	}
	
	
	countNextPosition() {
		let isMoving = false;
		let up = this.moving.up && this.y >= TILESIZEPX - TILESIZEPX / 2 && this.checkObstaclesCollision('up');
		let right = this.moving.right && this.x <= TILESIZEPX * CANVASWIDTHTILES - TILESIZEPX - 36 && this.checkObstaclesCollision('right');
		let down = this.moving.down && this.y <= TILESIZEPX * CANVASHEIGHTTILES - TILESIZEPX - 54 && this.checkObstaclesCollision('down');
		let left = this.moving.left && this.x >= TILESIZEPX && this.checkObstaclesCollision('left');
		
		if (up && left) {
			this.currentImgSet = 1;
			this.y -= BOTSSPEED;
			this.x -= BOTSSPEED;
			
			this.checkAnimationFrame();
			isMoving = true;
		}
		
		else if (up && right) {
			this.currentImgSet = 2;
			this.y -= BOTSSPEED;
			this.x += BOTSSPEED;
			
			this.checkAnimationFrame();
			isMoving = true;
		}
		else if (down && right) {
			this.currentImgSet = 2;
			this.x += BOTSSPEED;
			this.y += BOTSSPEED;
			
			this.checkAnimationFrame();
			isMoving = true;
		}
		else if (down && left) {
			this.currentImgSet = 1;
			this.x -= BOTSSPEED;
			this.y += BOTSSPEED;
			
			this.checkAnimationFrame();
			isMoving = true;
		}
		
		else if (up) {
			this.currentImgSet = 3;
			this.y -= BOTSSPEED;
			
			this.checkAnimationFrame();
			isMoving = true;
		}
		else if (right) {
			this.currentImgSet = 2;
			this.x += BOTSSPEED;
			
			this.checkAnimationFrame();
			isMoving = true;
		}
		else if (down) {
			this.currentImgSet = 0;
			this.y += BOTSSPEED;
			
			this.checkAnimationFrame();
			isMoving = true;
		}
		else if (left) {
			this.currentImgSet = 1;
			this.x -= BOTSSPEED;
			
			this.checkAnimationFrame();
			isMoving = true;
		}
		
		if (!isMoving) {
			this.currentStep = 0;
			this.currentImgX = 0;
		}
		
		this.checkIfTouchedChest();
		//console.log(this.currentStep);
	};
	
	// check if spy (traitor) collected chest
	checkIfTouchedChest() {
		for (let i = 0; i < chestArr.length; i++) {
			if (!chestArr[i].isAlreadyCollected) {
				let chestZoneX = chestArr[i].x - CHESTZONE;
				let chestZoneY = chestArr[i].y - CHESTZONE;
				let chestSideSize = CHESTZONE + CHESTZONE + TILESIZEPX;
				
				//CANVCTX.fillStyle = "rgba(22, 22, 22, 0.9)";
				//CANVCTX.sniper.fillRect(chestZoneX, chestZoneY, chestSideSize, chestSideSize);
				
				//54 36
				let A = this.y + 54 > chestZoneY && this.y < chestZoneY && this.x > chestZoneX && this.x + 36 < chestZoneX + chestSideSize;
				let B = this.x < chestZoneX + chestSideSize && this.x + 36 > chestZoneX + chestSideSize && this.y > chestZoneY && this.y + 54 < chestZoneY + chestSideSize;
				let C = this.y < chestZoneY + chestSideSize && this.y + 54 > chestZoneY + chestSideSize && this.x > chestZoneX && this.x + 36 < chestZoneX + chestSideSize;
				let D = this.x + 36 > chestZoneX && this.x < chestZoneX && this.y > chestZoneY && this.y + 54 < chestZoneY + chestSideSize;
				//if (A || B || C || D) {}
				if (A || B || C || D) {
					console.log('chest pwned');
					chestArr[i].isAlreadyCollected = true;
					
					setTimeout(_ => {
						chestSound.play();
						chestArr.splice(i, 1);
					}, 5000);
				}
			}
		}
	}
	
	drawSpy() {
		if (this.isAlive) {
			//console.log(this.currentImgX+(this.currentImgSet*36));
			CANVCTX.bots.drawImage(this.img, this.currentImgX, this.currentImgY + (this.currentImgSet * 54), 36, 54, this.x, this.y, 36, 54);
		}
	};
	
	checkIfWin() {
		if (chestArr.length === 1 && chestArr[0].isAlreadyCollected === true) {
			sniperPlayer.canShoot = false;
			setTimeout(_ => {
				botsArr = []
			}, 6000);
			setTimeout(_ => gameEnd('spy'), 8000);
			chestArr.length = 0;
		}
	}
}

class Bot extends ManInterface {
	constructor() {
		super();
		this.x = 0;                  //px
		this.y = 0;                  //px
		
		this.basicImg = new Image(); //full image
		
		this.currentImgX = 0;
		this.currentImgY = 0;
		this.currentImgSet = 0;
		this.currentStep = 0;
		
		this.currentMovePattern = 0;       // string of pattern
		this.currentMovePatternStep = 0;   // current index of currentMovePattern
		this.currentMoveCounter = 0;       // counter of frames
		
		this.ifWaiting = false;
		this.waiting = 0;
		this.waitingFor = 0;
		
		//generating data for bots
		let tmp = parseInt(Math.random() * 10) % 3 + 1;
		this.basicImg.src = 'res/bots/' + tmp + '.png';
		this.basicImg.onload = _ => {
			RESOURCESLOADED += 1;
		};
		
		this.generateInitialCoords();
		
		tmp = parseInt(Math.random() * (botsMovePatterns.length - 0) + 0);
		this.currentMovePattern = botsMovePatterns[tmp];
	}
	
	draw() {
		CANVCTX.bots.drawImage(this.basicImg, this.currentImgX, this.currentImgY + (this.currentImgSet * 54), 36, 54, this.x, this.y, 36, 54);
	}
	
	// choose randomly new move pattern
	newMovePattern() {
		let tmp = parseInt(Math.random() * (botsMovePatterns.length - 0) + 0);
		this.currentMovePattern = botsMovePatterns[tmp];
		this.currentMovePatternStep = 0;
		this.currentMoveCounter = 0;
		
	}
	
	// choose randomly time to wait
	generateWait() {
		this.waiting = 0;
		let tmp = parseInt(Math.random() * (BOTWAITMIN - BOTWAITMAX) + BOTWAITMAX);
		this.waitingFor = tmp;
	}
	
	checkObstaclesCollision(dir) {
		switch (dir) {
			case 'up':
				for (let obst of map.obstacles) {
					if (this.y - BOTSSPEED + 54 >= obst.y && this.y - BOTSSPEED <= obst.y + TILESIZEPX && this.x + 36 > obst.x && this.x < obst.x + TILESIZEPX)
						return false
				}
				break;
			case 'down':
				for (let obst of map.obstacles) {
					if (this.y + BOTSSPEED + 54 >= obst.y && this.y + BOTSSPEED <= obst.y + TILESIZEPX && this.x + 36 > obst.x && this.x < obst.x + TILESIZEPX)
						return false
				}
				break;
			
			
			case 'right':
				for (let obst of map.obstacles) {
					if (this.x + BOTSSPEED + 36 >= obst.x && this.x + BOTSSPEED <= obst.x + TILESIZEPX && this.y + 54 > obst.y && this.y < obst.y + TILESIZEPX)
						return false
				}
				break;
			case 'left':
				for (let obst of map.obstacles) {
					if (this.x - BOTSSPEED + 36 >= obst.x && this.x - BOTSSPEED <= obst.x + TILESIZEPX && this.y + 54 > obst.y && this.y < obst.y + TILESIZEPX) {
						return false
					}
				}
				break;
		}
		return true
	}
	
	countNextStep() {
		if (this.ifWaiting) {
			this.waiting += 1;
			if (this.waiting > this.waitingFor) {
				this.ifWaiting = false;
				this.waitingFor = 0;
				this.waiting = 0;
				this.currentMovePatternStep = 0;
				this.currentMoveCounter = 0;
				this.newMovePattern();
			}
		}
		else {
			let currentStep = this.currentMovePattern[parseInt(this.currentMovePatternStep)];
			
			switch (currentStep) {
				case '1':
					if (this.y >= TILESIZEPX - TILESIZEPX / 2 && this.x >= TILESIZEPX && this.checkObstaclesCollision('up') && this.checkObstaclesCollision('left')) {
						this.y -= BOTSSPEED;
						this.x -= BOTSSPEED;
						this.currentImgSet = 1;
						
						this.checkAnimationFrame();
					}
					break;
				case '2':
					if (this.y >= TILESIZEPX - TILESIZEPX / 2 && this.checkObstaclesCollision('up')) {
						this.y -= BOTSSPEED;
						this.currentImgSet = 3;
						
						this.checkAnimationFrame();
						
					}
					break;
				case '3':
					if (this.y >= TILESIZEPX - TILESIZEPX / 2 && this.x <= TILESIZEPX * CANVASWIDTHTILES - TILESIZEPX - 36 && this.checkObstaclesCollision('up') && this.checkObstaclesCollision('right')) {
						this.y -= BOTSSPEED;
						this.x += BOTSSPEED;
						this.currentImgSet = 2;
						
						this.checkAnimationFrame();
					}
					break;
				case '4':
					if (this.x >= TILESIZEPX && this.checkObstaclesCollision('left')) {
						this.x -= BOTSSPEED;
						this.currentImgSet = 1;
						
						this.checkAnimationFrame();
					}
					break;
				case '5':
					break;
				case '6':
					if (this.x <= TILESIZEPX * CANVASWIDTHTILES - TILESIZEPX - 36 && this.checkObstaclesCollision('right')) {
						this.x += BOTSSPEED;
						this.currentImgSet = 2;
						
						this.checkAnimationFrame();
					}
					break;
				case '7':
					if (this.y <= TILESIZEPX * CANVASHEIGHTTILES - TILESIZEPX - 54 && this.x >= TILESIZEPX && this.checkObstaclesCollision('down') && this.checkObstaclesCollision('left')) {
						this.y += BOTSSPEED;
						this.x -= BOTSSPEED;
						this.currentImgSet = 1;
						
						this.checkAnimationFrame();
					}
					break;
				case '8':
					if (this.y <= TILESIZEPX * CANVASHEIGHTTILES - TILESIZEPX - 54 && this.checkObstaclesCollision('down')) {
						this.y += BOTSSPEED;
						this.currentImgSet = 0;
						
						this.checkAnimationFrame();
					}
					break;
				case '9':
					if (this.x <= TILESIZEPX * CANVASWIDTHTILES - TILESIZEPX - 36 && this.y <= TILESIZEPX * CANVASHEIGHTTILES - TILESIZEPX - 54 && this.checkObstaclesCollision('down') && this.checkObstaclesCollision('right')) {
						this.y += BOTSSPEED;
						this.x += BOTSSPEED;
						this.currentImgSet = 2;
						
						this.checkAnimationFrame();
					}
					break;
			}
			
			this.currentMoveCounter += 1;
			
			
			if (this.currentMoveCounter > IMGSPERFRAME) {
				
				this.currentMoveCounter = 0;
				this.currentMovePatternStep += 1;
				if (this.currentMovePatternStep > this.currentMovePattern.length) {
					// wait, then generate new move pattern
					this.generateWait();
					this.ifWaiting = true;
					this.currentStep = 0;
				}
			}
		}
	}
}

let sniperPlayer = {
	counterAmmo: 3,
	canShoot: true,
};

let aim = {
	constructor() {
		this.normalAim = new Image();
		this.normalAim.src = 'res/pic/aim3.png';
		this.normalAim.onload = _ => {
			RESOURCESLOADED += 1;
		};
		
		this.crossAim = new Image();
		this.crossAim.src = 'res/pic/aim4.png';
		this.crossAim.onload = _ => {
			RESOURCESLOADED += 1;
		};
		
		this.shotSound = new Audio("res/sounds/shotgun1.mp3");
		this.shotSound.onload = _ => {
			RESOURCESLOADED += 1;
		};
		
		this.x = 0;
		this.y = 0;
	},
	draw() {
		if (sniperPlayer.canShoot === true) {
			CANVCTX.sniper.drawImage(aim.normalAim, aim.x - 32, aim.y - 32);
		} else {
			CANVCTX.sniper.drawImage(aim.crossAim, aim.x - 32, aim.y - 32);
		}
	}
	
};

let deadBodyImg = new Image();
deadBodyImg.src = "res/bots/dead.png";
deadBodyImg.onload = _ => {
	RESOURCESLOADED += 1;
};
let chestSound = new Audio();
chestSound.src = "res/sounds/chest.wav";
chestSound.onload = _ => {
	RESOURCESLOADED += 1;
};

//---------------------------------------------------------------------

// animation of fading 'loading game' picture
function animationStartGame(alpha = 1.00) {
	//console.log('called animationStartGame with alpha', alpha);
	if (alpha < 0) {
		$("#loadingCanvas").remove();
		return;
	}
	CANVCTX.loading.clearRect(0, 0, CANVASWIDTH, CANVASHEIGHT);
	CANVCTX.loading.fillStyle = `rgba(22, 22, 22, ${alpha})`;
	CANVCTX.loading.fillRect(0, 0, CANVASWIDTH, CANVASHEIGHT);
	
	setTimeout(_ => animationStartGame(alpha - 0.02), 70);
	
}

function gameEnd(winner) {
	clearInterval(timerInterval);
	cancelAnimationFrame(updating);
	$('body').off();
	$('#sniperCanvas').off();
	CANVCTX.sniper.fillStyle = "rgba(22, 22, 22, 0.5)";
	CANVCTX.sniper.fillRect(0, 0, CANVASWIDTH, CANVASHEIGHT);
	CANVCTX.sniper.font = "32px Arial";
	CANVCTX.sniper.fillStyle = "#EEE";
	if (winner === "sniper") {
		CANVCTX.sniper.fillText('Master won!', CANVASWIDTH * 0.45, CANVASHEIGHT * 0.3);
		sniperPoints = parseInt(localStorage.getItem('sniperPoints'));
		sniperPoints++;
		localStorage.setItem('sniperPoints', sniperPoints);
		$("#sniperPoints").text(sniperPoints);
	}
	else if (winner === "spy") {
		//debugger;
		CANVCTX.sniper.fillText('Traitor won!', CANVASWIDTH * 0.45, CANVASHEIGHT * 0.3);
		spyPoints = parseInt(localStorage.getItem('spyPoints'));
		spyPoints++;
		localStorage.setItem('spyPoints', spyPoints);
		$("#spyPoints").text(spyPoints);
	}
	CANVCTX.sniper.font = "24px Arial";
	CANVCTX.sniper.fillText('F5 to start new game', CANVASWIDTH * 0.432, CANVASHEIGHT * 0.4);
}

// var for requestAnimFrame
let updating;
function update() {
	
	// clear everything
	CANVCTX.map3.clearRect(0, 0, CANVASWIDTH, CANVASHEIGHT);
	CANVCTX.bots.clearRect(0, 0, CANVASWIDTH, CANVASHEIGHT);
	CANVCTX.sniper.clearRect(0, 0, CANVASWIDTH, CANVASHEIGHT);
	
	//draw chests
	for (let i of chestArr) {
		i.drawChest();
	}
	
	spyPlayer.countNextPosition();
	spyPlayer.drawSpy();
	spyPlayer.checkIfWin();
	
	//draw bots
	for (let bot of botsArr) {
		bot.countNextStep();
		bot.draw()
	}
	
	// draw snipers aim
	aim.draw();
	
	updating = requestAnimationFrame(update);
}

// var for Interval of timer
let timerInterval;
let timer = new Timer();


let map = new Map(CANVASWIDTHTILES, CANVASHEIGHTTILES);
aim.constructor();


let chestArr = [];
chestArr.push(new Chest(2, 2));
chestArr.push(new Chest(2, CANVASHEIGHTTILES - 3));
chestArr.push(new Chest(CANVASWIDTHTILES - 3, 2));
chestArr.push(new Chest(CANVASWIDTHTILES - 3, CANVASHEIGHTTILES - 3));


let botsArr = [];
for (let i = 0; i < BOTSSCOUNT; i++)
	botsArr.push(new Bot());

let spyPlayer = new Spy();

function handleClick(evt) {
	if (sniperPlayer.canShoot === true && sniperPlayer.counterAmmo > 0) {
		
		sniperPlayer.counterAmmo--;
		
		let shootX = evt.originalEvent.clientX - 8;
		let shootY = evt.originalEvent.clientY - 8;
		console.log('SHOOT x', shootX, ' y', shootY);
		
		aim.shotSound.play();
		sniperPlayer.canShoot = false;
		
		for (let i = 0; i < botsArr.length; i++) {
			let A = (shootX + AIMZONEPX / 2 > botsArr[i].x && shootX + AIMZONEPX / 2 < botsArr[i].x + 36 && shootY + AIMZONEPX / 2 > botsArr[i].y && shootY + AIMZONEPX / 2 < botsArr[i].y + 54);
			let B = (shootX - AIMZONEPX / 2 > botsArr[i].x && shootX - AIMZONEPX / 2 < botsArr[i].x + 36 && shootY + AIMZONEPX / 2 > botsArr[i].y && shootY + AIMZONEPX / 2 < botsArr[i].y + 54);
			let C = (shootX + AIMZONEPX / 2 > botsArr[i].x && shootX + AIMZONEPX / 2 < botsArr[i].x + 36 && shootY - AIMZONEPX / 2 > botsArr[i].y && shootY - AIMZONEPX / 2 < botsArr[i].y + 54);
			;
			let D = (shootX - AIMZONEPX / 2 > botsArr[i].x && shootX - AIMZONEPX / 2 < botsArr[i].x + 36 && shootY - AIMZONEPX / 2 > botsArr[i].y && shootY - AIMZONEPX / 2 < botsArr[i].y + 54);
			;
			if (A || B || C || D) {
				CANVCTX.map2.drawImage(deadBodyImg, botsArr[i].x, botsArr[i].y);
				botsArr.splice(i, 1);
			}
		}
		
		//check for killing spy
		let A = (shootX + AIMZONEPX / 2 > spyPlayer.x && shootX + AIMZONEPX / 2 < spyPlayer.x + 36 && shootY + AIMZONEPX / 2 > spyPlayer.y && shootY + AIMZONEPX / 2 < spyPlayer.y + 54);
		let B = (shootX - AIMZONEPX / 2 > spyPlayer.x && shootX - AIMZONEPX / 2 < spyPlayer.x + 36 && shootY + AIMZONEPX / 2 > spyPlayer.y && shootY + AIMZONEPX / 2 < spyPlayer.y + 54);
		let C = (shootX + AIMZONEPX / 2 > spyPlayer.x && shootX + AIMZONEPX / 2 < spyPlayer.x + 36 && shootY - AIMZONEPX / 2 > spyPlayer.y && shootY - AIMZONEPX / 2 < spyPlayer.y + 54);
		;
		let D = (shootX - AIMZONEPX / 2 > spyPlayer.x && shootX - AIMZONEPX / 2 < spyPlayer.x + 36 && shootY - AIMZONEPX / 2 > spyPlayer.y && shootY - AIMZONEPX / 2 < spyPlayer.y + 54);
		;
		if (A || B || C || D) {
			clearInterval(timerInterval);
			spyPlayer.isAlive = false;
			CANVCTX.map2.drawImage(deadBodyImg, spyPlayer.x, spyPlayer.y);
			setTimeout(_ => gameEnd('sniper'), 3000);
		}
		
		if (sniperPlayer.counterAmmo > 0) {
			setTimeout(_ => {
				sniperPlayer.canShoot = true;
			}, 3000);
		}
		else {
			sniperPlayer.canShoot = false;
			setTimeout(_ => {
				botsArr = []
			}, 4000);
			setTimeout(_ => gameEnd('spy'), 6000);
		}
		
	}
	
}

function keyDownHandler(evt) {
	//console.log('key down ');
	evt.preventDefault();
	if (evt.which === 87) { //up
		spyPlayer.moving.up = true;
	}
	else if (evt.which === 68) { //right
		spyPlayer.moving.right = true;
	}
	else if (evt.which === 83) { //down
		spyPlayer.moving.down = true;
	}
	else if (evt.which === 65) { //left
		spyPlayer.moving.left = true;
	}
	else if (evt.which === 32)
		spaceHandler();
	
	//$('body').off("keydown", a);
}

function keyUpHandler(evt) {
	evt.preventDefault();
	
	//console.log('keyUp');
	if (evt.which === 87) { //up
		spyPlayer.moving.up = false;
	}
	else if (evt.which === 68) { //right
		spyPlayer.moving.right = false;
	}
	else if (evt.which === 83) { //down
		spyPlayer.moving.down = false;
	}
	else if (evt.which === 65) { //left
		spyPlayer.moving.left = false;
	}
	//$('body').on("keydown", a);
}

function spaceHandler() {
	if (spyPlayer.hasLightning) {
		$("#info").before(`<canvas id="lightningCanvas"></canvas>`);
		$('#lightningCanvas').attr('height', CANVASHEIGHT).attr('width', CANVASWIDTH);
		let ctx = document.querySelector('#lightningCanvas').getContext("2d");
		
		spyPlayer.hasLightning = false;
		ctx.fillStyle = "#FFFFFF";
		ctx.fillRect(0, 0, CANVASWIDTHTILES * TILESIZEPX, CANVASHEIGHTTILES * TILESIZEPX);
		setTimeout(_ => {
			$('#lightningCanvas').remove();
		}, 1500);
	}
}



if (window.innerWidth >= 1280) {
	
	CANVCTX.loading.fillStyle = "#222";
	CANVCTX.loading.fillRect(0, 0, CANVASWIDTH, CANVASHEIGHT);
	CANVCTX.loading.font = "30px Arial";
	CANVCTX.loading.fillStyle = "#EEE";
	CANVCTX.loading.fillText('Game is loading...', CANVASWIDTH * 0.43, CANVASHEIGHT * 0.4);
	
	//start game
	waitAllTilesLoaded().then(_ => {
		map.drawMap();
		$('#sniperCanvas').on('mousemove', evt => {
			//console.log('Mouse moved');
			aim.x = evt.originalEvent.clientX;
			aim.y = evt.originalEvent.clientY;
		});
		$('#sniperCanvas').on("click", handleClick);
		$('body').on("keydown", keyDownHandler).on("keyup", keyUpHandler);
		animationStartGame();
		timerInterval = setInterval(_ => {
			timer.tick()
		}, 1000);
		update();
	});
}
else (
	$("#info").hide()
);




