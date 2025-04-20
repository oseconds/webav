// 전역 변수
let shapes = []; // Shape 객체 배열
let forces = []; // 물리적 힘 필드 포인트
let speedSlider, densitySlider, toneSlider;
let prevSpeedVal = 50;
let prevDensityVal = 50;
let prevToneVal = 50;
let backgroundHue = 10; // 배경색 기본값 (어두운 톤)
let canvas;
let firstInteraction = false; // 첫 인터랙션 감지
let introText = true; // 인트로 텍스트 표시 여부
let forceDisplay = true; // 힘 장 표시 여부
let connectionLines = true; // 객체간 연결선 표시 여부
let userInteractionPos; // 사용자 최근 인터랙션 위치
let lastInteractionTime = 0; // 마지막 인터랙션 시간
let debugMode = false; // 디버그 모드

// p5.js setup 함수
function setup() {
  console.log("p5.js setup 시작");
  
  try {
    // 캔버스 생성 및 설정
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    
    colorMode(HSB, 360, 100, 100, 100);
    background(backgroundHue, 15, 15); // 어두운 배경
    
    // 슬라이더 연결 - DOM 요소가 로드되었는지 확인
    try {
      speedSlider = select('#speed-slider');
      densitySlider = select('#density-slider');
      toneSlider = select('#tone-slider');
      console.log("슬라이더 연결됨:", speedSlider ? "O" : "X", densitySlider ? "O" : "X", toneSlider ? "O" : "X");
    } catch (error) {
      console.error("슬라이더 연결 오류:", error);
    }
    
    // 힘 장(Force Field) 포인트 생성 - 객체 움직임에 영향을 주는 요소
    const forceCount = 8;
    for (let i = 0; i < forceCount; i++) {
      let x = random(width * 0.1, width * 0.9);
      let y = random(height * 0.1, height * 0.9);
      let strength = random(-1, 1); // 음수: 척력, 양수: 인력
      let radius = random(50, 200);
      
      forces.push({
        pos: createVector(x, y),
        strength: strength,
        radius: radius,
        angle: random(TWO_PI), // 회전 방향
        rotationSpeed: random(-0.005, 0.005) // 회전 속도
      });
    }
    
    // 초기에는 객체 생성 안함 - 사용자 클릭 시에만 생성
    userInteractionPos = createVector(width/2, height/2); // 기본 위치
    
    // 키보드 단축키
    document.addEventListener('keydown', function(e) {
      if (e.key === 'd' || e.key === 'D') {
        debugMode = !debugMode;
      } else if (e.key === 'f' || e.key === 'F') {
        forceDisplay = !forceDisplay;
      } else if (e.key === 'c' || e.key === 'C') {
        connectionLines = !connectionLines;
      } else if (e.key === ' ') { // 스페이스바
        // 모든 도형 제거
        shapes = [];
      }
    });
    
    // 사용자 첫 인터랙션 시 Tone.js 초기화
    window.addEventListener('click', function() {
      if (!firstInteraction) {
        firstInteraction = true;
        introText = false;
        
        // Tone.js 시작
        if (Tone.context.state !== 'running') {
          console.log("Tone.js 시작 (첫 클릭 이벤트)");
          Tone.start().then(() => {
            setupTone();
          });
        }
      }
    }, { once: true });
    
    console.log("p5.js setup 완료");
  } catch (error) {
    console.error("setup 함수 오류:", error);
  }
}

