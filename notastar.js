"use strict";
const map = [[]];
// 中間点試行回数
const nAttempts = 32;
// 媒介変数の移動間隔
const dt = 1 / 128;
// 各種距離を求める関数たち
const euclidean = (p, q) => Math.hypot(q.lat - p.lat, q.lng - p.lng);
const manhattan = (p, q) => Math.abs(q.lat - p.lat) + Math.abs(q.lng - p.lng);
const chebyshev = (p, q) => Math.max(Math.abs(q.lat - p.lat), Math.abs(q.lng - p.lng));
// XXX: 暫定。この環境以外では仕事をしてくれない
function isReachable(p, q) {
    if (euclidean(p, q) > 50)
        return false; // 遠すぎる
    for (let t = 0; t <= 1; t += dt) {
        const temp = {
            lat: (q.lat - p.lat) * t + p.lat,
            lng: (q.lng - p.lng) * t + p.lng,
        };
        if (map[temp.lng | 0][temp.lat | 0])
            return false;
    }
    return true;
}
// XXX: 暫定。より良いパーマンスを出す関数を書けるかもしれない
function randomPosition(p, q) {
    return {
        lat: (q.lat - p.lat) * Math.random() + p.lat,
        lng: (q.lng - p.lng) * Math.random() + p.lng,
    };
}
// コスト推定関数たち
function g(p, q) {
    if (isReachable(p, q))
        return euclidean(p, q);
    return -1;
}
// 再帰を許すタイプの g 関数
function int_g(p, q, r = 0) {
    if (r > 3)
        return -1;
    if (isReachable(p, q))
        return euclidean(p, q); // 到達可能なら普通に距離
    // 多段中継点経由なら到達できるか？
    for (const i in [...Array(nAttempts)]) {
        const pos = randomPosition(p, q);
        const tmpg = int_g(p, pos, r + 1);
        const tmph = h(pos, q, r + 1);
        if (tmpg !== -1 && tmph !== -1)
            return tmpg + tmph;
    }
    return -1;
}
function h(p, q, r = 0) {
    if (r > 3)
        return -1;
    if (isReachable(p, q))
        return euclidean(p, q); // 到達可能なら普通に距離
    // 多段中継点経由なら到達できるか？
    for (const i in [...Array(nAttempts)]) {
        const pos = randomPosition(p, q);
        const tmpg = int_g(p, pos, r + 1);
        const tmph = h(pos, q, r + 1);
        if (tmpg !== -1 && tmph !== -1)
            return tmpg + tmph;
    }
    return -1;
}
//const h = g;
function calculateCost(p, start, goal) {
    const tmpg = g(start, p);
    const tmph = h(p, goal);
    if (tmpg === -1 || tmph === -1)
        return -1;
    return tmpg + tmph;
}
function escapeFromDeadEnd(start) {
    for (const i in [...Array(nAttempts)]) {
        const pos = randomPosition({ lat: 0, lng: 0 }, { lat: 100, lng: 100 });
        if (isReachable(start, pos))
            return pos;
    }
    return { lat: NaN, lng: NaN };
}
function notAstar(start, goal) {
    if (isReachable(start, goal))
        return goal;
    const relayPoints = [];
    for (const i in [...Array(nAttempts)]) {
        const pos = randomPosition(start, goal);
        const cost = calculateCost(pos, start, goal);
        if (cost !== -1)
            relayPoints.push(Object.assign(Object.assign({}, pos), { cost }));
    }
    const min = relayPoints.reduce((prev, cur) => (prev.cost < cur.cost ? prev : cur), { lat: NaN, lng: NaN, cost: Number.MAX_VALUE });
    if (min.cost == Number.MAX_VALUE)
        return escapeFromDeadEnd(start);
    return min;
}
