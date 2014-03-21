// The initProcess sends elements to be created.
//
// __initProcess__
//
// _depends on `elementsComponent`_
//
// - null 'init' -> __IN__
// - __OUT__ -> element 'create'
//
var elementsComponent = [
    //jshint ignore:start
    {type: 'svg', layer: 1, class: 'container', data: {
        version: '1.2', baseProfile: 'tiny', viewBox: '0 0 200 200', 'enable-background': '0 0 200 200'}},
    {type: 'circle', layer: 2, class: 'clock', data: {
        cx: 100, cy: 100, r: 90}},
    {type: 'text', layer: 1, class: 'text', textContent: '12', data: {
        x: 92, y: 30}},
    {type: 'text', layer: 1, class: 'text', textContent: '3', data: {
        x: 175, y: 106}},
    {type: 'text', layer: 1, class: 'text', textContent: '6', data: {
        x: 96, y: 180}},
    {type: 'text', layer: 1, class: 'text', textContent: '9', data: {
        x: 18, y: 106}},
    {type: 'line', layer: 1, class: 'hours', data: {
        x1: 100, y1: 45, x2: 100, y2: 100}},
    {type: 'line', layer: 1, class: 'minutes', data: {
        x1: 100, y1: 25, x2: 100, y2: 100}},
    {type: 'line', layer: 1, class: 'seconds', data: {
        x1: 100, y1: 15, x2: 100, y2: 100}},
    {type: 'circle', layer: 1, class: 'pin', data: {
        cx: 100, cy: 100, r: 2}}
    //jshint ignore:end
];

module.exports = function initProcess( app ) {

    function createElmComponent( element ) {

        app.emit( 'create', element );
    }

    function initComponent() {

        elementsComponent.forEach( createElmComponent );

    }

    app.on( 'init', initComponent );

};