// 새로운 Shape 객체 생성 - 사용자 인터랙션 위치 기반
function createNewShape(x, y, forceType = null) {
  // 위치 지정이 없으면 화면 중앙 근처에 랜덤 생성
  if (x === undefined || y === undefined) {
    x = random(width * 0.3, width * 0.7);
    y = random(height * 0.3, height * 0.7);
  }
  
  // 크기는 슬라이더 값과 랜덤성 조합
  const baseSize = map(prevDensityVal, 0, 100, 40, 100);
  const size = baseSize * random(0.7, 1.3);
  
  // 타입 지정이 없으면 랜덤 타입
  const type = forceType !== null ? forceType : null;
  
  // 고유한 시드값으로 Shape 생성
  const seed = random(1000);
  const shape = new Shape(x, y, size, seed);
  shapes.push(shape);
  
  // 주변 영역에 작은 자식 객체들도 함께 생성 (그룹화)
  if (random() < 0.7 && type === null) {
    const childCount = floor(random(1, 4));
    for (let i = 0; i < childCount; i++) {
      const offset = random(30, 80);
      const angle = random(TWO_PI);
      const childX = x + cos(angle) * offset;
      const childY = y + sin(angle) * offset;
      const childSize = size * random(0.3, 0.6);
      
      // 부모와 비슷한 타입의 자식 생성 (관련성 부여)
      const childShape = new Shape(childX, childY, childSize, seed + i);
      shapes.push(childShape);
      
      // 자식 객체에 대한 사운드 생성 (부모와 관련된 사운드)
      if (Tone.context && Tone.context.state === 'running') {
        triggerSoundFromShape(childShape);
      }
    }
  }
  
  // Tone.js가 시작되었으면 새 Shape에 대한 사운드 생성
  if (Tone.context && Tone.context.state === 'running') {
    triggerSoundFromShape(shape);
  }
  
  // 사용자 인터랙션 위치 업데이트
  userInteractionPos = createVector(x, y);
  lastInteractionTime = millis();
  
  return shape;
}

// p5.js draw 함수
function draw() {
  // 배경 부분적으로 지우기 (트레일 효과)
  fill(backgroundHue, 15, 15, 15);
  rect(0, 0, width, height);
  
  // 슬라이더 값 업데이트 및 값 변화 감지
  try {
    handleSliders();
  } catch (error) {
    console.error("슬라이더 처리 오류:", error);
  }
  
  // 힘 장 업데이트 및 표시
  try {
    updateAndDisplayForces();
  } catch (error) {
    console.error("힘 장 표시 오류:", error);
  }
  
  // 객체 간 연결선 표시
  if (connectionLines && shapes.length > 1) {
    drawConnectionsBetweenShapes();
  }
  
  // 모든 Shape 업데이트 및 표시
  try {
    updateAndDisplayShapes();
  } catch (error) {
    console.error("Shape 업데이트 오류:", error);
  }
  
  // 사용자 인터랙션 표시
  displayUserInteraction();
  
  // 도움말 및 인트로 텍스트 표시
  if (introText) {
    showIntroText();
  }
  
  // 디버그 모드일 때 정보 표시
  if (debugMode) {
    displayDebugInfo();
  }
}

// 은은한 배경 요소 그리기
function drawBackgroundElements() {
  // 시간에 따라 천천히 변화하는 색상
  let time = frameCount * 0.001;
  
  // 대형 원 그리기
  noFill();
  stroke(200, 20, 80, 10);
  strokeWeight(1);
  let radius = height * 0.4 + sin(time) * 50;
  ellipse(width/2, height/2, radius * 2, radius * 2);
  
  // 수직선 그리기
  stroke(160, 20, 70, 8);
  let lineX = width * 0.3 + sin(time * 0.7) * width * 0.1;
  line(lineX, 0, lineX, height);
  
  // 수평선 그리기
  stroke(270, 20, 70, 8);
  let lineY = height * 0.6 + sin(time * 0.5) * height * 0.1;
  line(0, lineY, width, lineY);
}

// 어트랙터 표시
function displayAttractors() {
  const hue = (frameCount * 0.1) % 360;
  
  for (let attractor of attractors) {
    // 어트랙터의 위치 서서히 변화 (천천히 움직임)
    attractor.x += sin(frameCount * 0.01 + attractor.y * 0.01) * 0.3;
    attractor.y += cos(frameCount * 0.01 + attractor.x * 0.01) * 0.3;
    
    // 화면 경계 유지
    attractor.x = constrain(attractor.x, width * 0.1, width * 0.9);
    attractor.y = constrain(attractor.y, height * 0.1, height * 0.9);
    
    // 은은하게 표시
    noStroke();
    fill(hue, 40, 80, 5);
    ellipse(attractor.x, attractor.y, 30, 30);
  }
}

