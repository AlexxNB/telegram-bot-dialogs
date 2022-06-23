export function waitPromise<T>(cb:()=>Promise<void|T>,interval:number,timeout:number, message:string):Promise<Exclude<T,void>>{
  return new Promise((resolve) => {
    let time = 0;
    let timer: NodeJS.Timer;

    cb().then( result => {
      if(result === undefined){

        const stop = () => timer && clearInterval(timer);

        timer = setInterval(async() => {
          if(time > timeout) {
            stop();
            throw new Error(message);
          }

          cb().then( result => {
            if(result === undefined){
              time += interval;
            } else {
              stop();
              resolve(result as Exclude<T,void>);
            }
          });

        },interval);

      } else resolve(result as Exclude<T,void>);
    });
  });
}