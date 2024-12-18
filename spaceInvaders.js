// spaceInvaders.js
import { LightningElement, track } from 'lwc';
import playerImgURL from '@salesforce/resourceUrl/player';
import enemyImgURL from '@salesforce/resourceUrl/enemy';
import bulletImgURL from '@salesforce/resourceUrl/bullet';
import enemyBulletImgURL from '@salesforce/resourceUrl/enemyBullet';

export default class SpaceInvaders extends LightningElement {
    @track score = 0;
    @track lives = 3;
    @track gameOver = false;

    canvas;
    ctx;
    animationId;
    isInitialized = false;

    // Images
    playerImage = new Image();
    enemyImage = new Image();
    bulletImage = new Image();
    enemyBulletImage = new Image();

    // Player properties
    player = {
        x: 375,
        y: 550,
        width: 50,
        height: 30,
        speed: 5,
        dx: 0,
        // Hitbox properties
        hitboxWidth: 40,
        hitboxHeight: 20,
        hitboxOffsetX: 5,
        hitboxOffsetY: 5
    };

    // Bullet properties
    bullets = [];

    // Enemy properties
    enemies = [];
    enemyRows = 5;
    enemyCols = 10;
    enemyWidth = 40;
    enemyHeight = 30;
    enemyPadding = 10;
    enemyOffsetTop = 50;
    enemyOffsetLeft = 30;
    enemySpeed = 1;
    enemyDirection = 1;

    // Enemy Bullets
    enemyBullets = [];
    enemyShootInterval = 1000; // in ms

    connectedCallback() {
        // Preload images
        this.playerImage.src = playerImgURL;
        this.enemyImage.src = enemyImgURL;
        this.bulletImage.src = bulletImgURL;
        this.enemyBulletImage.src = enemyBulletImgURL;
    }

    renderedCallback() {
        if (this.isInitialized) {
            return;
        }
        this.isInitialized = true;
        this.initializeGame();
    }

    initializeGame() {
        this.canvas = this.template.querySelector('.game-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.createEnemies();
            this.draw();
            this.setupEventListeners();
            this.startEnemyShooting();
        } else {
            console.error('Canvas element not found.');
        }
    }

    createEnemies() {
        this.enemies = [];
        for (let row = 0; row < this.enemyRows; row++) {
            for (let col = 0; col < this.enemyCols; col++) {
                let enemy = {
                    x: this.enemyOffsetLeft + col * (this.enemyWidth + this.enemyPadding),
                    y: this.enemyOffsetTop + row * (this.enemyHeight + this.enemyPadding),
                    width: this.enemyWidth,
                    height: this.enemyHeight,
                    dx: this.enemySpeed * this.enemyDirection,
                    dy: 0,
                    // Hitbox properties
                    hitboxWidth: 30,
                    hitboxHeight: 20,
                    hitboxOffsetX: 5,
                    hitboxOffsetY: 5
                };
                this.enemies.push(enemy);
            }
        }
    }

    setupEventListeners() {
        window.addEventListener('keydown', this.keyDownHandler.bind(this), false);
        window.addEventListener('keyup', this.keyUpHandler.bind(this), false);
    }