// 윈도우 크기가 변경될 때 캔버스 크기 조정
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // 힘 장 위치 재설정
  for (let i = 0; i < forces.length; i++) {
    // 화면 내에 고르게 재배치
    forces[i].pos.x = random(width * 0.1, width * 0.9);
    forces[i].pos.y = random(height * 0.1, height * 0.9);
  }
  
  // 기존 Shape 객체들의 위치 조정 (화면 범위 내로)
  for (let shape of shapes) {
    // 화면 밖으로 벗어난 객체는 화면 안으로 이동
    if (shape.pos.x < 0 || shape.pos.x > width || shape.pos.y < 0 || shape.pos.y > height) {
      shape.pos.x = constrain(shape.pos.x, width * 0.1, width * 0.9);
      shape.pos.y = constrain(shape.pos.y, height * 0.1, height * 0.9);
    }
  }
  
  // 배경 다시 그리기
  background(backgroundHue, 15, 15);
}

// 마우스를 클릭하면 그 위치에 새 Shape 추가
function mousePressed() {
  // 인트로 텍스트 숨기기
  introText = false;
  
  // 컨트롤 영역이 아닌 경우에만 객체 생성
  if (mouseY < height - 100) {
    // 클릭한 위치에 새로운 Shape 생성
    const newShape = createNewShape(mouseX, mouseY);
    
    // Tone.js 초기화 (처음 클릭시)
    if (Tone.context.state !== "running") {
      Tone.start().then(() => {
        setupTone();
        // 오디오 컨텍스트가 시작된 후 사운드 트리거
        triggerSoundFromShape(newShape);
      });
    }
    
    // 사용자가 이미 여러 객체를 생성한 상태라면,
    // 클릭된 위치에서 가장 가까운 기존 객체에 영향을 주기
    if (shapes.length > 1) {
      for (let shape of shapes) {
        // 현재 생성된 객체는 제외
        if (shape !== newShape) {
          shape.interact(mouseX, mouseY, 1.0);
        }
      }
    }
    
    return false; // 이벤트 전파 방지
  }
}

// 마우스를 드래그하면 객체들과 상호작용
function mouseDragged() {
  // 인트로 텍스트 숨기기
  introText = false;
  
  if (mouseY < height - 100) { // 컨트롤 영역 피하기
    // 현재 마우스 위치에 작은 힘 생성
    let mouseForce = createVector(
      mouseX - pmouseX,
      mouseY - pmouseY
    );
    
    // 드래그 속도가 충분히 빠르면 새 객체 생성
    if (mouseForce.mag() > 8 && frameCount % 10 === 0 && shapes.length < 50) {
      createNewShape(mouseX, mouseY);
    }
    
    // 모든 가까운 객체에 영향 주기
    let interactionCount = 0;
    for (let shape of shapes) {
      if (shape.interact(mouseX, mouseY, 0.5)) {
        interactionCount++;
      }
    }
    
    // 상호작용 정보 업데이트
    if (interactionCount > 0) {
      userInteractionPos = createVector(mouseX, mouseY);
      lastInteractionTime = millis();
    }
    
    return false; // 이벤트 전파 방지
  }
}

// 마우스 이동 시 부드러운 상호작용
function mouseMoved() {
  if (shapes.length > 0 && mouseY < height - 100) {
    // 객체들에 약한 영향 주기
    for (let shape of shapes) {
      shape.interact(mouseX, mouseY, 0.1); 
    }
    
    // 힘 장에도 약간의 영향
    for (let force of forces) {
      if (dist(mouseX, mouseY, force.pos.x, force.pos.y) < 100) {
        force.pos.x += random(-1, 1);
        force.pos.y += random(-1, 1);
      }
    }
  }
}

