// 전역 변수
let shapes = []; // Shape 객체 배열
let attractors = []; // 여러 개의 어트랙터 포인트
let speedSlider, densitySlider, toneSlider;
let prevSpeedVal = 50;
let prevDensityVal = 50;
let prevToneVal = 50;
let backgroundHue = 220; // 배경색 기본값 (깊은 파란색 계열)
let lastShapeTime = 0; // 마지막 Shape 생성 시간
let shapeInterval = 2000; // 새로운 Shape 생성 간격 (밀리초)
let canvas;

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
    
    // 여러 개의 어트랙터 포인트 생성 (칸딘스키 화풍의 구심점들)
    const attractorCount = 5;
    for (let i = 0; i < attractorCount; i++) {
      // 화면 전체에 고르게 분포
      let x = map(i, 0, attractorCount - 1, width * 0.2, width * 0.8);
      let y = map(noise(i * 0.5), 0, 1, height * 0.2, height * 0.8);
      
      // 약간의 무작위성 추가
      x += random(-width * 0.1, width * 0.1);
      y += random(-height * 0.1, height * 0.1);
      
      attractors.push(createVector(x, y));
    }
    
    // 초기 Shape 객체 생성
    console.log("초기 Shape 객체 생성 시작");
    try {
      // 초기에는 적은 수의 Shape으로 시작
      for (let i = 0; i < 10; i++) {
        createNewShape();
      }
      console.log(`${shapes.length}개의 Shape 객체가 생성됨`);
    } catch (error) {
      console.error("Shape 생성 오류:", error);
    }
    
    // Tone.js 초기화 - 페이지에 사용자 상호작용이 있은 후
    canvas.mousePressed(() => {
      if (Tone.context.state !== 'running') {
        console.log("Tone.js 시작");
        Tone.start().then(() => {
          setupTone();
        });
      }
    });
    
    // 사용자가 페이지와 상호작용한 후 Tone.js 설정
    window.addEventListener('click', function() {
      if (Tone.context.state !== 'running') {
        console.log("Tone.js 시작 (클릭 이벤트)");
        Tone.start().then(() => {
          setupTone();
        });
      }
    }, { once: true });
    
    console.log("p5.js setup 완료");
  } catch (error) {
    console.error("setup 함수 오류:", error);
  }
}

// 새로운 Shape 객체 생성
function createNewShape() {
  const x = random(width * 0.1, width * 0.9);
  const y = random(height * 0.1, height * 0.9);
  const size = random(20, 100);
  
  const shape = new Shape(x, y, size);
  shapes.push(shape);
  
  // Tone.js가 시작되었으면 새 Shape에 대한 사운드 생성
  if (Tone.context && Tone.context.state === 'running') {
    createSoundForNewShape(shape);
  }
  
  return shape;
}

// p5.js draw 함수
function draw() {
  // 배경 부분적으로 지우기 (트레일 효과)
  fill(backgroundHue, 15, 15, 20);
  rect(0, 0, width, height);
  
  // 슬라이더 값 업데이트 및 값 변화 감지
  try {
    handleSliders();
  } catch (error) {
    console.error("슬라이더 처리 오류:", error);
  }
  
  // 어트랙터들 표시 (은은하게)
  try {
    displayAttractors();
  } catch (error) {
    console.error("어트랙터 표시 오류:", error);
  }
  
  // 모든 Shape 업데이트 및 표시
  try {
    updateAndDisplayShapes();
  } catch (error) {
    console.error("Shape 업데이트 오류:", error);
  }
  
  // 새로운 Shape 주기적 생성 및 관리
  try {
    manageShapes();
  } catch (error) {
    console.error("Shape 관리 오류:", error);
  }
  
  // 배경 요소 그리기 (원과 선)
  drawBackgroundElements();
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
  
  // 어트랙터 위치 재설정 (화면에 고르게 분포)
  for (let i = 0; i < attractors.length; i++) {
    attractors[i].x = map(i, 0, attractors.length - 1, width * 0.2, width * 0.8) + random(-width * 0.1, width * 0.1);
    attractors[i].y = map(noise(i * 0.5), 0, 1, height * 0.2, height * 0.8) + random(-height * 0.1, height * 0.1);
  }
  
  // 배경 다시 그리기
  background(backgroundHue, 15, 15);
}

// 마우스를 클릭하면 그 위치에 새 Shape 추가
function mousePressed() {
  if (mouseY < height - 100) { // 컨트롤 영역 피하기
    // 클릭한 위치에 새로운 Shape 추가
    const newShape = new Shape(mouseX, mouseY, random(30, 80));
    shapes.push(newShape);
    
    // Tone.js 시작 (아직 시작하지 않은 경우)
    if (Tone.context.state !== "running") {
      Tone.start().then(() => {
        setupTone();
        // 새 Shape에 대한 사운드 생성
        triggerSoundFromShape(newShape);
      });
    } else {
      // 이미 실행 중이면 사운드 직접 트리거
      triggerSoundFromShape(newShape);
    }
  }
}

// 마우스를 드래그하면 가장 가까운 어트랙터 이동
function mouseDragged() {
  if (mouseY < height - 100) { // 컨트롤 영역 피하기
    // 가장 가까운 어트랙터 찾기
    let closestIndex = 0;
    let closestDist = Infinity;
    
    for (let i = 0; i < attractors.length; i++) {
      let d = dist(mouseX, mouseY, attractors[i].x, attractors[i].y);
      if (d < closestDist) {
        closestDist = d;
        closestIndex = i;
      }
    }
    
    // 가장 가까운 어트랙터 이동 (부드럽게)
    attractors[closestIndex].x = lerp(attractors[closestIndex].x, mouseX, 0.2);
    attractors[closestIndex].y = lerp(attractors[closestIndex].y, mouseY, 0.2);
  }
}

// 슬라이더 처리
function handleSliders() {
  let speedVal = speedSlider.value();
  let densityVal = densitySlider.value();
  let toneVal = toneSlider.value();
  
  let isSpeedChanged = false;
  let isDensityChanged = false;
  let isToneChanged = false;
  
  // 속도 슬라이더 변화 감지 (Shape의 움직임 속도와 음악 템포에 영향)
  if (speedVal !== prevSpeedVal) {
    prevSpeedVal = speedVal;
    isSpeedChanged = true;
    
    // 배경색 약간 변화 (미묘하게)
    backgroundHue = map(speedVal, 0, 100, 200, 240);
  }
  
  // 밀도 슬라이더 변화 감지 (화면에 보이는 Shape 수와 사운드 복잡도에 영향)
  if (densityVal !== prevDensityVal) {
    prevDensityVal = densityVal;
    isDensityChanged = true;
  }
  
  // 톤 슬라이더 변화 감지 (사운드의 음색과 이펙트에 영향)
  if (toneVal !== prevToneVal) {
    prevToneVal = toneVal;
    isToneChanged = true;
  }
  
  // 슬라이더 값이 변경되었으면 ToneManager에 전달
  if (isSpeedChanged || isDensityChanged || isToneChanged) {
    // ToneManager.js의 함수 호출
    updateSliderValues(prevSpeedVal, prevDensityVal, prevToneVal);
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
