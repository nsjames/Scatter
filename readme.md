# Scatter - Chrome wallet

add to chrome as a developer extension and then create a simple html file with a <button id="button"></button> in it for testing and the code below.


-------


### Dependencies:
`npm i -g gulp-cli`


`npm i babel-preset-es2015 babel-preset-stage-2`


------


### Chrome dev settings
look up `LocalStream.js Line:13` and change this line
```if(sender.id !== 'jokgdlbdbnpidobcndjfneoaolplaood') return;```
to include your extension id. You can see it in the chrome extensions panel `chrome://extensions/`


### Usage example for the interacting webpage
```
(function(){
            document.addEventListener("scatterLoaded", function(){
                document.getElementById("button").addEventListener("click",
                    function() {
                        window.scatter.sign("help").then(function(res){
                            console.log("Got result", res);
                        })
                    }, false);

                window.scatter.subscribe(function(msg){
                    console.log("Subscription msg: ", msg)
                })
            })

        })();
```


for dev testing use `gulp run`