// 슬라이더 처리 - 객체들의 물리적 특성에 직접 영향
function handleSliders() {
  let speedVal = speedSlider.value();
  let densityVal = densitySlider.value();
  let toneVal = toneSlider.value();
  
  let isSpeedChanged = false;
  let isDensityChanged = false;
  let isToneChanged = false;
  
  // 속도 슬라이더 변화 감지
  if (speedVal !== prevSpeedVal) {
    prevSpeedVal = speedVal;
    isSpeedChanged = true;
    
    // 객체들의 최대 속도와 물리 특성 업데이트
    const speedFactor = map(speedVal, 0, 100, 0.5, 3);
    shapes.forEach(shape => {
      shape.maxSpeed = 3.5 * speedFactor;
      shape.damping = map(speedVal, 0, 100, 0.97, 0.90); // 높은 속도=낮은 감쇠
    });
  }
  
  // 밀도 슬라이더 변화 감지
  if (densityVal !== prevDensityVal) {
    prevDensityVal = densityVal;
    isDensityChanged = true;
    
    // 객체들의 크기와 변형 특성 업데이트
    const deformFactor = map(densityVal, 0, 100, 0.3, 1.5);
    shapes.forEach(shape => {
      shape.deformStrength = deformFactor * shape.baseSize * 0.01;
      shape.morphSpeed = map(densityVal, 0, 100, 0.005, 0.02);
    });
  }
  
  // 톤 슬라이더 변화 감지
  if (toneVal !== prevToneVal) {
    prevToneVal = toneVal;
    isToneChanged = true;
    
    // 객체들의 시각적 특성 업데이트
    const colorIntensity = map(toneVal, 0, 100, 0.5, 2.0);
    shapes.forEach(shape => {
      shape.colorChangeRate = map(toneVal, 0, 100, 0.001, 0.01);
      shape.soundResponseIntensity = colorIntensity;
    });
  }
  
  // 슬라이더 값이 변경되었으면 ToneManager에 전달
  if (isSpeedChanged || isDensityChanged || isToneChanged) {
    // ToneManager.js의 함수 호출 (사운드 매개변수 업데이트)
    if(typeof updateSliderValues === 'function') {
      updateSliderValues(prevSpeedVal, prevDensityVal, prevToneVal);
    }
    
    // 속도 변화가 큰 경우 시퀀서 재시작
    if (isSpeedChanged && Math.abs(speedVal - prevSpeedVal) > 10 && typeof startSequence === 'function') {
      startSequence();
    }
  }
}

// Shape 객체 업데이트 및 표시
function updateAndDisplayShapes() {
  let speedFactor = map(prevSpeedVal, 0, 100, 0.3, 1.5);
  
  for (let shape of shapes) {
    // 가장 가까운 어트랙터 찾기
    let closestAttractor = null;
    let closestDistance = Infinity;
    
    for (let attractor of attractors) {
      let distance = p5.Vector.dist(shape.pos, attractor);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestAttractor = attractor;
      }
    }
    
    if (closestAttractor) {
      // 가장 가까운 어트랙터를 향해 부드럽게 이동
      shape.seek(closestAttractor);
    }
    
    // 다른 Shape 객체들과의 분리
    shape.separate(shapes);
    
    // 자연스러운 움직임을 위한 진동
    shape.oscillate();
    
    // Shape 업데이트
    shape.update();
    
    // Shape 표시
    shape.display();
  }
  
  // 활성화된 Shape 배열을 ToneManager에 전달
  updateActiveShapes(shapes);
}

// Shape 객체 관리
function manageShapes() {
  // 죽은 Shape 객체 제거
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (shapes[i].isDead()) {
      shapes.splice(i, 1);
    }
  }
  
  // 일정한 간격으로 새로운 Shape 생성 (밀도에 따라 간격 조정)
  const currentTime = millis();
  shapeInterval = map(prevDensityVal, 0, 100, 5000, 1000); // 낮은 밀도=긴 간격, 높은 밀도=짧은 간격
  
  if (currentTime - lastShapeTime > shapeInterval && shapes.length < 25) {
    createNewShape();
    lastShapeTime = currentTime;
  }
  
  // 목표 수량으로 조정 (매우 점진적으로)
  let targetCount = floor(map(prevDensityVal, 0, 100, 8, 25));
  adjustShapeCount(targetCount);
}

