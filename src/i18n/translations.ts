import { Language } from '../types/physics';

export interface TranslationSet {
  studioTitle: string;
  reset: string;
  play: string;
  pause: string;
  langToggle: string;
  tabs: {
    vertical: {
      short: string;
      full: string;
    };
    combined: {
      short: string;
      full: string;
    };
    pendulum: {
      short: string;
      full: string;
    };
  };
  common: {
    controlsTitle: string;
    telemetryTitle: string;
    derivationTitle: string;
    mass: string;
    gravity: string;
    amplitude: string;
    period: string;
    frequency: string;
    angularFreq: string;
    displacement: string;
    velocity: string;
    acceleration: string;
    dragHint: string;
    liveMotion: string;
    paused: string;
    dragging: string;
    equilibrate: string;
    pluck: string;
    showVectors: string;
    planetPresets: string;
    unitKg: string;
    unitN: string;
    unitNm: string;
    unitM: string;
    unitCm: string;
    unitS: string;
    unitHz: string;
    unitRadS: string;
    unitMs2: string;
    unitDeg: string;
    unitRad: string;
  };
  module1: {
    springConstant: string;
    staticExtension: string;
    naturalLengthRef: string;
    activeLoadedRig: string;
    naturalLineLabel: string;
    eqLineLabel: string;
    gravityVector: string;
    tensionVector: string;
    netForceVector: string;
    gravityProofTitle: string;
    gravityProofSubtitle: string;
    horizontalPeriod: string;
    verticalPeriod: string;
    difference: string;
    proofConclusion: string;
    vectorBalanceTitle: string;
    kineticEnergy: string;
    potentialEnergy: string;
    totalEnergy: string;
    energyTitle: string;
    derivationLines: string[];
    canvasDragPrompt: string;
    waveformTitle: string;
  };
  module2: {
    modeLabel: string;
    modes: {
      series: string;
      parallel: string;
      opposing: string;
      cutter: string;
    };
    spring1: string;
    spring2: string;
    baseSpringK: string;
    cutSegments: string;
    cutRatioMode: string;
    equalParts: string;
    customRatio: string;
    selectedPart: string;
    partA: string;
    partB: string;
    cutAction: string;
    restoreWhole: string;
    eqSpringConstant: string;
    stiffnessMultiplier: string;
    periodRatio: string;
    forceSharingTitle: string;
    extensionSharingTitle: string;
    seriesRuleNote: string;
    parallelRuleNote: string;
    opposingRuleNote: string;
    cutterRuleNote: string;
    originalLabel: string;
    slicedLabel: string;
    forceOnSpring1: string;
    forceOnSpring2: string;
    extOfSpring1: string;
    extOfSpring2: string;
    totalStaticExt: string;
    derivationSeries: string[];
    derivationParallel: string[];
    derivationOpposing: string[];
    derivationCutter: string[];
  };
  module3: {
    stringLength: string;
    bobMass: string;
    initialAngle: string;
    quickAngles: string;
    showGhostBob: string;
    showForceDecomp: string;
    showMagnifier: string;
    shmSafeZone: string;
    outsideShmZone: string;
    idealPeriod: string;
    exactPeriod: string;
    periodError: string;
    sinTheta: string;
    thetaRad: string;
    approxError: string;
    stringTension: string;
    tangentialForce: string;
    radialWeight: string;
    phaseDrift: string;
    lawsTitle: string;
    law1Title: string;
    law1Valid: string;
    law1Deviating: string;
    law2Title: string;
    law2Desc: string;
    law3Title: string;
    law3Desc: string;
    law4Title: string;
    law4Desc: string;
    errorGaugeTitle: string;
    derivationLines: string[];
    realBobLabel: string;
    ghostBobLabel: string;
    magnifierTitle: string;
    dragBobHint: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationSet> = {
  bn: {
    studioTitle: 'উল্লম্ব স্প্রিং, সমন্বিত স্প্রিং ও সরল দোলক ল্যাব',
    reset: 'রিসেট',
    play: 'চালান',
    pause: 'থামান',
    langToggle: 'English',
    tabs: {
      vertical: {
        short: '১. উল্লম্ব স্প্রিং ও আদি প্রসারণ',
        full: 'মডিউল ১: উল্লম্ব স্প্রিং ও আদি প্রসারণ',
      },
      combined: {
        short: '২. সমন্বিত স্প্রিং ও বিভাজন',
        full: 'মডিউল ২: সমন্বিত স্প্রিং ও স্প্রিং বিভাজন',
      },
      pendulum: {
        short: '৩. সরল দোলক ও ৪° শর্ত',
        full: 'মডিউল ৩: সরল দোলক ও ৪° কোণের শর্ত',
      },
    },
    common: {
      controlsTitle: 'প্যারামিটার ও নিয়ন্ত্রণ',
      telemetryTitle: 'লাইভ পরিমাপ ও বিশ্লেষণ',
      derivationTitle: 'গাণিতিক প্রতিপাদন',
      mass: 'ঝুলন্ত ভর (m)',
      gravity: 'অভিকর্ষজ ত্বরণ (g)',
      amplitude: 'দোলন বিস্তার (A)',
      period: 'দোলনকাল (T)',
      frequency: 'কম্পাঙ্ক (f)',
      angularFreq: 'কৌণিক কম্পাঙ্ক (ω)',
      displacement: 'সরণ (x)',
      velocity: 'বেগ (v)',
      acceleration: 'ত্বরণ (a)',
      dragHint: 'ভরটি মাউস বা টাচ দিয়ে টেনে ছেড়ে দিন',
      liveMotion: 'চলমান স্পন্দন',
      paused: 'স্থির অবস্থা',
      dragging: 'টানা হচ্ছে',
      equilibrate: 'সাম্যাবস্থায় স্থির করুন',
      pluck: 'বিস্তারে ছেড়ে দিন',
      showVectors: 'বল ভেক্টর দেখান',
      planetPresets: 'গ্রহভিত্তিক মান (g)',
      unitKg: 'kg',
      unitN: 'N',
      unitNm: 'N/m',
      unitM: 'm',
      unitCm: 'cm',
      unitS: 's',
      unitHz: 'Hz',
      unitRadS: 'rad/s',
      unitMs2: 'm/s²',
      unitDeg: '°',
      unitRad: 'rad',
    },
    module1: {
      springConstant: 'স্প্রিং ধ্রুবক (k)',
      staticExtension: 'আদি প্রসারণ (e = mg/k)',
      naturalLengthRef: 'মুক্ত স্বাভাবিক দৈর্ঘ্য (L₀)',
      activeLoadedRig: 'সক্রিয় ভারযুক্ত উল্লম্ব স্প্রিং',
      naturalLineLabel: 'স্বাভাবিক প্রান্ত (y₀)',
      eqLineLabel: 'নতুন সাম্যাবস্থা (y_eq)',
      gravityVector: 'ওজন (mg)',
      tensionVector: 'স্প্রিং টান k(e+x)',
      netForceVector: 'প্রত্যয়নী বল (-kx)',
      gravityProofTitle: 'অভিকর্ষ-নিরপেক্ষতা প্রমাণ',
      gravityProofSubtitle: 'g বদলালে শুধু সাম্যাবস্থা e সরে যায়, কিন্তু T অপরিবর্তিত থাকে',
      horizontalPeriod: 'অনুভূমিক T = 2π√(m/k)',
      verticalPeriod: 'উল্লম্ব T = 2π√(e/g)',
      difference: 'পার্থক্য',
      proofConclusion: 'উভয় ক্ষেত্রে T হুবহু সমান; অর্থাৎ উল্লম্ব দোলনকাল g-এর ওপর নির্ভরশীল নয়।',
      vectorBalanceTitle: 'তাৎক্ষণিক বলের ভারসাম্য',
      kineticEnergy: 'গতিশক্তি (KE)',
      potentialEnergy: 'বিভবশক্তি (PE)',
      totalEnergy: 'মোট যান্ত্রিক শক্তি (E)',
      energyTitle: 'শক্তির রূপান্তর',
      derivationLines: [
        'সাম্যাবস্থায়: mg = k·e  ⇒  e = mg / k',
        'সরণ x হলে মোট প্রসারণ = (e + x)',
        'লব্ধি বল: F_net = mg − k(e + x) = −kx',
        'সুতরাং T = 2π√(m/k) = 2π√(e/g)',
      ],
      canvasDragPrompt: 'ভরটি নিচে টেনে ছেড়ে দিন',
      waveformTitle: 'তাৎক্ষণিক সরণ লেখচিত্র x(t)',
    },
    module2: {
      modeLabel: 'সমন্বয় বা বিভাজন ধরন',
      modes: {
        series: 'শ্রেণি সমবায়',
        parallel: 'সমান্তরাল সমবায়',
        opposing: 'বিপরীতমুখী স্প্রিং',
        cutter: 'স্প্রিং বিভাজন (কাঁচি)',
      },
      spring1: 'প্রথম স্প্রিং ধ্রুবক (k₁)',
      spring2: 'দ্বিতীয় স্প্রিং ধ্রুবক (k₂)',
      baseSpringK: 'মূল স্প্রিং ধ্রুবক (k)',
      cutSegments: 'সমান বিভাজন সংখ্যা (n)',
      cutRatioMode: 'বিভাজন পদ্ধতি',
      equalParts: 'সমান n খণ্ড',
      customRatio: 'অনুপাত (১ : ২)',
      selectedPart: 'পরীক্ষিত খণ্ড',
      partA: 'ছোট খণ্ড (১/৩ অংশ)',
      partB: 'বড় খণ্ড (২/৩ অংশ)',
      cutAction: 'কাঁচি দিয়ে কাটুন',
      restoreWhole: 'আগের অবস্থায় ফিরুন',
      eqSpringConstant: 'তুল্য স্প্রিং ধ্রুবক (k_eq)',
      stiffnessMultiplier: 'দৃঢ়তা বৃদ্ধি গুণিতক',
      periodRatio: 'দোলনকাল অনুপাত (T′/T)',
      forceSharingTitle: 'বলের বণ্টন (F₁ বনাম F₂)',
      extensionSharingTitle: 'প্রসারণের বণ্টন (e₁ বনাম e₂)',
      seriesRuleNote: 'শ্রেণি সমবায়ে উভয় স্প্রিংয়ে বল সমান থাকে (F₁ = F₂), প্রসারণ যোগ হয়।',
      parallelRuleNote: 'সমান্তরালে উভয় স্প্রিংয়ের প্রসারণ সমান (x₁ = x₂), বল যোগ হয়।',
      opposingRuleNote: 'দুই দেয়ালের মাঝে ভর সরলে এক স্প্রিং টানে ও অন্যটি ঠেলে দেয় (k_eq = k₁+k₂)।',
      cutterRuleNote: 'দৈর্ঘ্য L/n হলে স্প্রিং ধ্রুবক n গুণ বাড়ে (k′ = nk), দোলনকাল 1/√n গুণ হয়।',
      originalLabel: 'মূল পূর্ণ স্প্রিং (L, k)',
      slicedLabel: 'কর্তিত খণ্ড (L′, k′)',
      forceOnSpring1: '১ম স্প্রিংয়ের বল (F₁)',
      forceOnSpring2: '২য় স্প্রিংয়ের বল (F₂)',
      extOfSpring1: '১ম স্প্রিংয়ের প্রসারণ',
      extOfSpring2: '২য় স্প্রিংয়ের প্রসারণ',
      totalStaticExt: 'মোট আদি প্রসারণ (e_total)',
      derivationSeries: [
        'উভয় স্প্রিংয়ে টান সমান: F₁ = F₂ = F',
        'মোট প্রসারণ: x = x₁ + x₂ = F/k₁ + F/k₂',
        '1/k_s = 1/k₁ + 1/k₂  ⇒  k_s = (k₁k₂)/(k₁+k₂)',
      ],
      derivationParallel: [
        'উভয় স্প্রিংয়ে প্রসারণ সমান: x₁ = x₂ = x',
        'মোট বল: F = F₁ + F₂ = (k₁ + k₂)x',
        'তুল্য ধ্রুবক: k_p = k₁ + k₂',
      ],
      derivationOpposing: [
        'ডানে x সরণে বাম স্প্রিং টানে (−k₁x), ডান স্প্রিং ঠেলে (−k₂x)',
        'মোট প্রত্যয়নী বল: F_net = −(k₁ + k₂)x',
        'তুল্য ধ্রুবক: k_eq = k₁ + k₂',
      ],
      derivationCutter: [
        'একই বলে প্রসারণ দৈর্ঘ্যের সমানুপাতিক: x ∝ l',
        'তাই k ∝ 1/l  ⇒  k·l = ধ্রুবক',
        'n সমান ভাগে কাটলে k′ = n·k এবং T′ = T/√n',
      ],
    },
    module3: {
      stringLength: 'কার্যকরী দৈর্ঘ্য (L)',
      bobMass: 'ববের ভর (m)',
      initialAngle: 'কৌণিক বিস্তার (θ₀)',
      quickAngles: 'দ্রুত কোণ পরীক্ষা',
      showGhostBob: 'আদর্শ SHM ছায়া-বব দেখান',
      showForceDecomp: 'বলের উপাংশ বিশ্লেষণ দেখান',
      showMagnifier: '৪° সূক্ষ্ম কোণ ম্যাগনিফায়ার',
      shmSafeZone: 'আদর্শ SHM অঞ্চল (θ₀ ≤ 4°)',
      outsideShmZone: 'অ-রৈখিক বিচ্যুতি (θ₀ > 4°)',
      idealPeriod: 'আদর্শ T₀ = 2π√(L/g)',
      exactPeriod: 'প্রকৃত দোলনকাল (T_exact)',
      periodError: 'দোলনকাল বিচ্যুতি',
      sinTheta: 'sin(θ₀)',
      thetaRad: 'θ₀ (রেডিয়ান)',
      approxError: 'sin θ ≈ θ ত্রুটি',
      stringTension: 'সুতার টান (T_string)',
      tangentialForce: 'প্রত্যয়নী বল (mg sin θ)',
      radialWeight: 'লম্ব উপাংশ (mg cos θ)',
      phaseDrift: 'দশা পার্থক্য (Δφ)',
      lawsTitle: 'সরল দোলকের ৪টি সূত্র যাচাই',
      law1Title: '১. সমকাল সূত্র (θ₀ ≤ 4°)',
      law1Valid: 'বৈধ — ক্ষুদ্র কোণে T কৌণিক বিস্তারের ওপর নির্ভর করে না',
      law1Deviating: 'বিচ্যুত — কোণ ৪° ছাড়িয়ে যাওয়ায় প্রকৃত T বেড়ে গেছে',
      law2Title: '২. দৈর্ঘ্যের সূত্র (T ∝ √L)',
      law2Desc: 'L ও g স্থির অনুপাতে T₀ / √L ধ্রুবক থাকে',
      law3Title: '৩. অভিকর্ষজ ত্বরণের সূত্র (T ∝ 1/√g)',
      law3Desc: 'T₀ · √g = 2π√L সর্বদা ধ্রুবক',
      law4Title: '৪. ভরের সূত্র (ভর-নিরপেক্ষতা)',
      law4Desc: 'ভর m পরিবর্তন করলে সুতার টান বদলায়, কিন্তু T অপরিবর্তিত থাকে (০.০০% পরিবর্তন)',
      errorGaugeTitle: 'ক্ষুদ্র কোণ শর্ত (sin θ বনাম θ)',
      derivationLines: [
        'স্পর্শকীয় বল: F_t = −mg sin θ',
        'যখন θ ≤ 4° (0.0698 rad), তখন sin θ ≈ θ',
        'তাই a ≈ −(g/L)x  ⇒  T₀ = 2π√(L/g)',
        'সুতার টান: T_string = mg cos θ + mv²/L',
      ],
      realBobLabel: 'প্রকৃত (RK4)',
      ghostBobLabel: 'আদর্শ SHM',
      magnifierTitle: 'কেন্দ্রীয় ±৪° জুম দৃশ্য',
      dragBobHint: 'ববটি যেকোনো কোণে টেনে ছেড়ে দিন',
    },
  },
  en: {
    studioTitle: 'Vertical Spring, Combined Springs & Simple Pendulum Dynamics Studio',
    reset: 'Reset',
    play: 'Play',
    pause: 'Pause',
    langToggle: 'বাংলা',
    tabs: {
      vertical: {
        short: '1. Vertical Spring & Extension',
        full: 'Module 1: Vertical Spring-Mass & Static Extension',
      },
      combined: {
        short: '2. Combined Springs & Cutting',
        full: 'Module 2: Series/Parallel Springs & Spring Cutting',
      },
      pendulum: {
        short: '3. Simple Pendulum & 4° Rule',
        full: 'Module 3: Simple Pendulum & Small-Angle Approximation',
      },
    },
    common: {
      controlsTitle: 'Parameters & Controls',
      telemetryTitle: 'Live Telemetry & Analyzers',
      derivationTitle: 'Mathematical Derivation',
      mass: 'Hanging Mass (m)',
      gravity: 'Gravity (g)',
      amplitude: 'Amplitude (A)',
      period: 'Time Period (T)',
      frequency: 'Frequency (f)',
      angularFreq: 'Angular Freq (ω)',
      displacement: 'Displacement (x)',
      velocity: 'Velocity (v)',
      acceleration: 'Acceleration (a)',
      dragHint: 'Drag the mass with mouse or touch and release',
      liveMotion: 'Oscillating',
      paused: 'Paused',
      dragging: 'Dragging',
      equilibrate: 'Settle at Equilibrium',
      pluck: 'Release from Amplitude',
      showVectors: 'Show Force Vectors',
      planetPresets: 'Gravity Presets (g)',
      unitKg: 'kg',
      unitN: 'N',
      unitNm: 'N/m',
      unitM: 'm',
      unitCm: 'cm',
      unitS: 's',
      unitHz: 'Hz',
      unitRadS: 'rad/s',
      unitMs2: 'm/s²',
      unitDeg: '°',
      unitRad: 'rad',
    },
    module1: {
      springConstant: 'Spring Constant (k)',
      staticExtension: 'Static Extension (e = mg/k)',
      naturalLengthRef: 'Unloaded Natural Length (L₀)',
      activeLoadedRig: 'Active Loaded Vertical Spring',
      naturalLineLabel: 'Natural Tip (y₀)',
      eqLineLabel: 'Static Equilibrium (y_eq)',
      gravityVector: 'Weight (mg)',
      tensionVector: 'Spring Tension k(e+x)',
      netForceVector: 'Restoring Force (-kx)',
      gravityProofTitle: 'Gravity-Independence Proof',
      gravityProofSubtitle: 'Changing g shifts equilibrium e, yet oscillation period T remains invariant',
      horizontalPeriod: 'Horizontal T = 2π√(m/k)',
      verticalPeriod: 'Vertical T = 2π√(e/g)',
      difference: 'Delta',
      proofConclusion: 'Both periods match identically; vertical oscillation period is independent of g.',
      vectorBalanceTitle: 'Instantaneous Force Balance',
      kineticEnergy: 'Kinetic Energy (KE)',
      potentialEnergy: 'Potential Energy (PE)',
      totalEnergy: 'Total Mechanical Energy (E)',
      energyTitle: 'Energy Conservation',
      derivationLines: [
        'At equilibrium: mg = k·e  ⇒  e = mg / k',
        'At displacement x, total stretch = (e + x)',
        'Net force: F_net = mg − k(e + x) = −kx',
        'Hence T = 2π√(m/k) = 2π√(e/g)',
      ],
      canvasDragPrompt: 'Pull mass down and release',
      waveformTitle: 'Live Displacement Waveform x(t)',
    },
    module2: {
      modeLabel: 'Spring Configuration',
      modes: {
        series: 'Series Combination',
        parallel: 'Parallel Combination',
        opposing: 'Opposing Wall Springs',
        cutter: 'Spring Cutter Tool',
      },
      spring1: 'Spring 1 Constant (k₁)',
      spring2: 'Spring 2 Constant (k₂)',
      baseSpringK: 'Original Spring Constant (k)',
      cutSegments: 'Equal Segments (n)',
      cutRatioMode: 'Cutting Mode',
      equalParts: 'Equal n Parts',
      customRatio: 'Ratio Cut (1 : 2)',
      selectedPart: 'Active Segment',
      partA: 'Short Piece (1/3 L)',
      partB: 'Long Piece (2/3 L)',
      cutAction: 'Slice with Scissors',
      restoreWhole: 'Restore Uncut Spring',
      eqSpringConstant: 'Equivalent Constant (k_eq)',
      stiffnessMultiplier: 'Stiffness Multiplier',
      periodRatio: 'Period Ratio (T′/T)',
      forceSharingTitle: 'Force Distribution (F₁ vs F₂)',
      extensionSharingTitle: 'Extension Distribution (e₁ vs e₂)',
      seriesRuleNote: 'In Series, both springs carry identical tension (F₁ = F₂) while extensions add up.',
      parallelRuleNote: 'In Parallel, both springs share identical extension (x₁ = x₂) while forces add up.',
      opposingRuleNote: 'Between opposing walls, one pulls and one pushes: F_net = −(k₁ + k₂)x.',
      cutterRuleNote: 'Cutting length to L/n multiplies stiffness by n (k′ = nk) and scales T′ = T/√n.',
      originalLabel: 'Original Spring (L, k)',
      slicedLabel: 'Sliced Segment (L′, k′)',
      forceOnSpring1: 'Force on Spring 1 (F₁)',
      forceOnSpring2: 'Force on Spring 2 (F₂)',
      extOfSpring1: 'Extension of Spring 1',
      extOfSpring2: 'Extension of Spring 2',
      totalStaticExt: 'Total Static Extension (e_total)',
      derivationSeries: [
        'Shared tension: F₁ = F₂ = F',
        'Total extension: x = x₁ + x₂ = F/k₁ + F/k₂',
        '1/k_s = 1/k₁ + 1/k₂  ⇒  k_s = (k₁k₂)/(k₁+k₂)',
      ],
      derivationParallel: [
        'Shared extension: x₁ = x₂ = x',
        'Total restoring force: F = F₁ + F₂ = (k₁ + k₂)x',
        'Equivalent stiffness: k_p = k₁ + k₂',
      ],
      derivationOpposing: [
        'Displacing right by x: left pulls (−k₁x), right pushes (−k₂x)',
        'Net restoring force: F_net = −(k₁ + k₂)x',
        'Equivalent stiffness: k_eq = k₁ + k₂',
      ],
      derivationCutter: [
        'Under equal tension, stretch scales with length: x ∝ l',
        'Thus stiffness k ∝ 1/l  ⇒  k·l = constant',
        'Cutting into n equal parts: k′ = n·k, T′ = T/√n',
      ],
    },
    module3: {
      stringLength: 'Pendulum Length (L)',
      bobMass: 'Bob Mass (m)',
      initialAngle: 'Release Angle (θ₀)',
      quickAngles: 'Quick Angle Tests',
      showGhostBob: 'Show Ideal SHM Ghost Bob',
      showForceDecomp: 'Show Force Decomposition',
      showMagnifier: '4° Angle Magnifier Inset',
      shmSafeZone: 'SHM Safe Zone (θ₀ ≤ 4°)',
      outsideShmZone: 'Non-Linear Regime (θ₀ > 4°)',
      idealPeriod: 'Ideal T₀ = 2π√(L/g)',
      exactPeriod: 'Exact Period (T_exact)',
      periodError: 'Period Deviation',
      sinTheta: 'sin(θ₀)',
      thetaRad: 'θ₀ (radians)',
      approxError: 'sin θ ≈ θ Error',
      stringTension: 'String Tension (T_string)',
      tangentialForce: 'Restoring Force (mg sin θ)',
      radialWeight: 'Radial Weight (mg cos θ)',
      phaseDrift: 'Phase Lag (Δφ)',
      lawsTitle: '4 Laws of Simple Pendulum Verifier',
      law1Title: '1. Law of Isochronism (θ₀ ≤ 4°)',
      law1Valid: 'VALID — Period is independent of small amplitude',
      law1Deviating: 'DEVIATING — Large angle increases actual period',
      law2Title: '2. Law of Length (T ∝ √L)',
      law2Desc: 'Invariant ratio T₀ / √L holds constant for fixed g',
      law3Title: '3. Law of Gravity (T ∝ 1/√g)',
      law3Desc: 'Invariant product T₀ · √g = 2π√L remains constant',
      law4Title: '4. Law of Mass (Mass Independence)',
      law4Desc: 'Changing bob mass m alters tension T_string, not period T (0.00% change)',
      errorGaugeTitle: 'Small-Angle Approximation (sin θ vs θ)',
      derivationLines: [
        'Tangential restoring force: F_t = −mg sin θ',
        'For θ ≤ 4° (0.0698 rad), sin θ ≈ θ',
        'Hence a ≈ −(g/L)x  ⇒  T₀ = 2π√(L/g)',
        'String tension: T_string = mg cos θ + mv²/L',
      ],
      realBobLabel: 'Real (RK4)',
      ghostBobLabel: 'Ideal SHM',
      magnifierTitle: 'Central ±4° Precision Zoom',
      dragBobHint: 'Drag bob to any angle θ₀ and release',
    },
  },
};
