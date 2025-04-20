// Tone.js 관련 전역 변수
let ambientSynth, droneSynth, melodySynth;
let pingPongDelay, reverb, chorus, filter, autoFilter;
let chordPart, ambientPart;
let activeShapes = []; // 현재 활성화된 Shape 객체들의 참조

// Tone 매니저 내부에서 사용할 슬라이더 값 저장 변수
let _speedVal = 50;
let _densityVal = 50;
let _toneVal = 50;

// 슬라이더 값 업데이트 함수 - sketch.js에서 호출
function updateSliderValues(speedVal, densityVal, toneVal) {
  _speedVal = speedVal;
  _densityVal = densityVal;
  _toneVal = toneVal;
  
  // 값이 업데이트되면 Tone.js 파라미터도 업데이트
  updateToneParameters();
}

// 활성 Shape 객체 배열 업데이트
function updateActiveShapes(shapes) {
  activeShapes = shapes;
}

// Tone.js 설정
function setupTone() {
  try {
    console.log("Tone.js 설정 시작");
    
    // 이펙트 체인 생성
    pingPongDelay = new Tone.PingPongDelay({
      delayTime: 0.6,
      feedback: 0.65,
      wet: 0.35
    }).toDestination();
    
    reverb = new Tone.Reverb({
      decay: 8,
      wet: 0.4,
      preDelay: 0.2
    }).connect(pingPongDelay);
    
    chorus = new Tone.Chorus({
      frequency: 0.5,
      delayTime: 2.5,
      depth: 0.7,
      wet: 0.3
    }).connect(reverb);
    
    filter = new Tone.Filter({
      frequency: 800,
      type: "lowpass",
      rolloff: -24,
      Q: 1
    }).connect(chorus);
    
    autoFilter = new Tone.AutoFilter({
      frequency: 0.1,
      depth: 0.8,
      wet: 0.4,
      octaves: 4
    }).connect(filter);
    
    // 앰비언트 신디사이저 - 부드러운 패드 사운드
    ambientSynth = new Tone.PolySynth(Tone.FMSynth).connect(autoFilter);
    ambientSynth.set({
      harmonicity: 3.01,
      modulationIndex: 14,
      oscillator: {
        type: "sine"
      },
      envelope: {
        attack: 1.2,
        decay: 2,
        sustain: 0.8,
        release: 8
      },
      modulation: {
        type: "triangle"
      },
      modulationEnvelope: {
        attack: 2.5,
        decay: 1,
        sustain: 0.5,
        release: 5
      },
      volume: -10
    });
    
    // 드론 신디사이저 - 베이스와 저주파 영역
    droneSynth = new Tone.PolySynth(Tone.AMSynth).connect(filter);
    droneSynth.set({
      harmonicity: 1.5,
      oscillator: {
        type: "fatsine4"
      },
      envelope: {
        attack: 3,
        decay: 5,
        sustain: 0.9,
        release: 10
      },
      modulation: {
        type: "sine"
      },
      modulationEnvelope: {
        attack: 4,
        decay: 10,
        sustain: 0.6,
        release: 12
      },
      volume: -16
    });
    
    // 멜로디 신디사이저 - 부드러운 선율과 하이라이트용
    melodySynth = new Tone.PolySynth(Tone.Synth).connect(chorus);
    melodySynth.set({
      oscillator: {
        type: "sine8"
      },
      envelope: {
        attack: 0.8,
        decay: 2,
        sustain: 0.4,
        release: 4
      },
      portamento: 0.1,
      volume: -15
    });
    
    // 앰비언트 사운드스케이프 시작
    startAmbientSoundscape();
    
    console.log("Tone.js 설정 완료");
  } catch (error) {
    console.error("Tone.js 설정 오류:", error);
  }
}

