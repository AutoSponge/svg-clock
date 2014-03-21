// keep the interface fluent
function SVG( config ) {

    if ( !(this instanceof SVG) ) {

        return new SVG( config );

    }

    this.config = config;

    this.create()
        .set( 'class', this.config.class )
        .setText()
        .setData()
        .register()
        .appendTo( this.config.layer );
}

// store layers as a class property
SVG.layers = [document.getElementsByTagName( 'body' )[0]];

SVG.prototype = {

    create: function () {

        this.elm = document.createElementNS( 'http://www.w3.org/2000/svg', this.config.type );

        return this;

    },
    set: function ( prop, val ) {

        this.elm.setAttribute( prop, val );

        return this;

    },
    getLayer: function ( layerId ) {

        this.layer = SVG.layers[layerId];

        if ( !this.layer ) {

            SVG.layers[layerId] = this.elm;

            this.layer = SVG.layers[layerId - 1];

        }

        return this;

    },
    appendTo: function ( layerId ) {

        this.getLayer( layerId );

        this.layer.appendChild( this.elm );

        return this;

    },
    setText: function () {

        if ( this.config.textContent ) {

            this.elm.appendChild( document.createTextNode( this.config.textContent ) );

        }

        return this;

    },
    getConfigData: function () {

        return this.config.data || {};

    },
    setData: function () {

        var prop;

        for ( prop in  this.getConfigData() ) {

            if ( this.config.data.hasOwnProperty( prop ) ) {

                this.set( prop, this.config.data[prop] );

            }
        }

        return this;

    },
    register: function () {

        SVG[this.config.class] = this;

        return this;

    },
    rotate: function ( degrees, transition ) {

        var origin = 'transform-origin: 100 100;',

            transform = 'transform:rotate(' + degrees + 'deg);',

            style = origin + transform +
                '-ms-' + origin +
                '-ms-' + transform +
                '-webkit-' + origin +
                '-webkit-' + transform;

        if ( transition === false ) {

            style += 'transition: none;';

        }

        return this.set( 'style', style );

    }
};

module.exports = SVG;