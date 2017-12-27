# Scatter - Chrome wallet

add to chrome as a developer extension and then create a simple html file with a <button id="button"></button> in it for testing and the code below.

*Usage example*
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

