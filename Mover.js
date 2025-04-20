class Mover {
  constructor(x, y, mass) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.mass = mass;
    this.radius = mass * 10;
    this.color = color(255, 255, 255, 150);
    
    // 파티클 시스템을 위한 추가 속성
    this.trail = [];
    this.trailLength = 20;
    this.life = 255;
    this.maxLife = 255;
    this.lifeReduction = random(0.8, 2.5);
  }

  // 힘 적용
  applyForce(force) {
    let f = p5.Vector.div(force, this.mass);
    this.acc.add(f);
  }

  // 경계 내에서 유지
  checkEdges() {
    if (this.pos.x > width - this.radius) {
      this.pos.x = width - this.radius;
      this.vel.x *= -0.8;
    } else if (this.pos.x < this.radius) {
      this.pos.x = this.radius;
      this.vel.x *= -0.8;
    }
    
    if (this.pos.y > height - this.radius) {
      this.pos.y = height - this.radius;
      this.vel.y *= -0.8;
    } else if (this.pos.y < this.radius) {
      this.pos.y = this.radius;
      this.vel.y *= -0.8;
    }
  }

  // 업데이트 로직
  update(speedFactor = 1) {
    // 속도 업데이트
    this.vel.add(this.acc);
    this.vel.mult(speedFactor);
    this.vel.limit(10 * speedFactor); // 최대 속도 제한
    
    // 위치 업데이트
    this.pos.add(this.vel);
    
    // 가속도 초기화
    this.acc.mult(0);
    
    // 트레일 추가
    if (frameCount % 2 === 0) {
      this.trail.push(createVector(this.pos.x, this.pos.y));
      if (this.trail.length > this.trailLength) {
        this.trail.shift();
      }
    }
    
    // 생명력 감소
    this.life -= this.lifeReduction;
  }

  // 그리기
  display(alpha = 255) {
    // 트레일 그리기
    this.drawTrail();
    
    // 메인 원 그리기
    noStroke();
    let c = this.color;
    fill(red(c), green(c), blue(c), alpha);
    ellipse(this.pos.x, this.pos.y, this.radius * 2, this.radius * 2);
  }
  
  // 트레일 그리기
  drawTrail() {
    noFill();
    strokeWeight(this.radius);
    
    let c = this.color;
    
    beginShape();
    for (let i = 0; i < this.trail.length; i++) {
      let alpha = map(i, 0, this.trail.length, 0, 150);
      stroke(red(c), green(c), blue(c), alpha);
      vertex(this.trail[i].x, this.trail[i].y);
    }
    endShape();
  }
  
  // 색상 변경
  changeColor(newColor) {
    this.color = newColor;
  }
  
  // 질량과 반지름 변경
  changeMass(newMass) {
    this.mass = newMass;
    this.radius = newMass * 10;
  }
  
  // 생명력 확인
  isDead() {
    return this.life < 0;
  }
}
