/**
 * Call/chat coin rates: hosts follow global Setting unless useCustomCallRates is true.
 */

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * @param {object} host - lean host doc (may be missing useCustomCallRates → treated as global)
 * @param {object} setting - global.settingJSON or Setting doc
 * @returns {{ randomCallRate, randomCallFemaleRate, randomCallMaleRate, privateCallRate, audioCallRate, chatRate }}
 */
function resolveHostCallRates(host, setting) {
  const s = setting || {};
  if (host && (host.useCustomCallRates === true || host.isFake === true)) {
    return {
      randomCallRate: num(host.randomCallRate, num(s.generalRandomCallRate, 0)),
      randomCallFemaleRate: num(host.randomCallFemaleRate, num(s.femaleRandomCallRate, 0)),
      randomCallMaleRate: num(host.randomCallMaleRate, num(s.maleRandomCallRate, 0)),
      privateCallRate: num(host.privateCallRate, num(s.videoPrivateCallRate, 0)),
      audioCallRate: num(host.audioCallRate, num(s.audioPrivateCallRate, 0)),
      chatRate: num(host.chatRate, num(s.chatInteractionRate, 0)),
    };
  }
  return {
    randomCallRate: num(s.generalRandomCallRate, 0),
    randomCallFemaleRate: num(s.femaleRandomCallRate, 0),
    randomCallMaleRate: num(s.maleRandomCallRate, 0),
    privateCallRate: num(s.videoPrivateCallRate, 0),
    audioCallRate: num(s.audioPrivateCallRate, 0),
    chatRate: num(s.chatInteractionRate, 0),
  };
}

function hostWithEffectiveCallRates(host, setting) {
  if (!host) return host;
  const eff = resolveHostCallRates(host, setting);
  return { ...host, ...eff };
}

module.exports = { resolveHostCallRates, hostWithEffectiveCallRates };