// 앰비언트 사운드스케이프 시작
function startAmbientSoundscape() {
  // 모든 트랜스포트 정지
  if (chordPart) chordPart.stop();
  if (ambientPart) ambientPart.stop();
  
  // 기본 배경 화음 (칸딘스키 작품의 색채감에 어울리는 화음)
  const baseChords = [
    ["D2", "A2", "D3", "F#3", "A3"], // D major
    ["A1", "E2", "A2", "C#3", "E3"], // A major
    ["F#2", "C#3", "F#3", "A3", "C#4"], // F# minor
    ["B1", "F#2", "B2", "D3", "F#3"], // B minor
    ["E2", "B2", "E3", "G#3", "B3"]  // E major
  ];
  
  // 분위기를 위한 상위 음역대 화음
  const highChords = [
    ["D4", "F#4", "A4", "E5"],
    ["E4", "G#4", "B4", "D5"],
    ["F#4", "A4", "C#5", "E5"],
    ["A4", "C#5", "E5", "A5"]
  ];
  
  // 배경 화음 패턴 - 느린 진행
  chordPart = new Tone.Part((time, chord) => {
    // 드론 신디사이저로 저음 화음 연주
    droneSynth.triggerAttackRelease(chord.notes, chord.duration, time, chord.velocity);
    
    // 공간감을 위해 필터 주파수 서서히 조절
    filter.frequency.rampTo(chord.filterFreq, 4);
    
    // LFO 속도 조절
    autoFilter.frequency.rampTo(chord.lfoRate, 5);
    
  }, [
    { time: "0:0", notes: baseChords[0], duration: "2m", velocity: 0.1, filterFreq: 800, lfoRate: 0.1 },
    { time: "2:0", notes: baseChords[1], duration: "2m", velocity: 0.12, filterFreq: 1200, lfoRate: 0.08 },
    { time: "4:0", notes: baseChords[2], duration: "2m", velocity: 0.1, filterFreq: 600, lfoRate: 0.12 },
    { time: "6:0", notes: baseChords[3], duration: "2m", velocity: 0.13, filterFreq: 900, lfoRate: 0.05 },
    { time: "8:0", notes: baseChords[4], duration: "2m", velocity: 0.11, filterFreq: 1500, lfoRate: 0.1 },
    { time: "10:0", notes: baseChords[0], duration: "2m", velocity: 0.12, filterFreq: 1000, lfoRate: 0.07 }
  ]);
  
  // 상위 멜로디 패턴 - 산발적인 음표들
  ambientPart = new Tone.Part((time, note) => {
    // 앰비언트 신디사이저로 상위 음역대 연주
    ambientSynth.triggerAttackRelease(note.note, note.duration, time, note.velocity);
    
    // 공간감을 위한 변수들 
    pingPongDelay.delayTime.value = note.delayTime;
    reverb.decay = note.reverbDecay;
    
  }, [
    { time: "0:2", note: highChords[0][2], duration: "4n", velocity: 0.05, delayTime: 0.5, reverbDecay: 6 },
    { time: "1:0", note: highChords[0][3], duration: "2n", velocity: 0.04, delayTime: 0.6, reverbDecay: 5 },
    { time: "2:1", note: highChords[1][0], duration: "4n", velocity: 0.06, delayTime: 0.4, reverbDecay: 7 },
    { time: "3:2", note: highChords[1][2], duration: "2n", velocity: 0.05, delayTime: 0.5, reverbDecay: 6 },
    { time: "4:0", note: highChords[2][1], duration: "4n", velocity: 0.07, delayTime: 0.7, reverbDecay: 8 },
    { time: "5:1", note: highChords[2][3], duration: "2n", velocity: 0.04, delayTime: 0.6, reverbDecay: 7 },
    { time: "6:2", note: highChords[3][0], duration: "4n", velocity: 0.08, delayTime: 0.5, reverbDecay: 6 },
    { time: "7:0", note: highChords[3][2], duration: "1n", velocity: 0.05, delayTime: 0.7, reverbDecay: 9 },
    { time: "8:2", note: highChords[0][1], duration: "4n", velocity: 0.06, delayTime: 0.5, reverbDecay: 7 },
    { time: "9:1", note: highChords[0][3], duration: "2n", velocity: 0.05, delayTime: 0.6, reverbDecay: 8 },
    { time: "10:2", note: highChords[1][1], duration: "4n", velocity: 0.07, delayTime: 0.4, reverbDecay: 6 },
    { time: "11:0", note: highChords[1][3], duration: "2n", velocity: 0.04, delayTime: 0.7, reverbDecay: 7 }
  ]);
  
  // 루프 설정 및 시작
  chordPart.loop = true;
  chordPart.loopStart = "0:0";
  chordPart.loopEnd = "12:0";
  
  ambientPart.loop = true;
  ambientPart.loopStart = "0:0";
  ambientPart.loopEnd = "12:0";
  
  // 트랜스포트 설정 및 시작
  Tone.Transport.bpm.value = 60; // 매우 느린 템포
  Tone.Transport.start();
  chordPart.start(0);
  ambientPart.start(0);
  
  // 지속적인 사운드 업데이트를 위한 루프
  continuousSoundUpdate();
}

// Shape 객체들의 움직임에 따라 소리를 지속적으로 업데이트
function continuousSoundUpdate() {
  // 100ms마다 업데이트
  Tone.Transport.scheduleRepeat((time) => {
    if (activeShapes.length === 0) return;
    
    // 현재 활성화된 Shape 객체들 중 하나를 랜덤하게 선택
    if (Math.random() < 0.3 && activeShapes.length > 0) {
      const shape = random(activeShapes);
      const props = shape.getSoundProperties();
      
      // 멜로디 신디사이저로 짧은 음표 연주
      melodySynth.triggerAttackRelease(
        Tone.Frequency(props.note, "midi").toNote(), 
        "16n", 
        "+0.1", 
        props.velocity * 0.3
      );
      
      // 팬 포지셔닝 - 화면 위치에 따른 스테레오 효과
      chorus.wet.value = map(props.modulation, 0, 1000, 0.1, 0.6);
      
      // 필터 주파수 조절
      filter.frequency.rampTo(props.filterFreq, 1);
    }
  }, "0:2");
}