    keyDownHandler(e) {
        if (e.key === 'Right' || e.key === 'ArrowRight') {
            this.player.dx = this.player.speed;
        } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
            this.player.dx = -this.player.speed;
        } else if (e.key === ' ' || e.key === 'Spacebar') {
            this.shootBullet();
        }
    }

    keyUpHandler(e) {
        if (
            (e.key === 'Right' || e.key === 'ArrowRight') ||
            (e.key === 'Left' || e.key === 'ArrowLeft')
        ) {
            this.player.dx = 0;
        }
    }

    shootBullet() {
        if (this.bullets.length < 5) { // Limit the number of bullets on screen
            const bullet = {
                x: this.player.x + this.player.width / 2 - 2.5,
                y: this.player.y,
                width: 5,
                height: 10,
                dy: -7,
                // Hitbox properties
                hitboxWidth: 5,
                hitboxHeight: 10,
                hitboxOffsetX: 0,
                hitboxOffsetY: 0
            };
            this.bullets.push(bullet);
        }
    }

    shootEnemyBullet() {
        if (this.enemies.length === 0) return;
        const randomEnemy = this.enemies[Math.floor(Math.random() * this.enemies.length)];
        const enemyBullet = {
            x: randomEnemy.x + randomEnemy.width / 2 - 2.5,
            y: randomEnemy.y + randomEnemy.height,
            width: 5,
            height: 10,
            dy: 5,
            // Hitbox properties
            hitboxWidth: 5,
            hitboxHeight: 10,
            hitboxOffsetX: 0,
            hitboxOffsetY: 0
        };
        this.enemyBullets.push(enemyBullet);
    }

    startEnemyShooting() {
        this.enemyShootIntervalId = setInterval(() => {
            this.shootEnemyBullet();
        }, this.enemyShootInterval);
    }

    movePlayer() {
        this.player.x += this.player.dx;
        // Prevent player from moving out of bounds
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.canvas.width) {
            this.player.x = this.canvas.width - this.player.width;
        }
    }

    moveBullets() {
        this.bullets.forEach((bullet, index) => {
            bullet.y += bullet.dy;
            // Remove bullet if it goes off screen
            if (bullet.y < 0) {
                this.bullets.splice(index, 1);
            }
        });
    }

    moveEnemies() {
        let changeDirection = false;
        this.enemies.forEach(enemy => {
            enemy.x += enemy.dx;
            // Check if any enemy hits the canvas boundary
            if (enemy.x + enemy.width > this.canvas.width || enemy.x < 0) {
                changeDirection = true;
            }
        });

        if (changeDirection) {
            this.enemies.forEach(enemy => {
                enemy.dx = -enemy.dx;
                enemy.y += 10; // Move down when changing direction
                // Check if any enemy reaches the player level
                if (enemy.y + enemy.height >= this.player.y) {
                    this.endGame();
                }
            });
        }
    }

    moveEnemyBullets() {
        this.enemyBullets.forEach((bullet, index) => {
            bullet.y += bullet.dy;
            // Remove bullet if it goes off screen
            if (bullet.y > this.canvas.height) {
                this.enemyBullets.splice(index, 1);
            }
            // Check collision with player using hitboxes
            if (this.isColliding(bullet, this.player)) {
                this.enemyBullets.splice(index, 1);
                this.lives -= 1;
                if (this.lives <= 0) {
                    this.endGame();
                }
            }
        });
    }

    detectCollisions() {
        this.bullets.forEach((bullet, bIndex) => {
            this.enemies.forEach((enemy, eIndex) => {
                if (this.isColliding(bullet, enemy)) {
                    // Collision detected
                    this.bullets.splice(bIndex, 1);
                    this.enemies.splice(eIndex, 1);
                    this.score += 10;
                }
            });
        });
    }

    isColliding(objA, objB) {
        const aLeft = objA.x + objA.hitboxOffsetX;
        const aRight = aLeft + objA.hitboxWidth;
        const aTop = objA.y + objA.hitboxOffsetY;
        const aBottom = aTop + objA.hitboxHeight;

        const bLeft = objB.x + objB.hitboxOffsetX;
        const bRight = bLeft + objB.hitboxWidth;
        const bTop = objB.y + objB.hitboxOffsetY;
        const bBottom = bTop + objB.hitboxHeight;

        return !(aRight < bLeft || 
                 aLeft > bRight || 
                 aBottom < bTop || 
                 aTop > bBottom);
    }

    checkGameOver() {
        if (this.enemies.length === 0) {
            this.gameOver = true;
            cancelAnimationFrame(this.animationId);
            clearInterval(this.enemyShootIntervalId);
        }
    }

    endGame() {
        this.gameOver = true;
        cancelAnimationFrame(this.animationId);
        clearInterval(this.enemyShootIntervalId);
    }

    drawPlayer() {
        this.ctx.drawImage(this.playerImage, this.player.x, this.player.y, this.player.width, this.player.height);
    }

    drawBullets() {
        this.bullets.forEach(bullet => {
            this.ctx.drawImage(this.bulletImage, bullet.x, bullet.y, bullet.width, bullet.height);
        });
    }

    drawEnemies() {
        this.enemies.forEach(enemy => {
            this.ctx.drawImage(this.enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
        });
    }

    drawEnemyBullets() {
        this.enemyBullets.forEach(bullet => {
            this.ctx.drawImage(this.enemyBulletImage, bullet.x, bullet.y, bullet.width, bullet.height);
        });
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw() {
        this.clearCanvas();
        this.drawPlayer();
        this.drawBullets();
        this.drawEnemies();
        this.drawEnemyBullets();
        this.detectCollisions();
        this.movePlayer();
        this.moveBullets();
        this.moveEnemies();
        this.moveEnemyBullets();
        this.checkGameOver();

        if (!this.gameOver) {
            this.animationId = requestAnimationFrame(this.draw.bind(this));
        }
    }

    restartGame() {
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.bullets = [];
        this.enemyBullets = [];
        this.createEnemies();
        this.player.x = 375;
        this.player.y = 550;
        this.startEnemyShooting();
        this.draw();
    }
}