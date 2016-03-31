/**
 * Created by Romain on 14/01/2016.
 */

var falconSprite, tieSprite, shieldSprite, deathStarSprite, shuttleSprite, vaderSprite,
    bulletFalconSprite, bulletTieSprite, bulletShuttleSprite, bulletVaderSprite, explosionSprite;
var starJediFont;

var acceleration = 1, delayFalconBullet = 0, shieldDelay, firedDelay;
var delayFighterSpawn, delayTieFire, delayTieReload;

var level, levelMax, maxScoreDifficulty, bulletSpeed, ennemyDamage, falconDamage, pointsToVader;
var score, kills, ennemyCount, ennemiesMissed, nbBulletFired;
var psStars, quotes = [];

var falcon, deathStar;
var ennemies = new Group(), bulletsFalcon = new Group(), bulletsEnnemies = new Group(), explosions = new Group();
var cBlack, cYellow, cWhite, cBlue;
var gameState = 'intro', fpsRate, fpsCount, secondCount, fps, dev = false;

function setup() {
    // Couleurs
    cBlack = color(0, 0, 0);
    cYellow = color(255, 248, 0);
    cWhite = color(242, 238, 233);
    cBlue = color(68, 238, 238);

    // Général
    createCanvas(windowWidth, windowHeight);
    background(cBlack);
    smooth();

    // Chargement des svg
    falconSprite = loadImage('sprites/falcon_ship.svg');
    tieSprite = loadImage('sprites/tie_ship.svg');
    shieldSprite = loadImage('sprites/shield.svg');
    deathStarSprite = loadImage('sprites/death_star.svg');
    shuttleSprite = loadImage('sprites/shuttle_ship.svg');
    vaderSprite = loadImage('sprites/vader_ship.svg');

    bulletFalconSprite = loadImage('sprites/falcon_bullet.svg');
    bulletTieSprite = loadImage('sprites/tie_bullet.svg');
    bulletShuttleSprite = loadImage('sprites/shuttle_bullet.svg');
    bulletVaderSprite = loadImage('sprites/vader_bullet.svg');
    explosionSprite = loadSpriteSheet('sprites/explosion.jpg', 320, 240, 18);

    // Chargement des polices
    starJediFont = loadFont('fonts/star_jedi.ttf');

    initialize();

    // Objet de l'étoile de la mort
    deathStar = createSprite(300, 300, 300, 300);
    deathStar.addImage(deathStarSprite);
    deathStar.scale = .2;

    // Citations
    quotes[0] = 'Nous sommes perdus !';
    quotes[1] = 'C\'est élégant, maniable. L\'arme noble d\'une époque civilisée.';
    quotes[2] = 'Et dire que je trouvais qu\'il puait déjà avant !';
    quotes[3] = 'Je crois qu\'on a un pépin.';
    quotes[4] = 'Personne par la guerre ne devient grand.';
    quotes[5] = '- Comment on s\'en sort ?\\n- Comme d\'habitude.\\n- Si mal que ça ?!';
    quotes[6] = 'Quand neuf cents ans comme moi tu auras, moins en forme tu seras.';
    quotes[7] = 'Au lieu d\'un grand flou noir, je vois un grand flou lumineux.';
    quotes[8] = 'Luke, quand je ne serai plus, le dernier des Jedi tu seras.';
    quotes[9] = 'Garde bien tes distances Chewie, mais n\'aie pas l\'air de les garder trop ouvertement.';
    quotes[10] = 'Fais-le, ou ne le fais pas. Il n\'y a pas d\'essai.';

    // Les étoiles
    psStars = new ParticleSystem();
    for (var i = 0; i < 100; i++) psStars.addParticle();
}

function initialize(){
    // Difficulté
    level = 0;
    levelMax = 10;
    maxScoreDifficulty = 5000;
    bulletSpeed = 16;
    ennemyDamage = 15;
    falconDamage = 20;
    pointsToVader = 10000;

    // Stats
    fpsRate = 60;
    fpsCount = 0;
    secondCount = 0;
    fps = 0;
    score = 0;
    kills = 0;
    nbBulletFired = 0;
    ennemiesMissed = 0;
    ennemyCount = 0;

    // On créer l'objet du faucon
    falcon = createSprite(width / 2, height - 100, 200, 200);
    falcon.addImage('normal', falconSprite);
    falcon.scale = .25;
    falcon.maxSpeed = 16;
    falcon.friction = .92;
    falcon.setCollider('circle', 0, 0, 180, 180);
    falcon.hpMax = 400;
    falcon.hp = falcon.hpMax;

    // Config des ennemis
    delayFighterSpawn = 0;
    delayTieFire = fpsRate / 3;
    delayTieReload = fpsRate;
    shieldDelay = 0;
    firedDelay = 0;
    vaderSpawned = false;
    vaderMissed = false;
}

