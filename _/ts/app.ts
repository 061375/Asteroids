declare var ASTEROIDS_CONFIG;
namespace AquaFun {
    // BUG: pause stops levels from incrementing and rocks from being created
     
    // TODO: killing big rocks should make smaller rocks ( like in the original )
    // TODO: optimize everything as much as possible
    // TODO: comment
    // TODO: ships should aim at asteroids that are too close to them ( at higher levels )
    // TODO: ships will avoid collisions with rocks if possible ( at higher levels )
    // TODO: the frequency of the ships shooting is still too high 
    // TODO: on death enemy ships should be removed
    // TODO: if user logs in as username: captainnemo password: asteroids then the game will play in Nautilus
    // TODO: better looking scoreboard
    // TODO: remake ships in Blender
    // TODO: (maybe) a boss of some kind ... something silly and inappropriate (thinking Monty Python)
    //          A Donald Trump boss throwing hamburgers and yelling "They're eating the dogs! They're eating the cats!" 
    //          Followed by the "real" boss Elon shooting starships at you ( but luckily half of them blow up before they even get close )
    //          The starships will have the first stage and the upper stage will detatch and and actually veer towards Trump ( on purpose but not on purpose )
    //          If it hits Trump it will damage him. When he dies Elon will hold up flags and cheer with "much rejoicing" ( i.e. Holly Grail )
    //          They will both have baby bodies 
    
    // Define a base GameObject class to avoid circular inheritance
    export class GameObject {
        public x: number = 0;
        public y: number = 0;

        constructor() {}
        