// Shape 수량 조정 (칸딘스키 스타일의 균형감을 위해 급격한 변화는 피함)
function adjustShapeCount(targetCount) {
  // 너무 적으면 천천히 추가
  if (shapes.length < targetCount - 3 && random() < 0.05) {
    createNewShape();
  }
  
  // 너무 많으면 하나씩 제거 (가장 수명이 짧은 것부터)
  if (shapes.length > targetCount + 3) {
    let shortestLifeIndex = 0;
    let shortestLife = Infinity;
    
    for (let i = 0; i < shapes.length; i++) {
      if (shapes[i].lifespan < shortestLife) {
        shortestLife = shapes[i].lifespan;
        shortestLifeIndex = i;
      }
    }
    
    shapes.splice(shortestLifeIndex, 1);
  }
}

// 슬라이더 값을 ToneManager.js에 전달하기 위해 별도 함수 없음
// ToneManager.js에서 직접 prevSpeedVal, prevDensityVal, prevToneVal 변수를 참조

// 힘 장 업데이트 및 표시
function updateAndDisplayForces() {
  for (let i = 0; i < forces.length; i++) {
    let force = forces[i];
    
    // 힘 장의 위치 천천히 변경
    if (random() < 0.005) {
      force.pos.x += random(-5, 5);
      force.pos.y += random(-5, 5);
    }
    
    // 회전 각도 업데이트
    force.angle += force.rotationSpeed;
    
    // 힘 장 표시 (디버그 모드거나 표시 옵션이 켜져있을 때만)
    if (forceDisplay || debugMode) {
      push();
      translate(force.pos.x, force.pos.y);
      rotate(force.angle);
      
      // 인력(+)과 척력(-) 다르게 표시
      if (force.strength > 0) {
        // 인력 - 중심을 향해 당기는 모양
        stroke(170, 70, 70, 30);
        noFill();
        ellipse(0, 0, force.radius * 2, force.radius * 2);
        
        for (let a = 0; a < TWO_PI; a += PI/4) {
          let len = force.radius;
          line(cos(a) * len * 0.3, sin(a) * len * 0.3, cos(a) * len, sin(a) * len);
        }
      } else {
        // 척력 - 바깥으로 밀어내는 모양
        stroke(240, 70, 70, 30);
        noFill();
        ellipse(0, 0, force.radius * 2, force.radius * 2);
        
        for (let a = 0; a < TWO_PI; a += PI/4) {
          let len = force.radius;
          line(cos(a) * len * 0.7, sin(a) * len * 0.7, cos(a) * len, sin(a) * len);
        }
      }
      pop();
    }
  }
}

// 객체 간 연결선 그리기
function drawConnectionsBetweenShapes() {
  const maxDistance = 150; // 연결선을 그릴 최대 거리
  
  stroke(200, 30, 60, 20);
  strokeWeight(0.5);
  
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const shape1 = shapes[i];
      const shape2 = shapes[j];
      
      const d = dist(shape1.pos.x, shape1.pos.y, shape2.pos.x, shape2.pos.y);
      
      if (d < maxDistance) {
        // 거리에 따라 선 투명도 조절
        const alpha = map(d, 0, maxDistance, 40, 5);
        stroke(200, 30, 60, alpha);
        line(shape1.pos.x, shape1.pos.y, shape2.pos.x, shape2.pos.y);
      }
    }
  }
}

// 모든 Shape 업데이트 및 표시
function updateAndDisplayShapes() {
  // ToneManager에 활성화된 Shape 배열 전달
  if (window.updateActiveShapes) {
    updateActiveShapes(shapes);
  }
  
  // 각 Shape에 힘 장의 영향 적용하고 업데이트
  for (let shape of shapes) {
    // 힘 장의 영향 적용
    applyForcesToShape(shape);
    
    // 기존 행동 업데이트
    shape.update();
    
    // 객체와 사운드가 연결되어 있음을 시각적으로 표현하기 위한 효과
    if (shape.soundTriggered && Tone.context && Tone.context.state === 'running') {
      // 사운드 반응 시 시각적 표현 (파동 효과)
      push();
      noFill();
      stroke(hue(shape.fillColor), 80, 90, 50);
      strokeWeight(2);
      let waveSize = map(millis() - shape.lastSoundTime, 0, 500, 0, shape.size * 2);
      ellipse(shape.pos.x, shape.pos.y, waveSize, waveSize);
      pop();
      
      // 소리 특성에 따른 시각적 피드백
      const props = shape.getSoundProperties();
      updateAudioVisualFeedback(shape, props);
    }
    
    // Shape 표시
    shape.display();
    
    // 자식 파티클 표시
    shape.childParticles.forEach(particle => {
      particle.display();
    });
  }
  
  // 죽은 Shape 제거
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (shapes[i].isDead()) {
      shapes.splice(i, 1);
    }
  }
}

