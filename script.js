class _createObject {
	constructor(ctx, x, y, vx, vy, mass) {
		this.ctx = ctx;
		this.x = x;
		this.y = y;
		this.vx = vx;
		this.vy = vy;
		this.mass = mass;
		this.color = '#0099b0';

		this.isColliding = false;
	}

	genRandomColor() {
		return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
	}
}

class _Object extends _createObject {
	constructor(ctx, x, y, vx, vy, mass) {
		super(ctx, x, y, vx, vy, mass);
		this.r = 15;
	}

	draw() {
		// this.ctx.fillStyle = this.isColliding ? '#ff8080' : '#0099b0';
		this.ctx.fillStyle = this.color;
		this.ctx.beginPath();
		this.ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
		this.ctx.fill();
	}

	update(secondsPassed) {
		let g = 9.81 * 100;
		this.vy += g * secondsPassed;
		this.x += this.vx * secondsPassed;
		this.y += this.vy * secondsPassed;
	}
}

class _Engine {
	constructor(setup) {
		this.canvas = document.querySelector(setup.canvas);
		this.ctx = this.canvas.getContext('2d');
		this.w = this.canvas.width;
		this.h = this.canvas.height;
		this.prevtime = 0;
		this.objectArray = [];
		this.resetCounter = 0;
		this.contained = setup.contained;
		this.objects = setup.objects;

		this.init();

		this.user = new _Object(this.ctx, 370, 195, 0, 0, 20);
		this.user.isColliding = true;

		let canvasGBCR = this.canvas.getBoundingClientRect();

		let self = this;
		this.canvas.addEventListener('mousemove', e => {
			this.user.x = e.clientX - canvasGBCR.left;
			this.user.y = e.clientY - canvasGBCR.top;
		});
	}

	init() {
		this.genObjectArray();
		window.requestAnimationFrame(time => { this.update(time); });
	}

	genObjectArray() {
		let i = 0;
		while (i < this.objects) {
			let x = this.genRandomNumber(1, this.w);
			let vx = this.genRandomNumber(-50, 50);
			let y = this.genRandomNumber(1, -this.h);
			let vy = this.genRandomNumber(-50, 50);
			let mass = this.genRandomNumber(.5, 1, 10);
			let circle = new _Object(this.ctx, x, -15, vx, vy, mass);

			this.objectArray.push(circle);
			i++;
		}
	}

	update(time) {
		let secondsPassed = (time - this.prevtime) / 1000;
		this.prevtime = time;

		this.detectCollisions();
		this.clearCanvas();

		this.user.update(0);
		this.user.draw();

		let i = 0, length = this.objectArray.length;
		while (i < length) {
			this.objectArray[i].update(secondsPassed);
			this.objectArray[i].draw();
			i++;
		}
		window.requestAnimationFrame(time => this.update(time));
	}

	detectCollisions() {
		let obj1;
		let obj2;
		let length = this.objectArray.length;

		{
			let i = 0;
			while (i < length) {
				obj1 = this.objectArray[i];
				obj1.isColliding = false;

				if (this.contained.x) {
					if (obj1.x < obj1.r) {
						obj1.vx = Math.abs(obj1.vx) * .9;
						obj1.x = obj1.r;
						obj1.isColliding = true;
					} else if (obj1.x > this.w - obj1.r) {
						obj1.vx = -Math.abs(obj1.vx) * .9;
						obj1.x = this.w - obj1.r;
						obj1.isColliding = true;
					}
				}
				
				if (obj1.y < obj1.r && !this.contained.y) {
					obj1.vy = Math.abs(obj1.vy) * .9;
					obj1.y = obj1.r;
					obj1.isColliding = true;
				} else if (obj1.y > this.h - obj1.r && this.contained.y) {
					obj1.vy = -Math.abs(obj1.vy) * .9;
					obj1.y = this.h - obj1.r;
					obj1.isColliding = true;
				}
				i++;
			}
		}

		{
			let i = 0;
			while (i < length) {
				obj1 = this.objectArray[i];
				obj1.isColliding = false;

				let j = i + 1;
				while (j < length) {
					obj2 = this.objectArray[j];
					if (this.objectCollided(obj1.x, obj1.y, obj1.r, obj2.x, obj2.y, obj2.r)) {
						obj1.isColliding = true;
						obj2.isColliding = true;

						let vecCollision = { x: obj2.x - obj1.x, y: obj2.y - obj1.y };
						let distance = this.getDistance(obj1.x, obj1.y, obj2.x, obj2.y);

						let vecCollisionNorm = { x: vecCollision.x / distance, y: vecCollision.y / distance };
						let vRelativeVelocity = { x: obj1.vx - obj2.vx, y: obj1.vy - obj2.vy };
						let speed = vRelativeVelocity.x * vecCollisionNorm.x + vRelativeVelocity.y * vecCollisionNorm.y;

						let impulse = 1.5 * speed / (obj1.mass + obj2.mass);

						if (speed < 0) break;
						obj1.vx -= impulse * obj2.mass * vecCollisionNorm.x;
						obj1.vy -= impulse * obj2.mass * vecCollisionNorm.y;
						obj2.vx += impulse * obj1.mass * vecCollisionNorm.x;
						obj2.vy += impulse * obj1.mass * vecCollisionNorm.y;
					}
					j++;
				}
				i++;
			}
		}

		{
			let i = 0;
			while (i < length) {
				obj1 = this.objectArray[i];
				obj1.isColliding = false;

				obj2 = this.user;
				if (this.objectCollided(obj1.x, obj1.y, obj1.r, obj2.x, obj2.y, obj2.r)) {
					obj1.isColliding = true;
					obj2.isColliding = true;

					let vecCollision = { x: obj2.x - obj1.x, y: obj2.y - obj1.y };
					let distance = this.getDistance(obj1.x, obj1.y, obj2.x, obj2.y);

					let vecCollisionNorm = { x: vecCollision.x / distance, y: vecCollision.y / distance };
					let vRelativeVelocity = { x: obj1.vx - obj2.vx, y: obj1.vy - obj2.vy };
					let speed = vRelativeVelocity.x * vecCollisionNorm.x + vRelativeVelocity.y * vecCollisionNorm.y;

					let impulse = 1.5 * speed / (obj1.mass + obj2.mass);

					if (speed < 0) break;
					obj1.vx -= impulse * obj2.mass * vecCollisionNorm.x;
					obj1.vy -= impulse * obj2.mass * vecCollisionNorm.y;
					obj2.vx += impulse * obj1.mass * vecCollisionNorm.x;
					obj2.vy += impulse * obj1.mass * vecCollisionNorm.y;
				}
				i++;
			}
		}
	}

	genRandomNumber(min, max, f) {
		if (!f) f = 1;
		max *= f;
		min *= f;
		return Math.floor(Math.random() * (max - min + 1) + min) / f;
	}

	getDistance(x1, y1, x2, y2) {
		return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
	}

	objectCollided(x1, y1, r1, x2, y2, r2) {
		let distance = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
		return distance <= (r1 + r2) * (r1 + r2);
	}

	clearCanvas() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}
}

const gameWorld = new _Engine({
	canvas: '#canvas',
	radius: 10,
	objects: 20,
	contained: {
		x: true,
		y: true
	}
});