        loop(): void {}
        destroy(): void {}
    }
    export class Asteroids
    {
        public level:number = 1
        public score:number = 0
        public game_timer:number = 0
        public allow_enemy:boolean = false
        public allow_enemy_t:number = ASTEROIDS_CONFIG.base.allow_enemy_timer
        public allow_enemy_r:number = ASTEROIDS_CONFIG.base.allow_enemy_random
        public max_asteroids:number = ASTEROIDS_CONFIG.base.max_asteroids
        public asteroids_random:number = ASTEROIDS_CONFIG.base.asteroids_random
        public draw_asteroid_t:number = ASTEROIDS_CONFIG.base.draw_asteroids_time
        public allow_enemy_timer_i:number = ASTEROIDS_CONFIG.base.allow_enemy_timer_increment
        public allow_enemy_random_i:number = ASTEROIDS_CONFIG.base.allow_enemy_random_increment
        public max_enemy_i:number = ASTEROIDS_CONFIG.base.max_enemy_increment
        public max_enemy:number = 1
        public img_path:string;
        public svg_path:string;
        public mouseX:number = 0 
        public mouseY:number = 0
        public screen_width:number = window.innerWidth
        public screen_height:number = window.innerHeight
        public score_board:HTMLDivElement
        public game_container:HTMLElement = document.getElementById("GTHYUGFRQQ_wsasteroids")
        public game_objects:any = {
            ship:null,
            bullets:[],
            asteroids:[],
            enemys:[]
        }
        private loopid:any
        public ispaused:boolean = false
        private static instance: Asteroids | null = null;
        constructor()
        {
            if (Asteroids.instance) {
                return Asteroids.instance
            }
            Asteroids.instance = this

            console.log("Asteroids Loaded",ASTEROIDS_CONFIG.base.version)

            // INIT
            let $this = this
            this.img_path = ASTEROIDS_CONFIG.base.assets_folder + ASTEROIDS_CONFIG.base.img_folder;
            this.svg_path = ASTEROIDS_CONFIG.base.assets_folder + ASTEROIDS_CONFIG.base.svg_folder;

            // so all the clicks won't highlight game characters and what not...
            this.game_container.classList.add("noselect")

            
            this.game_container.style.backgroundImage = `url(${this.img_path + ASTEROIDS_CONFIG.base.background_image})`
            this.game_container.style.backgroundSize = "cover"
            this.game_container.style.width = "100vw";
            this.game_container.style.height = "100vh";

            ///
            /// CREATE A SCOREBOARD -->
            // build and add the scoreboard
            this.score_board = document.createElement("div")
            this.score_board.setAttribute("id","scoreboard")
            this.score_board.setAttribute("class","flex scoreboard")
            this.score_board.innerHTML = `
            <div class="border flex">
                <div class="c5">
                    Score: <span class="score"></span>
                </div>
                <div class="c1"></div>
                <div class="c5">
                    Level: <span class="level"></span>
                </div>
            </div>`
            this.game_container.appendChild(this.score_board)
            /// <-- CREATE A SCOREBOARD
            ///

            // INSTANTIATE PLAYERS SHIP
            this.game_objects.ship = new Ship()

            ///
            /// EVENTS -->
            window.addEventListener('mousemove', (e)=>{this.MouseMove(e,this) }, false)
            window.addEventListener('mousedown', (e)=>{
                switch(e.button)
                {
                    case 0: // left click
                        $this.game_objects.ship.shoot(e)
                        break;
                    case 2: // right click
                        e.preventDefault()
                        $this.game_objects.ship.mouseDown = true
                        break;
                }   
            }, false)
            window.addEventListener('mouseup', (e)=>{
                switch(e.button)
                {
                    case 0: // left click
                        break;
                    case 2: // right click
                        $this.game_objects.ship.mouseDown = false
                        break;
                }   
            }, false)
            window.addEventListener('keyup',(e)=>{
                console.log("click", e.key)
                e.stopPropagation()
                switch(e.key)
                {
                    case "P":
                    case "p":
                        if(this.ispaused){this.start()}else{this.pause()}
                        break;
                    case "b":
                    case "B":
                        // the boss is coming!!!!!!!
                        document.body.style.backgroundImage = ""
                        document.body.innerHTML = ""
                        window.location.href = "/"
                        break;
                }

            })
            /// <-- EVENTS
            ///
            this.start()
        }
        static getInstance(): Asteroids {
            if (!Asteroids.instance) {
                Asteroids.instance = new Asteroids();
            }
            return Asteroids.instance;
        }
        start() : void
        {
            this.ispaused = false
            // start the loop
            this.loopid = setInterval(()=> { this.loop() }, 1000 / 60 )
            document.getElementById("asteroids_message").innerHTML = ""
        }
        pause() : void
        {
            this.ispaused = true
            clearInterval(this.loopid)
            this.loopid = null
            console.log("Game Paused")
            document.getElementById("asteroids_message").innerHTML = "Game Paused"
        }
        loop() : void
        {
            // get game instance to get the score to update the scroreboard
            let game = Asteroids.getInstance()
            this.score_board.querySelector(".score").innerHTML = game.score.toString()
            this.score_board.querySelector(".level").innerHTML = game.level.toString()
            // loop all game objects to update their loop(s)
            for(const [key, value] of Object.entries(this.game_objects))
                {
                    if(Array.isArray(value))
                        {
                            for(let i=0;i<value.length;i++)
                                value[i].loop()
                        }else{
                            this.game_objects[key].loop()
                        }
                }
            
        }
        /**
         * 
         * @param urls 
         * @param img_path 
         * @param allImagesLoadedCallback 
         */
        static preloadImages(urls:Array<string>, img_path:string, allImagesLoadedCallback:any) : void 
        {
            var loadedCounter = 0;
            var toBeLoadedNumber = urls.length;
            var loaded_images = []
            urls.forEach(function(url){
                if(loaded_images.indexOf(url) > -1)return
                preloadImage(img_path + "/" + url, function(){
                    loadedCounter++;
                    console.log('Number of loaded images: ' + loadedCounter);
                    loaded_images.push(url)
                    if(loadedCounter == toBeLoadedNumber){
                        allImagesLoadedCallback();
                    }
                });
            });
            function preloadImage(url:string, anImageLoadedCallback:any) : void 
            {
                var img = new Image();
                img.onload = anImageLoadedCallback;
                img.src = url;
            }
        }
        /** 
         * MouseMove
         * @param {object} 
         * @param {object} 
         * @returns void 
         * */
        MouseMove(e:any, $this:Asteroids) : void
        {
            $this.mouseX = e.clientX - (window.innerWidth - $this.screen_width) * .5;
            $this.mouseY = e.clientY - (window.innerHeight - $this.screen_height) * .5;
        }
        /**
         * check if the object is outside the stage
         * @param $parent the object to test
         * @param threashold an easement area to allow the object to exist outside the stage a bit
         * @returns 
         */
        checkOutSide($parent:any, threashold:number = 0) : boolean
        {
            if($parent.x > this.screen_width + threashold || $parent.x < -threashold || $parent.y > this.screen_height + threashold || $parent.y < -threashold)
                return true
            return false
        }
        /**
         * if object is outside stage then loop it to its opposite location 
         * @param $parent 
         */
        checkOutSideLoop($parent:any) : void
        {
            if(this.checkOutSide($parent))
                {
                    if($parent.x < 0)$parent.x = this.screen_width
                    if($parent.x > this.screen_width)$parent.x = 0
                    if($parent.y < 0)$parent.y = this.screen_height
                    if($parent.y > this.screen_height)$parent.y = 0
                }
        }
        /**
         * check collisions of two objects
         * @param $target 
         * @param $parent 
         * @returns 
         */
        checkCollision($target:any, $parent:any) {
            let radiusParent = $parent.size / 2;
            let radiusTarget = $target.size / 2;
            let distance = Math.hypot($target.x - $parent.x, $target.y - $parent.y);
            return distance < (radiusParent + radiusTarget);
        }
        /**
         * check collisions against all objects in the list
         * @param $target 
         * @param objects 
         * @returns 
         */
        checkCollisionList($target:any, objects:Array<string>) : any
        {
            for(let i=0;i<objects.length;i++)
                {
                    if(this.game_objects.hasOwnProperty(objects[i])){
                        
                        if(Array.isArray(this.game_objects[objects[i]])){
                            for(let j=0;j<this.game_objects[objects[i]].length;j++){
                                if(this.checkCollision($target,this.game_objects[objects[i]][j])) {
                                    if(this.game_objects[objects[i]][j]?.points)
                                        AquaFun.Asteroids.getInstance().score += this.game_objects[objects[i]][j]?.points
                                    return this.game_objects[objects[i]][j]
                                }
                            }
                        }else {
                            if(this.checkCollision($target,this.game_objects[objects[i]]))
                                return this.game_objects[objects[i]]
                        }
                    }
                }
                return false
        }
        /**
         * resets the cartesian direction
         * @param d 
         * @returns 
         */
        dir(d:number) : number
        {
            if(d<0)d+=360;
            if(d>360)d-=360;
            return d
        }
        /**
         * point at x1,y1 from x2,y2 
         * @param x1 
         * @param y1 
         * @param x2 
         * @param y2 
         * @param degrees if false return radians
         * @returns 
         */
        point_at(x1:number,y1:number,x2:number,y2:number,degrees:boolean = true) : number
        {
            let x:number = x2 - x1
            let y:number = y2 - y1 
            let r = Math.atan2(y,x)
            if(!degrees)return r 
            r = r * 180 / Math.PI
            return this.dir(r)
        }
        /**
         * point at object b from object a
         * @param a 
         * @param b 
         * @param degrees 
         * @returns 
         */
        point_at_obj(a:any,b:any,degrees:boolean = true) : number
        {
            return this.point_at(a.x,a.y,b.x,b.y,degrees)
        }
        /**
         * move in in direction degrees at speed
         * @param x 
         * @param y 
         * @param degrees 
         * @param speed 
         * @returns object
         */
        move_direction(x:number,y:number,degrees:number,speed:number) : {x:number,y:number}
        {
            const rad = degrees * Math.PI / 180; // Convert degrees to radians
            x += (Math.cos(rad) * Math.PI / 180) * speed;
            y += (Math.sin(rad) * Math.PI / 180) * speed;

            return {x:x,y:y};
        }
        /**
         * move the specified object in direction degress at speed
         * @param o the object to target that should have x and y as keys
         * @param degrees 
         * @param speed 
         */
        move_dir_object(o:any,degrees:number,speed:number) : void
        {
            let xy:any = this.move_direction(o.x,o.y,degrees,speed)
            o.x = xy.x 
            o.y = xy.y
        }
        /**
         * get distance from x1,y1 to x2,y2
         * @param x1 
         * @param y1 
         * @param x2 
         * @param y2 
         * @returns number
         */
        distance(x1:number,y1:number,x2:number,y2:number) : number 
        {
            return Math.hypot(x2-x1, y2-y1);
        }
        /**
         * wrapper to draw an HTMLImageElement
         * @param img 
         * @param id 
         * @returns HTMLImageElement
         */
        draw(img:string, id:string, _class:string) : HTMLImageElement
        {
            let $i = document.createElement("img")
            $i.setAttribute("src",img)
            $i.setAttribute("id",id)
            $i.setAttribute("class",_class)
            this.game_container.appendChild($i)
            return $i
        }
    }
    class Ship extends GameObject
    {
        public x:number = 0
        public y:number = 0
        public size:number = ASTEROIDS_CONFIG.ship.size
        public degrees:number = 0
        public mouseDown:boolean = false
        private friction:number = ASTEROIDS_CONFIG.ship.friction
        private acc:number = ASTEROIDS_CONFIG.ship.acc
        private velocity:{ x: number; y: number } = { x: 0, y: 0 };
        private maxSpeed:number = ASTEROIDS_CONFIG.ship.maxSpeed 
        private dead:boolean = false
        private N:number = ASTEROIDS_CONFIG.ship.resetTimer
        private image_id:string = ASTEROIDS_CONFIG.ship.image_id
        private image:string = ASTEROIDS_CONFIG.ship.image
        private bullet_color:string = ASTEROIDS_CONFIG.ship.bullet_color
        private bullet_targets:Array<string> = ASTEROIDS_CONFIG.ship.bullet_targets
        private shipimage:HTMLImageElement
        private game:Asteroids
        constructor()
        {
            super()
            this.game = Asteroids.getInstance()
            this.image = `${this.game.svg_path}${this.image}`
            this.shipimage = this.game.draw(this.image,this.image_id,"ship")
            
            // set ship size by image width when loaded
            this.shipimage.style.width = `${this.size}px`
            this.shipimage.style.height = `${this.size}px`
            this.shipimage.style.visibility = "initial"
            this.reset()
        }
        reset() : void
        {
            this.x = this.game.screen_width / 2
            this.y = this.game.screen_height / 2
            this.dead = false
            // Reset velocity as well
            this.velocity = { x: 0, y: 0 }
            this.shipimage.src = this.image
            this.shipimage.style.visibility = "initial"
            this.game.score = 0
            this.game.level = 1
            this.game.game_timer = 0
            this.game.allow_enemy = false
            this.game.allow_enemy_t = ASTEROIDS_CONFIG.base.allow_enemy_timer
            this.game.allow_enemy_r = ASTEROIDS_CONFIG.base.allow_enemy_random
            this.game.max_enemy = 1
        }
        loop() : void
        {
            // point the ship at the mouse cursor
            this.degrees = this.game.point_at(this.x, this.y,this.game.mouseX,this.game.mouseY)

            // if ! dead draw me
            this.shipimage.style.rotate = `${this.degrees}deg`
            this.shipimage.style.left = `${this.x - (this.size/2)}px`
            this.shipimage.style.top = `${this.y - (this.size/2)}px`
           
            if(this.mouseDown)
                this.thrust()
            
            // Update position using the velocity vector
            this.x += this.velocity.x
            this.y += this.velocity.y
            // Apply friction by scaling down the velocity:
            this.velocity.x *= (1 - this.friction)
            this.velocity.y *= (1 - this.friction)
            // check outside stage
            this._checkOutSide()
        }
        thrust() : void
        {
            // Calculate the thrust vector based on current facing (degrees)
            const rad = (this.degrees * Math.PI) / 180;
            const thrustVector = { x: Math.cos(rad) * this.acc, y: Math.sin(rad) * this.acc };

            // Determine if the ship is moving in the opposite direction of the thrust
            const dot = this.velocity.x * thrustVector.x + this.velocity.y * thrustVector.y;

            if (dot < 0) {
                // The ship is moving against the thrust direction—apply braking.
                // Adjust the deceleration factor (here 0.5) as needed.
                this.velocity.x += thrustVector.x * 0.5;
                this.velocity.y += thrustVector.y * 0.5;
            } else {
                // Accelerate normally in the thrust direction.
                this.velocity.x += thrustVector.x;
                this.velocity.y += thrustVector.y;
            }

            // Limit the ship's maximum speed.
            const speed = Math.hypot(this.velocity.x, this.velocity.y);
            if (speed > this.maxSpeed) {
                const scale = this.maxSpeed / speed;
                this.velocity.x *= scale;
                this.velocity.y *= scale;
            }
        }
        shoot() : void
        {
            if(this.dead) return
            let i = this.game.game_objects.bullets.length
            this.game.game_objects.bullets.push(new Bullet(
                i, 
                this.x, 
                this.y, 
                this.degrees,
                this.bullet_targets, 
                this.bullet_color))
        }
        destroy() : void
        {
            if(this.dead) return
            this.dead = true
            let $this = this

            // draw exploding animation
            this.shipimage.src = `${this.game.img_path}${ASTEROIDS_CONFIG.ship.explosion_image}`
            
            // hide me
            setTimeout(()=>{
                this.shipimage.style.visibility = "hidden"
            }, 1000)
            // wait N seconds
            setTimeout(()=>{
                // move me home 
                // show me again
                $this.reset()
            },this.N)
        }
        _checkOutSide() : void
        {
            this.game.checkOutSideLoop(this)
        }
    }
    export class Asteroid extends GameObject
    {
        public points:number = ASTEROIDS_CONFIG.asteroid.points
        public x:number = 0
        public y:number = 0
        private N:number = ASTEROIDS_CONFIG.asteroid.resetTimer
        private speed:number = 0
        private degrees:number = Math.floor(Math.random() * 360)
        private size:number = ASTEROIDS_CONFIG.asteroid.sizeRange[0] + Math.random() * ASTEROIDS_CONFIG.asteroid.sizeRange[1]
        private image_src:string = ASTEROIDS_CONFIG.asteroid.image
        private image:HTMLImageElement
        private image_id:string = ASTEROIDS_CONFIG.asteroid.image_id
        private dead:boolean = false
        private game:Asteroids
        private target_objects:Array<string> = ASTEROIDS_CONFIG.asteroid.target_objects
        constructor(
            private i:number,
            x:number = 0,
            y:number = 0,
            size:number = 0,
            speed:number = 0
        )
        {
            super()
            this.game = Asteroids.getInstance()
            // set the size of the rock if set
            if(size > 0)this.size = size
            // the point value of the rock is negatively preportional to its size
            this.points -= Math.floor(this.size)
            // if speed not set then set random else set by parameter
            if(speed == 0)
                this.speed = (ASTEROIDS_CONFIG.asteroid.speedIncrementRange[0] + Math.random() * (ASTEROIDS_CONFIG.asteroid.speedIncrementRange[1] * this.game.level))
            else this.speed = speed

            /// --> SET STARTING POSITION
            if(x == 0 && y == 0) {
                // set y to random location
                this.y = Math.random() * this.game.screen_height
                // early in the game the asteroids should be drawn to the left and right of the ship 
                // far enough away that it doesn't kill the player
                if(this.game.game_timer < this.game.draw_asteroid_t)
                    {
                        // early in the game the asteroids should be drawn to the left and right of the ship 
                        // far enough away that it doesn't kill the player
                        if(Math.random() * 100 < 50) {
                            this.x = Math.random() * this.game.screen_width / 4
                        }else{ 
                            this.x = this.game.screen_width / 2 + this.game.screen_width / 4 + Math.random() * this.game.screen_width / 4
                        }
                    }else{
                        // later asteroids should appear outside the stage
                        if(Math.random() * 100 < 50)
                            this.x = this.game.screen_width
                }
            }else{
                this.x = x
                this.y = y
            }
            /// <-- SET STARTING POSITION

            // add the ship image to the game
            this.image = this.game.draw(`${this.game.img_path}${this.image_src}`,this.image_id,"astroid_img")
            this.image.style.width = `${this.size}px`
            this.image.style.rotate = `${Math.floor(Math.random() * 360)}deg`
            this.image.style.visibility = "initial"
            
        }
        loop() : void
        {
            if(this.dead) return
            this.game.move_dir_object(this,this.degrees,this.speed)
            this.image.style.left = `${this.x - (this.size/2)}px`
            this.image.style.top = `${this.y - (this.size/2)}px`
            this._checkOutSide()
            this._checkCollision()
        }
        destroy() : void
        {
            // YOU'RE DEAD - STAY DEAD - AND OUT OF THIS WORLD !!!
            if(this.dead)return
            this.dead = true

            let $this = this
            // draw exploding animation
            this.image.src = `${this.game.img_path}${ASTEROIDS_CONFIG.asteroid.explosion_image}`
            // if the rocks aren't too small 
                if(this.size > ASTEROIDS_CONFIG.asteroid.sizeRange[0] * 3){
                    // make smaller shards from the explosion
                    for(let i=0;i<3;i++)
                        this.game.game_objects.asteroids.push(new AquaFun.Asteroid(this.game.game_objects.asteroids.length,this.x,this.y,this.size / 3,this.speed * 2))
                }
            // remove after N
            setTimeout(()=>{
                $this.image.remove()
                $this.game.game_objects.asteroids.splice($this.i,1)
                // Update indices
                for (let i = $this.i; i < $this.game.game_objects.asteroids.length; i++) {
                    $this.game.game_objects.asteroids[i].i = i;
                }
                
            },$this.N);
            
        }
        _checkOutSide() : void
        {
            this.game.checkOutSideLoop(this)
        }
        _checkCollision() : void
        {
            let hit = this.game.checkCollisionList(this,this.target_objects)
            if(hit)
                {
                    hit.destroy()
                    this.destroy()
                }
        }
    }
    export class Enemy extends GameObject
    {
        public points:number = ASTEROIDS_CONFIG.enemy.points
        private smart:boolean = ASTEROIDS_CONFIG.enemy.smart
        private danger_zone:number = 200
        public x:number = 0
        public y:number = 0
        private degrees:number = 0
        private shoot_degrees:number = 0
        private speed:number = 0
        private N:number = ASTEROIDS_CONFIG.enemy.resetTimer
        private image_id:string = ASTEROIDS_CONFIG.enemy.image_id
        private image_src:string = ASTEROIDS_CONFIG.enemy.image
        private image:HTMLImageElement
        private size:number = ASTEROIDS_CONFIG.enemy.sizeRange[0] + Math.random() * ASTEROIDS_CONFIG.enemy.sizeRange[0]
        private kos:number = ASTEROIDS_CONFIG.enemy.kos
        private dir_timer:number = 0
        private dir_kos:number = Math.random() * this.kos
        private border_t:number = ASTEROIDS_CONFIG.enemy.border_t
        private x_left:boolean = true
        private dead:boolean = false
        private bullet_color:string = ASTEROIDS_CONFIG.enemy.bullet_color
        private bullet_targets:Array<string> = ASTEROIDS_CONFIG.enemy.bullet_targets
        private other_dis:number = 9999999
        private closest:number = 0
        private b_avoid:boolean = false
        private avoid_time:number = 0
        private avoid_max:number = 0 
        private avoid_max_max:number = ASTEROIDS_CONFIG.enemy.avoid_max_max 
        private avoid_max_min:number = ASTEROIDS_CONFIG.enemy.avoid_max_min 
        private game: Asteroids
        private text:TextObject
        constructor(
            private i:number,
            x:number = 0,
            y:number = 0
        )
        {
            super()
            this.game = Asteroids.getInstance()

            // if the x,y is set then 
            if(x != 0 && y != 0) {
                this.x = x 
                this.y = y
            }else{
                // set random location outside screen
                // it should come in from the left or the right only and off-screen so we need to do some phenagling
                if(Math.random() * 100 < 50) {
                    this.x_left = true
                    // set me off the right of the screen but only half-way to it's extra border
                    this.x = this.game.screen_width + this.border_t / 2
                }else{ 
                    this.x_left = false
                    // set me off the left of the screen but only half-way to it's extra border
                    this.x = -(this.border_t / 2)
                }
                // set me someplace top-to-bottom on the screen
                this.y = this.border_t + Math.random() * this.game.screen_height - this.border_t
            }

            this.set_direction()
            
            // draw me
            this.image = this.game.draw(`${this.game.svg_path}${this.image_src}`,this.image_id,"enemy")
            // set my image width
            this.image.style.width = `${this.size}px`
            // set ship invisible initially
            this.image.style.visibility = "initial"
            // set my speed
            this.speed = ASTEROIDS_CONFIG.enemy.speedIncrementRange[0] + Math.random() * (ASTEROIDS_CONFIG.enemy.speedIncrementRange[0] * this.game.level)
        }
        loop() : void
        {
            // I'm dead...don't bother me
            if(this.dead) return

            this.dir_timer++ 
            if(this.smart)
                this.avoid()

            // the counter > a random number then change direction
            if(this.dir_timer > this.dir_kos)
                {
                    // TODO: this is done twice so it can be added to a method
                    this.dir_kos = Math.random() * this.kos
                    this.set_direction()
                }
            // move the ship
            this.game.move_dir_object(this,this.degrees,this.speed)
            this.image.style.left = `${this.x - this.size / 2}px`
            this.image.style.top = `${this.y - this.image.height / 2}px`

            // 1 in 99 and it enemy is not dead then shoot at him
            if((Math.random() * 100) > 99)
                if(this.game.game_objects.ship.dead == false || this.other_dis < this.danger_zone)
                    this.shoot()
            
            
            this._checkOutSide()
        }
        set_direction() : void
        {
            // RUN AWAY !!!
            if(this.b_avoid) return

            if(this.x_left) {
                this.degrees = 90 + Math.random() * 180
                return
            }
            // js Cartesian is facing right so set a random direction
            this.degrees = Math.floor(Math.random() * 360)
            // if now facing left just subtract 180
            if(this.degrees > 90 && this.degrees < 270)
                this.degrees -= 180
            
        }
        avoid() : void
        {
            // this makes the ship avoid enemies...but only every few steps
            // this way it's not jerky but also so the enemy can be killed by the rocks once in awhile
            if(this.b_avoid)
                {
                    this.avoid_time++
                    if(this.avoid_time > this.avoid_max){
                        this.b_avoid = false
                    } else {
                        // nope
                        return
                    }
                }
           
            let dis:number = 999999999
            let other_dis:number = 0
            // find nearest asteroid
            for(let i=0;i<this.game.game_objects.asteroids.length;i++)
                {
                    other_dis = this.game.distance(
                        this.game.game_objects.asteroids[i].x,
                        this.game.game_objects.asteroids[i].y,
                    this.x,this.y);
                    
                    if(other_dis < dis) {
                        dis = other_dis
                        this.closest = i
                        this.other_dis = other_dis
                    }
                }
            // if an asteroid is too close 
            if(this.other_dis < this.danger_zone) {
                // plot direction away from
                let d = this.game.point_at_obj(this,this.game.game_objects.asteroids[this.closest])
                // pick a random direction
                this.degrees = Math.random() * 360
                // still kind of pointing at the target then give it a little kick to the left or right
                if(this.degrees > d + 45 && this.degrees < d - 45) this.degrees += (50 + Math.random() * 40)
                
                // set avoid and set the next time it tries to avoid again ahead N(r) steps
                this.b_avoid = true
                this.avoid_max = this.avoid_max_min + Math.random() * this.avoid_max_max
                this.avoid_time = 0
                return
            }
            // no reason to avoid anything
            this.b_avoid = false
        }
        /**
         * 
         * @param boom 
         * @returns 
         */
        destroy(boom:boolean = true) : void
        {
            // YOU'RE DEAD - STAY DEAD - AND OUT OF THIS WORLD !!!
            if(this.dead)return
            this.dead = true

            let $this = this
            // draw exploding animation
            if(boom){
                this.image.src = `${this.game.img_path}${ASTEROIDS_CONFIG.enemy.explosion_image}`
                // remove after N
                setTimeout(()=>{
                    $this.remove()
                },$this.N);
            } else this.remove()
        }
        remove() : void
        {
            this.image.remove()
            this.game.game_objects.enemys.splice(this.i,1)
            // Update indices
            for (let i = this.i; i < this.game.game_objects.enemys.length; i++) {
                this.game.game_objects.enemys[i].i = i;
            }
        }
        shoot() : void
        {
            // get the ship
            let other = this.game.game_objects.ship
            // too close to a rock then target the rock instead
            if(this.other_dis < this.danger_zone)
                other = this.game.game_objects.asteroids[this.closest]
            // point at other
            this.shoot_degrees = this.game.point_at_obj(this,other);
            // shoot
            this.game.game_objects.bullets.push(new Bullet(
                this.game.game_objects.bullets.length,
                this.x,
                this.y,
                this.shoot_degrees,
                this.bullet_targets,
                this.bullet_color))
        }
        _checkOutSide() : void
        {
            if(this.game.checkOutSide(this, 200)) 
                {
                    this.destroy(false)
                }   
        }
    }
    class Bullet extends GameObject
    {
        private game: Asteroids
        private speed:number = ASTEROIDS_CONFIG.bullet.speed
        private image:HTMLDivElement
        public size:number = ASTEROIDS_CONFIG.bullet.size
        constructor(
            private i:number,
            public x:number,
            public y:number,
            public degrees:number,
            private target_objects:Array<string>,
            private color:string = "#fff"
        )
        {
            super()
            this.game = Asteroids.getInstance()
            this.image = document.createElement("div")
            this.image.classList.add("bullet")
            this.image.setAttribute("style",`
                z-index:9999999;
                position:fixed;
                width:${this.size}px;
                height:${this.size}px;
                background:${this.color};
                box-shadow:0px 0px 3px ${this.color}
            `)
            this.image.style.visibility = "hidden"
            this.game.game_container.appendChild(this.image)
        }
        loop() : void
        {
            this.game.move_dir_object(this,this.degrees,this.speed)
            this.image.style.left = `${this.x - 1}px`
            this.image.style.top = `${this.y - 1}px`
            this.image.style.visibility = "initial"
            this._checkOutSide()
            this._checkCollision()
        }
        destroy() : void
        {
            this.image.remove()
            this.game.game_objects.bullets.splice(this.i,1)
            // Update indices
            for (let i = this.i; i < this.game.game_objects.bullets.length; i++) {
                this.game.game_objects.bullets[i].i = i;
            }
        }
        _checkOutSide() : void
        {
            if(this.game.checkOutSide(this))this.destroy()
        }
        _checkCollision() : void
        {
            let hit = this.game.checkCollisionList(this,this.target_objects)
            if(hit)
                {
                    hit.destroy()
                    this.destroy()
                }
        }
    }
    /**
     * for debugging - it's easier than console.log and won't crash the browser
     * @usage 
     *  1. from the contructor of a game object
     *      this.text = new TextObject(this, 20, -20)
     *  2. in the loop
     *      this.text.loop()
     *  3. in the loop or method
     *      this.text.text = `${myvariable} and some text ... etc`
     */
    class TextObject extends GameObject
    {
        private node:HTMLElement;
        public x:number = 0
        public y:number = 0
        public text:string = ""
        private game: Asteroids
        constructor(private parent:any,private offsetx:number = 0,private offsety:number = 0)
        {
            super()
            this.game = Asteroids.getInstance()
            this.node = document.createElement("div")
            this.node.setAttribute("class","text")
            this.game.game_container.appendChild(this.node)
            
        }
        loop() : void
        {
            this.x = this.parent.x + this.offsetx 
            this.y = this.parent.y + this.offsety
            this.node.style.left = `${this.x}px`
            this.node.style.top = `${this.y}px`
            this.node.innerHTML = this.text
        }
        destroy(): void {
            this.node.remove()
        }
    }
} // <-- Aquafun