// 사용자 인터랙션 표시
function displayUserInteraction() {
  // 마지막 인터랙션 시간으로부터 2초 내에만 표시
  if (millis() - lastInteractionTime < 2000) {
    const fadeOut = map(millis() - lastInteractionTime, 0, 2000, 100, 0);
    
    push();
    noFill();
    stroke(30, 70, 90, fadeOut);
    strokeWeight(1);
    
    // 인터랙션 위치에 동심원 효과
    for (let i = 0; i < 3; i++) {
      let size = map(millis() - lastInteractionTime, 0, 2000, 20, 100) * (i + 1) * 0.7;
      ellipse(userInteractionPos.x, userInteractionPos.y, size, size);
    }
    
    pop();
  }
}

// 인트로 텍스트 표시
function showIntroText() {
  push();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(24);
  text("화면을 클릭하여 시작하세요", width/2, height/2 - 40);
  
  textSize(16);
  text("각 클릭은 독특한 소리와 형태를 가진 객체를 생성합니다", width/2, height/2);
  text("객체들은 물리적 특성에 따라 지속적으로 변화합니다", width/2, height/2 + 30);
  
  textSize(12);
  text("키보드 단축키: [D] 디버그 모드, [F] 힘 장 표시, [C] 연결선 표시, [Space] 모든 객체 지우기", width/2, height - 40);
  pop();
}

// 디버그 정보 표시
function displayDebugInfo() {
  push();
  fill(255);
  textAlign(LEFT, TOP);
  textSize(12);
  text(`FPS: ${floor(frameRate())}`, 10, 10);
  text(`객체 수: ${shapes.length}`, 10, 30);
  text(`속도: ${prevSpeedVal}`, 10, 50);
  text(`밀도: ${prevDensityVal}`, 10, 70);
  text(`음색: ${prevToneVal}`, 10, 90);
  pop();
}

// 오디오-비주얼 피드백 업데이트
function updateAudioVisualFeedback(shape, props) {
  // 사운드 특성에 따라 시각적 요소 업데이트
  if (props.activeLevel > 1.5) {
    // 활동량이 높을 때 더 역동적인 변화
    shape.deformStrength *= 1.05;
    setTimeout(() => { shape.deformStrength /= 1.05; }, 200);
  }
  
  // 주파수에 따른 색상 변화
  const freqEffect = map(props.frequency, 180, 1200, -20, 20);
  shape.colorPhase += 0.05; // 색상 변화 가속
}

// Shape에 힘 장의 영향 적용
function applyForcesToShape(shape) {
  // 각 힘 장의 영향 계산
  for (let force of forces) {
    let d = p5.Vector.dist(shape.pos, force.pos);
    
    if (d < force.radius) {
      // 거리에 따른 힘의 강도 계산 (거리 제곱에 반비례)
      let strength = force.strength * (1 - d / force.radius) * 0.2;
      
      // 중심을 향하는 힘 계산
      let forceDir = p5.Vector.sub(force.pos, shape.pos);
      forceDir.normalize();
      forceDir.mult(strength);
      
      // 회전 효과 추가 (선회 운동)
      let perpForce = createVector(-forceDir.y, forceDir.x);
      perpForce.mult(0.3);
      
      // 힘 적용
      shape.applyForce(forceDir);
      shape.applyForce(perpForce);
      
      // 회전 속도에도 영향
      shape.rotationSpeed += strength * 0.001;
    }
  }
}
