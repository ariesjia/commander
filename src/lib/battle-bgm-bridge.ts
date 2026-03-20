/**
 * 战斗页 BGM 与 MechaBattle 朗读共用：朗读时可压低 BGM，两者同时播放、互不 cancel。
 */
export const BATTLE_BGM_DEFAULT_VOLUME = 0.22;
const BATTLE_BGM_DUCKED_VOLUME = 0.07;

let registered: HTMLAudioElement | null = null;

export function registerBattleBgmEl(audio: HTMLAudioElement | null) {
  registered = audio;
  if (audio) audio.volume = BATTLE_BGM_DEFAULT_VOLUME;
}

export function setBattleBgmDucked(ducked: boolean) {
  if (!registered) return;
  registered.volume = ducked ? BATTLE_BGM_DUCKED_VOLUME : BATTLE_BGM_DEFAULT_VOLUME;
}