function draw() {
    background(cBlack);
    psStars.update();

    frameRate(fpsRate);
    secondCount = floor(fpsCount / fpsRate);
    fps = floor(fpsCount / max(fpsCount / fpsRate, 1));

    // death star
    if (gameState != 'intro') {
        var dist = 5;
        deathStar.position.x = 300 + map(falcon.position.x, 0, width, dist, -dist);
        deathStar.position.y = 300 + map(falcon.position.y, 0, height, dist, -dist);
        push();
        imageMode(CENTER);
        translate(deathStar.position.x, deathStar.position.y);
        scale(deathStar.scale);
        deathStar.draw();
        pop();
    }

    if (keyWentDown(SHIFT)) {
        if (dev) dev = false; else dev = true;
    }

    switch (gameState) {
        // intro du jeu (text défilant)
        case 'intro':
            if (keyWentDown(ENTER)) {
                $('.intro').hide();
                gameState = 'start';
            }
            break;

        // En attente de lancement de la partie
        case 'start':
            if (keyWentDown(ENTER)) gameState = 'play';

            push();
            fill(cBlue);
            textFont("Arial");
            textAlign(CENTER);
            textSize(30);
            text('Attention ! Chasseurs en approche !', width / 2, height / 2);
            textSize(14);
            text('Appuie sur ENTRER pour commencer', width / 2, height / 2 + 30);
            pop();
            break;

        // En cours de jeu
        case 'play':
            fpsCount++;

            // Menu pause
            if (keyWentDown('p')) gameState = 'pause';

            // Déplacement du faucon
            if (keyDown(RIGHT_ARROW) && falcon.position.x < width - 130) falcon.addSpeed(acceleration, 0);
            if (keyDown(LEFT_ARROW) && falcon.position.x > 130) falcon.addSpeed(acceleration, 180);
            if (keyDown(DOWN_ARROW) && falcon.position.y < height - 130) falcon.addSpeed(acceleration, 90);
            if (keyDown(UP_ARROW) && falcon.position.y > height / 2 + 130) falcon.addSpeed(acceleration, -90);

            // Effet de flottement du faucon + rotation
            falcon.rotation = -(falcon.position.x - width / 2) / (width / 2) * 10;
            falcon.position.x -= cos(frameCount / 20) * .5;
            falcon.position.y += sin(frameCount / 15) * .5;

            // Mise à jour du niveau de difficulté
            level = min(levelMax, floor(map(score, 0, maxScoreDifficulty, 0, levelMax)));

            // Tir du faucon
            if (delayFalconBullet > 0) delayFalconBullet--;
            if (keyDown('s') && delayFalconBullet == 0) {
                bulletsFalcon.add(createBullet(
                    falcon.position.x + sin(radians(falcon.rotation - 90)),
                    falcon.position.y + cos(radians(falcon.rotation - 90)) * 25,
                    falcon.rotation - 90 + random(-2.5, 2.5),
                    'falcon'));
                delayFalconBullet = 15;
                nbBulletFired++;
            }

            // Apparition de chasseur
            if (delayFighterSpawn > 0) delayFighterSpawn--;
            if (delayFighterSpawn == 0 && !vaderSpawned) {
                var minDelay = fpsRate * .1,
                    maxDelay = fpsRate * 1.5,
                    center = lerp(minDelay, maxDelay, .5);

                var type = 'tie';
                if (ennemyCount > 0 && ennemyCount % 10 == 0) type = 'shuttle';
                if (score >= pointsToVader) {
                  type = 'vader';
                  vaderSpawned = true;
                }

                ennemies.add(createEnnemy(type));

                delayFighterSpawn = floor(random(
                    map(level, 0, levelMax, center, minDelay),
                    map(level, 0, levelMax, maxDelay, center)
                ));
                ennemyCount++;
            }

            // Update bulletsFalcon
            for (var i = 0; i < bulletsFalcon.length; i++) {
                var bullet = bulletsFalcon[i];
                bullet.position.x += cos(radians(bullet.direction)) * bulletSpeed;
                bullet.position.y += sin(radians(bullet.direction)) * bulletSpeed;

                // Suppression du tir (en dehors de l'écran)
                if (bullet.position.y < -100) bullet.remove();
                if (bullet.position.y > height + 100) bullet.remove();
            }

            // Update bulletsEnnemies
            for (var i = 0; i < bulletsEnnemies.length; i++) {
                var bullet = bulletsEnnemies[i],
                    a = map(level, 0, levelMax, 0.5, 0.75);
                bullet.position.x += cos(radians(bullet.direction)) * bullet.spd * .8;
                bullet.position.y += sin(radians(bullet.direction)) * bullet.spd * .8;

                // Suppression du tir (en dehors de l'écran)
                if (bullet.position.y < -100) bullet.remove();
                if (bullet.position.y > height + 150) bullet.remove();
            }

            // Update ennemies
            for (var i = 0; i < ennemies.length; i++) {
                var e = ennemies[i];

                e.position.x += sin(e.position.y / 50);
                e.position.y += e.spd;
                if (e.delay > 0) e.delay = e.delay - 1;

                // Le chasseur a le faucon en ligne de mire
                if (e.status == 'ready' &&
                    e.delay == 0 &&
                    e.position.y > 20 &&
                    getDistance1D(e.position.x, falcon.position.x) <= 50 &&
                    getDistance1D(e.position.y, falcon.position.y) >= 150) {
                    e.status = 'fire';
                    e.delay = delayTieFire;
                }
                // Le chasseur tire puis recharge
                else if (e.status == 'fire' && e.delay == 0) {
                    var deltaX = e.position.x - falcon.position.x,
                        deltaY = e.position.y - falcon.position.y,
                        direction = Math.atan2(deltaX, deltaY) + 90;

                    bulletsEnnemies.add(createBullet(
                        e.position.x,
                        e.position.y,
                        direction,
                        e.type));
                    e.status = 'reload';
                    e.delay = floor(map(level, 0, levelMax, delayTieReload, delayTieReload * .2));
                }
                // Le chasseur est près à tirer
                else if (e.delay == 0 && e.status == 'reload') {
                    e.status = 'ready';
                }

                // Suppression du chasseur + pénalité
                if (e.position.y > height + 100) {
                    score -= 250;
                    score = max(0, score);
                    if (e.type = 'vader') {
                      vaderMissed = true;
                      checkGameOver();
                    }
                    e.remove();
                    ennemiesMissed++;
                }
            }

            // Remove explosions from these group when animation ends
            for (var i = 0; i < explosions.length; i++) {
                var e = explosions[i];

                if (e.animation.getFrame() == e.animation.getLastFrame()) {
                    e.remove();
                }
            }

            // Collisions
            ennemies.overlap(bulletsFalcon, ennemyHit);
            falcon.overlap(bulletsEnnemies, falconHit);
            falcon.overlap(ennemies, falconContactEnnemy);

            // Affichage
            if (shieldDelay > 0) shieldDelay--;
            if (firedDelay > 0) firedDelay--;

            drawSprites(ennemies);

            push();
            // falcon
            imageMode(CENTER);
            translate(falcon.position.x, falcon.position.y);
            scale(.25);
            rotate(radians(falcon.rotation));
            image(falconSprite, 0, 0);

            // shield
            scale(3, 3);
            var t = map(shieldDelay, 0, fpsRate / 2, 0, 255);
            tint(t, t, t);
            blendMode(ADD);
            image(shieldSprite, 0, 0);
            pop();

            drawSprites(bulletsEnnemies);
            drawSprites(bulletsFalcon);

            push();
            blendMode(ADD);
            drawSprites(explosions);
            pop();
            break;

        // Partie en pause
        case 'pause':
            if (keyWentDown('p')) gameState = 'play';

            falcon.update();

            push();
            fill(cBlue);
            textFont('Arial');
            textAlign(CENTER);
            textSize(30);
            text('Han Solo est encore piégé dans la carbonite !', width / 2, height / 2);
            textSize(14);
            text('Appuie sur P pour le décarboniser', width / 2, height / 2 + 30);
            pop();
            break;

        // Game over
        case 'gameover':
            if (keyDown(ENTER)) {
                initialize();
                gameState = 'play';
            }
            if (keyDown(BACKSPACE)) {
                window.location = '//mmimontbeliard.com/';
            }

            push();
            fill(cBlue);
            textFont('Arial');
            textAlign(CENTER);
            textSize(30);
            if (vaderSpawned) text('Dark Vador s\'est échappé..', width / 2, height / 2);
            else text('Vous avez tué Han Solo..', width / 2, height / 2);
            textSize(14);
            text('Appuie sur ENTRER pour relancer la mission', width / 2, height / 2 + 30);
            text('Appuie sur BACKSPACE pour revenir sur le site', width / 2, height / 2 + 60);
            pop();
            break;

        // You win
        case 'win':
            if (keyDown(ENTER)) {
                initialize();
                gameState = 'play';
            }
            if (keyDown(BACKSPACE)) {
                window.location = '//mmimontbeliard.com/';
            }

            push();
            fill(cBlue);
            textFont('Arial');
            textAlign(CENTER);
            textSize(30);
            text('Vous avez vaincu Dark Vador !', width / 2, height / 2);
            textSize(14);
            text('Appuie sur ENTRER pour relancer la mission', width / 2, height / 2 + 30);
            text('Appuie sur BACKSPACE pour revenir sur le site', width / 2, height / 2 + 60);
            pop();
            break;
    }

    // Affichage de la barre de vie
    if (gameState != 'intro') {
        var barHeight = 10;
        push();
        noStroke();
        fill(50, 50, 100);
        rect(0, 0, width, barHeight);
        fill(255, 248, 0);
        rect(0, 0, map(falcon.hp, 0, falcon.hpMax, 0, width), barHeight);
        pop();

        push()
        textSize(14);
        fill(cWhite);
        textAlign(RIGHT);
        text('Bouge avec les FLÈCHES', width - 50, 50);
        text('Tir avec S', width - 50, 70);
        text('Met en pause avec P', width - 50, 90);
        pop();
    }

    // Affichage des infos de développement
    if (dev) {
        push();
        fill(cWhite);
        textAlign(LEFT);
        text(falcon.hp + '/' + falcon.hpMax + ' | ' + round(falcon.hp / falcon.hpMax * 100) + '%', 50, 50);
        text(score + ' pts', 50, 75);
        text(kills + ' dead', 50, 95);
        text(getTimeString(secondCount), 50, 115);
        text(fps + ' fps', 50, 135);
        text(floor((kills / max(secondCount, 1) * 100)) / 100 + ' dead/s', 50, 155);
        text('level : ' + level, 50, 175);
        text(ennemiesMissed + ' missed', 50, 195);
        text('Acurracy : ' + floor(kills / nbBulletFired * 100) / 100, 50, 215);
        text('Ennemy counter : ' + ennemyCount, 50, 235);
        text('Ennemy : ' + ennemies.length, 50, 255);
        text('Bullets (falcon) number : ' + bulletsFalcon.length, 50, 275);
        text('Bullet (ennemy) number : ' + bulletsEnnemies.length, 50, 295);
        text('Explosions : ' + explosions.length, 50, 315);
        pop();
    }
}

