# Scatter - Chrome wallet

add to chrome as a developer extension and then create a simple html file with a <button id="button"></button> in it for testing and the code below.


### Standalone
If you would like to just download and install the plugin's current build [you can do so here](https://github.com/nsjames/Scatter/raw/master/dev-build.zip)
-------


### Dependencies:
`npm i -g gulp-cli`


`npm i babel-preset-es2015 babel-preset-stage-2`


------


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

