const BGM_TRACK = 'Juhani Junkala [Retro Game Music Pack] Level 1.ogg';
const BOSS_BGM_TRACK = 'Juhani Junkala [Retro Game Music Pack] Level 3.ogg';
const EXPLOSION_TRACK = '8bit_bomb_explosion.ogg';
const TAMA_DAMAGE_TRACK = '7.ogg';
const LASER_TRACK = 'laser5.ogg';
const SLOWDOWN_TRACK = 'Jump_00.ogg';
const SLOWDOWN_FULL_TRACK = 'Jump_01.ogg';
const ENEMY_DAMAGE_TRACK = 'Skeleton Roar.ogg';
const FIRE_TRACK = 'qubodupFireLoop.ogg';
const SUPERMAN_POINTS_TRACK = 'Jingle_Win_00.ogg';
const SUPERMAN_FLYING_TRACK = 'Climb_Rope_Loop_00.ogg';
const LEVEL_UP_TRACK = 'Jingle_Achievement_00.ogg';
const HEAL_TRACK = 'Pickup_01.ogg'
const POWERUP_TRACK = 'Pickup_04.ogg'

const audioHandler = (() => {
	const trackNames = [
		BGM_TRACK,
        BOSS_BGM_TRACK,
		EXPLOSION_TRACK,
		TAMA_DAMAGE_TRACK,
		LASER_TRACK,
        SLOWDOWN_TRACK,
        SLOWDOWN_FULL_TRACK,
		ENEMY_DAMAGE_TRACK,
		FIRE_TRACK,
		SUPERMAN_POINTS_TRACK,
		SUPERMAN_FLYING_TRACK,
        LEVEL_UP_TRACK,
        HEAL_TRACK,
        POWERUP_TRACK
	];

	const trackVolumes = new Map([
		[BGM_TRACK, 0.3],
		[BOSS_BGM_TRACK, 0.3],
		[EXPLOSION_TRACK, 2],
		[TAMA_DAMAGE_TRACK, 1],
		[LASER_TRACK, 2],
		[SLOWDOWN_TRACK, 1],
		[SLOWDOWN_FULL_TRACK, 1],
		[ENEMY_DAMAGE_TRACK, 2],
		[FIRE_TRACK, 0.5],
		[SUPERMAN_POINTS_TRACK, 1],
		[SUPERMAN_FLYING_TRACK, 1],
        [LEVEL_UP_TRACK, 1],
        [HEAL_TRACK, 1],
        [POWERUP_TRACK, 1]
	]);

	let tracksMapPromise = null;
	let audioCtx = null;

	const playFunc = (track, loop, volume) => {
		const audioBuffer = track;
		const trackSource = audioCtx.createBufferSource();

		const gainNode = audioCtx.createGain();
		trackSource.loop = loop;
		trackSource.buffer = audioBuffer;
		trackSource.connect(gainNode).connect(audioCtx.destination);

		gainNode.gain.value = volume;

		trackSource.start();
		return trackSource;
	}


	let currentBgm = { name: null, track: null };
	let currentLoopingEffects = [];

	return {
		init: function() {
			if (tracksMapPromise !== null) {
				return;
			}
			tracksMapPromise = (async () => {
				const AudioContext = window.AudioContext || window.webkitAudioContext;
				audioCtx = new AudioContext();
		
				const tracks = await Promise.all(trackNames.map(async trackName => {
					const response = await fetch(`audio/${trackName}`);
					const arrayBuffer = await response.arrayBuffer();
					const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
					return audioBuffer;
				}));
			
				return new Map((() => {
					const result = [];
					for (let i = 0; i < trackNames.length; i++) {
						result.push([trackNames[i], tracks[i]]);
					}
					return result;
				})());
			})();
		},
		playBgm: function(trackName) {
			if (trackName === currentBgm.name) {
				return;
			}
			tracksMapPromise.then(tm => {
				const track = tm.get(trackName);
				if (currentBgm.track !== null) {
					currentBgm.track.stop();
				}
				currentBgm = { name: trackName, track: playFunc(track, true, trackVolumes.get(trackName)) };
			});
		},
		playEffect: function(trackName) {
			tracksMapPromise.then(tm => {
				const track = tm.get(trackName);
				playFunc(track, false, trackVolumes.get(trackName));
			});
		},
		playLoopingEffect: function(trackName) {
			const effectIndex = currentLoopingEffects.findIndex(e => e.name === trackName);
			if (effectIndex >= 0) {
				return;
			}
			tracksMapPromise.then(tm => {
				const track = tm.get(trackName);
				const volume = trackName === ENEMY_DAMAGE_TRACK ? 5 : 1;
				currentLoopingEffects.push({ name: trackName, track: playFunc(track, true, trackVolumes.get(trackName)) });
			});
		},
		stopLoopingEffect: function(trackName) {
			const effectIndex = currentLoopingEffects.findIndex(e => e.name === trackName);
			if (effectIndex >= 0) {
				currentLoopingEffects[effectIndex].track.stop();
				currentLoopingEffects.splice(effectIndex, 1);
			}
		},
		stopAll: function() {
			if (currentBgm.track !== null) {
				currentBgm.track.stop();
				currentBgm = { name: null, track: null };
			}
			currentLoopingEffects.forEach(e => e.track.stop());
			currentLoopingEffects = [];
		}
	};

})();