var camera, scene, renderer;
var geometry, material, mesh;
var controls,time = Date.now();
var objects = [];
var ray;
var instructions = document.getElementById( 'instructions' )
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
var speedMultiplier = 0.02;
var gun, pistol1, pistol2;

if ( havePointerLock ) {
    var element = document.body;
    var pointerlockchange = function ( event ) {
        if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
            controls.enabled = true;
        } else {
            controls.enabled = false;
            instructions.style.display = '';
        }
    }
    var pointerlockerror = function ( event ) {
        instructions.style.display = '';
    }

    document.addEventListener( 'pointerlockchange', pointerlockchange, false );
    document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
    document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
    document.addEventListener( 'pointerlockerror', pointerlockerror, false );
    document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
    document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

    document.addEventListener('keydown', function(event) {
        switch(event.key) {
            case '1':
                switchWeapon('gun');
                break;
            case '2':
                switchWeapon('pistolet');
                break;
            case 'Shift':
                speedMultiplier = 0.5;
                break;
        }
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Shift') {
            speedMultiplier = 1; 
        }
    });
    
    document.addEventListener('keyup', function(event) {
        if (event.key === 'Shift') {
            speedMultiplier = 0.02; 
        }
    });


    instructions.addEventListener( 'click', function ( event ) {
        instructions.style.display = 'none';
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        if ( /Firefox/i.test( navigator.userAgent ) ) {
            var fullscreenchange = function ( event ) {
                if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
                    document.removeEventListener( 'fullscreenchange', fullscreenchange );
                    document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
                    element.requestPointerLock();
                }
            }
            document.addEventListener( 'fullscreenchange', fullscreenchange, false );
            document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
            element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
            element.requestFullscreen();
        } else {
            element.requestPointerLock();
        }
    }, false );

} else {

    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
}

init()
animate()

function init(){
    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor( 0xffffff );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    //Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0xffffff, 100, 400 );

    //camera
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );


    // Ambient light
    const ambientLight = new THREE.AmbientLight('#ffffff', 15, 50);
    scene.add(ambientLight);
    // Directional light

    controls = new THREE.PointerLockControls( camera );
    scene.add( controls.getObject() );

    ray = new THREE.Raycaster();
    ray.ray.direction.set( 0, -1, 0 );

    window.addEventListener( 'resize', onWindowResize, false );

    // Floor
    geometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
    geometry.applyMatrix4( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

    material = new THREE.MeshBasicMaterial({ color: '#a9c388', map: createRepeatingTexture("https://dnl03.github.io/smallcity/grass.jpg", 150, 150, 1) });

    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    //obj

    // //obj before camer
    loader = new THREE.FBXLoader();
    loader.load("/guns2/karabin/gun.fbx", function(fbx) {
        gun = fbx;
        gun.rotation.y = Math.PI / 6;  // 30 degrees to radians
        gun.rotateY(-Math.PI / 6);     // rotate 30 degrees to the left
        gun.position.set(0.7, -0.3, -2);
        gun.rotateY(180*(Math.PI/180));
        gun.rotateX(-15*(Math.PI/180));
        gun.scale.set(0.037, 0.037, 0.037);
        camera.add(gun)
    });

    loader.load("/guns2/pistolet/pistolet.fbx", function(fbx) {
        pistol1 = fbx;
        pistol1.rotation.y = Math.PI / 6;
        pistol1.rotateY(-Math.PI / 6); 
        pistol1.position.set(-2, -1, -4);
        pistol1.rotateY(180*(Math.PI/180));
        pistol1.rotateX(-15*(Math.PI/180));
        pistol1.scale.set(0.01, 0.01, 0.01);

        pistol2 = pistol1.clone();
        pistol2.position.set(2, -1, -4);
    });

    // skybox
    skyBox = createSkyBox("textures/skybox/dawnmountain-");
    scene.add( skyBox );

    // objects
    geometry = new THREE.BoxGeometry( 20, 20, 20 );

    geometry = new THREE.BoxGeometry( 20, 20, 20 );

    for ( var i = 0; i < 500; i ++ ) {
        material = new THREE.MeshStandardMaterial( { color: 0xff0000 } ); 
        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
        mesh.position.y = Math.floor( Math.random() * 20 ) * 20 + 10;
        mesh.position.z = Math.floor( Math.random() * 20 - 10 ) * 20;
        scene.add( mesh );
    
        var edges = new THREE.EdgesGeometry( geometry );
        var line = new THREE.LineBasicMaterial( { color: 0x000000 } );
    
        var lineSegments = new THREE.LineSegments( edges, line );
        mesh.add( lineSegments );
    
        objects.push( mesh );
    }
}

function createSkyBox(box){
    var imagePrefix = box;
    var directions  = ["xpos", "xneg", "ypos", "yneg", "zpos", "zneg"];
    var imageSuffix = ".png";
    var skyGeometry = new THREE.BoxBufferGeometry( 700, 700, 700 );	

    var materialArray = [];
    for (var i = 0; i < 6; i++)
        materialArray.push( new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture( imagePrefix + directions[i] + imageSuffix ),
            side: THREE.BackSide
        }));
    var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
    return new THREE.Mesh( skyGeometry, skyMaterial );
}

function switchWeapon(weaponType) {
    if (camera.children.includes(gun)) {
        camera.remove(gun);
    }
    if (camera.children.includes(pistol1)) {
        camera.remove(pistol1);
    }
    if (camera.children.includes(pistol2)) {
        camera.remove(pistol2);
    }

    if (weaponType === 'gun') {
        camera.add(gun);
    } else if (weaponType === 'pistolet') {
        camera.add(pistol1);
        camera.add(pistol2);
    }
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    requestAnimationFrame( animate );
    controls.isOnObject( false );
    ray.ray.origin.copy( controls.getObject().position );
    ray.ray.origin.y -= 10;
    var intersections = ray.intersectObjects( objects );
    if ( intersections.length > 0 ) {
        var distance = intersections[ 0 ].distance;
        if ( distance > 0 && distance < 10 ) {
            controls.isOnObject( true );
        }
    }

    var oldPosition = controls.getObject().position.clone();
    controls.update(Date.now() - time);
    var deltaPosition = controls.getObject().position.clone().sub(oldPosition); 
    controls.getObject().position.copy(oldPosition.add(deltaPosition.multiplyScalar(speedMultiplier))); // Modyfikujemy pozycję z uwzględnieniem mnożnika prędkości

    var controlPos = controls.getObject().position;
    if ( controlPos.x > 250 ) controlPos.x = 250;
    if ( controlPos.x < -250 ) controlPos.x = -250;
    if ( controlPos.y > 250 ) controlPos.y = 250;
    if ( controlPos.y < -250 ) controlPos.y = -250;
    if ( controlPos.z > 250 ) controlPos.z = 250;
    if ( controlPos.z < -250 ) controlPos.z = -250;

    controls.update( Date.now() - time );
    camera.updateMatrixWorld();
    renderer.render( scene, camera );
    time = Date.now();
}
function createRepeatingTexture(fileName, repeatX, repeatY, rot) {
    var textureLoader = new THREE.TextureLoader();
    var texture = textureLoader.load(fileName);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( repeatX, repeatY);
    texture.rotation = rot;
    return texture;
}