// load the class and start everything
// Spawn asteroids and enemies periodically
function spawnGameObjects() {
    const game = AquaFun.Asteroids.getInstance();
    if(game.ispaused)return
    game.game_timer++
    // for debugging
    //console.log(game.game_timer)

    // Spawn asteroid
    let draw_asteroid = true
    if(game.game_timer > game.draw_asteroid_t) draw_asteroid = Math.random() < game.asteroids_random
    if (game.game_objects.asteroids.length < game.max_asteroids && draw_asteroid) {
        game.game_objects.asteroids.push(new AquaFun.Asteroid(game.game_objects.asteroids.length));
    }

    // REMOVE ME - debug enemy
    ASTEROIDS_CONFIG.enemy.smart = true
    if (game.game_objects.enemys.length < 1) {
        game.game_objects.enemys.push(new AquaFun.Enemy(game.game_objects.enemys.length, 500, 200))
    }
    
    // // Spawn enemy
    if(game.game_timer > game.allow_enemy_t) {
        game.allow_enemy = true
        game.max_enemy+=game.max_enemy_i
        game.allow_enemy_t += game.allow_enemy_timer_i
        game.allow_enemy_r += game.allow_enemy_random_i
        game.level++
        console.log("Level", game.level)
    }
    if(game.allow_enemy){
        if (game.game_objects.enemys.length < game.max_enemy && Math.random() < game.allow_enemy_r) {
            
            game.game_objects.enemys.push(new AquaFun.Enemy(game.game_objects.enemys.length));
        }
    }
    
    // Continue checking
    requestAnimationFrame(spawnGameObjects);
}