// Functions
function createBullet(x, y, direction, type) {
    var bullet = createSprite(x, y);

    switch (type) {
        case 'falcon':
            bullet.addImage(bulletFalconSprite);
            bullet.spd = bulletSpeed;
            bullet.damage = ennemyDamage;
            break;

        case 'tie':
            bullet.addImage(bulletTieSprite);
            bullet.spd = bulletSpeed;
            bullet.damage = ennemyDamage;
            break;

        case 'shuttle':
            bullet.addImage(bulletShuttleSprite);
            bullet.spd = bulletSpeed;
            bullet.damage = ennemyDamage * 1.5;
            break;

        case 'vader':
            bullet.addImage(bulletVaderSprite);
            bullet.spd = bulletSpeed * 1.5;
            bullet.damage = ennemyDamage * 3;
            break;
    }

    bullet.scale = .1;
    bullet.direction = direction;
    bullet.rotation = direction + 90;
    bullet.setCollider('circle', 0, 0, bullet.width, bullet.height);

    return bullet;
}

// Spawn d'un ennemi
function createEnnemy(type) {
    var e = createSprite(floor(random(250, width - 250)), -100, 200, 200);

    e.type = type;
    switch (e.type) {
        case 'tie':
            e.addImage('normal', tieSprite);
            e.scale = .15;
            e.hp = 20;
            e.spd = 1;
            break;

        case 'shuttle':
            e.addImage('normal', shuttleSprite);
            e.scale = .3;
            e.hp = 50;
            e.spd = .8;
            break;

        case 'vader':
            e.addImage('normal', vaderSprite);
            e.scale = .2;
            e.hp = 400;
            e.spd = .4;
            break;
    }

    e.setCollider('circle', 2, -5, 180, 150);
    e.delay = 0;
    e.status = 'ready';

    return e;
}