// Shape 객체의 시각적 변화에 반응하여 사운드 트리거
function triggerSoundFromShape(shape) {
  try {
    // Tone.js가 시작되지 않았다면 시작
    if (Tone.context.state !== "running") {
      Tone.start();
      setupTone();
      return;
    }
    
    // Shape 객체의 속성으로부터 소리 특성 추출
    const props = shape.getSoundProperties();
    
    // 앰비언트 신디사이저로 음표 연주
    ambientSynth.triggerAttackRelease(
      Tone.Frequency(props.note, "midi").toNote(), 
      "4n", 
      Tone.now(), 
      props.velocity * 0.6
    );
    
    // 해당 도형의 위치와 특성에 맞게 효과 조절
    pingPongDelay.delayTime.value = map(props.frequency, 220, 880, 0.3, 0.8);
    reverb.decay = map(props.modulation, 0, 1000, 4, 10);
    
  } catch (error) {
    console.error("Shape 사운드 트리거 오류:", error);
  }
}

// 슬라이더 값에 따라 오디오 파라미터 업데이트
function updateToneParameters() {
  if (!ambientSynth) return;
  
  const speedValue = map(_speedVal, 0, 100, 0.5, 2);
  const densityValue = map(_densityVal, 0, 100, 0.3, 1);
  const toneValue = map(_toneVal, 0, 100, 0, 1);
  
  // BPM 업데이트 (매우 느린 변화)
  if (Tone.Transport.state === "started") {
    Tone.Transport.bpm.rampTo(40 + speedValue * 30, 4); // 40~100 BPM 사이 천천히 변화
  }
  
  // 이펙트 업데이트
  if (reverb) {
    reverb.wet.rampTo(0.3 + toneValue * 0.5, 3);
    reverb.decay = 6 + toneValue * 4; // 6-10초 리버브
  }
  
  if (pingPongDelay) {
    pingPongDelay.feedback.rampTo(0.3 + toneValue * 0.4, 3);
    pingPongDelay.delayTime.rampTo(0.3 + toneValue * 0.5, 2);
  }
  
  if (chorus) {
    chorus.depth = 0.5 + toneValue * 0.5;
    chorus.frequency.rampTo(0.1 + toneValue * 0.8, 2);
  }
  
  if (filter) {
    filter.frequency.rampTo(500 + toneValue * 4000, 4);
    filter.Q.value = 0.5 + toneValue;
  }
  
  if (autoFilter) {
    autoFilter.depth = 0.5 + densityValue * 0.5;
    autoFilter.frequency.value = 0.05 + densityValue * 0.2;
  }
  
  // 신디사이저 업데이트
  if (ambientSynth) {
    ambientSynth.set({
      "voice0": {
        "modulationIndex": 3 + toneValue * 10,
        "harmonicity": 1 + toneValue * 2
      }
    });
  }
  
  if (droneSynth) {
    droneSynth.set({
      "voice0": {
        "harmonicity": 0.8 + densityValue
      }
    });
  }
}

// 새 Shape 객체가 생성될 때 해당 객체의 특성에 맞는 사운드 생성
function createSoundForNewShape(shape) {
  if (Tone.context.state !== "running") return;
  
  const props = shape.getSoundProperties();
  
  // 도형 타입에 따라 다른 사운드 생성
  switch (shape.type) {
    case 0: // 원
      melodySynth.triggerAttackRelease(
        Tone.Frequency(props.note + 12, "midi").toNote(), 
        "2n", 
        Tone.now(), 
        props.velocity * 0.5
      );
      break;
      
    case 1: // 삼각형
      ambientSynth.triggerAttackRelease(
        Tone.Frequency(props.note + 7, "midi").toNote(), 
        "4n", 
        Tone.now(), 
        props.velocity * 0.4
      );
      break;
      
    case 2: // 사각형
      droneSynth.triggerAttackRelease(
        Tone.Frequency(props.note - 12, "midi").toNote(), 
        "2n", 
        Tone.now(), 
        props.velocity * 0.6
      );
      break;
      
    case 3: // 선
    case 4: // 아치
      ambientSynth.triggerAttackRelease(
        Tone.Frequency(props.note, "midi").toNote(), 
        "8n", 
        Tone.now(), 
        props.velocity * 0.3
      );
      break;
  }
}