// Load the class and start everything
window.addEventListener('load', () => {
    // remove any Nautilus stuff
    document.body.innerHTML = ""

    // Prevent right-click context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    let $game = document.createElement("div")
        $game.setAttribute("id","GTHYUGFRQQ_wsasteroids")
    document.body.appendChild($game)
        let $style = document.createElement("div")
        $style.innerHTML = `
            <link rel="stylesheet" href="${ASTEROIDS_CONFIG.base.css_path}">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&display=swap" rel="stylesheet">`
        $game.appendChild($style)
    let $m = document.createElement("div")
        $m.setAttribute("id","asteroids_message")
        $m.setAttribute("class","flex")
    $game.appendChild($m)
    AquaFun.Asteroids.preloadImages(ASTEROIDS_CONFIG.base.all_svg, 
        ASTEROIDS_CONFIG.base.assets_folder + ASTEROIDS_CONFIG.base.svg_folder,
            ()=>{
                AquaFun.Asteroids.preloadImages(ASTEROIDS_CONFIG.base.all_images,
                    ASTEROIDS_CONFIG.base.assets_folder + ASTEROIDS_CONFIG.base.img_folder,
                        ()=>{
                            // Initialize game
                            const game = new AquaFun.Asteroids();
                            
                            // Start spawning game objects
                            spawnGameObjects();
                        })
                })
});