// Création d'une explosion
function createExplosion(position, type) {
    var e = createSprite(position.x, position.y, 200, 200);

    e.addAnimation('explode', explosionSprite);
    e.animation.frameDelay = 2;
    e.animation.looping = false;

    switch (type) {
        case 'tie':
            e.scale = .6;
            break;

        case 'shuttle':
            e.scale = 1;
            break;

        case 'vader':
            e.scale = .8;
            break;
    }

    return e;
}

// Quand un chasseur se fait toucher
function ennemyHit(e, bullet) {
    if (e.position.y >= 0) {
        e.hp -= falconDamage;

        if (e.hp <= 0) {
            var s = floor((height - e.position.y) / height * 50);
            score += max(20, s);
            kills++;

            if (e.type == 'vader'){
                gameState = 'win';
            }

            explosions.add(createExplosion(e.position, e.type));
            e.remove();
        }
        bullet.remove();
    }
}

// Quand le faucon se fait toucher
function falconHit(falcon, bullet) {
    decreaseFalconLife(bullet.damage);
    bullet.remove();
}

// Quand le faucon entre en contact avec un chasseur
function falconContactEnnemy(falcon, e) {
    decreaseFalconLife(ennemyDamage * 1.2);
    e.remove();
}

function decreaseFalconLife(value) {
    falcon.hp -= value;
    falcon.hp = max(0, falcon.hp);
    shieldDelay = fps / 2;
    checkGameOver();
}

