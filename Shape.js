class Shape {
  constructor(x, y, size) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-0.3, 0.3), random(-0.3, 0.3));
    this.acc = createVector(0, 0);
    this.size = size || random(20, 80);
    this.maxSpeed = 0.8;
    this.maxForce = 0.05;
    this.type = floor(random(5)); // 0: 원, 1: 삼각형, 2: 사각형, 3: 선, 4: 아치
    
    // 색상 - 칸딘스키 팔레트 (원색과 대비색 위주)
    const palettes = [
      [color(255, 0, 0), color(0, 0, 255), color(255, 255, 0)], // 빨강, 파랑, 노랑
      [color(0, 0, 0), color(255), color(128)], // 흑백 계열
      [color(255, 165, 0), color(75, 0, 130), color(238, 130, 238)] // 오렌지, 남색, 보라
    ];
    
    const selectedPalette = random(palettes);
    this.fillColor = random(selectedPalette);
    this.strokeColor = random(selectedPalette);
    this.opacity = random(150, 220);
    
    // 음악적 특성
    this.frequency = map(this.size, 20, 80, 220, 880); // 크기에 따른 주파수
    this.note = floor(map(this.frequency, 220, 880, 48, 72)); // MIDI 노트
    
    // 움직임 특성
    this.oscillationRate = random(0.01, 0.05);
    this.phase = random(TWO_PI);
    this.sinOffset = random(100);
    
    // 생명주기
    this.lifespan = 1000;
    this.fadeRate = random(0.1, 0.3);
    
    // 스타일 특성
    this.strokeWeight = random(0.5, 3);
    this.rotation = random(TWO_PI);
    this.rotationSpeed = random(-0.01, 0.01);
  }
  
  applyForce(force) {
    this.acc.add(force);
  }
  
  // 특정 지점으로 부드럽게 이동 (느린 속도로)
  seek(target) {
    let desired = p5.Vector.sub(target, this.pos);
    let distance = desired.mag();
    
    if (distance < 100) {
      // 목표에 가까우면 속도 줄임
      let speed = map(distance, 0, 100, 0, this.maxSpeed);
      desired.setMag(speed);
    } else {
      desired.setMag(this.maxSpeed);
    }
    
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    this.applyForce(steer);
  }
  
  separate(shapes) {
    let desiredSeparation = this.size * 1.5;
    let sum = createVector();
    let count = 0;
    
    for (let other of shapes) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if ((d > 0) && (d < desiredSeparation)) {
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.normalize();
        diff.div(d); // 거리에 반비례하는 힘
        sum.add(diff);
        count++;
      }
    }
    
    if (count > 0) {
      sum.div(count);
      sum.setMag(this.maxSpeed);
      let steer = p5.Vector.sub(sum, this.vel);
      steer.limit(this.maxForce);
      this.applyForce(steer);
    }
  }
  
  // 느린 진동 움직임
  oscillate() {
    // 위치에 따른 미세한 진동 효과
    let noiseVal = noise(this.pos.x * 0.01, this.pos.y * 0.01, frameCount * 0.01);
    let angle = map(noiseVal, 0, 1, 0, TWO_PI);
    let force = p5.Vector.fromAngle(angle);
    force.mult(0.05);
    this.applyForce(force);
  }
  
  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // 회전 업데이트
    this.rotation += this.rotationSpeed;
    
    // 생명주기 관리
    this.lifespan -= this.fadeRate;
    
    // 화면 가장자리에서 반사
    this.checkEdges();
  }
  
  // 부드러운 반사 효과
  checkEdges() {
    const buffer = 50;
    
    if (this.pos.x < buffer) {
      this.pos.x = buffer;
      this.vel.x *= -0.5;
    } else if (this.pos.x > width - buffer) {
      this.pos.x = width - buffer;
      this.vel.x *= -0.5;
    }
    
    if (this.pos.y < buffer) {
      this.pos.y = buffer;
      this.vel.y *= -0.5;
    } else if (this.pos.y > height - buffer) {
      this.pos.y = height - buffer;
      this.vel.y *= -0.5;
    }
  }
  
  display() {
    // 투명도 계산 (생명주기에 따라 천천히 변함)
    let alpha = map(this.lifespan, 0, 1000, 0, this.opacity);
    
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotation);
    
    noFill();
    strokeWeight(this.strokeWeight);
    stroke(red(this.strokeColor), green(this.strokeColor), blue(this.strokeColor), alpha);
    
    // 칸딘스키 스타일의 기본 도형들
    switch (this.type) {
      case 0: // 원
        fill(red(this.fillColor), green(this.fillColor), blue(this.fillColor), alpha * 0.7);
        ellipse(0, 0, this.size, this.size);
        // 중심에 작은 점
        fill(red(this.strokeColor), green(this.strokeColor), blue(this.strokeColor), alpha);
        ellipse(0, 0, this.size * 0.2, this.size * 0.2);
        break;
      
      case 1: // 삼각형
        fill(red(this.fillColor), green(this.fillColor), blue(this.fillColor), alpha * 0.5);
        triangle(0, -this.size/2, this.size/2, this.size/2, -this.size/2, this.size/2);
        break;
      
      case 2: // 사각형
        fill(red(this.fillColor), green(this.fillColor), blue(this.fillColor), alpha * 0.6);
        rectMode(CENTER);
        rect(0, 0, this.size, this.size);
        // 대각선
        line(-this.size/2, -this.size/2, this.size/2, this.size/2);
        break;
      
      case 3: // 선 번들
        for (let i = 0; i < 3; i++) {
          let offset = map(i, 0, 2, -this.size/3, this.size/3);
          line(-this.size/2, offset, this.size/2, offset);
        }
        break;
      
      case 4: // 아치
        fill(red(this.fillColor), green(this.fillColor), blue(this.fillColor), alpha * 0.4);
        arc(0, 0, this.size, this.size, 0, PI);
        break;
    }
    
    pop();
  }
  
  isDead() {
    return this.lifespan < 0;
  }
  
  // 객체의 상태에 따른 소리 특성 반환
  getSoundProperties() {
    return {
      note: this.note,
      velocity: map(this.vel.mag(), 0, this.maxSpeed, 0.2, 0.8),
      pan: map(this.pos.x, 0, width, -1, 1),
      frequency: this.frequency,
      modulation: map(this.pos.y, 0, height, 0, 1000),
      filterFreq: map(this.size, 20, 80, 500, 5000)
    };
  }
}
