var f1 = function(p1, p2){
    return new Promise((resolve, reject)=>{
        setTimeout(()=>{
            if(!p1){
                reject('whoaaa, f1 err - no params dude!');
            }
            else {
                console.warn(`f1 processig following params: ${p1}, ${p2}`);
                resolve({p1: 'P3', p2: 'P4'});
            }
        }, 500);
    });
}

var f2 = function(input){
    return new Promise((resolve, reject)=>{
        setTimeout(()=>{
            try {
                console.warn(`f2 params are: ${input.p1}, ${input.p2}`);
            }
            catch(err){
                reject(err.message);
            }
        }, 500);
    });
}


//f1 & f2 executed one by one
f1('p1', 'p2').then(f2);

//f1 throws, execution goes to the next catch and since the chain ends there, execution stops
f1().then(f2).catch(err => {
    console.warn(`Uups an error occured: ${err}`);
});

//f1 throws, err is processed in the next catch, and the execution continues to throw in f2 that is caught by the last catch
f1().catch(err => console.warn(`Uups an error occured: ${err}`)).then(f2).catch(err => console.warn(`Uups an error occured: ${err}`));