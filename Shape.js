class Shape {
  constructor(x, y, size, seed) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-1.2, 1.2), random(-1.2, 1.2));
    this.acc = createVector(0, 0);
    this.size = size || random(30, 100);
    this.baseSize = this.size; // 원래 크기 저장
    
    // 물리적 특성
    this.maxSpeed = 3.5;
    this.maxForce = 0.3;
    this.mass = random(0.8, 2.5);
    
    // 형태 속성
    this.seed = seed || random(1000); // 노이즈 시드
    this.type = floor(random(6)); // 0: 유기적 형태, 1: 기하학적 형태, 2: 방사형, 3: 분열형, 4: 흐름형, 5: 혼합형
    this.vertices = [];
    this.vertexCount = floor(random(3, 12));
    this.generateVertices(); // 꼭지점 생성
    
    // 형태 변형 관련 변수
    this.morphSpeed = random(0.005, 0.02);
    this.morphAmount = 0;
    this.morphState = 0; // 변형 상태 (0-1)
    this.growFactor = 1;
    this.pulseRate = random(0.01, 0.05);
    this.deformStrength = random(0.2, 0.8);
    
    // 색상 - 다양한 팔레트
    const palettes = [
      [color(255, 70, 60), color(60, 180, 255), color(255, 220, 40), color(180, 255, 120)], // 밝은 색상
      [color(20, 40, 90), color(80, 140, 190), color(140, 20, 70), color(50, 100, 70)], // 어두운 색상
      [color(255, 120, 80), color(80, 210, 160), color(120, 90, 240), color(240, 210, 90)] // 중간 색상
    ];
    
    const selectedPalette = random(palettes);
    this.fillColor = random(selectedPalette);
    this.strokeColor = random(selectedPalette);
    this.secondColor = random(selectedPalette); // 추가 색상 (그라디언트/변형용)
    this.opacity = random(150, 220);
    this.colorChangeRate = random(0.001, 0.01); // 색상 변화 속도
    this.colorPhase = random(TWO_PI);
    
    // 음악적 특성 (더 다양하고 개성 있는 사운드를 위한 특성들)
    this.frequency = map(this.size, 30, 100, 180, 1200); // 크기에 따른 주파수 범위 확장
    this.baseFrequency = this.frequency; // 기본 주파수 저장
    this.note = floor(map(this.frequency, 180, 1200, 36, 84)); // MIDI 노트 범위 확장
    this.timbre = random(0, 1); // 음색 특성 (0: 부드러움, 1: 거침)
    this.harmonics = floor(random(1, 6)); // 하모닉스 수
    this.envelope = {
      attack: random(0.01, 0.5),
      decay: random(0.1, 1.0),
      sustain: random(0.3, 0.8),
      release: random(0.5, 3.0)
    };
    
    // 움직임 특성
    this.oscillationRate = random(0.01, 0.05);
    this.phase = random(TWO_PI);
    this.noiseOffset = random(1000);
    this.spin = random(-0.02, 0.02); // 회전 속도
    
    // 이력 및 추적
    this.history = []; // 이동 경로
    this.historyLength = floor(random(10, 30)); // 경로 길이
    this.childParticles = []; // 자식 파티클
    
    // 생명주기 (더 오래 지속되도록 변경)
    this.lifespan = 2000;
    this.fadeRate = random(0.05, 0.2);
    
    // 스타일 특성
    this.strokeWeight = random(0.5, 5);
    this.rotation = random(TWO_PI);
    this.rotationSpeed = random(-0.03, 0.03);
    this.blendMode = random([BLEND, OVERLAY, SCREEN, MULTIPLY]);
    
    // 상호작용 요소
    this.interactionForce = 0; // 사용자 상호작용으로 인한 힘
    this.lastInteraction = 0; // 마지막 상호작용 시간
    
    // 물리적 시뮬레이션 매개변수
    this.springFactor = random(0.001, 0.01);
    this.damping = random(0.92, 0.98);
    this.turbulence = random(0.2, 1.5);
    
    // 사운드 상호작용 매개변수
    this.soundResponseIntensity = random(0.5, 2.0);
    this.soundTriggered = false; 
    this.lastSoundTime = 0;
  }
  
  // 꼭지점 생성 - 형태의 기본 구조 정의
  generateVertices() {
    this.vertices = [];
    
    switch(this.type) {
      case 0: // 유기적 형태 (불규칙한 곡선)
        for (let i = 0; i < this.vertexCount; i++) {
          let angle = map(i, 0, this.vertexCount, 0, TWO_PI);
          let radius = this.size/2 * (0.6 + 0.4 * noise(this.seed + i * 0.3));
          let x = cos(angle) * radius;
          let y = sin(angle) * radius;
          this.vertices.push(createVector(x, y));
        }
        break;
        
      case 1: // 기하학적 형태 (다각형)
        for (let i = 0; i < this.vertexCount; i++) {
          let angle = map(i, 0, this.vertexCount, 0, TWO_PI);
          let radius = this.size/2 * (0.8 + 0.2 * sin(angle * 2));
          let x = cos(angle) * radius;
          let y = sin(angle) * radius;
          this.vertices.push(createVector(x, y));
        }
        break;
        
      case 2: // 방사형 (꽃 모양)
        let petalCount = floor(random(3, 8));
        for (let i = 0; i < this.vertexCount; i++) {
          let angle = map(i, 0, this.vertexCount, 0, TWO_PI);
          let radius = this.size/2 * (0.4 + 0.6 * abs(sin(angle * petalCount)));
          let x = cos(angle) * radius;
          let y = sin(angle) * radius;
          this.vertices.push(createVector(x, y));
        }
        break;
        
      case 3: // 분열형 (프랙탈 형태)
        for (let i = 0; i < this.vertexCount; i++) {
          let angle = map(i, 0, this.vertexCount, 0, TWO_PI);
          let noiseFactor = noise(this.seed + cos(angle), this.seed + sin(angle));
          let radius = this.size/2 * (0.5 + 0.5 * noiseFactor);
          let x = cos(angle) * radius;
          let y = sin(angle) * radius;
          this.vertices.push(createVector(x, y));
        }
        break;
        
      case 4: // 흐름형 (물결 형태)
        for (let i = 0; i < this.vertexCount; i++) {
          let angle = map(i, 0, this.vertexCount, 0, TWO_PI);
          let waveHeight = sin(angle * 3) * 0.3 + sin(angle * 5) * 0.2;
          let radius = this.size/2 * (0.7 + waveHeight);
          let x = cos(angle) * radius;
          let y = sin(angle) * radius;
          this.vertices.push(createVector(x, y));
        }
        break;
        
      case 5: // 혼합형
        for (let i = 0; i < this.vertexCount; i++) {
          let angle = map(i, 0, this.vertexCount, 0, TWO_PI);
          let noiseVal = noise(this.seed + i * 0.2);
          let radius = this.size/2 * (0.6 + 0.4 * noiseVal * sin(angle * noiseVal * 8));
          let x = cos(angle) * radius;
          let y = sin(angle) * radius;
          this.vertices.push(createVector(x, y));
        }
        break;
    }
  }
  
  // 물리적 힘 적용
  applyForce(force) {
    let f = p5.Vector.div(force, this.mass); // 질량에 따른 힘 적용
    this.acc.add(f);
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
  
  // 동적 움직임 생성
  applyBehaviors() {
    // 복잡한 진동 효과
    let timeVal = frameCount * 0.01;
    let noiseVal = noise(this.pos.x * 0.005, this.pos.y * 0.005, timeVal + this.seed);
    let angle = map(noiseVal, 0, 1, 0, TWO_PI);
    
    // 난류 효과 적용
    let turbulenceForce = p5.Vector.fromAngle(angle);
    turbulenceForce.mult(this.turbulence * noiseVal);
    this.applyForce(turbulenceForce);
    
    // 사용자 인터랙션 반응
    if (millis() - this.lastInteraction < 2000) {
      let interactionForce = createVector(
        cos(this.interactionForce) * sin(timeVal) * 0.3,
        sin(this.interactionForce) * cos(timeVal) * 0.3
      );
      this.applyForce(interactionForce);
    }
    
    // 다른 모양과의 상호작용 (여기서는 예시만 포함)
    if (this.soundTriggered) {
      let pulseForce = p5.Vector.random2D();
      pulseForce.mult(0.5);
      this.applyForce(pulseForce);
      
      if (millis() - this.lastSoundTime > 500) {
        this.soundTriggered = false;
      }
    }
  }
  
  // 형태 변형 - 시간에 따른 동적 변화
  morph() {
    // 형태 변형 진행
    this.morphState += this.morphSpeed;
    if (this.morphState > 1) this.morphState = 0;
    
    // 크기 맥동 효과
    this.growFactor = 1 + sin(frameCount * this.pulseRate) * 0.2;
    
    // 색상 변화
    this.colorPhase += this.colorChangeRate;
    
    // 음악적 특성 업데이트 - 형태 변화에 따른 주파수 변조
    this.frequency = this.baseFrequency * (0.8 + 0.4 * sin(this.morphState * PI));
    
    // 꼭지점 변형
    for (let i = 0; i < this.vertices.length; i++) {
      let vertex = this.vertices[i];
      let angle = map(i, 0, this.vertices.length, 0, TWO_PI);
      
      // 고유한 노이즈 값으로 꼭지점 변형
      let noiseVal = noise(
        this.seed + cos(angle) + frameCount * this.morphSpeed * 0.1, 
        this.seed + sin(angle) + frameCount * this.morphSpeed * 0.1
      );
      
      // 변형 방향 계산
      let dir = createVector(cos(angle), sin(angle));
      
      // 원래 위치에서 변형
      let baseRadius;
      switch(this.type) {
        case 0: // 유기적 형태
          baseRadius = this.size/2 * (0.6 + 0.4 * noise(this.seed + i * 0.3 + this.morphState));
          break;
        case 1: // 기하학적 형태
          baseRadius = this.size/2 * (0.8 + 0.2 * sin(angle * 2 + this.morphState * PI));
          break;
        case 2: // 방사형
          let petalCount = floor(3 + noise(this.seed) * 5);
          baseRadius = this.size/2 * (0.4 + 0.6 * abs(sin(angle * petalCount + this.morphState * PI)));
          break;
        case 3: // 분열형
          baseRadius = this.size/2 * (0.5 + 0.5 * noise(this.seed + cos(angle + this.morphState), this.seed + sin(angle + this.morphState)));
          break;
        case 4: // 흐름형
          let waveHeight = sin(angle * 3 + this.morphState * PI) * 0.3 + sin(angle * 5 + this.morphState * PI * 2) * 0.2;
          baseRadius = this.size/2 * (0.7 + waveHeight);
          break;
        case 5: // 혼합형
          let mixNoise = noise(this.seed + i * 0.2 + this.morphState);
          baseRadius = this.size/2 * (0.6 + 0.4 * mixNoise * sin(angle * mixNoise * 8 + this.morphState * PI));
          break;
        default:
          baseRadius = this.size/2;
      }
      
      // 변형된 반경에 맥동 효과 적용
      let radius = baseRadius * this.growFactor;
      
      // 난류 효과로 약간의 무작위성 추가
      radius += this.deformStrength * noise(this.seed + i * 0.5 + frameCount * 0.02) * 15;
      
      // 꼭지점 위치 업데이트
      vertex.x = dir.x * radius;
      vertex.y = dir.y * radius;
    }
  }
  
  update() {
    // 가속도 기반 물리 시뮬레이션
    this.vel.add(this.acc);
    this.vel.mult(this.damping); // 감쇠 적용
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // 회전 업데이트
    this.rotation += this.rotationSpeed;
    
    // 이동 경로 기록
    if (frameCount % 3 === 0 && this.history.length < this.historyLength) {
      this.history.push(createVector(this.pos.x, this.pos.y));
    }
    if (this.history.length > this.historyLength) {
      this.history.shift();
    }
    
    // 동적 행동 적용
    this.applyBehaviors();
    
    // 형태 변형
    this.morph();
    
    // 생명주기 관리 - 천천히 사라지는 효과
    this.lifespan -= this.fadeRate;
    
    // 화면 가장자리에서 반사
    this.checkEdges();
    
    // 랜덤하게 자식 파티클 생성
    if (random(1) < 0.02 && this.childParticles.length < 5) {
      this.spawnChildParticle();
    }
    
    // 자식 파티클 업데이트
    for (let i = this.childParticles.length - 1; i >= 0; i--) {
      let particle = this.childParticles[i];
      particle.update();
      
      if (particle.isDead()) {
        this.childParticles.splice(i, 1);
      }
    }
  }
  
  // 작은 자식 파티클 생성
  spawnChildParticle() {
    let offset = p5.Vector.random2D().mult(this.size * 0.3);
    let pos = p5.Vector.add(this.pos, offset);
    let velocity = p5.Vector.random2D().mult(random(0.5, 2));
    
    this.childParticles.push({
      pos: pos,
      vel: velocity,
      size: random(3, 8),
      color: this.fillColor,
      life: 100,
      
      update: function() {
        this.pos.add(this.vel);
        this.vel.mult(0.95);
        this.life -= 2;
      },
      
      display: function() {
        push();
        fill(red(this.color), green(this.color), blue(this.color), this.life);
        noStroke();
        ellipse(this.pos.x, this.pos.y, this.size, this.size);
        pop();
      },
      
      isDead: function() {
        return this.life <= 0;
      }
    });
  }
  
  // 물리적 현실감 있는 반사 효과
  checkEdges() {
    const buffer = 50;
    let bounced = false;
    
    if (this.pos.x < buffer) {
      this.pos.x = buffer;
      this.vel.x *= -0.7;
      bounced = true;
    } else if (this.pos.x > width - buffer) {
      this.pos.x = width - buffer;
      this.vel.x *= -0.7;
      bounced = true;
    }
    
    if (this.pos.y < buffer) {
      this.pos.y = buffer;
      this.vel.y *= -0.7;
      bounced = true;
    } else if (this.pos.y > height - buffer) {
      this.pos.y = height - buffer;
      this.vel.y *= -0.7;
      bounced = true;
    }
    
    // 충돌 시 형태 변형 및 사운드 트리거
    if (bounced) {
      // 충돌로 인한 형태 변형 - 일시적 변화
      this.deformStrength *= 1.5; // 변형 강도 일시적 증가
      this.rotationSpeed *= 1.2; // 회전 속도 일시적 증가
      
      // 충돌시 소리 변화 트리거
      this.soundTriggered = true;
      this.lastSoundTime = millis();
      
      // 충돌시 자식 파티클 생성
      for (let i = 0; i < 3; i++) {
        this.spawnChildParticle();
      }
      
      // 점진적으로 원래 상태로 회복
      setTimeout(() => {
        this.deformStrength /= 1.5;
        this.rotationSpeed /= 1.2;
      }, 500);
    }
  }
  
  // 사용자 인터랙션 처리
  interact(x, y, intensity) {
    let distance = dist(this.pos.x, this.pos.y, x, y);
    let maxDistance = 200;
    
    if (distance < maxDistance) {
      // 거리에 따른 영향력 계산
      let force = map(distance, 0, maxDistance, intensity, 0);
      
      // 마우스로부터 멀어지는 방향으로 힘 적용
      let repel = p5.Vector.sub(this.pos, createVector(x, y));
      repel.normalize();
      repel.mult(force);
      this.applyForce(repel);
      
      // 인터랙션 상태 기록
      this.interactionForce = atan2(repel.y, repel.x);
      this.lastInteraction = millis();
      
      // 형태에 일시적 변화 추가
      this.deformStrength *= 1.2;
      
      // 원래 상태로 되돌리기
      setTimeout(() => {
        this.deformStrength /= 1.2;
      }, 300);
      
      return true; // 인터랙션 발생
    }
    return false; // 인터랙션 없음
  }
  
  display() {
    // 투명도 계산 (생명주기에 따라 천천히 변함)
    let alpha = map(this.lifespan, 0, 2000, 0, this.opacity);
    
    // 이동 경로 표시 (흔적)
    if (this.history.length > 1) {
      push();
      noFill();
      beginShape();
      for (let i = 0; i < this.history.length; i++) {
        let historyAlpha = map(i, 0, this.history.length, 30, 100);
        stroke(red(this.strokeColor), green(this.strokeColor), blue(this.strokeColor), historyAlpha);
        strokeWeight(map(i, 0, this.history.length, 0.5, this.strokeWeight));
        curveVertex(this.history[i].x, this.history[i].y);
      }
      endShape();
      pop();
    }
    
    // 자식 파티클 표시
    this.childParticles.forEach(particle => {
      particle.display();
    });
    
    // 메인 형태 표시
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotation);
    
    // 블렌드 모드 설정
    blendMode(this.blendMode);
    
    // 색상 진동 효과
    let colorPhaseEffect = sin(this.colorPhase);
    let r = red(this.fillColor) + colorPhaseEffect * 20;
    let g = green(this.fillColor) + colorPhaseEffect * 20;
    let b = blue(this.fillColor) + colorPhaseEffect * 20;
    let fillAlpha = alpha * 0.7;
    
    if (this.soundTriggered) {
      // 소리 반응 시 색상 강화
      r = constrain(r + 40, 0, 255);
      g = constrain(g + 40, 0, 255);
      b = constrain(b + 40, 0, 255);
      fillAlpha *= 1.3;
    }
    
    // 도형 스타일 설정
    strokeWeight(this.strokeWeight + sin(frameCount * 0.05) * 0.5);
    stroke(red(this.strokeColor), green(this.strokeColor), blue(this.strokeColor), alpha);
    fill(r, g, b, fillAlpha);
    
    // 도형 타입에 따른 렌더링
    switch (this.type) {
      case 0: // 유기적 형태
        this.renderOrganicShape(alpha);
        break;
      
      case 1: // 기하학적 형태
        this.renderGeometricShape(alpha);
        break;
      
      case 2: // 방사형
        this.renderRadialShape(alpha);
        break;
      
      case 3: // 분열형
        this.renderFractalShape(alpha);
        break;
      
      case 4: // 흐름형
        this.renderFlowingShape(alpha);
        break;
      
      case 5: // 혼합형
        this.renderHybridShape(alpha);
        break;
    }
    
    // 복합 효과 - 서브 레이어 추가
    if (random(1) < 0.3) {
      push();
      blendMode(OVERLAY);
      noFill();
      stroke(r, g, b, alpha * 0.5);
      strokeWeight(1);
      this.drawNoisyCircle(0, 0, this.size * 0.6);
      pop();
    }
    
    pop();
  }
  
  // 형태별 렌더링 메서드
  renderOrganicShape(alpha) {
    // 유기적 곡선형 경로로 그리기
    beginShape();
    for (let i = 0; i <= this.vertices.length; i++) {
      let idx = i % this.vertices.length;
      let v = this.vertices[idx];
      curveVertex(v.x, v.y);
    }
    endShape(CLOSE);
    
    // 내부에 보조 형태
    noFill();
    beginShape();
    for (let i = 0; i < this.vertices.length; i++) {
      let v = this.vertices[i];
      curveVertex(v.x * 0.6, v.y * 0.6);
    }
    endShape(CLOSE);
  }
  
  renderGeometricShape(alpha) {
    // 정확한 다각형으로 그리기
    beginShape();
    for (let v of this.vertices) {
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
    
    // 중심점에서 꼭지점까지 선
    for (let i = 0; i < this.vertices.length; i += 2) {
      let v = this.vertices[i];
      line(0, 0, v.x, v.y);
    }
  }
  
  renderRadialShape(alpha) {
    // 꽃 모양의 방사형 패턴
    beginShape();
    for (let v of this.vertices) {
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
    
    // 중심으로부터 패턴
    push();
    fill(red(this.secondColor), green(this.secondColor), blue(this.secondColor), alpha * 0.6);
    let innerSize = this.size * 0.4;
    ellipse(0, 0, innerSize, innerSize);
    pop();
    
    // 방사형 선
    push();
    stroke(red(this.strokeColor), green(this.strokeColor), blue(this.strokeColor), alpha * 0.7);
    strokeWeight(this.strokeWeight * 0.5);
    let petalCount = floor(this.vertices.length / 2);
    for (let i = 0; i < petalCount; i++) {
      let angle = map(i, 0, petalCount, 0, TWO_PI);
      line(0, 0, cos(angle) * this.size * 0.6, sin(angle) * this.size * 0.6);
    }
    pop();
  }
  
  renderFractalShape(alpha) {
    // 프랙탈 모양 - 재귀적 분열 패턴
    beginShape();
    for (let v of this.vertices) {
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
    
    // 더 작은 내부 반복
    push();
    scale(0.6);
    stroke(red(this.secondColor), green(this.secondColor), blue(this.secondColor), alpha * 0.7);
    beginShape();
    for (let v of this.vertices) {
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
    pop();
    
    // 내부에 또 다른 작은 반복
    push();
    scale(0.3);
    rotate(this.rotation * 2);
    stroke(red(this.fillColor), green(this.fillColor), blue(this.fillColor), alpha * 0.8);
    beginShape();
    for (let v of this.vertices) {
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
    pop();
  }
  
  renderFlowingShape(alpha) {
    // 부드럽게 흐르는 물결 모양
    beginShape();
    for (let i = 0; i <= this.vertices.length; i++) {
      let idx = i % this.vertices.length;
      let v = this.vertices[idx];
      curveVertex(v.x, v.y);
    }
    endShape(CLOSE);
    
    // 내부에 흐르는 선
    push();
    noFill();
    stroke(red(this.secondColor), green(this.secondColor), blue(this.secondColor), alpha * 0.8);
    strokeWeight(this.strokeWeight * 0.7);
    
    beginShape();
    for (let i = 0; i < 12; i++) {
      let angle = map(i, 0, 12, 0, TWO_PI);
      let radius = this.size * 0.3 * (0.8 + 0.2 * sin(angle * 4 + frameCount * 0.05));
      curveVertex(cos(angle) * radius, sin(angle) * radius);
    }
    endShape(CLOSE);
    pop();
  }
  
  renderHybridShape(alpha) {
    // 여러 요소를 혼합한 복합적 형태
    beginShape();
    for (let v of this.vertices) {
      vertex(v.x, v.y);
    }
    endShape(CLOSE);
    
    // 다양한 내부 요소들
    push();
    fill(red(this.secondColor), green(this.secondColor), blue(this.secondColor), alpha * 0.6);
    rotate(this.rotation * -0.5);
    rectMode(CENTER);
    rect(0, 0, this.size * 0.4, this.size * 0.4);
    pop();
    
    push();
    noFill();
    stroke(red(this.strokeColor), green(this.strokeColor), blue(this.strokeColor), alpha * 0.7);
    
    // 진동하는 동심원
    for (let i = 1; i < 3; i++) {
      let radius = this.size * 0.2 * i + sin(frameCount * 0.05 + i) * 5;
      this.drawNoisyCircle(0, 0, radius);
    }
    pop();
  }
  
  // 노이즈를 이용한 불규칙한 원 그리기 (유틸리티 메서드)
  drawNoisyCircle(x, y, radius) {
    beginShape();
    for (let a = 0; a < TWO_PI; a += 0.1) {
      let xoff = map(cos(a + this.phase), -1, 1, 0, 1);
      let yoff = map(sin(a + this.phase), -1, 1, 0, 1);
      let r = radius + map(noise(xoff, yoff, frameCount * 0.01), 0, 1, -5, 5);
      let px = x + cos(a) * r;
      let py = y + sin(a) * r;
      vertex(px, py);
    }
    endShape(CLOSE);
  }
  
  isDead() {
    return this.lifespan < 0;
  }
  
  // 객체의 상태에 따른 소리 특성 반환 - 형태와 움직임이 사운드에 직접 영향
  getSoundProperties() {
    // 현재 도형의 상태에 따른 동적 속성 계산
    const morphEffect = sin(this.morphState * TWO_PI); // 형태 변형 효과 (-1 ~ 1)
    const velocityMag = this.vel.mag();
    const normalizedSize = map(this.size * this.growFactor, 30, 150, 0, 1);
    const vertexComplexity = map(this.vertices.length, 3, 12, 0, 1);
    const activityLevel = map(velocityMag, 0, this.maxSpeed, 0, 1) + 
                           abs(this.rotationSpeed) * 10 +
                           this.deformStrength;
    
    // 도형 타입별 특성 반영
    let typeModifier = 0;
    switch(this.type) {
      case 0: typeModifier = 0; break;    // 유기적 - 낮은 톤
      case 1: typeModifier = 0.2; break;  // 기하학적 - 중간 낮은 톤
      case 2: typeModifier = 0.4; break;  // 방사형 - 중간 톤
      case 3: typeModifier = 0.6; break;  // 분열형 - 중간 높은 톤
      case 4: typeModifier = 0.8; break;  // 흐름형 - 높은 톤
      case 5: typeModifier = 1.0; break;  // 혼합형 - 가장 높은 톤
    }
    
    // 도형의 현재 상태에 따라 사운드가 어떻게 생성될지 결정하는 속성들
    return {
      // 기본 음악적 속성
      note: this.note + floor(morphEffect * 5), // 형태 변형에 따른 음높이 변화
      octave: floor(map(this.size, 30, 100, 3, 5)), // 크기에 따른 옥타브
      
      // 강도 및 타이밍 관련 속성
      velocity: map(velocityMag, 0, this.maxSpeed, 0.3, 0.9), // 속도에 따른 볼륨
      attack: this.envelope.attack,
      decay: this.envelope.decay,
      sustain: this.envelope.sustain,
      release: this.envelope.release,
      
      // 공간감 속성
      pan: map(this.pos.x, 0, width, -0.8, 0.8),
      
      // 음색 및 조절 관련 속성
      frequency: this.frequency * (1 + morphEffect * 0.2), // 형태 변형에 따른 주파수 변화
      harmonics: this.harmonics,
      timbre: this.timbre + normalizedSize * 0.3, // 크기에 따른 음색 변화
      
      // 변조 효과 관련 속성
      modulation: map(this.pos.y, 0, height, 200, 2000) * (1 + activityLevel * 0.5),
      modIndex: map(activityLevel, 0, 3, 1, 10), // 활동량에 따른 모듈레이션 인덱스
      
      // 필터 및 이펙트 관련 속성
      filterFreq: map(normalizedSize, 0, 1, 300, 5000) * (1 + typeModifier),
      resonance: map(this.deformStrength, 0.2, 0.8, 1, 10),
      distortion: map(activityLevel, 0, 3, 0, 0.5),
      
      // 시퀀싱 및 리듬 관련 속성
      rhythmValue: floor(map(this.vertices.length, 3, 12, 1, 16)), // 꼭지점 수에 따른 리듬 값
      beatPattern: this.type, // 타입별 다른 비트 패턴
      
      // 상태 플래그
      isColliding: this.soundTriggered,
      activeLevel: activityLevel,
      shapeType: this.type,
      vertexComplexity: vertexComplexity,
      
      // 컨트롤러를 위한 정규화된 값 (0-1)
      normSize: normalizedSize,
      normSpeed: map(velocityMag, 0, this.maxSpeed, 0, 1),
      normDeform: map(this.deformStrength, 0.2, 0.8, 0, 1),
      typeRatio: typeModifier
    };
  }
}
