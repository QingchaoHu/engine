describe("pc.TextElement", function () {
    var app;
    var assets;
    var entity;
    var element;
    var fontAsset;
    var canvas;

    beforeEach(function (done) {
        canvas = document.createElement("canvas");
        app = new pc.Application(canvas);
        buildElement(done);
    });


    afterEach(function () {
        fontAsset.unload();
        fontAsset = null;
        app.destroy();
        app = null;
        canvas = null;
    });

    var buildElement = function (callback) {
        entity = new pc.Entity("myEntity", app);
        element = app.systems.element.addComponent(entity, { type: pc.ELEMENTTYPE_TEXT });
        element.autoWidth = false;
        element.wrapLines = true;
        element.width = 200;

        fontAsset = new pc.Asset("Arial", "font", {
            url: "base/examples/assets/Arial/Arial.json"
        });

        fontAsset.ready(function () {
            // use timeout to prevent tests running inside ready() callback (so events are cleared on asset)
            setTimeout(function () {
                callback();
            })
        });

        app.assets.add(fontAsset);
        app.assets.load(fontAsset);

        app.root.addChild(entity);

        assets = {
            font: fontAsset
        };
    };

    var assertLineContents = function (expectedLineContents) {
        expect(element.lines.length).to.equal(expectedLineContents.length);
        expect(element.lines).to.deep.equal(expectedLineContents);
    };

    it("does not break onto multiple lines if the text is short enough", function () {
        element.fontAsset = fontAsset;

        element.text = "abcde fghij";
        assertLineContents(["abcde fghij"]);
    });

    it("does not break onto multiple lines if the autoWidth is set to true", function () {
        element.fontAsset = fontAsset;

        element.autoWidth = true;
        element.text = "abcde fghij klmno pqrst uvwxyz";
        assertLineContents(["abcde fghij klmno pqrst uvwxyz"]);
    });

    it("updates line wrapping once autoWidth becomes false and a width is set", function () {
        element.fontAsset = fontAsset;

        element.autoWidth = true;
        element.text = "abcde fghij klmno pqrst uvwxyz";
        expect(element.lines.length).to.equal(1);
        element.autoWidth = false;
        element.width = 200;
        expect(element.lines.length).to.equal(3);
    });

    it("does not break onto multiple lines if the wrapLines is set to false", function () {
        element.fontAsset = fontAsset;

        element.wrapLines = false;
        element.text = "abcde fghij klmno pqrst uvwxyz";
        assertLineContents(["abcde fghij klmno pqrst uvwxyz"]);
    });

    it("updates line wrapping once wrapLines becomes true", function () {
        element.fontAsset = fontAsset;

        element.wrapLines = false;
        element.text = "abcde fghij klmno pqrst uvwxyz";
        expect(element.lines.length).to.equal(1);
        element.wrapLines = true;
        expect(element.lines.length).to.equal(3);
    });

    it("breaks onto multiple lines if individual lines are too long", function () {
        element.fontAsset = fontAsset;

        element.text = "abcde fghij klmno pqrst uvwxyz";
        assertLineContents([
            "abcde fghij ",
            "klmno pqrst ",
            "uvwxyz"
        ]);
    });

    it("breaks individual words if they are too long to fit onto a line by themselves (single word case)", function () {
        element.fontAsset = fontAsset;

        element.text = "abcdefghijklmnopqrstuvwxyz";
        assertLineContents([
            "abcdefghijklm",
            "nopqrstuvwxy",
            "z"
        ]);
    });

    it("breaks individual words if they are too long to fit onto a line by themselves (multi word case)", function () {
        element.fontAsset = fontAsset;

        element.text = "abcdefgh ijklmnopqrstuvwxyz";
        assertLineContents([
            "abcdefgh ",
            "ijklmnopqrstu",
            "vwxyz"
        ]);
    });

    it("breaks individual characters onto separate lines if the width is really constrained", function () {
        element.fontAsset = fontAsset;

        element.width = 1;
        element.text = "abcdef ghijkl";
        assertLineContents([
            "a",
            "b",
            "c",
            "d",
            "e",
            "f ",
            "g",
            "h",
            "i",
            "j",
            "k",
            "l"
        ]);
    });

    it("does not include whitespace at the end of a line in width calculations", function () {
        element.fontAsset = fontAsset;

        element.text = "abcdefgh        i";
        assertLineContents([
            "abcdefgh        ",
            "i"
        ]);
    });

    it("breaks words on hypens", function () {
        element.fontAsset = fontAsset;

        element.text = "abcde fghij-klm nopqr stuvwxyz";
        assertLineContents([
            "abcde fghij-",
            "klm nopqr ",
            "stuvwxyz"
        ]);
    });

    it("keeps hyphenated word segments together when wrapping them", function () {
        element.fontAsset = fontAsset;

        element.width = 150;
        element.text = "abcde fghij-klm nopqr stuvwxyz";
        assertLineContents([
            "abcde ",
            "fghij-klm ",
            "nopqr ",
            "stuvwxyz"
        ]);
    });

    it("splits lines on \\n", function () {
        element.fontAsset = fontAsset;

        element.text = "abcde\nfghij";
        assertLineContents([
            "abcde",
            "fghij"
        ]);
    });

    it("splits lines on \\r", function () {
        element.fontAsset = fontAsset;

        element.text = "abcde\rfghij";
        assertLineContents([
            "abcde",
            "fghij"
        ]);
    });

    it("splits lines on multiple \\n", function () {
        element.fontAsset = fontAsset;

        element.text = "abcde\n\n\nfg\nhij";
        assertLineContents([
            "abcde",
            "",
            "",
            "fg",
            "hij"
        ]);
    });

    it('AssetRegistry events unbound on destroy for font asset', function () {
        var e = new pc.Entity();

        e.addComponent('element', {
            type: 'text',
            fontAsset: 123456
        });

        expect(app.assets.hasEvent('add:123456')).to.be.true;

        e.destroy();

        expect(app.assets.hasEvent('add:123456')).to.be.false;
    });


    it('Font assets unbound when reset', function () {
        expect(assets.font.hasEvent('add')).to.be.false;
        expect(assets.font.hasEvent('change')).to.be.false;
        expect(assets.font.hasEvent('load')).to.be.false;
        expect(assets.font.hasEvent('remove')).to.be.false;

        var e = new pc.Entity();
        e.addComponent('element', {
            type: 'text',
            fontAsset: assets.font
        });

        e.element.fontAsset = null;

        expect(assets.font.hasEvent('add')).to.be.false;
        expect(assets.font.hasEvent('change')).to.be.false;
        expect(assets.font.hasEvent('load')).to.be.false;
        expect(assets.font.hasEvent('remove')).to.be.false;
    });

    it('Font assets unbound when destroy', function () {
        expect(assets.font.hasEvent('add')).to.be.false;
        expect(assets.font.hasEvent('change')).to.be.false;
        expect(assets.font.hasEvent('load')).to.be.false;
        expect(assets.font.hasEvent('remove')).to.be.false;

        var e = new pc.Entity();
        e.addComponent('element', {
            type: 'text',
            fontAsset: assets.font
        });

        e.destroy();

        expect(assets.font.hasEvent('add')).to.be.false;
        expect(assets.font.hasEvent('change')).to.be.false;
        expect(assets.font.hasEvent('load')).to.be.false;
        expect(assets.font.hasEvent('remove')).to.be.false;
    });

    it('Font assets to be bound once when enabled late', function () {
        expect(assets.font.hasEvent('add')).to.be.false;
        expect(assets.font.hasEvent('change')).to.be.false;
        expect(assets.font.hasEvent('load')).to.be.false;
        expect(assets.font.hasEvent('remove')).to.be.false;

        var e = new pc.Entity();
        e.enabled = false;
        e.addComponent('element', {
            type: 'text',
            fontAsset: assets.font
        });
        app.root.addChild(e);

        e.enabled = true;

        e.element.fontAsset = null;

        expect(assets.font.hasEvent('add')).to.be.false;
        expect(assets.font.hasEvent('change')).to.be.false;
        expect(assets.font.hasEvent('load')).to.be.false;
        expect(assets.font.hasEvent('remove')).to.be.false;
    });

    it("defaults to white color and opacity 1", function () {
        expect(element.color.r).to.equal(1);
        expect(element.color.g).to.equal(1);
        expect(element.color.b).to.equal(1);
        expect(element.opacity).to.equal(1);

        var meshes = element._text._model.meshInstances;
        for (var i = 0; i < meshes.length; i++) {
            var color = meshes[i].getParameter('material_emissive').data;
            expect(color[0]).to.equal(1);
            expect(color[1]).to.equal(1);
            expect(color[2]).to.equal(1);

            var opacity = meshes[i].getParameter('material_opacity').data;
            expect(opacity).to.equal(1);
        }
    });

    it("uses color and opacity passed in addComponent data", function () {
        var e = new pc.Entity();
        e.addComponent('element', {
            type: 'text',
            text: 'test',
            fontAsset: element.fontAsset,
            color: [0.1, 0.2, 0.3],
            opacity: 0.4
        });

        expect(e.element.color.r).to.be.closeTo(0.1, 0.001);
        expect(e.element.color.g).to.be.closeTo(0.2, 0.001);
        expect(e.element.color.b).to.be.closeTo(0.3, 0.001);
        expect(e.element.opacity).to.be.closeTo(0.4, 0.001);

        var meshes = e.element._text._model.meshInstances;
        for (var i = 0; i < meshes.length; i++) {
            var color = meshes[i].getParameter('material_emissive').data;
            expect(color[0]).to.be.closeTo(0.1, 0.001);
            expect(color[1]).to.be.closeTo(0.2, 0.001);
            expect(color[2]).to.be.closeTo(0.3, 0.001);

            var opacity = meshes[i].getParameter('material_opacity').data;
            expect(opacity).to.be.closeTo(0.4, 0.001);
        }
    });

    it("changes color", function () {
        element.color = new pc.Color(0.1, 0.2, 0.3);

        expect(element.color.r).to.be.closeTo(0.1, 0.001);
        expect(element.color.g).to.be.closeTo(0.2, 0.001);
        expect(element.color.b).to.be.closeTo(0.3, 0.001);
        expect(element.opacity).to.be.closeTo(1, 0.001);

        var meshes = element._text._model.meshInstances;
        for (var i = 0; i < meshes.length; i++) {
            var color = meshes[i].getParameter('material_emissive').data;
            expect(color[0]).to.be.closeTo(0.1, 0.001);
            expect(color[1]).to.be.closeTo(0.2, 0.001);
            expect(color[2]).to.be.closeTo(0.3, 0.001);

            var opacity = meshes[i].getParameter('material_opacity').data;
            expect(opacity).to.be.closeTo(1, 0.001);
        }
    });

    it("changes opacity", function () {
        element.opacity = 0.4;
        expect(element.opacity).to.be.closeTo(0.4, 0.001);

        var meshes = element._text._model.meshInstances;
        for (var i = 0; i < meshes.length; i++) {
            var opacity = meshes[i].getParameter('material_opacity').data;
            expect(opacity).to.be.closeTo(0.4, 0.001);
        }
    });


    it("cloned text component is complete", function () {
        var e = new pc.Entity();

        e.addComponent('element', {
            type: 'text',
            text: 'test',
            fontAsset: assets.font
        });

        var clone = e.clone();


        expect(e.element.fontAsset).to.be.ok;

        expect(clone.text).to.equal(e.text);
        expect(clone.fontAsset).to.equal(e.fontAsset);
        expect(clone.font).to.equal(e.font);
        expect(clone.color).to.deep.equal(e.color);
        expect(clone.spacing).to.equal(e.spacing);
        expect(clone.fontSize).to.equal(e.fontSize);
        expect(clone.lineHeight).to.equal(e.lineHeight);
        expect(clone.alignment).to.equal(e.alignment);
        expect(clone.wrapLine).to.equal(e.wrapLines);
        expect(clone.autoWidth).to.equal(e.autoWidth);
        expect(clone.autoHeight).to.equal(e.autoHeight);
    });

    it("clears font asset when font is assigned directly", function () {
        var e = new pc.Entity();

        e.addComponent('element', {
            type: 'text',
            text: '',
            fontAsset: assets.font
        });

        var font = new pc.CanvasFont(app);
        font.createTextures(' ');

        e.element.font = font;

        expect(e.element.font).to.equal(font);
        expect(e.element.fontAsset).to.equal(null);
    });


    it('Offscreen element is culled', function () {
        var canvasWidth = app.graphicsDevice.width;
        var canvasHeight = app.graphicsDevice.height;

        var screen = new pc.Entity();
        screen.addComponent('screen', {
            screenSpace: true
        });
        app.root.addChild(screen);

        var e = new pc.Entity();
        e.addComponent('element', {
            type: 'text',
            text: "test",
            fontAsset: fontAsset,
            autoWidth: false,
            autoHeight: false,
            width: 100,
            height: 100,
            pivot: [0.5,0.5]
        });
        screen.addChild(e);

        var camera = new pc.Entity();
        camera.addComponent('camera');
        app.root.addChild(camera);

        // update transform
        app.update(0.1);
        app.render();

        var meshInstance = e.element._text._model.meshInstances[0];

        expect(e.element.isVisibleForCamera(camera.camera.camera)).to.be.true;

        // move just off screen
        e.translateLocal(canvasWidth+(100/2)+0.001,0,0);

        app.update(0.1);
        app.render();
        expect(e.element.isVisibleForCamera(camera.camera.camera)).to.be.false;

        // move just on screen
        e.translateLocal(-1, 0, 0);

        app.update(0.1);
        app.render();
        expect(e.element.isVisibleForCamera(camera.camera.camera)).to.be.true;

    });

    it('Offscreen autowidth element is culled', function () {
        var canvasWidth = app.graphicsDevice.width;
        var canvasHeight = app.graphicsDevice.height;

        var screen = new pc.Entity();
        screen.addComponent('screen', {
            screenSpace: true
        });
        app.root.addChild(screen);

        var e = new pc.Entity();
        e.addComponent('element', {
            type: 'text',
            text: "test",
            fontAsset: fontAsset,
            autoWidth: true,
            autoHeight: false,
            width: 100,
            height: 100,
            pivot: [0.5,0.5]
        });
        screen.addChild(e);

        var camera = new pc.Entity();
        camera.addComponent('camera');
        app.root.addChild(camera);

        // update transform
        app.update(0.1);
        app.render();

        var meshInstance = e.element._text._model.meshInstances[0];

        expect(e.element.isVisibleForCamera(camera.camera.camera)).to.be.true;

        // move just off screen
        e.translateLocal(canvasWidth+(e.element.width/2)+0.001,0,0);

        app.update(0.1);
        app.render();
        expect(e.element.isVisibleForCamera(camera.camera.camera)).to.be.false;

        // move just on screen
        e.translateLocal(-1, 0, 0);

        app.update(0.1);
        app.render();
        expect(e.element.isVisibleForCamera(camera.camera.camera)).to.be.true;
    });

    it('Offscreen child element is culled', function () {
        var canvasWidth = app.graphicsDevice.width;
        var canvasHeight = app.graphicsDevice.height;

        var screen = new pc.Entity();
        screen.addComponent('screen', {
            screenSpace: true
        });
        app.root.addChild(screen);

        var parent = new pc.Entity();
        parent.addComponent('element', {
            type: 'text',
            text: "test",
            fontAsset: fontAsset,
            autoWidth: false,
            autoHeight: false,
            width: 100,
            height: 100,
            pivot: [0.5,0.5]
        });
        screen.addChild(parent);

        var e = new pc.Entity();
        e.addComponent('element', {
            type: 'text',
            text: "test",
            fontAsset: fontAsset,
            autoWidth: false,
            autoHeight: false,
            width: 100,
            height: 100,
            pivot: [0.5,0.5]
        });
        parent.addChild(e);

        var camera = new pc.Entity();
        camera.addComponent('camera');
        app.root.addChild(camera);

        var meshInstance = e.element._text._model.meshInstances[0];

        // update transform
        app.update(0.1);
        app.render();
        expect(e.element.isVisibleForCamera(camera.camera.camera)).to.be.true;

        // move just off screen
        parent.translateLocal(50, 50, 0);
        e.translateLocal(351, 50, 0);

        // update transform
        app.update(0.1);
        app.render();
        expect(e.element.isVisibleForCamera(camera.camera.camera)).to.be.false;
    });


    it('Offscreen rotated element is culled', function () {
        var canvasWidth = app.graphicsDevice.width;
        var canvasHeight = app.graphicsDevice.height;

        var screen = new pc.Entity();
        screen.addComponent('screen', {
            screenSpace: true
        });
        app.root.addChild(screen);

        var e = new pc.Entity();
        e.addComponent('element', {
            type: 'text',
            text: "test",
            fontAsset: fontAsset,
            autoWidth: false,
            autoHeight: false,
            width: 100,
            height: 100,
            pivot: [0.5,0.5]
        });
        screen.addChild(e);

        var camera = new pc.Entity();
        camera.addComponent('camera');
        app.root.addChild(camera);

        // move just off screen (when rotated 45°)
        e.translateLocal(300 + (50*Math.sqrt(2)), 0, 0);
        e.rotateLocal(0, 0, 45);

        var meshInstance = e.element._text._model.meshInstances[0];

        // update transform
        app.update(0.1);
        app.render();
        expect(e.element.isVisibleForCamera(camera.camera.camera)).to.be.false;
    });

    it('Offscreen rotated out of plane is culled', function () {
        var canvasWidth = app.graphicsDevice.width;
        var canvasHeight = app.graphicsDevice.height;

        var screen = new pc.Entity();
        screen.addComponent('screen', {
            screenSpace: true
        });
        app.root.addChild(screen);

        var e = new pc.Entity();
        e.addComponent('element', {
            type: 'text',
            text: "test",
            fontAsset: fontAsset,
            autoWidth: false,
            autoHeight: false,
            width: 100,
            height: 100,
            pivot: [0.5,0.5]
        });
        screen.addChild(e);

        var camera = new pc.Entity();
        camera.addComponent('camera');
        app.root.addChild(camera);

        // move just off screen (when rotated 45°)
        e.translateLocal(300, 0, 0);
        e.rotateLocal(0, 90, 0);

        var meshInstance = e.element._text._model.meshInstances[0];

        // update transform
        app.update(0.1);
        app.render();
        expect(e.element.isVisibleForCamera(camera.camera.camera)).to.be.false;
    });
});
