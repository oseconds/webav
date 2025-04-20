// 전역 변수
let movers = [];
let attractor;
let speedSlider, densitySlider, toneSlider;
let prevSpeedVal = 50;
let prevDensityVal = 50;
let prevToneVal = 50;

// p5.js setup 함수
function setup() {
  console.log("p5.js setup 시작");
  
  try {
    // 캔버스 생성 및 설정
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    
    colorMode(HSB, 360, 100, 100, 100);
    
    // 슬라이더 연결 - DOM 요소가 로드되었는지 확인
    try {
      speedSlider = select('#speed-slider');
      densitySlider = select('#density-slider');
      toneSlider = select('#tone-slider');
      console.log("슬라이더 연결됨:", speedSlider ? "O" : "X", densitySlider ? "O" : "X", toneSlider ? "O" : "X");
    } catch (error) {
      console.error("슬라이더 연결 오류:", error);
    }
    
    // 초기 물체 생성
    console.log("초기 무버 생성 시작");
    try {
      for (let i = 0; i < 10; i++) {
        let mass = random(1, 4);
        let x = random(width);
        let y = random(height);
        let hue = random(0, 360);
        let m = new Mover(x, y, mass);
        m.changeColor(color(hue, 80, 90, 70));
        movers.push(m);
      }
      console.log(`${movers.length}개의 무버가 생성됨`);
    } catch (error) {
      console.error("무버 생성 오류:", error);
    }
    
    // 중력 어트랙터 생성 (화면 중앙)
    attractor = createVector(width/2, height/2);
    
    // Tone.js 초기화 - 페이지에 사용자 상호작용이 있은 후
    canvas.mousePressed(() => {
      if (!Tone.context.state === 'running') {
        console.log("Tone.js 시작");
        Tone.start();
        setupTone();
      }
    });
    
    // 사용자가 페이지와 상호작용한 후 Tone.js 설정
    window.addEventListener('click', function() {
      if (Tone.context.state !== 'running') {
        console.log("Tone.js 시작 (클릭 이벤트)");
        Tone.start();
        setupTone();
      }
    }, { once: true });
    
    console.log("p5.js setup 완료");
  } catch (error) {
    console.error("setup 함수 오류:", error);
  }
}

// p5.js draw 함수
function draw() {
  // 배경 그리기 (완전히 지우기)
  background(0, 0, 10);
  
  // 디버깅용 텍스트 표시
  fill(255);
  textSize(16);
  text('WebAV 인터랙티브 미디어 아트', 10, 30);
  text('화면을 클릭하여 파티클 생성', 10, 60);
  
  // 슬라이더 값 업데이트 및 값 변화 감지
  try {
    handleSliders();
  } catch (error) {
    console.error("슬라이더 처리 오류:", error);
  }
  
  // 모든 무버 업데이트 및 표시
  try {
    updateAndDisplayMovers();
  } catch (error) {
    console.error("무버 업데이트 오류:", error);
  }
  
  // 죽은 무버 제거 및 필요시 새 무버 추가
  try {
    manageMovers();
  } catch (error) {
    console.error("무버 관리 오류:", error);
  }
}

// 윈도우 크기가 변경될 때 캔버스 크기 조정
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  attractor.set(width/2, height/2);
}

// 마우스를 클릭하면 그 위치에 새 무버 추가
function mousePressed() {
  if (mouseY < height - 100) { // 컨트롤 영역 피하기
    let mass = random(1, 4);
    let hue = random(0, 360);
    let m = new Mover(mouseX, mouseY, mass);
    m.changeColor(color(hue, 80, 90, 70));
    movers.push(m);
    
    // 사운드 트리거
    triggerSound(mouseX, mouseY);
  }
}

// 마우스를 드래그하면 어트랙터 이동
function mouseDragged() {
  if (mouseY < height - 100) { // 컨트롤 영역 피하기
    attractor.set(mouseX, mouseY);
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
  
  // 속도 슬라이더 변화 감지
  if (speedVal !== prevSpeedVal) {
    prevSpeedVal = speedVal;
    isSpeedChanged = true;
  }
  
  // 밀도 슬라이더 변화 감지
  if (densityVal !== prevDensityVal) {
    prevDensityVal = densityVal;
    isDensityChanged = true;
    
    // 밀도에 따라 무버 수 조정
    let targetCount = floor(map(densityVal, 0, 100, 5, 40));
    adjustMoverCount(targetCount);
  }
  
  // 톤 슬라이더 변화 감지
  if (toneVal !== prevToneVal) {
    prevToneVal = toneVal;
    isToneChanged = true;
  }
  
  // 슬라이더 값이 변경되었으면 ToneManager에 전달
  if (isSpeedChanged || isDensityChanged || isToneChanged) {
    // ToneManager.js의 함수 호출
    updateSliderValues(prevSpeedVal, prevDensityVal, prevToneVal);
    
    // 속도 변화가 큰 경우 시퀀서 재시작
    if (isSpeedChanged && Math.abs(speedVal - prevSpeedVal) > 10) {
      startSequence();
    }
  }
}

// 무버 업데이트 및 표시
function updateAndDisplayMovers() {
  let speedFactor = map(prevSpeedVal, 0, 100, 0.3, 2.5);
  
  for (let mover of movers) {
    // 어트랙터를 향한 중력 계산
    let force = p5.Vector.sub(attractor, mover.pos);
    let distance = force.mag();
    distance = constrain(distance, 5, 25);
    
    let strength = (0.5 * distance) / (distance * distance);
    force.setMag(strength);
    
    // 약간의 랜덤 힘 추가
    let randomForce = p5.Vector.random2D();
    randomForce.mult(0.1);
    
    mover.applyForce(force);
    mover.applyForce(randomForce);
    mover.update(speedFactor);
    mover.checkEdges();
    mover.display();
  }
  
  // 어트랙터 표시
  stroke(200, 100, 100);
  strokeWeight(2);
  fill(0, 0, 100, 30);
  ellipse(attractor.x, attractor.y, 40, 40);
}

// 무버 수 관리
function manageMovers() {
  // 죽은 무버 제거
  for (let i = movers.length - 1; i >= 0; i--) {
    if (movers[i].isDead()) {
      movers.splice(i, 1);
    }
  }
  
  // 목표 수량으로 조정
  let targetCount = floor(map(prevDensityVal, 0, 100, 5, 40));
  adjustMoverCount(targetCount);
}

// 무버 수량 조정
function adjustMoverCount(targetCount) {
  while (movers.length < targetCount) {
    let mass = random(1, 4);
    let x = random(width);
    let y = random(height);
    let hue = random(0, 360);
    let m = new Mover(x, y, mass);
    m.changeColor(color(hue, 80, 90, 70));
    movers.push(m);
  }
  
  // 필요시 무버 제거 (수가 너무 많은 경우)
  if (movers.length > targetCount + 5) {
    movers.splice(targetCount, movers.length - targetCount);
  }
}

// 슬라이더 값을 ToneManager.js에 전달하기 위해 별도 함수 없음
// ToneManager.js에서 직접 prevSpeedVal, prevDensityVal, prevToneVal 변수를 참조