// const ASTEROIDS_CONFIG = {
//     base:{
//         allow_enemy_timer:2000,
//         allow_enemy_timer_increment:2000,
//         allow_enemy_random:0.0005,
//         allow_enemy_random_increment:0.0005,
//         max_enemy_increment:1,
//         max_asteroids:20,
//         asteroids_random:0.02,
//         draw_asteroids_time:20,
//         assets_folder:"/img/",
//         background_image:"space.jpg",
//         all_images:["space.jpg","boom1.gif","rock1.gif"],
//         all_svg:["enemy1.svg","ship.svg"],
//         css_path:"/hydhfifyrhgkuhrmqodta/scripts/css/style.css"
//     },
//     ship:{
//         size:40,
//         friction:0.005,
//         acc:0.1,
//         maxSpeed:10 ,
//         resetTimer:10000,
//         image:"ship.svg",
//         image_id:"asteroids_theship",
//         bullet_targets:["asteroids","enemys"],
//         explosion_image:"boom1.gif",
//         bullet_color:"#fff"
//     },
//     asteroid: {
//         points:100,
//         resetTimer:1000,
//         image:"rock1.gif",
//         image_id:"astroid_img",
//         sizeRange:[10,50],
//         speedIncrementRange:[10,20],
//         explosion_image:"boom1.gif",
//         target_objects:["ship","enemys"]
//     },
//     enemy: {
//         points:100,
//         resetTimer:1000,
//         image:"enemy1.svg",
//         image_id:"asteroid_enemy",
//         sizeRange:[30,50],
//         kos:5000,
//         border_t:200,
//         speedIncrementRange:[10,20],
//         explosion_image:"boom1.gif",
//         bullet_color:"#edff00",
//         bullet_targets:["ship","asteroids"]
//     },
//     bullet:{
//         speed:300,
//         size:3
//     }
// }