function checkGameOver() {
    if (falcon.hp <= 0 || vaderMissed) {
        // On supprime les données de la partie précédente
        falcon.remove();
        deathStar.remove();

        ennemies.removeSprites();
        ennemies.clear();

        bulletsFalcon.removeSprites();
        bulletsFalcon.clear();

        bulletsEnnemies.removeSprites();
        bulletsEnnemies.clear();

        // On affiche le game over
        gameState = 'gameover';
    }
}

function getVader() {
    for(var i = 0; i < ennemies; i++){
      if (ennemies[i].type == 'vader') return ennemies[i];
    }
    return null;
}

// Utilities
function getDistance1D(p1, p2) {
    return abs(p1 - p2);
}

function getTimeString(seconds) {
    var minutes = 0, hours = 0, text = '';

    while (seconds >= 60) {
        seconds -= 60;
        minutes++;
    }
    while (minutes >= 60) {
        minutes -= 60;
        hours++;
    }

    if (hours > 0) {
        text += hours + 'h';
    }
    if (minutes > 0) {
        if (text != '') text += ' ';
        text += minutes + 'm';
    }
    if (seconds > 0 || text == '') {
        if (text != '') text += ' ';
        text += seconds + 's';
    }

    return text;
}

// Particle System : Stars
var Particle = function () {
    this.position = createVector(random(0, width), random(0, height));
    this.opacity = 127;
    this.frame = round(random(0, 1000));
    this.size = random(1.5, 2.5);
};

Particle.prototype.update = function () {
    this.frame++;
    this.opacity += sin(this.frame / 150) * 2;
};

Particle.prototype.draw = function () {
    noStroke();
    fill(200, this.opacity);
    ellipse(this.position.x, this.position.y, this.size, this.size);
};

var ParticleSystem = function () {
    this.particles = [];
};

ParticleSystem.prototype.addParticle = function () {
    this.particles.push(new Particle());
};

ParticleSystem.prototype.update = function () {
    for (var i = this.particles.length - 1; i >= 0; i--) {
        var p = this.particles[i];
        p.update();
        p.draw();
    }
};
