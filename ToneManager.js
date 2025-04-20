// Tone.js 관련 전역 변수
let synth, membraneSynth, metalSynth, noiseSynth;
let pingPongDelay, distortion, reverb;
let sequencer;

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

// Tone.js 설정
function setupTone() {
  try {
    console.log("Tone.js 설정 시작");
    
    // 이펙트 생성
    pingPongDelay = new Tone.PingPongDelay({
      delayTime: 0.25,
      feedback: 0.3,
      wet: 0.2
    }).toDestination();
    
    reverb = new Tone.Reverb({
      decay: 2.5,
      wet: 0.3
    }).connect(pingPongDelay);
    
    distortion = new Tone.Distortion({
      distortion: 0.3,
      wet: 0.2
    }).connect(reverb);
    
    // 신디사이저 생성
    synth = new Tone.PolySynth(Tone.Synth).connect(distortion);
    synth.set({
      envelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.2,
        release: 1
      }
    });
    
    // 드럼 신디사이저
    membraneSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: {
        type: "sine"
      },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 1.4,
        attackCurve: "exponential"
      }
    }).toDestination();
    
    // 메탈 신디사이저
    metalSynth = new Tone.MetalSynth({
      frequency: 200,
      envelope: {
        attack: 0.001,
        decay: 0.2,
        release: 0.3
      },
      harmonicity: 3.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).connect(reverb);
    
    // 노이즈 신디사이저
    noiseSynth = new Tone.NoiseSynth({
      noise: {
        type: "white"
      },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.05,
        release: 0.1
      }
    }).connect(reverb);
    
    // 시퀀서 시작
    startSequence();
    
    console.log("Tone.js 설정 완료");
  } catch (error) {
    console.error("Tone.js 설정 오류:", error);
  }
}

// 시퀀스 시작
function startSequence() {
  // 속도 값에 따라 시퀀스 간격 조정
  const speedValue = map(_speedVal, 0, 100, 1.0, 0.1);
  
  // 시퀀서가 이미 있으면 정지
  if (sequencer) {
    sequencer.stop();
  }
  
  // 드럼 패턴 시퀀스
  const drumPattern = [
    ["C2", null, "G1", null, "C2", null, "G1", "C2"],
    [null, "C3", null, "C3", null, "C3", null, "C3"]
  ];
  
  sequencer = new Tone.Sequence((time, idx) => {
    // 밀도 값에 따라 드럼 히트 확률 조정
    const hitProbability = map(_densityVal, 0, 100, 0.4, 1.0);
    
    // 베이스 드럼 패턴
    if (drumPattern[0][idx] && Math.random() < hitProbability) {
      membraneSynth.triggerAttackRelease(drumPattern[0][idx], "8n", time);
    }
    
    // 하이햇 패턴
    if (drumPattern[1][idx] && Math.random() < hitProbability) {
      const toneModifier = map(_toneVal, 0, 100, 0.5, 2);
      metalSynth.frequency.value = 300 * toneModifier;
      metalSynth.triggerAttackRelease("16n", time);
    }
    
    // 가끔 노이즈 추가
    if (idx % 4 === 0 && Math.random() < 0.3 * (_densityVal / 100)) {
      noiseSynth.triggerAttackRelease("16n", time);
    }
    
  }, [0, 1, 2, 3, 4, 5, 6, 7], "8n");
  
  // 시퀀서 시작
  sequencer.start(0);
  Tone.Transport.bpm.value = 120 * speedValue * 2;
  Tone.Transport.start();
}

// 사운드 트리거 (마우스 클릭 시)
function triggerSound(x, y) {
  try {
    // Tone.js가 시작되지 않았다면 시작
    if (Tone.context.state !== "running") {
      Tone.start();
      setupTone();
      return;
    }
    
    // 위치에 따라 음높이와 볼륨 계산
    let note = calculateNote(x);
    let velocity = map(y, 0, height, 0.8, 0.2);
    
    // 톤 슬라이더 값에 따라 효과 조절
    let toneValue = map(_toneVal, 0, 100, 0, 1);
    distortion.wet.value = toneValue * 0.5;
    reverb.decay = 1 + toneValue * 3;
    
    console.log("사운드 트리거됨:", note, velocity);
    
    // 코드 연주
    playChord(note, velocity);
    
  } catch (error) {
    console.error("사운드 트리거 오류:", error);
  }
}

// 화면 위치에 따른 음높이 계산 (펜타토닉 스케일 사용)
function calculateNote(x) {
  const pentatonicScale = ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5", "G5", "A5"];
  const index = floor(map(x, 0, width, 0, pentatonicScale.length));
  return pentatonicScale[index];
}

// 코드 연주
function playChord(rootNote, velocity) {
  // 기본 음표에 따른 코드 구성
  const noteIndex = Tone.Frequency(rootNote).toMidi();
  
  // 코드 타입 (밀도에 따라 달라짐)
  let chord = [];
  
  if (_densityVal < 33) {
    // 3화음
    chord = [rootNote, Tone.Frequency(noteIndex + 4).toNote(), Tone.Frequency(noteIndex + 7).toNote()];
  } else if (_densityVal < 66) {
    // 4화음
    chord = [rootNote, Tone.Frequency(noteIndex + 4).toNote(), Tone.Frequency(noteIndex + 7).toNote(), Tone.Frequency(noteIndex + 11).toNote()];
  } else {
    // 5화음
    chord = [rootNote, Tone.Frequency(noteIndex + 4).toNote(), Tone.Frequency(noteIndex + 7).toNote(), Tone.Frequency(noteIndex + 11).toNote(), Tone.Frequency(noteIndex + 14).toNote()];
  }
  
  // 코드 재생
  synth.triggerAttackRelease(chord, "8n", Tone.now(), velocity);
}

// 슬라이더 값에 따라 오디오 파라미터 업데이트
function updateToneParameters() {
  if (!synth) return;
  
  const speedValue = map(_speedVal, 0, 100, 0.5, 2);
  const toneValue = map(_toneVal, 0, 100, 0, 1);
  
  // BPM 업데이트
  if (Tone.Transport.state === "started") {
    Tone.Transport.bpm.value = 120 * speedValue * 2;
  }
  
  // 효과 업데이트
  if (distortion) {
    distortion.distortion = 0.2 + toneValue * 0.5;
  }
  
  if (reverb) {
    reverb.wet.value = 0.2 + toneValue * 0.3;
  }
  
  if (pingPongDelay) {
    pingPongDelay.feedback.value = 0.2 + toneValue * 0.3;
  }
}
