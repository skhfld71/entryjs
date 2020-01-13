'use strict';

const _includes = require('lodash/includes');
const hardware = require('./hardware/index');
const _union = require('lodash/union');
const _flatten = require('lodash/flatten');

const basicBlockList = [
    require('./block_start'),
    require('./block_flow'),
    require('./block_moving'),
    require('./block_looks'),
    require('./block_brush'),
    require('./block_text'),
    require('./block_sound'),
    require('./block_judgement'),
    require('./block_calc'),
    require('./block_variable'),
    require('./block_func'),
];

Entry.EXPANSION_BLOCK = {};
require('./block_expansion_weather');
require('./block_expansion_festival');
require('./block_expansion_translate');
require('./block_expansion_behaviorconduct_disaster');
require('./block_expansion_behaviorconduct_lifesafety');
require('./block_expansion_tts');
require('./block_expansion_audio');
require('./block_expansion_video');
Entry.EXPANSION_BLOCK_LIST = {
    weather: Entry.Expansion_Weather,
    festival: Entry.EXPANSION_BLOCK.festival,
    translate: Entry.EXPANSION_BLOCK.translate,
    behaviorConductDisaster: Entry.EXPANSION_BLOCK.behaviorConductDisaster,
    behaviorConductLifeSafety: Entry.EXPANSION_BLOCK.behaviorConductLifeSafety,
    tts: Entry.EXPANSION_BLOCK.tts,
    audio: Entry.EXPANSION_BLOCK.audio,
    video: Entry.EXPANSION_BLOCK.video,
};

function getBlockObject(items) {
    const blockObject = {};
    items.forEach((item) => {
        if ('getBlocks' in item) {
            Object.assign(blockObject, item.getBlocks());
        }
    });
    return blockObject;
}

/**
 * 하드웨어 블록을 EntryStatic 에 등록한다.
 * 하드웨어 블록에만 사용하는 이유는,
 * 기존 블록은 legacy 블록이 존재하기 때문에 전부 등록하면 안되기 때문이다.
 * 또한 값블록으로서만 사용하는 블록이 블록메뉴에 따로 나타나게 될 수 있다.
 *
 * @param {Object} hardwareModules
 * @return {void}
 */
function registerHardwareBlockToStatic(hardwareModules) {
    EntryStatic.DynamicHardwareBlocks = _union(
        _flatten(hardwareModules.map((hardware) => hardware.blockMenuBlocks || [])),
        EntryStatic.DynamicHardwareBlocks
    );
}

module.exports = {
    getBlocks() {
        const hardwareModules = hardware.getHardwareModuleList();
        registerHardwareBlockToStatic(hardwareModules);
        const basicAndExpansionBlockObjectList = getBlockObject(
            basicBlockList.concat(Object.values(Entry.EXPANSION_BLOCK_LIST))
        );
        const hardwareBlockObjectList = getBlockObject(hardwareModules);
        return Object.assign({}, basicAndExpansionBlockObjectList, hardwareBlockObjectList);
    },
};
